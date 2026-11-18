'use strict';

var fs = require('fs');
var path = require('path');
var test = require('node:test');
var assert = require('node:assert/strict');

var root = path.join(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

test('visa buying guide is one flagship page on the locked URL', function () {
  var njk = path.join(root, 'src/articles/buying-property-without-australian-pr-or-citizenship.njk');
  var md = path.join(root, 'src/articles/buying-property-without-australian-pr-or-citizenship.md');
  assert.equal(fs.existsSync(njk), true);
  assert.equal(fs.existsSync(md), false);

  var article = read('src/articles/buying-property-without-australian-pr-or-citizenship.njk');
  assert.match(article, /layout: landing\.njk/);
  assert.match(article, /permalink: \/articles\/buying-property-without-australian-pr-or-citizenship\//);
  assert.match(article, /seoTitle: "Buying a Home in Australia on a Visa: 2026 Guide \| Wombat"/);
  assert.match(article, /description: "Can you buy a home in Australia on a visa\? What FIRB is, the established-home ban to June 2029, and how foreign buyer surcharges differ by state\."/);
  assert.equal((article.match(/^description: .*$/m) || [''])[0].split('\n').length, 1);
  assert.match(article, /date: 2026-11-18/);
  assert.match(article, /dateModified": "2026-11-18"/);
  assert.match(article, /"@type": "FAQPage"/);
  assert.match(article, /cta "Book a 30-minute chat"/);
  assert.match(article, /The short answer/);
  assert.match(article, /class="visa-compare"/);
  assert.match(article, /id="state-by-state"/);
  assert.match(article, /<h2 id="state-by-state">State by state: what extra costs do foreign buyers pay\?<\/h2>/);
  assert.match(article, /class="state-matrix"/);
  assert.equal((article.match(/<td data-label="State">/g) || []).length, 8);
  assert.match(article, /What is FIRB\?/);
  assert.match(article, /Do permanent residents pay foreign buyer surcharges\?/);
  assert.match(article, /Is FIRB the same as stamp duty\?/);
  assert.doesNotMatch(article, /DO NOT PASTE|Changelog/);
  assert.doesNotMatch(article, /\u2014|\u2013/);

  var llms = read('src/llms.txt.njk');
  var hits = llms.split('/articles/buying-property-without-australian-pr-or-citizenship/').length - 1;
  assert.equal(hits, 1);
  assert.match(llms, /a state-by-state table of foreign buyer duty and land tax surcharges/);
});
