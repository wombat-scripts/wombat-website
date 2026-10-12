/**
 * Property IQ suggestions. Suburbs come from the bundled locality list.
 * Streets come from the feature source. Every address can be submitted.
 */
import { checkHandoverAddress } from "./handover-address-lib.mjs";
import { LOCALITIES_BY_POSTCODE } from "../data/au-localities.mjs";

const MIN_QUERY = 3;
const MAX_SUGGESTIONS = 8;
const LOCALITY_SLOTS = 3;
const HOME_STATE = "NSW";
const STREET_SUFFIX = /\b(street|st|road|rd|avenue|ave|drive|dr|place|pl|crescent|cres|parade|pde|lane|ln|way|court|ct|terrace|tce)\b/i;

const STATE_ABBR = {
  "new south wales": "NSW",
  victoria: "VIC",
  queensland: "QLD",
  "south australia": "SA",
  "western australia": "WA",
  tasmania: "TAS",
  "northern territory": "NT",
  "australian capital territory": "ACT",
  nsw: "NSW",
  vic: "VIC",
  qld: "QLD",
  sa: "SA",
  wa: "WA",
  tas: "TAS",
  nt: "NT",
  act: "ACT",
};

function abbreviateState(state) {
  const key = String(state || "").trim().toLowerCase();
  return STATE_ABBR[key] || "";
}

function leadingNumber(query) {
  const match = String(query || "").match(/^\s*(\d+[a-z]?)\b/i);
  return match ? match[1] : "";
}

function typedUnit(query) {
  const text = String(query || "").trim();
  let match = text.match(/^(unit|flat|apartment|apt)\s+(\d+[a-z]?(?:\s*\/\s*\d+[a-z]?)?)/i);
  if (match) {
    const word = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
    return word + " " + match[2].replace(/\s*\/\s*/g, "/");
  }
  match = text.match(/^(\d+[a-z]?)\s*\/\s*(\d+[a-z]?)/i);
  if (match) return match[1] + "/" + match[2];
  return "";
}

function streetRemainder(query) {
  const text = String(query || "").trim();
  if (typedUnit(query)) {
    return text
      .replace(/^(?:unit|flat|apartment|apt)\s+\d+[a-z]?(?:\s*\/\s*\d+[a-z]?)?\s*/i, "")
      .replace(/^\d+[a-z]?\s*\/\s*\d+[a-z]?\s*/i, "")
      .trim();
  }
  const number = leadingNumber(query);
  if (!number) return text;
  return text.replace(/^\s*\d+[a-z]?\b\s*/i, "").trim();
}

function queryTokens(query) {
  return streetRemainder(query)
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((token) => token.length >= 3 && !STATE_ABBR[token]);
}

function normaliseQuery(raw) {
  return String(raw || "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, 120);
}

function worthLookingUp(query) {
  return query.length >= MIN_QUERY && /[A-Za-z]/.test(query) && queryTokens(query).length > 0;
}

function streetLookups(query) {
  const lookups = [query];
  const rest = streetRemainder(query);
  if (rest.length >= MIN_QUERY && rest !== query) lookups.push(rest);
  if (rest && !STREET_SUFFIX.test(rest)) lookups.push(rest + " street");
  return lookups;
}

function localityOf(props) {
  return String(props.district || props.locality || props.city || "").trim();
}

function streetOf(props) {
  if (props.street) return String(props.street).trim();
  if (props.type === "street" && props.name) return String(props.name).trim();
  return "";
}

function nearSydney(feature) {
  const coords = feature && feature.geometry && feature.geometry.coordinates;
  if (!coords) return false;
  const lon = Number(coords[0]);
  const lat = Number(coords[1]);
  return Math.abs(lat + 33.87) < 0.9 && Math.abs(lon - 151.21) < 0.9;
}

function formatSuggestion(feature, query) {
  const props = feature && feature.properties ? feature.properties : feature;
  if (!props || String(props.countrycode || "").toUpperCase() !== "AU") return null;
  const street = streetOf(props);
  if (/freeway|motorway/i.test(street)) return null;
  const fromFeature = String(props.housenumber || "").trim();
  const fromQuery = leadingNumber(query);
  const unit = typedUnit(query);
  const number = unit || fromFeature || fromQuery;
  if (!number || !street) return null;
  const locality = localityOf(props);
  const state = abbreviateState(props.state);
  const postcode = String(props.postcode || "").trim();
  if (!locality || !state) return null;

  const tokens = queryTokens(query);
  const hay = (street + " " + locality).toLowerCase();
  if (tokens.length && !tokens.some((token) => hay.includes(token))) return null;

  const address = postcode
    ? number + " " + street + ", " + locality + " " + state + " " + postcode
    : number + " " + street + ", " + locality + " " + state;

  let score = 0;
  if (fromFeature) score += 4;
  if (fromQuery && street.toLowerCase().includes((tokens[0] || "").toLowerCase()) && tokens[0]) score += 6;
  if (nearSydney(feature)) score += 8;
  if (postcode) score += 1;
  tokens.forEach((token) => {
    if (street.toLowerCase().includes(token)) score += 3;
    if (locality.toLowerCase().includes(token)) score += 1;
  });

  return { label: address, address: address, score: score };
}

function streetCandidates(features, query) {
  const seen = new Set();
  const list = [];
  (features || []).forEach((feature) => {
    const item = formatSuggestion(feature, query);
    if (!item || seen.has(item.address)) return;
    seen.add(item.address);
    list.push(item);
  });
  list.sort((a, b) => b.score - a.score);
  return list;
}

function localityKey(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/['\u2019.]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function buildLocalities(byState) {
  const rows = [];
  Object.keys(byState).forEach((state) => {
    Object.keys(byState[state]).forEach((postcode) => {
      byState[state][postcode].forEach((name) => {
        rows.push({
          label: name + " " + state + " " + postcode,
          key: localityKey(name),
          state: state,
          postcode: postcode,
        });
      });
    });
  });
  rows.sort((a, b) => {
    if (a.key !== b.key) return a.key < b.key ? -1 : 1;
    if (a.state !== b.state) return a.state < b.state ? -1 : 1;
    if (a.postcode !== b.postcode) return a.postcode < b.postcode ? -1 : 1;
    return 0;
  });
  return rows;
}

const LOCALITIES = buildLocalities(LOCALITIES_BY_POSTCODE);

function takeState(words) {
  const max = Math.min(3, words.length);
  for (let n = max; n >= 1; n -= 1) {
    const tail = words.slice(words.length - n).join(" ");
    if (STATE_ABBR[tail]) {
      return { state: STATE_ABBR[tail], words: words.slice(0, words.length - n) };
    }
  }
  return null;
}

function parseLocalityQuery(query) {
  if (leadingNumber(query) || typedUnit(query)) return null;
  let words = localityKey(query).split(" ").filter(Boolean);
  let state = null;
  let postcode = null;
  for (let pass = 0; pass < 2; pass += 1) {
    if (!words.length) break;
    const last = words[words.length - 1];
    if (!postcode && /^\d{4}$/.test(last)) {
      postcode = last;
      words = words.slice(0, -1);
      continue;
    }
    if (!state) {
      const peeled = takeState(words);
      if (peeled) {
        state = peeled.state;
        words = peeled.words;
        continue;
      }
    }
    break;
  }
  if (words.some((word) => /\d/.test(word))) return null;
  const name = words.join(" ");
  if (name.length < MIN_QUERY) return null;
  return { name: name, state: state, postcode: postcode };
}

function tierFor(key, name) {
  if (key === name) return 0;
  if (key.startsWith(name)) return 1;
  const words = key.split(" ");
  for (let i = 1; i < words.length; i += 1) {
    if (words[i].startsWith(name)) return 2;
  }
  return -1;
}

function matchLocalities(lq) {
  if (!lq) return [];
  const home = [[], [], []];
  const other = [[], [], []];
  LOCALITIES.forEach((row) => {
    if (lq.state && row.state !== lq.state) return;
    if (lq.postcode && row.postcode !== lq.postcode) return;
    const tier = tierFor(row.key, lq.name);
    if (tier < 0) return;
    const bucket = row.state === HOME_STATE ? home[tier] : other[tier];
    bucket.push(row);
  });
  const out = [];
  for (let tier = 0; tier < 3; tier += 1) {
    out.push(...home[tier], ...other[tier]);
  }
  return out.slice(0, LOCALITY_SLOTS);
}

function mergeSuggestions(localities, streets) {
  const seen = new Set();
  const out = [];
  function push(address) {
    if (out.length >= MAX_SUGGESTIONS) return;
    if (!address || seen.has(address)) return;
    if (!checkHandoverAddress(address).ok) return;
    seen.add(address);
    out.push({ label: address, address: address });
  }
  localities.forEach((row) => push(row.label));
  streets.forEach((row) => push(row.address));
  return out;
}

/**
 * @param {string | null | undefined} rawQuery
 * @param {(query: string) => Promise<unknown>} source
 */
export async function suggestAddresses(rawQuery, source) {
  const query = normaliseQuery(rawQuery);
  if (!worthLookingUp(query)) return [];
  const localities = matchLocalities(parseLocalityQuery(query));
  const lookups = streetLookups(query);
  const settled = await Promise.allSettled(lookups.map((q) => Promise.resolve().then(() => source(q))));
  const features = settled.flatMap((result) => {
    return result.status === "fulfilled" && Array.isArray(result.value) ? result.value : [];
  });
  return mergeSuggestions(localities, streetCandidates(features, query));
}
