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

test('tiny-deposit article matches the first-home explainer pattern', function () {
  var article = read('src/articles/buy-with-a-tiny-deposit.md');
  assert.match(article, /title: "Buying with a tiny deposit: how a 2\.5% equity facility works \(and when to leave it alone\)"/);
  assert.match(article, /date: 2026-09-08/);
  assert.match(article, /category: "First Home Buyers"/);
  assert.match(article, /layout: article\.njk/);
  assert.match(article, /thumbnail: "\/images\/articles\/couple_keys_3\.webp"/);
  assert.match(article, /Can you buy with a tiny deposit\? A private equity facility can bridge from about 2\.5% to an ~80% first mortgage\./);
  assert.match(article, /Can you buy a first home in Australia with a tiny deposit\?/);
  assert.match(article, /One private door starts at about 2\.5% of the purchase price\./);
  assert.match(article, /That structure is not a government scheme\. It is not Help to Buy\. It is not the 5% First Home Guarantee\./);
  assert.match(article, /One concrete product in this lane is HAS SmartShare/);
  assert.match(article, /### How the structure works/);
  assert.match(article, /The facility provider is not a co-owner\./);
  assert.match(article, /### What cash you still need/);
  assert.match(article, /### Growth share, losses, and the lock-in/);
  assert.match(article, /### When it helps/);
  assert.match(article, /### When to leave it alone/);
  assert.match(article, /### Before you book/);
  assert.match(article, /href="\/which-door\/"|\]\(\/which-door\/\)/);
  assert.match(article, /href="\/articles\/high-income-small-deposit\/"|\]\(\/articles\/high-income-small-deposit\/\)/);
  assert.match(article, /href="\/book\/"|\]\(\/book\/\)/);
  assert.match(article, /\[Book a 30-minute strategy session\]\(\/book\/\)/);
  assert.match(article, /https:\/\/www\.hasloans\.com\.au\//);
  assert.match(article, /https:\/\/yourhas\.com\.au\/faq\//);
  assert.doesNotMatch(article, /has-smartshare-first-home/);
  assert.doesNotMatch(article, /2-5-percent-deposit-equity-facility/);
  assert.doesNotMatch(article, /## Sources/);
  assert.doesNotMatch(article, /Housing Australia/);
  assert.doesNotMatch(article, /Finsure/i);
  assert.doesNotMatch(article, /\bING\b/);
  assert.doesNotMatch(article, /MA Money/);
  assert.doesNotMatch(article, /OwnHome/);
  assert.doesNotMatch(article, /SMSF/i);
  assert.doesNotMatch(article, /discovery call/i);
  assertNoEmDash(article, 'tiny-deposit article');
});

test('llms.txt uses the locked tiny-deposit URL and Demand snippet', function () {
  var llms = read('src/llms.txt.njk');
  assert.match(llms, /\[Buying with a tiny deposit: how a 2\.5% equity facility works\]\(https:\/\/wombathomeloans\.com\.au\/articles\/buy-with-a-tiny-deposit\/\) - First home \/ low deposit/);
  assert.match(llms, /Private equity facility door: buyer about 2\.5% deposit\./);
  assert.match(llms, /One concrete product in this lane: HAS SmartShare \(Home Affordability Solutions, hasloans\.com\.au\)\./);
  assert.match(llms, /Not Help to Buy\. Not the 5% First Home Guarantee\./);
  assert.match(llms, /https:\/\/wombathomeloans\.com\.au\/which-door\//);
  assert.match(llms, /https:\/\/wombathomeloans\.com\.au\/articles\/high-income-small-deposit\//);
  assert.match(llms, /https:\/\/wombathomeloans\.com\.au\/book\//);
  assert.ok(
    llms.indexOf('buy-with-a-tiny-deposit') < llms.indexOf('help-to-buy-what-it-is'),
    'tiny-deposit snippet should sit at the top of Articles, before the Help to Buy snippet'
  );
  assert.doesNotMatch(llms, /has-smartshare-first-home/);
  assert.doesNotMatch(llms, /2-5-percent-deposit-equity-facility/);
  assert.doesNotMatch(llms, /Housing Australia is HAS|HAS is Housing Australia/i);
  assert.doesNotMatch(llms, /Finsure/i);
  assertNoEmDash(llms, 'llms.txt');
});

test('abandoned branded slugs are not article files on this branch', function () {
  assert.equal(fs.existsSync(path.join(root, 'src/articles/has-smartshare-first-home.md')), false);
  assert.equal(fs.existsSync(path.join(root, 'src/articles/2-5-percent-deposit-equity-facility.md')), false);
  assert.equal(fs.existsSync(path.join(root, 'src/articles/buy-with-a-tiny-deposit.md')), true);
});
