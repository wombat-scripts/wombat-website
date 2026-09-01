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

test('Help to Buy article matches the first-home explainer pattern', function () {
  var article = read('src/articles/help-to-buy-what-it-is.md');
  assert.match(article, /title: "Help to Buy: what it is, and what it is not"/);
  assert.match(article, /date: 2026-09-01/);
  assert.match(article, /category: "First Home Buyers"/);
  assert.match(article, /layout: article\.njk/);
  assert.match(article, /thumbnail: "\/images\/articles\/couple_keys_2\.webp"/);
  assert.match(article, /Will the government help you buy a house in Australia\? Help to Buy is shared equity with income caps\./);
  assert.match(article, /It is a government shared-equity product, run by Housing Australia\./);
  assert.match(article, /## What Help to Buy actually is/);
  assert.match(article, /## The income line is the whole conversation/);
  assert.match(article, /## What it is not/);
  assert.match(article, /## Places run out\. The 5% scheme does not\./);
  assert.match(article, /## When to leave it alone/);
  assert.match(article, /## Before you book/);
  assert.match(article, /href="\/which-door\/"|\]\(\/which-door\/\)/);
  assert.match(article, /href="\/articles\/high-income-small-deposit\/"|\]\(\/articles\/high-income-small-deposit\/\)/);
  assert.match(article, /href="\/book\/"|\]\(\/book\/\)/);
  assert.match(article, /\[Book a 30-minute strategy session\]\(\/book\/\)/);
  assert.match(article, /https:\/\/firsthomebuyers\.gov\.au\/australian-government-help-buy-scheme/);
  assert.doesNotMatch(article, /## Sources/);
  assert.doesNotMatch(article, /Help to Buy is on Finsure/i);
  assert.doesNotMatch(article, /SmartShare/);
  assert.doesNotMatch(article, /OwnHome/);
  assert.doesNotMatch(article, /\bHAS\b/);
  assert.doesNotMatch(article, /SMSF/i);
  assert.doesNotMatch(article, /if you want a first home loan broker in NSW/i);
  assertNoEmDash(article, 'Help to Buy article');
});

test('llms.txt includes the Help to Buy snippet with a hyphen, not an em dash', function () {
  var llms = read('src/llms.txt.njk');
  assert.match(llms, /\[Help to Buy: what it is, and what it is not\]\(https:\/\/wombathomeloans\.com\.au\/articles\/help-to-buy-what-it-is\/\) - First home \/ government schemes/);
  assert.match(llms, /Help to Buy is the Australian Government shared-equity scheme\./);
  assert.match(llms, /It is not the 5% deposit scheme\./);
  assert.match(llms, /Most high earners will not qualify\./);
  assert.match(llms, /https:\/\/wombathomeloans\.com\.au\/book\//);
  assert.ok(
    llms.indexOf('help-to-buy-what-it-is') < llms.indexOf('deposit-bond-first-home'),
    'Help to Buy snippet should sit at the top of Articles, before the deposit bond snippet'
  );
  assertNoEmDash(llms, 'llms.txt');
});
