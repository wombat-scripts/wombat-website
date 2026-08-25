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
  assert.match(hub, /Start here so you do not open the wrong tool\./);
  assert.match(hub, /The cash timeline is only for one of the doors below\./);
  assert.match(hub, /This door opens the cash timeline/);
  assert.match(hub, /No cash timeline for this yet/);
  assert.match(hub, /Open the cash timeline/);
  assert.match(hub, /Run your own numbers/);
  assert.doesNotMatch(hub, /cash walk/i);
  assert.doesNotMatch(hub, /open the walk/i);
  assert.doesNotMatch(hub, /opens the walk/i);
  assert.doesNotMatch(hub, /walk into the wrong/);
  assert.doesNotMatch(hub, /walkable/i);
  assert.doesNotMatch(hub, /discovery call/i);
  assert.doesNotMatch(hub, /\bCBA\b|CommBank|Commonwealth Bank/);
  assert.doesNotMatch(hub, /<details/);
});

test('cash timeline lives under /construction/ and keeps the engine hooks', function () {
  var walk = read('src/construction/house-and-land-cash.njk');
  assert.match(walk, /permalink:\s*\/construction\/house-and-land-cash\//);
  assert.match(walk, /Construction/);
  assert.match(walk, /href="\/construction\/"/);
  assert.match(walk, /Cash timeline/);
  assert.match(walk, /The cash timeline/);
  assert.doesNotMatch(walk, /cash walk/i);
  assert.doesNotMatch(walk, /the walk/i);
  assert.doesNotMatch(walk, /walkable/i);
  assert.match(walk, /data-hlc/);
  assert.match(walk, /id="hlc-form"/);
  assert.match(walk, /id="hlc-lvr"/);
  assert.match(walk, /data-value="70"/);
  assert.match(walk, /data-value="80"/);
  assert.match(walk, /data-value="90"/);
  assert.match(walk, /data-value="95"/);
  assert.match(walk, /id="hlc-fhb"/);
  assert.match(walk, /id="hlc-rate"/);
  assert.match(walk, /id="hlc-rate"[^>]*value="6\.5"/);
  assert.match(walk, /id="hlc-rent"/);
  assert.match(walk, /id="hlc-stages"/);
  assert.match(walk, /Housing Industry Association/);
  assert.match(walk, /<details class="hlc-more" open>/);
  assert.match(walk, /Book a Strategy Session/);
  assert.doesNotMatch(walk, /discovery call/i);
  assert.doesNotMatch(walk, /\bHIA\b/);
  assert.doesNotMatch(walk, /permalink:\s*\/tools\/house-and-land-cash\//);
});

test('old cash URL is a redirect stub and Netlify 301s it to the cash timeline', function () {
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
  assert.match(home, /Which door is actually open\?/);
  assert.doesNotMatch(home, /Which door can you actually walk/);
  assert.doesNotMatch(home, /href="\/tools\/house-and-land-cash\/"/);
  assert.doesNotMatch(home, /data-umami-event-location="hero"[^>]*construction/);

  assert.match(calcs, /href="\/construction\/"/);
  assert.match(calcs, /Building vs buying/);
  assert.match(calcs, /cash timeline/);
  assert.match(calcs, /Which door is actually open\?/);
  assert.doesNotMatch(calcs, /cash walk/i);
  assert.doesNotMatch(calcs, /Which door can you actually walk/);
  assert.doesNotMatch(calcs, /href="\/tools\/house-and-land-cash\/"/);

  assert.match(footer, /href="\/construction\/"/);
  assert.match(footer, /Building vs buying/);
  assert.doesNotMatch(footer, /href="\/tools\/house-and-land-cash\/"/);
  assert.doesNotMatch(footer, /cash walk/i);
});

test('quiz page heading is open, not walk', function () {
  var quiz = read('src/which-door.njk');
  assert.match(quiz, /permalink:\s*\/which-door\//);
  assert.match(quiz, /Which door is actually open\?/);
  assert.match(quiz, /Which door is <em>actually open\?<\/em>/);
  assert.doesNotMatch(quiz, /Which door can you actually walk/);
  assert.doesNotMatch(quiz, /worth walking/);
  assert.doesNotMatch(quiz, /Walk this/);
});
