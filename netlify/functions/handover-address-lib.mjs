const STATE = "(?:NSW|VIC|QLD|SA|WA|TAS|NT|ACT)";

// iOS smart punctuation turns ' into a right quote, so both are allowed.
const LOCALITY_FORM = new RegExp(
  "^[A-Za-z][A-Za-z'\\u2019. -]*[A-Za-z],?\\s+" + STATE + "\\s+\\d{4}$",
  "i"
);

const HOUSE_NUMBER = "[A-Za-z]?\\d+[A-Za-z]?(?:\\s*[\\/-]\\s*\\d+[A-Za-z]?)?";
const STREET_WORD = "[A-Za-z][A-Za-z'\\u2019.-]+";
const STREET_FORM = new RegExp("(?:^|[\\s,/])" + HOUSE_NUMBER + "\\s+" + STREET_WORD);

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
