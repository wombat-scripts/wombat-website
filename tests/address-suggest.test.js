'use strict';

var fs = require('fs');
var path = require('path');
var test = require('node:test');
var assert = require('node:assert/strict');

var root = path.join(__dirname, '..');

test('12 Gore prefers Gore Street, Parramatta as a handover address', async function () {
  var lib = await import('../netlify/functions/address-suggest-lib.mjs');
  var features = [
    { properties: { type: 'street', name: 'Gore Street', city: 'Parramatta', state: 'New South Wales', postcode: '2150', countrycode: 'AU' } },
    { properties: { type: 'house', housenumber: '12', street: 'George Street', district: 'Parramatta', city: 'Parramatta', state: 'NSW', postcode: '2150', countrycode: 'AU' } },
    { properties: { type: 'house', housenumber: '12', street: 'Parramatta Walk', district: 'Craigieburn', city: 'Melbourne', state: 'Victoria', postcode: '3064', countrycode: 'AU' } },
    { properties: { type: 'house', housenumber: '10', street: 'King Street', city: 'Auckland', state: 'Auckland', postcode: '1010', countrycode: 'NZ' } },
  ];
  var list = await lib.suggestAddresses('12 Gore', async function () { return features; });
  assert.equal(list[0].address, '12 Gore Street, Parramatta NSW 2150');
  assert.equal(list[0].label, list[0].address);
  assert.ok(list.length <= 8);
  assert.equal(list.some(function (item) { return /Auckland/.test(item.address); }), false);
  assert.equal(list.some(function (item) { return item.address === '12 Parramatta Walk, Craigieburn VIC 3064'; }), false);
  assert.equal(list.some(function (item) { return item.address.indexOf(',') === -1; }), false);
});

test('state names become abbreviations and duplicates collapse', async function () {
  var lib = await import('../netlify/functions/address-suggest-lib.mjs');
  var features = [
    { properties: { type: 'house', housenumber: '4', street: 'Queen Street', city: 'Brisbane', state: 'Queensland', postcode: '4000', countrycode: 'AU' } },
    { properties: { type: 'house', housenumber: '4', street: 'Queen Street', city: 'Brisbane', state: 'QLD', postcode: '4000', countrycode: 'AU' } },
  ];
  var list = await lib.suggestAddresses('Queen Street', async function () { return features; });
  assert.equal(list.length, 1);
  assert.equal(list[0].address, '4 Queen Street, Brisbane QLD 4000');
});

test('a typed unit stays on the street when Photon only has the street number', async function () {
  var lib = await import('../netlify/functions/address-suggest-lib.mjs');
  var features = [
    { properties: { type: 'house', housenumber: '3', street: 'Webb Street', district: 'East Gosford', city: 'Gosford', state: 'New South Wales', postcode: '2250', countrycode: 'AU' } },
    { properties: { type: 'street', name: 'Webb Street', city: 'East Gosford', state: 'NSW', postcode: '2250', countrycode: 'AU' } },
  ];
  var slash = await lib.suggestAddresses('3/9 Webb', async function () { return features; });
  assert.equal(slash[0].address, '3/9 Webb Street, East Gosford NSW 2250');
  assert.equal(slash.some(function (item) { return item.address.indexOf('3 Webb') === 0; }), false);
  assert.equal(slash.some(function (item) { return item.address === 'East Gosford NSW 2250'; }), false);
  var labelled = await lib.suggestAddresses('Unit 3/9 Webb', async function () { return features; });
  assert.equal(labelled[0].address, 'Unit 3/9 Webb Street, East Gosford NSW 2250');
});

test('a suburb comes back as Suburb STATE postcode, ahead of streets', async function () {
  var lib = await import('../netlify/functions/address-suggest-lib.mjs');
  var noStreets = async function () { return []; };

  var ettalong = await lib.suggestAddresses('ettalong beach', noStreets);
  assert.equal(ettalong[0].address, 'Ettalong Beach NSW 2257');
  assert.equal(ettalong[0].label, ettalong[0].address);

  var beside = [
    { properties: { type: 'house', housenumber: '14', street: 'The Esplanade', district: 'Ettalong Beach', state: 'New South Wales', postcode: '9999', countrycode: 'AU' } },
  ];
  var withStreet = await lib.suggestAddresses('ettalong beach', async function () { return beside; });
  assert.equal(withStreet[0].address, 'Ettalong Beach NSW 2257');
  assert.equal(withStreet[0].label, withStreet[0].address);
  assert.equal(withStreet.some(function (row) { return row.address === 'Ettalong Beach NSW 9999'; }), false);
  assert.equal(withStreet.some(function (row) { return row.address === '14 The Esplanade, Ettalong Beach NSW 9999'; }), true);

  var gosfordFeatures = [
    { properties: { type: 'city', name: 'Gosford', state: 'New South Wales', postcode: '2250', countrycode: 'AU' } },
    { properties: { type: 'house', housenumber: '9-11', street: 'Mann Street', district: 'Gosford', state: 'New South Wales', postcode: '2250', countrycode: 'AU' } },
  ];
  var gosford = await lib.suggestAddresses('gosford', async function () { return gosfordFeatures; });
  assert.equal(gosford[0].address, 'Gosford NSW 2250');
  assert.ok(gosford.some(function (row) { return row.address === '9-11 Mann Street, Gosford NSW 2250'; }));
  assert.ok(gosford.length <= 8);
});

test('suburbs survive a Photon failure', async function () {
  var lib = await import('../netlify/functions/address-suggest-lib.mjs');
  var down = async function () { throw new Error('timeout'); };
  var rows = await lib.suggestAddresses('ettalong', down);
  assert.equal(rows[0].address, 'Ettalong Beach NSW 2257');
  var syncDown = function () { throw new Error('timeout'); };
  var syncRows = await lib.suggestAddresses('ettalong beach', syncDown);
  assert.equal(syncRows[0].address, 'Ettalong Beach NSW 2257');
});

test('a postcode or a tiny query does not ask for streets', async function () {
  var lib = await import('../netlify/functions/address-suggest-lib.mjs');
  var calls = 0;
  var source = async function () { calls += 1; return []; };
  assert.deepEqual(await lib.suggestAddresses('2250', source), []);
  assert.deepEqual(await lib.suggestAddresses('ab', source), []);
  assert.deepEqual(await lib.suggestAddresses('nsw', source), []);
  assert.equal(calls, 0);
});

test('every bundled suburb is a value the handover accepts', async function () {
  var data = (await import('../netlify/data/au-localities.generated.mjs')).LOCALITIES_BY_POSTCODE;
  var check = (await import('../netlify/functions/handover-address-lib.mjs')).checkHandoverAddress;
  var labels = [];
  Object.keys(data).forEach(function (state) {
    Object.keys(data[state]).forEach(function (postcode) {
      data[state][postcode].forEach(function (name) { labels.push(name + ' ' + state + ' ' + postcode); });
    });
  });
  assert.ok(labels.length > 10000);
  assert.equal(new Set(labels).size, labels.length);
  assert.ok(labels.indexOf('Ettalong Beach NSW 2257') !== -1);
  assert.ok(labels.indexOf('Gosford NSW 2250') !== -1);
  assert.ok(labels.indexOf('Macquarie Park NSW 2113') !== -1);
  assert.equal(labels.some(function (label) { return label.indexOf('McCquarie') !== -1; }), false);
  labels.forEach(function (label) { assert.equal(check(label).ok, true, label); });
});

test('only the suggest lib reads the locality data', function () {
  function walk(dir, acc) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach(function (ent) {
      var full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (full === path.join(root, 'netlify', 'data')) return;
        walk(full, acc);
        return;
      }
      if (/\.(mjs|js|njk|md|css|json|html|svg|txt|xml)$/.test(ent.name)) acc.push(full);
    });
  }
  var files = [];
  walk(path.join(root, 'netlify'), files);
  walk(path.join(root, 'src'), files);
  var mentioned = [];
  files.forEach(function (file) {
    var text = fs.readFileSync(file, 'utf8');
    if (text.indexOf('au-localities') === -1) return;
    mentioned.push(path.relative(root, file).split(path.sep).join('/'));
  });
  assert.deepEqual(mentioned, ['netlify/functions/address-suggest-lib.mjs']);
});

test('short queries and the client stay on our function', function () {
  var page = fs.readFileSync(path.join(root, 'src/property-iq.njk'), 'utf8');
  var client = fs.readFileSync(path.join(root, 'src/assets/js/property-iq.js'), 'utf8');
  var home = fs.readFileSync(path.join(root, 'src/index.njk'), 'utf8');
  var fn = fs.readFileSync(path.join(root, 'netlify/functions/address-suggest.mjs'), 'utf8');
  assert.match(page, /role="combobox"/);
  assert.match(page, /role="listbox"/);
  assert.match(client, /\/\.netlify\/functions\/address-suggest\?q=/);
  assert.match(client, /280/);
  assert.match(client, /ArrowDown/);
  assert.match(client, /withTypedUnit/);
  assert.match(client, /wombat-piq-recent/);
  assert.match(client, /RECENT_LIMIT = 10/);
  assert.match(client, /function rememberAddress/);
  assert.match(client, /function showRecent/);
  assert.match(client, /textContent = "Recent"/);
  assert.match(client, /showRecent\(""\)/);
  assert.match(client, /rememberAddress\(addressInput\.value\)/);
  assert.doesNotMatch(client, /localStorage\.setItem\([\s\S]{0,180}email/);
  assert.doesNotMatch(client, /umami\.track\([\s\S]{0,80}recent/i);
  assert.doesNotMatch(client + page, /photon\.komoot\.io/);
  assert.doesNotMatch(client + page, /api\.pifiproperty\.com/);
  assert.doesNotMatch(client + page + fn, /\u2014/);
  assert.match(fn, /ADDRESS_SUGGEST_PROVIDER/);
  assert.match(fn, /User-Agent/);
  assert.match(fn, /suggestAddresses/);
  assert.doesNotMatch(fn, /streetRemainder|suggestionsFromFeatures|normaliseQuery|queryTokens/);
  var tools = home.slice(home.indexOf('id="tools"'), home.indexOf('id="tools-next"'));
  assert.doesNotMatch(tools, /piq-address|address-suggest/);
});
