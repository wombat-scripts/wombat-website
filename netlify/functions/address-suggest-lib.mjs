/**
 * Address suggestion formatting. Photon is the QA preview provider.
 * A later provider can return the same { label, address } list.
 */

export const MIN_QUERY = 3;
export const MAX_SUGGESTIONS = 8;

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

export function abbreviateState(state) {
  const key = String(state || "").trim().toLowerCase();
  return STATE_ABBR[key] || "";
}

export function queryTokens(query) {
  return String(query || "")
    .toLowerCase()
    .replace(/^\s*\d+[a-z]?\b/, " ")
    .split(/[^a-z]+/)
    .filter(function (token) {
      return token.length >= 3 && !STATE_ABBR[token];
    });
}

export function leadingNumber(query) {
  const match = String(query || "").match(/^\s*(\d+[a-z]?)\b/i);
  return match ? match[1] : "";
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

export function formatSuggestion(feature, query) {
  const props = feature && feature.properties ? feature.properties : feature;
  if (!props || String(props.countrycode || "").toUpperCase() !== "AU") return null;
  const street = streetOf(props);
  if (/freeway|motorway/i.test(street)) return null;
  const fromFeature = String(props.housenumber || "").trim();
  const fromQuery = leadingNumber(query);
  const number = fromFeature || fromQuery;
  if (!number || !street) return null;
  const locality = localityOf(props);
  const state = abbreviateState(props.state);
  const postcode = String(props.postcode || "").trim();
  if (!locality || !state) return null;

  const tokens = queryTokens(query);
  const hay = (street + " " + locality).toLowerCase();
  if (tokens.length && !tokens.some(function (token) { return hay.includes(token); })) return null;

  const address = postcode
    ? number + " " + street + ", " + locality + " " + state + " " + postcode
    : number + " " + street + ", " + locality + " " + state;

  let score = 0;
  if (fromFeature) score += 4;
  if (fromQuery && street.toLowerCase().includes((tokens[0] || "").toLowerCase()) && tokens[0]) score += 6;
  if (nearSydney(feature)) score += 8;
  if (postcode) score += 1;
  tokens.forEach(function (token) {
    if (street.toLowerCase().includes(token)) score += 3;
    if (locality.toLowerCase().includes(token)) score += 1;
  });

  return { label: address, address: address, score: score };
}

export function suggestionsFromFeatures(features, query) {
  const seen = new Set();
  const list = [];
  (features || []).forEach(function (feature) {
    const item = formatSuggestion(feature, query);
    if (!item || seen.has(item.address)) return;
    seen.add(item.address);
    list.push(item);
  });
  list.sort(function (a, b) { return b.score - a.score; });
  return list.slice(0, MAX_SUGGESTIONS).map(function (item) {
    return { label: item.label, address: item.address };
  });
}

export function normaliseQuery(raw) {
  return String(raw || "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, 120);
}
