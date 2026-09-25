/**
 * PiFi Partner Handover helpers.
 * Host and key come from env at request time. This module never embeds them.
 * QA builds accept only the QA API host so a mis-set env cannot call live.
 */

export const QA_HOST = "https://api.qa.pifiproperty.com";
export const RETURN_URL = "https://www.wombathomeloans.com.au/property-iq";
export const TIMEOUT_MS = 30000;

const JOURNEYS = new Set(["buy", "invest", "sell", "rent", "price"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const journey = typeof src.journey === "string" ? src.journey.trim() : "";
  const context = typeof src.context === "string" ? src.context.trim() : "";

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
  if (!JOURNEYS.has(journey) || context.length > 8000) {
    return { ok: false, message: COPY.fail };
  }

  const body = {
    email: email.trim(),
    address,
    journey,
    returnUrl: RETURN_URL,
  };
  if (context) body.context = context;
  return { ok: true, body };
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

export function friendlyConfigError() {
  return { status: 503, retryable: false, message: COPY.fail };
}
