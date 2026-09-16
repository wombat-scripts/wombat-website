'use strict';

var fs = require('fs');
var path = require('path');
var test = require('node:test');
var assert = require('node:assert/strict');

var root = path.join(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

test('sitemap lists the homepage once, with a trailing slash', function () {
  var sitemap = read('src/sitemap.xml.njk');
  assert.match(sitemap, /<loc>\{\{ site\.url \}\}\/<\/loc>/);
  assert.match(sitemap, /page\.url != "\/"/);
  assert.doesNotMatch(sitemap, /<loc>\{\{ site\.url \}\}<\/loc>/);
});

test('mortgage-ready landing is a noindex stub; article stays the indexable URL', function () {
  var landing = read('src/landing/getting-mortgage-ready.njk');
  var article = read('src/articles/getting-mortgage-ready.njk');

  assert.match(landing, /permalink:\s*\/landing\/getting-mortgage-ready\//);
  assert.match(landing, /eleventyExcludeFromCollections:\s*true/);
  assert.match(landing, /rel="canonical" href="https:\/\/wombathomeloans\.com\.au\/articles\/getting-mortgage-ready\/"/);
  assert.match(landing, /http-equiv="refresh"/);
  assert.match(landing, /name="robots" content="noindex"/);
  assert.doesNotMatch(landing, /layout:\s*landing\.njk/);
  assert.doesNotMatch(landing, /Understand how your visa status shapes your lending options/);

  assert.match(article, /title:\s*Getting Mortgage-Ready Before You Land/);
  assert.match(article, /Understand how your visa status shapes your lending options/);
});

test('Netlify 301s the mortgage-ready landing to the article', function () {
  var netlify = read('netlify.toml');
  assert.match(netlify, /from = "\/landing\/getting-mortgage-ready\/"/);
  assert.match(netlify, /to = "\/articles\/getting-mortgage-ready\/"/);
  assert.match(netlify, /status = 301/);
});

test('expat landing is a distinct page, not a clone of the article', function () {
  var landing = read('src/landing/expat-home-loans.njk');
  var article = read('src/articles/expat-home-loan-guide.md');
  var netlify = read('netlify.toml');

  assert.match(landing, /title:\s*Expat Home Loans\. Buy Property in Australia from Overseas/);
  assert.match(article, /title:\s*"Getting a home loan as an Australian expat/);
  assert.doesNotMatch(netlify, /from = "\/landing\/expat-home-loans/);
});
