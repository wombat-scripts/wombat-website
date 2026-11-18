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
  assert.match(article, /<h2 id="state-by-state">State by state: what extra costs do foreign buyers pay\?<\/h2>/);
  assert.match(article, /<h2 id="lending-by-visa">How does your visa type change what a lender will do\?<\/h2>/);
  assert.match(article, /class="state-matrix"/);
  assert.equal((article.match(/<td data-label="State">/g) || []).length, 8);
  assert.match(article, /30 June 2029/);
  assert.doesNotMatch(article, /and still own it/);
  assert.match(article, /<td data-label="State">ACT<\/td>\s*<td data-label="Foreign buyer duty surcharge">None<\/td>/);
  assert.match(article, /<td data-label="State">NT<\/td>\s*<td data-label="Foreign buyer duty surcharge">None<\/td>/);
  assert.doesNotMatch(article, /\{#lending-by-visa\}/);
  // Visible text must not include a raw {# marker. Nunjucks comments {# ... #} are source-only.
  var visible = article.replace(/\{#[\s\S]*?#\}/g, '');
  assert.doesNotMatch(visible, /\{#/);
  assert.doesNotMatch(article, /DO NOT PASTE|Changelog/);
  assert.doesNotMatch(article, /\u2014|\u2013/);
  assert.match(article, /scroll-margin-top/);

  var llms = read('src/llms.txt.njk');
  var hits = llms.split('/articles/buying-property-without-australian-pr-or-citizenship/').length - 1;
  assert.equal(hits, 1);
  assert.match(llms, /until at least 30 June 2029/);

  var built = path.join(root, '_site/articles/buying-property-without-australian-pr-or-citizenship/index.html');
  if (fs.existsSync(built)) {
    var html = read('_site/articles/buying-property-without-australian-pr-or-citizenship/index.html');
    assert.doesNotMatch(html, /\{#/);
    assert.match(html, /id="state-by-state"/);
    assert.match(html, /id="lending-by-visa"/);
  }
});
