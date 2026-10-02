/**
 * PiFi Partner Handover helpers.
 * Host and key come from env at request time. This module never embeds them.
 * PIFI_API_HOST must be https and an api host on pifiproperty.com.
 * A QA comment example is https://api.qa.pifiproperty.com. Production sets its own host.
 * A missing or foreign host fails closed.
 */

export const RETURN_URL = "https://www.wombathomeloans.com.au/property-iq";
export const TIMEOUT_MS = 30000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const FIXED_JOURNEY = "price";
export const FIXED_CONTEXT = "just curious";
export const DEFAULT_MAIL_FROM = "Wombat Home Loans <tom@wombathomeloans.com.au>";
export const DEFAULT_MAIL_CC = "tom@wombathomeloans.com.au";

export const COPY = {
  emptyEmail: "Add your email so PropIQ can open the report.",
  invalidEmail: "That doesn't look like an email, have another go.",
  emptyAddress: "Add a street address so we know which place to look up.",
  unusableAddress: "We couldn't match that address. Check the spelling, or try the full street including suburb.",
  fail: "Something didn't go through. Try again in a minute. If it keeps failing, email us and we'll sort it.",
};

export function normaliseHost(host) {
  return String(host || "").trim().replace(/\/+$/, "");
}

export function assertApiHost(host) {
  const normalised = normaliseHost(host);
  let url;
  try {
    url = new URL(normalised);
  } catch {
    const err = new Error("PiFi host is not a usable API host");
    err.code = "host_invalid";
    throw err;
  }
  const hostname = url.hostname.toLowerCase();
  const onPifi = hostname === "pifiproperty.com" || hostname.endsWith(".pifiproperty.com");
  const apiHost = hostname === "api.pifiproperty.com" || hostname.startsWith("api.");
  const bare = !url.username && !url.password && !url.search && !url.hash && (url.pathname === "" || url.pathname === "/");
  if (url.protocol !== "https:" || !onPifi || !apiHost || !bare) {
    const err = new Error("PiFi host is not a usable API host");
    err.code = "host_invalid";
    throw err;
  }
  return url.origin;
}

export function validateInput(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const email = typeof src.email === "string" ? src.email : "";
  const address = typeof src.address === "string" ? src.address.trim() : "";

  const emailTrimmed = email.trim();
  if (!emailTrimmed) {
    return { ok: false, message: COPY.emptyEmail };
  }
  if (email !== emailTrimmed || !EMAIL_RE.test(emailTrimmed) || emailTrimmed.length > 254) {
    return { ok: false, message: COPY.invalidEmail };
  }
  if (!address) {
    return { ok: false, message: COPY.emptyAddress };
  }
  if (address.length > 300 || !/[A-Za-z]/.test(address) || !/\d/.test(address)) {
    return { ok: false, message: COPY.unusableAddress };
  }

  return {
    ok: true,
    body: {
      email: emailTrimmed,
      address,
      journey: FIXED_JOURNEY,
      context: FIXED_CONTEXT,
      returnUrl: RETURN_URL,
    },
  };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildReportEmail({ to, address, url, from, cc }) {
  const safeTo = String(to || "").trim();
  const mailFrom = from || DEFAULT_MAIL_FROM;
  const mailCc = cc || DEFAULT_MAIL_CC;
  const samePerson = mailCc.toLowerCase() === safeTo.toLowerCase();
  const text = samePerson
    ? "Your property report for " + address + " is ready. Open it anytime:\n\n" + url + "\n\nWombat Home Loans"
    : "Your property report for " + address + " is ready. Open it anytime:\n\n" + url + "\n\nTom is copied on this email.\n\nWombat Home Loans";
  const html = [
    "<p>Your property report for " + escapeHtml(address) + " is ready. Open it anytime:</p>",
    "<p><a href=\"" + escapeHtml(url) + "\">" + escapeHtml(url) + "</a></p>",
    samePerson ? "" : "<p>Tom is copied on this email.</p>",
    "<p>Wombat Home Loans</p>",
  ].filter(Boolean).join("");
  const message = {
    from: mailFrom,
    to: [safeTo],
    subject: "Your PropIQ report for " + address,
    text: text,
    html: html,
  };
  if (!samePerson) message.cc = [mailCc];
  return message;
}

export function mapUpstream(status, body) {
  const error = body && typeof body.error === "string" ? body.error : "";

  if (status === 422 || error === "unusable_address") {
    return { status: 422, retryable: false, message: COPY.unusableAddress };
  }
  if (status === 401) {
    return { status: 401, retryable: false, message: COPY.fail };
  }
  if (status === 409 || error === "cap_reached") {
    return { status: 409, retryable: false, message: COPY.fail };
  }
  if (status === 400) {
    return { status: 400, retryable: false, message: COPY.fail };
  }
  if (error === "link_unavailable") {
    return { status: 500, retryable: false, message: COPY.fail };
  }
  if (error === "account_unavailable" || error === "report_unavailable" || status >= 500) {
    return {
      status: status >= 500 ? status : 500,
      retryable: true,
      message: COPY.fail,
    };
  }
  return { status: 502, retryable: false, message: COPY.fail };
}

// Checked 1 Oct 2026 on qa.pifiproperty.com (the home page and a /s/ session).
// No X-Frame-Options. The enforcing Content-Security-Policy is only base-uri,
// object-src, and form-action. frame-ancestors 'self' is report-only, so Chrome
// still paints the report in a frame and leaves the parent page in place.
// A refused frame (github.com) fires the same load event and SecurityError, so
// page script cannot tell those apart. Read enforcing headers only. If that
// report-only rule is later enforced, this returns false and the page opens a
// new tab instead. The live PiFi host was not checked and may differ.
export function frameAllowed(headers) {
  const read = (name) => {
    if (!headers) return "";
    if (typeof headers.get === "function") return headers.get(name) || "";
    return headers[name] || headers[name.toLowerCase()] || "";
  };
  const xfo = String(read("x-frame-options")).toLowerCase();
  if (/\bdeny\b/.test(xfo) || /\bsameorigin\b/.test(xfo)) return false;
  const csp = String(read("content-security-policy"));
  const rules = csp.split(/[;]/).map((part) => part.trim()).filter((part) => /^frame-ancestors\b/i.test(part));
  if (!rules.length) return true;
  return rules.every((rule) => {
    const sources = rule.replace(/^frame-ancestors/i, "").trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (sources.includes("'none'")) return false;
    if (sources.includes("*")) return true;
    return sources.some((src) => src.includes("wombathomeloans.com.au"));
  });
}

export async function probeReportFrame(url, fetchImpl) {
  if (!isReportUrl(url)) return false;
  const doFetch = fetchImpl || fetch;
  let current = url;
  for (let hop = 0; hop < 3; hop += 1) {
    const res = await doFetch(current, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(4000),
    });
    if (res.body && typeof res.body.cancel === "function") {
      try { await res.body.cancel(); } catch { /* the headers are enough */ }
    }
    if (res.status >= 300 && res.status < 400) {
      const next = new URL(res.headers.get("location") || "", current).href;
      if (!isReportUrl(next)) return false;
      current = next;
      continue;
    }
    if (res.status < 200 || res.status >= 300) return false;
    return frameAllowed(res.headers);
  }
  return false;
}

export function isReportUrl(value) {
  try {
    const url = new URL(String(value || ""));
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:" && (host === "pifiproperty.com" || host.endsWith(".pifiproperty.com"));
  } catch {
    return false;
  }
}

export function friendlyConfigError() {
  return { status: 503, retryable: false, message: COPY.fail };
}
