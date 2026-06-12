/* ============================================================
   WOMBAT ARCADE — Leaderboard API
   Netlify Function + Netlify Blobs (persistent key-value store).
   GET  /api/leaderboard           -> all boards
   POST /api/leaderboard           -> { game, name, score }
   ============================================================ */
import { getStore } from "@netlify/blobs";

// Per-game rules: sort direction + sane score bounds (server-side
// validation so the board can't be trivially spammed with absurd numbers).
const GAMES = {
  dash:     { dir: "asc",  min: 10, max: 600 },    // seconds to save deposit (lower = better)
  stack:    { dir: "desc", min: 1,  max: 200 },    // floors
  openhome: { dir: "desc", min: 10, max: 3000 },   // points
  waiver:   { dir: "desc", min: 10, max: 20000 },  // metres
  reno:     { dir: "asc",  min: 10, max: 900 }     // seconds to full reno (lower = better)
};
const KEEP = 25;

// Classic arcade-cabinet initials filter.
const BLOCKED = new Set([
  "FUK", "FUC", "FCK", "FKU", "ASS", "CNT", "KNT", "FAG", "NIG", "NGR",
  "KKK", "SEX", "TIT", "DIK", "DCK", "COK", "CUM", "JIZ", "VAG", "PIS",
  "GOD", "DIE", "KYS"
]);

export default async (req) => {
  const store = getStore("arcade");

  if (req.method === "GET") {
    const data = (await store.get("scores", { type: "json" })) || {};
    return Response.json(data, { headers: { "Cache-Control": "no-store" } });
  }

  if (req.method === "POST") {
    let body;
    try { body = await req.json(); }
    catch { return new Response("bad json", { status: 400 }); }

    const cfg = GAMES[body.game];
    if (!cfg) return new Response("unknown game", { status: 400 });

    const score = Math.round(Number(body.score));
    if (!Number.isFinite(score) || score < cfg.min || score > cfg.max) {
      return new Response("score out of range", { status: 400 });
    }

    let name = String(body.name || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 3);
    if (!name) name = "???";
    if (BLOCKED.has(name)) name = "***";

    const data = (await store.get("scores", { type: "json" })) || {};
    const list = data[body.game] || [];
    const entry = { n: name, s: score, d: new Date().toISOString().slice(0, 10) };
    list.push(entry);
    list.sort((a, b) => (cfg.dir === "asc" ? a.s - b.s : b.s - a.s));
    data[body.game] = list.slice(0, KEEP);
    await store.setJSON("scores", data);

    const rank = data[body.game].indexOf(entry) + 1; // 0 if trimmed off the board
    return Response.json({
      ok: true,
      rank: rank > 0 ? rank : null,
      top: data[body.game].slice(0, 10)
    });
  }

  return new Response("method not allowed", { status: 405 });
};

export const config = { path: "/api/leaderboard" };
