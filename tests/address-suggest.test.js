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
  var list = lib.suggestionsFromFeatures(features, '12 Gore');
  assert.equal(list[0].address, '12 Gore Street, Parramatta NSW 2150');
  assert.equal(list[0].label, list[0].address);
  assert.ok(list.length <= 8);
  assert.equal(list.some(function (item) { return /Auckland/.test(item.address); }), false);
  assert.equal(list.some(function (item) { return item.address === '12 Parramatta Walk, Craigieburn VIC 3064'; }), false);
});

test('state names become abbreviations and duplicates collapse', async function () {
  var lib = await import('../netlify/functions/address-suggest-lib.mjs');
  assert.equal(lib.abbreviateState('Queensland'), 'QLD');
  assert.equal(lib.abbreviateState('VIC'), 'VIC');
  var features = [
    { properties: { type: 'house', housenumber: '4', street: 'Queen Street', city: 'Brisbane', state: 'Queensland', postcode: '4000', countrycode: 'AU' } },
    { properties: { type: 'house', housenumber: '4', street: 'Queen Street', city: 'Brisbane', state: 'QLD', postcode: '4000', countrycode: 'AU' } },
  ];
  var list = lib.suggestionsFromFeatures(features, 'Queen Street');
  assert.equal(list.length, 1);
  assert.equal(list[0].address, '4 Queen Street, Brisbane QLD 4000');
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
  assert.doesNotMatch(client + page, /photon\.komoot\.io/);
  assert.doesNotMatch(client + page, /api\.pifiproperty\.com/);
  assert.doesNotMatch(client + page + fn, /\u2014/);
  assert.match(fn, /ADDRESS_SUGGEST_PROVIDER/);
  assert.match(fn, /User-Agent/);
  var tools = home.slice(home.indexOf('id="tools"'), home.indexOf('id="tools-next"'));
  assert.doesNotMatch(tools, /piq-address|address-suggest/);
});
