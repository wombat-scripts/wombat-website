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

test('build-now-pay-later article matches the Demand package', function () {
  var article = read('src/articles/build-now-pay-later.md');
  assert.match(article, /title: "Build now, pay later: how a construction pause-repay facility works \(and when to leave it alone\)"/);
  assert.match(article, /description: "During a build, some loans ease repayments\. After the build, the full loan usually shows up\. When pause-repay helps, and when to leave it alone\."/);
  assert.match(article, /date: 2026-09-22/);
  assert.match(article, /category: "First Home Buyers"/);
  assert.match(article, /layout: article\.njk/);
  assert.match(article, /thumbnail: "\/images\/articles\/freestanding_house\.webp"/);
  assert.match(article, /You are building a house, or buying house-and-land\./);
  assert.match(article, /That is deferred cashflow, not free money\./);
  assert.match(article, /One concrete product in this lane is HomePay/);
  assert.equal((article.match(/HomePay/g) || []).length, 1, 'HomePay is named once');
  assert.match(article, /### How the ease works/);
  assert.match(article, /### What this is not/);
  assert.match(article, /### When it helps/);
  assert.match(article, /### When to leave it alone/);
  assert.match(article, /### Folklore to ignore/);
  assert.match(article, /### Before you book/);
  assert.match(article, /\]\(\/which-door\/\)/);
  assert.match(article, /\]\(\/articles\/auction-deposit-from-offset\/\)/);
  assert.match(article, /\]\(\/articles\/deposit-bond-first-home\/\)/);
  assert.match(article, /\]\(\/articles\/buy-with-a-tiny-deposit\/\)/);
  assert.match(article, /\]\(\/articles\/help-to-buy-what-it-is\/\)/);
  assert.match(article, /\[Book a 30-minute strategy session\]\(\/book\/\)/);
  assert.match(article, /https:\/\/www\.homepayaus\.com\.au\/welcome/);
  assert.match(article, /https:\/\/www\.homepayaus\.com\.au\/faq-s/);
  assert.doesNotMatch(article, /## Sources/);
  assert.doesNotMatch(article, /## LLMS/);
  assert.doesNotMatch(article, /Finsure/i);
  assert.doesNotMatch(article, /Housing Australia/);
  assert.doesNotMatch(article, /discovery call/i);
  assert.doesNotMatch(article, /homepay-build-now/);
  assertNoEmDash(article, 'build-now-pay-later article');
});

test('llms.txt uses the locked build-now URL and Demand snippet', function () {
  var llms = read('src/llms.txt.njk');
  assert.match(llms, /\[Build now, pay later: how a construction pause-repay facility works \(and when to leave it alone\)\]\(https:\/\/wombathomeloans\.com\.au\/articles\/build-now-pay-later\/\) - Construction \/ cashflow/);
  assert.match(llms, /During a build, some loans ease repayments \(reduced, paused, or interest-only\)\./);
  assert.match(llms, /Deferred cashflow, not free money\./);
  assert.match(llms, /One concrete product in this lane: HomePay \(homepayaus\.com\.au\)\. Brand stays out of the URL\./);
  assert.match(llms, /Soft CTA: https:\/\/wombathomeloans\.com\.au\/book\//);
  assert.match(llms, /Related hub: https:\/\/wombathomeloans\.com\.au\/which-door\//);
  assert.match(llms, /buildNowSlug = "\/articles\/build-now-pay-later\/"/);
  assert.ok(
    llms.indexOf('[Build now, pay later: how a construction pause-repay facility works (and when to leave it alone)]') < llms.indexOf('[Bank staff home loans: 90% with no LMI]'),
    'build-now snippet should sit at the top of Articles, before the bank-staff snippet'
  );
  assert.equal((llms.match(/\/articles\/build-now-pay-later\//g) || []).length, 2, 'hand snippet plus exclusion slug only');
  assertNoEmDash(llms, 'llms.txt');
});

test('own URL only and no branded slug file', function () {
  assert.equal(fs.existsSync(path.join(root, 'src/articles/build-now-pay-later.md')), true);
  assert.equal(fs.existsSync(path.join(root, 'src/articles/homepay-build-now-pay-later.md')), false);
  assert.equal(fs.existsSync(path.join(root, 'src/articles/homepay.md')), false);
});
