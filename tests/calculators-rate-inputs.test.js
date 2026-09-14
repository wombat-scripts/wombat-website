'use strict';

var fs = require('fs');
var path = require('path');
var test = require('node:test');
var assert = require('node:assert/strict');

var root = path.join(__dirname, '..');
var js = fs.readFileSync(path.join(root, 'src/assets/js/calculators.js'), 'utf8');

var rateFields = [
  { file: 'refinance.njk', range: 'f-old-rate', input: 'f-old-rate-input' },
  { file: 'refinance.njk', range: 'f-new-rate', input: 'f-new-rate-input' },
  { file: 'repayments.njk', range: 'r-rate', input: 'r-rate-input' },
  { file: 'extra-repayments.njk', range: 'e-rate', input: 'e-rate-input' },
  { file: 'borrowing-power.njk', range: 'b-rate', input: 'b-rate-input' },
  { file: 'offset-vs-basic.njk', range: 'o-rate', input: 'o-rate-input' },
  { file: 'offset-vs-basic.njk', range: 'o-prem', input: 'o-prem-input' },
  { file: 'offset-vs-basic.njk', range: 'o-sav', input: 'o-sav-input' },
];

function readCalc(file) {
  return fs.readFileSync(path.join(root, 'src/calculators', file), 'utf8');
}

test('every calculator rate field has a typed input and a 0.01 slider step', function () {
  var cache = {};
  rateFields.forEach(function (field) {
    var html = cache[field.file] || (cache[field.file] = readCalc(field.file));
    assert.match(html, new RegExp('id="' + field.input + '"'));
    assert.match(html, new RegExp('id="' + field.input + '"[^>]*inputmode="decimal"'));
    assert.match(html, new RegExp('id="' + field.range + '"[^>]*step="0\\.01"'));
    assert.doesNotMatch(html, new RegExp('id="' + field.range + '-out"'));
  });
});

test('no calculator page still uses a coarse 0.05 rate slider', function () {
  fs.readdirSync(path.join(root, 'src/calculators')).forEach(function (file) {
    if (!file.endsWith('.njk')) return;
    var html = readCalc(file);
    assert.doesNotMatch(html, /step="0\.05"/, file + ' still has a 0.05 step');
  });
});

test('calculators.js syncs rate sliders with typed two-decimal inputs', function () {
  assert.match(js, /function bindRate\(/);
  assert.match(js, /function fmtRateInput\(/);
  assert.match(js, /toFixed\(2\)/);
  [
    ['f-old-rate', 'f-old-rate-input'],
    ['f-new-rate', 'f-new-rate-input'],
    ['r-rate', 'r-rate-input'],
    ['e-rate', 'e-rate-input'],
    ['b-rate', 'b-rate-input'],
    ['o-rate', 'o-rate-input'],
    ['o-prem', 'o-prem-input'],
    ['o-sav', 'o-sav-input'],
  ].forEach(function (pair) {
    assert.match(js, new RegExp("bindRate\\('" + pair[0] + "', '" + pair[1] + "'"));
    assert.doesNotMatch(js, new RegExp("bindRange\\('" + pair[0] + "'"));
  });
});

test('typed rate markup does not introduce em dashes', function () {
  var cache = {};
  rateFields.forEach(function (field) {
    var html = cache[field.file] || (cache[field.file] = readCalc(field.file));
    var inputBlock = html.match(new RegExp(
      '<div class="calc-field">[\\s\\S]*?id="' + field.input + '"[\\s\\S]*?</div>\\s*<input class="calc-range" id="' + field.range + '"[^>]*>'
    ));
    assert.ok(inputBlock, 'could not isolate markup for ' + field.input);
    assert.doesNotMatch(inputBlock[0], /\u2014/);
  });
});
