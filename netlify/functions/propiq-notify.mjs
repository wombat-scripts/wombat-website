/**
 * Short email after the browser has waited for the PropIQ report to finish.
 * POST /.netlify/functions/propiq-notify
 * Body: { email, address, url }
 */
import {
  DEFAULT_MAIL_CC,
  DEFAULT_MAIL_FROM,
  buildReportEmail,
  isReportUrl,
} from "./pifi-handover-lib.mjs";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function json(status, payload) {
  return new Response(JSON.stringify(payload), { status, headers: JSON_HEADERS });
}

export default async (req) => {
  if (req.method !== "POST") return json(405, { emailSent: false });

  let raw;
  try {
    raw = await req.json();
  } catch {
    return json(400, { emailSent: false });
  }

  const email = raw && typeof raw.email === "string" ? raw.email.trim() : "";
  const address = raw && typeof raw.address === "string" ? raw.address.trim() : "";
  const url = raw && typeof raw.url === "string" ? raw.url.trim() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !address || address.length > 300 || !isReportUrl(url)) {
    return json(400, { emailSent: false });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info("propiq-notify: skipped, no resend key");
    return json(200, { emailSent: false });
  }

  const message = buildReportEmail({
    to: email,
    address: address,
    url: url,
    from: process.env.PROPIQ_MAIL_FROM || DEFAULT_MAIL_FROM,
    cc: process.env.PROPIQ_MAIL_CC || DEFAULT_MAIL_CC,
  });

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.error("propiq-notify: resend status", res.status);
      return json(200, { emailSent: false });
    }
    console.info("propiq-notify: email sent");
    return json(200, { emailSent: true });
  } catch (err) {
    console.error("propiq-notify: resend failed", err && err.name ? err.name : "error");
    return json(200, { emailSent: false });
  }
};
