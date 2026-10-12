/**
 * Server-only Australian address suggestions for the Property IQ form.
 * GET /.netlify/functions/address-suggest?q=
 *
 * ADDRESS_SUGGEST_PROVIDER defaults to photon. No provider key is required
 * for this QA preview, and none is sent to the browser.
 */
import { suggestAddresses } from "./address-suggest-lib.mjs";

const PHOTON_URL = "https://photon.komoot.io/api/";
const USER_AGENT = "WombatHomeLoans/property-iq (https://www.wombathomeloans.com.au)";
const AU_BBOX = "112,-44,154,-10";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=120",
};

function json(status, payload, cache) {
  return new Response(JSON.stringify(payload), {
    status: status,
    headers: cache ? JSON_HEADERS : { ...JSON_HEADERS, "Cache-Control": "no-store" },
  });
}

async function photonFeatures(query) {
  const url = new URL(PHOTON_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "12");
  url.searchParams.set("lang", "en");
  url.searchParams.set("bbox", AU_BBOX);
  url.searchParams.set("lat", "-33.87");
  url.searchParams.set("lon", "151.21");
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error("photon status " + res.status);
  const body = await res.json();
  return Array.isArray(body && body.features) ? body.features : [];
}

export default async (req) => {
  if (req.method !== "GET") return json(405, { suggestions: [] }, false);

  const provider = String(process.env.ADDRESS_SUGGEST_PROVIDER || "photon").toLowerCase();
  if (provider !== "photon") {
    console.error("address-suggest: provider not enabled", provider);
    return json(200, { suggestions: [] }, false);
  }

  let degraded = false;
  try {
    const suggestions = await suggestAddresses(new URL(req.url).searchParams.get("q"), async (query) => {
      try {
        return await photonFeatures(query);
      } catch (err) {
        degraded = true;
        console.error("address-suggest: lookup failed", err && err.name ? err.name : "error");
        return [];
      }
    });
    console.info("address-suggest: results", suggestions.length);
    return json(200, { suggestions: suggestions }, !degraded);
  } catch (err) {
    console.error("address-suggest: suggest failed", err && err.name ? err.name : "error");
    return json(200, { suggestions: [] }, false);
  }
};
