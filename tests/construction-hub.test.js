'use strict';

var fs = require('fs');
var path = require('path');
var test = require('node:test');
var assert = require('node:assert/strict');

var root = path.join(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

test('construction hub template is a buyer-framed page with jump links', function () {
  var hub = read('src/construction/index.njk');
  assert.match(hub, /permalink:\s*\/construction\//);
  assert.match(hub, /id="fork"/);
  assert.match(hub, /id="finished"/);
  assert.match(hub, /id="building"/);
  assert.match(hub, /id="how-it-differs"/);
  assert.match(hub, /id="example"/);
  assert.match(hub, /href="\/construction\/house-and-land-cash\/"/);
  assert.match(hub, /href="\/book\/"/);
  assert.match(hub, /href="\/calculators\/"/);
  assert.match(hub, /Book a Strategy Session/);
  assert.match(hub, /\$19,687/);
  assert.doesNotMatch(hub, /discovery call/i);
  assert.doesNotMatch(hub, /\bCBA\b|CommBank|Commonwealth Bank/);
  assert.doesNotMatch(hub, /<details/);
});

test('cash walk lives under /construction/ and keeps the engine hooks', function () {
  var walk = read('src/construction/house-and-land-cash.njk');
  assert.match(walk, /permalink:\s*\/construction\/house-and-land-cash\//);
  assert.match(walk, /Construction/);
  assert.match(walk, /href="\/construction\/"/);
  assert.match(walk, /data-hlc/);
  assert.match(walk, /id="hlc-form"/);
  assert.match(walk, /id="hlc-lvr"/);
  assert.match(walk, /id="hlc-fhb"/);
  assert.match(walk, /id="hlc-rate"/);
  assert.match(walk, /id="hlc-rent"/);
  assert.match(walk, /id="hlc-stages"/);
  assert.match(walk, /<details class="hlc-more" open>/);
  assert.match(walk, /Book a Strategy Session/);
  assert.doesNotMatch(walk, /discovery call/i);
  assert.doesNotMatch(walk, /permalink:\s*\/tools\/house-and-land-cash\//);
});

test('old walk URL is a redirect stub and Netlify 301s it to the new walk', function () {
  var stub = read('src/tools/house-and-land-cash.njk');
  assert.match(stub, /permalink:\s*\/tools\/house-and-land-cash\//);
  assert.match(stub, /construction\/house-and-land-cash\//);
  assert.match(stub, /http-equiv="refresh"/);

  var netlify = read('netlify.toml');
  assert.match(netlify, /from = "\/tools\/house-and-land-cash\/"/);
  assert.match(netlify, /to = "\/construction\/house-and-land-cash\/"/);
  assert.match(netlify, /status = 301/);
});

test('quiet Tools links point at the hub, not the raw form', function () {
  var home = read('src/index.njk');
  var calcs = read('src/calculators/index.njk');
  var footer = read('src/_includes/footer.njk');

  assert.match(home, /href="\/construction\/"/);
  assert.match(home, /data-umami-event-location="tools"/);
  assert.doesNotMatch(home, /href="\/tools\/house-and-land-cash\/"/);
  assert.doesNotMatch(home, /data-umami-event-location="hero"[^>]*construction/);

  assert.match(calcs, /href="\/construction\/"/);
  assert.match(calcs, /Building vs buying/);
  assert.doesNotMatch(calcs, /href="\/tools\/house-and-land-cash\/"/);

  assert.match(footer, /href="\/construction\/"/);
  assert.match(footer, /Building vs buying/);
  assert.doesNotMatch(footer, /href="\/tools\/house-and-land-cash\/"/);
});
