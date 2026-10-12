/**
 * Which address strings the Property IQ form may hand to PiFi.
 * The browser loads this file unchanged from /property-iq/handover-address.js.
 * It stays free of imports and Node APIs so that copy keeps working.
 */

const STATE = "(?:NSW|VIC|QLD|SA|WA|TAS|NT|ACT)";

// "Ettalong Beach NSW 2257", "gosford nsw 2250", "Gosford, NSW 2250", "O'Connor ACT 2602".
// iOS smart punctuation turns ' into a right quote, so both are allowed.
const LOCALITY_FORM = new RegExp(
  "^[A-Za-z][A-Za-z'\\u2019. -]*[A-Za-z],?\\s+" + STATE + "\\s+\\d{4}$",
  "i"
);

// A house number, optionally lettered, unit-prefixed or ranged, then a street word.
const STREET_FORM = /(?:^|[\s,\/])[A-Za-z]?\d+[A-Za-z]?(?:\s*[\/-]\s*\d+[A-Za-z]?)?\s+[A-Za-z][A-Za-z'\u2019.-]+/;

const POSTCODE_ONLY = new RegExp("^(?:" + STATE + "\\s+)?\\d{4}$", "i");

const MAX_LENGTH = 300;

const MESSAGES = {
  empty: "Add an address or suburb so we know which place to look up.",
  postcode_only: "A postcode on its own covers a few suburbs. Add the suburb or street, then pick it from the list.",
  incomplete: "Add a street number, or pick your suburb from the list so it has the state and postcode.",
  unrecognised: "We couldn't match that address. Check the spelling, or pick a suggestion from the list.",
};

function fail(reason) {
  return { ok: false, reason: reason, message: MESSAGES[reason] };
}

/**
 * Accepts a trimmed length of 1 to 300 that matches a suburb or a street.
 * Never rewrites the value. Callers send the string they want to keep.
 * @param {unknown} value
 */
export function checkHandoverAddress(value) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return fail("empty");
  if (text.length > MAX_LENGTH) return fail("unrecognised");
  if (LOCALITY_FORM.test(text)) return { ok: true, kind: "locality" };
  if (STREET_FORM.test(text)) return { ok: true, kind: "street" };
  if (POSTCODE_ONLY.test(text)) return fail("postcode_only");
  if (/[A-Za-z]/.test(text) && !/\d/.test(text)) return fail("incomplete");
  return fail("unrecognised");
}
