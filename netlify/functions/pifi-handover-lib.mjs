/**
 * PiFi Partner Handover helpers.
 * Host and key come from env at request time. This module never embeds them.
 * QA builds accept only the QA API host so a mis-set env cannot call live.
 */

export const QA_HOST = "https://api.qa.pifiproperty.com";
export const RETURN_URL = "https://www.wombathomeloans.com.au/book/";
export const TIMEOUT_MS = 30000;

const JOURNEYS = new Set(["buy", "invest", "sell", "rent", "price"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  if (email !== email.trim() || !EMAIL_RE.test(email.trim()) || email.trim().length > 254) {
    return { ok: false, message: "Enter a valid email address, with no spaces around it." };
  }
  if (address.length < 1 || address.length > 300 || !/[A-Za-z]/.test(address) || !/\d/.test(address)) {
    return {
      ok: false,
      message: "Enter a full street address with a number and a street name, plus suburb and state.",
    };
  }
  if (!JOURNEYS.has(journey)) {
    return { ok: false, message: "Choose buy, invest, sell, rent, or price." };
  }
  if (context.length > 8000) {
    return { ok: false, message: "Shorten the notes. 8,000 characters is the limit." };
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

  if (status === 401) {
    return {
      status: 401,
      retryable: false,
      message: "Property IQ is not available on this deploy. Book a Strategy Session and we can look at the place together.",
    };
  }
  if (status === 422 || error === "unusable_address") {
    return {
      status: 422,
      retryable: false,
      message: "That address is too vague. Add the street number, street name, suburb, and state.",
    };
  }
  if (status === 409 || error === "cap_reached") {
    return {
      status: 409,
      retryable: false,
      message: "We have hit today's limit for new reports. It resets overnight. Book a Strategy Session if you want to talk it through.",
    };
  }
  if (status === 400 && error === "invalid_return_url") {
    return {
      status: 400,
      retryable: false,
      message: "We could not open the report from this page. Book a Strategy Session and we will look at the place with you.",
    };
  }
  if (status === 400) {
    return {
      status: 400,
      retryable: false,
      message: "Check the email, the address, and what you want to do, then try again.",
    };
  }
  if (error === "link_unavailable") {
    return {
      status: 500,
      retryable: false,
      message: "We could not create a link for that report. Please book a Strategy Session.",
    };
  }
  if (error === "account_unavailable" || error === "report_unavailable" || status >= 500) {
    return {
      status: status >= 500 ? status : 500,
      retryable: true,
      message: "The report service is busy. Please try once more.",
    };
  }
  return {
    status: 502,
    retryable: false,
    message: "Something went wrong preparing the report. Please try once more in a moment.",
  };
}

export function friendlyConfigError() {
  return {
    status: 503,
    retryable: false,
    message: "Property IQ is not set up on this deploy yet. Book a Strategy Session and we can look at the place together.",
  };
}
