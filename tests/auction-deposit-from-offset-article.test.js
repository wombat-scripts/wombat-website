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

test('auction-deposit-from-offset article matches the Demand package', function () {
  var article = read('src/articles/auction-deposit-from-offset.md');
  assert.match(article, /title: "Paying the auction deposit from your offset: how it works \(and when not to\)"/);
  assert.match(article, /description: "Auction deposit is real money that leaves your account that day\. Offset is just where it was sitting\. When paying from offset helps, and when not to\."/);
  assert.match(article, /date: 2026-09-17/);
  assert.match(article, /category: "First Home Buyers"/);
  assert.match(article, /layout: article\.njk/);
  assert.match(article, /thumbnail: "\/images\/articles\/couple_signing_1\.webp"/);
  assert.match(article, /You win the auction\. You sign straight away\./);
  assert.match(article, /the auction deposit is real money that leaves your account that day/);
  assert.match(article, /Paying from offset is not a special loan trick\./);
  assert.match(article, /### What happens to the deposit/);
  assert.match(article, /### Moving cash out of the offset/);
  assert.match(article, /### When it helps/);
  assert.match(article, /### When to leave it alone/);
  assert.match(article, /### Folklore to ignore/);
  assert.match(article, /### Before you book/);
  assert.match(article, /href="\/articles\/deposit-bond-first-home\/"|\]\(\/articles\/deposit-bond-first-home\/\)/);
  assert.match(article, /href="\/which-door\/"|\]\(\/which-door\/\)/);
  assert.match(article, /href="\/book\/"|\]\(\/book\/\)/);
  assert.match(article, /\[Book a 30-minute strategy session\]\(\/book\/\)/);
  assert.doesNotMatch(article, /## Sources/);
  assert.doesNotMatch(article, /Finsure/i);
  assert.doesNotMatch(article, /Housing Australia/);
  assert.doesNotMatch(article, /discovery call/i);
  assert.doesNotMatch(article, /\bING\b/);
  assert.doesNotMatch(article, /Deposit Power/);
  assertNoEmDash(article, 'auction-deposit-from-offset article');
});

test('llms.txt uses the locked auction-deposit URL and Demand snippet', function () {
  var llms = read('src/llms.txt.njk');
  assert.match(llms, /\[Paying the auction deposit from your offset: how it works \(and when not to\)\]\(https:\/\/wombathomeloans\.com\.au\/articles\/auction-deposit-from-offset\/\) - Auction \/ deposit/);
  assert.match(llms, /NSW auction: win, sign immediately, deposit commonly ~10%/);
  assert.match(llms, /Auction deposit is real money that leaves that day; offset is just where it was sitting\./);
  assert.match(llms, /https:\/\/wombathomeloans\.com\.au\/book\//);
  assert.match(llms, /https:\/\/wombathomeloans\.com\.au\/articles\/deposit-bond-first-home\//);
  assert.match(llms, /https:\/\/wombathomeloans\.com\.au\/which-door\//);
  assert.match(llms, /auctionDepositSlug = "\/articles\/auction-deposit-from-offset\/"/);
  assert.ok(
    llms.indexOf('[Paying the auction deposit from your offset: how it works (and when not to)]') < llms.indexOf('[Buying with a tiny deposit: how a 2.5% equity facility works]'),
    'auction-deposit snippet should sit at the top of Articles, before the tiny-deposit snippet'
  );
  assertNoEmDash(llms, 'llms.txt');
});

test('own URL only and no branded slug file', function () {
  assert.equal(fs.existsSync(path.join(root, 'src/articles/auction-deposit-from-offset.md')), true);
  assert.equal(fs.existsSync(path.join(root, 'src/articles/cba-auction-deposit-from-offset.md')), false);
});
