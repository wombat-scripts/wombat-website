/**
 * PiFi Partner Handover helpers.
 * Host and key come from env at request time. This module never embeds them.
 * QA builds accept only the QA API host so a mis-set env cannot call live.
 */

export const QA_HOST = "https://api.qa.pifiproperty.com";
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

export function assertQaHost(host) {
  const normalised = normaliseHost(host);
  if (normalised !== QA_HOST) {
    const err = new Error("PiFi host is not the QA host");
    err.code = "host_not_qa";
    throw err;
  }
  return normalised;
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
