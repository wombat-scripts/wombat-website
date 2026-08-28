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

test('deposit bond article matches the first-home explainer pattern', function () {
  var article = read('src/articles/deposit-bond-first-home.md');
  assert.match(article, /title: "Deposit bonds for first home buyers: how they work at auction \(and what they do not replace\)"/);
  assert.match(article, /date: 2026-08-28/);
  assert.match(article, /category: "First Home Buyers"/);
  assert.match(article, /layout: article\.njk/);
  assert.match(article, /thumbnail: "\/images\/articles\/couple_signing_2\.webp"/);
  assert.match(article, /How much deposit do I need to buy a house in Australia if the auction wants 10% today\?/);
  assert.match(article, /The one I use is called Deposit Power\./);
  assert.match(article, /## What a deposit bond actually is/);
  assert.match(article, /## Auction and house hunting/);
  assert.match(article, /## What it does not replace/);
  assert.match(article, /## Before you raise your hand/);
  assert.match(article, /href="\/which-door\/"|\]\(\/which-door\/\)/);
  assert.match(article, /href="\/articles\/high-income-small-deposit\/"|\]\(\/articles\/high-income-small-deposit\/\)/);
  assert.match(article, /href="\/book\/"|\]\(\/book\/\)/);
  assert.match(article, /\[Book a 30-minute strategy session\]\(\/book\/\)/);
  assert.doesNotMatch(article, /if you want a first home loan broker in NSW/i);
  assert.doesNotMatch(article, /SMSF/i);
  assert.doesNotMatch(article, /\/articles\/has-/);
  assert.doesNotMatch(article, /\/articles\/homepay/);
  assert.doesNotMatch(article, /\/articles\/ownhome/);
  assertNoEmDash(article, 'deposit bond article');
});

test('llms.txt includes the deposit bond snippet with a hyphen, not an em dash', function () {
  var llms = read('src/llms.txt.njk');
  assert.match(llms, /\[Deposit bonds for first home buyers: how they work at auction \(and what they do not replace\)\]\(https:\/\/wombathomeloans\.com\.au\/articles\/deposit-bond-first-home\/\) - First home \/ deposit/);
  assert.match(llms, /A deposit bond is a digital certificate: a promise to pay the vendor at settlement, not cash leaving your account today\./);
  assert.match(llms, /It is not a home loan, not genuine savings, and not the funds you use to settle\./);
  assert.match(llms, /Auction and house hunting are the first-home door\./);
  assert.match(llms, /https:\/\/wombathomeloans\.com\.au\/book\//);
  assertNoEmDash(llms, 'llms.txt');
});
