'use strict';

var fs = require('fs');
var path = require('path');
var test = require('node:test');
var assert = require('node:assert/strict');

var root = path.join(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function assertNoEmDash(text, label) {
  assert.doesNotMatch(text, /\u2014|\u2013/, label + ' must not contain em or en dashes');
}

test('llms.txt is the short index and points at llms-full.txt', function () {
  var short = read('src/llms.txt.njk');
  var full = read('src/llms-full.txt.njk');
  var robots = read('src/robots.txt.njk');
  var sitemap = read('src/sitemap.xml.njk');

  assert.match(short, /permalink: \/llms\.txt/);
  assert.match(full, /permalink: \/llms-full\.txt/);
  assert.match(short, /https:\/\/wombathomeloans\.com\.au\/llms-full\.txt/);
  assert.match(full, /https:\/\/wombathomeloans\.com\.au\/llms\.txt/);
  assert.match(short, /Suite 1, 86 Mann St, Gosford NSW 2250/);
  assert.match(short, /559744/);
  assert.match(short, /561324/);
  assert.match(full, /Suite 1, 86 Mann St, Gosford NSW 2250/);
  assert.match(full, /Credit Representative Number: 559744/);
  assert.match(full, /Australian Credit Licence: 561324/);
  assert.match(full, /## Public URLs/);
  assert.match(short, /https:\/\/wombathomeloans\.com\.au\/property-iq\//);
  assert.match(full, /https:\/\/wombathomeloans\.com\.au\/property-iq\//);
  assert.doesNotMatch(short, /wombathl\.pifiproperty\.com/);
  assert.doesNotMatch(full, /wombathl\.pifiproperty\.com/);
  assert.doesNotMatch(short, /\/tools\/house-and-land-cash/);
  assert.doesNotMatch(full, /\/landing\/getting-mortgage-ready/);
  assert.match(robots, /https:\/\/wombathomeloans\.com\.au\/llms-full\.txt/);
  assert.match(sitemap, /page\.data\.permalink != "\/llms-full\.txt"/);
  assertNoEmDash(short, 'llms.txt');
  assertNoEmDash(full, 'llms-full.txt');
});

test('business JSON-LD geo is the Gosford Mann Street building, not Beecroft', function () {
  var base = read('src/_layouts/base.njk');
  assert.match(base, /"streetAddress": "Suite 1, 86 Mann Street"/);
  assert.match(base, /"addressLocality": "Gosford"/);
  assert.match(base, /"postalCode": "2250"/);
  assert.match(base, /"latitude": -33\.427413/);
  assert.match(base, /"longitude": 151\.341382/);
  assert.match(base, /"ratingValue": "4\.9"/);
  assert.match(base, /"ratingCount": "13"/);
  assert.match(base, /"name": "Sydney"/);
  assert.doesNotMatch(base, /-33\.7511/);
  assert.doesNotMatch(base, /151\.0759/);
  assert.doesNotMatch(base, /"addressLocality": "Sydney"/);
  assert.doesNotMatch(base, /"addressLocality": "Beecroft"/);
});

test('conversion events use the existing Umami track pattern', function () {
  var book = read('src/book.njk');
  var scripts = read('src/assets/js/scripts.js');
  var base = read('src/_layouts/base.njk');

  assert.match(book, /event\.origin !== 'https:\/\/calendly\.com'/);
  assert.match(book, /data\.event !== 'calendly\.event_scheduled'/);
  assert.match(book, /umami\.track\('book_strategy_scheduled'\)/);
  assert.match(scripts, /middle\.finance/);
  assert.match(scripts, /umami\.track\("middle_factfind_click"\)/);
  assert.match(base, /scripts\.js\?v=20261002/);
});
