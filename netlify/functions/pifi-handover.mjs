/**
 * Server proxy for the PiFi Partner Handover API.
 * POST /.netlify/functions/pifi-handover
 *
 * Reads PIFI_API_HOST and PIFI_PARTNER_KEY from the environment only.
 * This QA build refuses any host other than the QA API.
 * The partner key is never written to the response or to logs.
 */
import {
  TIMEOUT_MS,
  assertQaHost,
  COPY,
  friendlyConfigError,
  mapUpstream,
  validateInput,
} from "./pifi-handover-lib.mjs";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function json(status, payload) {
  return new Response(JSON.stringify(payload), { status, headers: JSON_HEADERS });
}

async function readJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

async function callUpstream(host, key, body) {
  const res = await fetch(`${host}/v1/partner/handover`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const upstream = await readJson(res);
  return { status: res.status, upstream };
}

export default async (req) => {
  if (req.method !== "POST") {
    return json(405, { message: COPY.fail, retryable: false });
  }

  const hostEnv = process.env.PIFI_API_HOST;
  const key = process.env.PIFI_PARTNER_KEY;
  if (!hostEnv || !key) {
    const missing = friendlyConfigError();
    return json(missing.status, { message: missing.message, retryable: false });
  }

  let host;
  try {
    host = assertQaHost(hostEnv);
  } catch {
    const blocked = friendlyConfigError();
    console.error("pifi-handover: host rejected (QA host required)");
    return json(blocked.status, { message: blocked.message, retryable: false });
  }

  let raw;
  try {
    raw = await req.json();
  } catch {
    return json(400, { message: COPY.fail, retryable: false });
  }

  const validated = validateInput(raw);
  if (!validated.ok) {
    return json(400, { message: validated.message, retryable: false });
  }

  let attempt = 0;
  while (attempt < 2) {
    attempt += 1;
    let result;
    try {
      result = await callUpstream(host, key, validated.body);
    } catch (err) {
      const timedOut = err && (err.name === "TimeoutError" || err.name === "AbortError");
      console.error("pifi-handover: upstream failed", timedOut ? "timeout" : "network");
      if (attempt < 2) continue;
      return json(504, { message: COPY.fail, retryable: true });
    }

    if (result.status === 201 && result.upstream && typeof result.upstream.url === "string") {
      console.info("pifi-handover: created");
      return json(201, { url: result.upstream.url });
    }

    const mapped = mapUpstream(result.status, result.upstream);
    console.error("pifi-handover: upstream status", result.status, result.upstream && result.upstream.error ? result.upstream.error : "");
    if (mapped.retryable && attempt < 2) continue;
    return json(mapped.status, { message: mapped.message, retryable: mapped.retryable });
  }

  return json(502, { message: COPY.fail, retryable: true });
};
