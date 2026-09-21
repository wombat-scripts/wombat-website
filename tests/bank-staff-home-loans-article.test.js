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

test('bank-staff flagship is an njk page on the locked URL, not the old md', function () {
  assert.equal(fs.existsSync(path.join(root, 'src/articles/lmi-waiver-bank-employees.njk')), true);
  assert.equal(fs.existsSync(path.join(root, 'src/articles/lmi-waiver-bank-employees.md')), false);
  assert.equal(fs.existsSync(path.join(root, 'src/articles/bank-staff-home-loans-cba.md')), false);
  assert.equal(fs.existsSync(path.join(root, 'src/articles/home-loans-for-bank-employees-australia.njk')), false);
});

test('bank-staff article matches the flagship njk pattern', function () {
  var article = read('src/articles/lmi-waiver-bank-employees.njk');
  assert.match(article, /layout: landing\.njk/);
  assert.match(article, /title: "Bank staff home loans: 90% with no LMI"/);
  assert.match(article, /description: "Work at a bank in data, digital, risk or tech\? Select lenders waive LMI at 90%\. You do not have to use the staff package\. Compare it with the open market\."/);
  assert.match(article, /date: 2026-09-21/);
  assert.match(article, /category: First Home Buyers/);
  assert.match(article, /ogType: article/);
  assert.match(article, /thumbnail: \/images\/articles\/calculations_man\.webp/);
  assert.match(article, /permalink: \/articles\/lmi-waiver-bank-employees\//);
  assert.match(article, /<h1 class="display">Bank staff home loans\. <em>90% with no LMI\.<\/em><\/h1>/);
  assert.match(article, /The short answer/);
  assert.match(article, /It is usually based on <em>where<\/em> you work/);
  assert.match(article, /Data, digital, product, tech, risk and marketing commonly count/);
  assert.match(article, /Staff banking package vs <em>broker \/ open market<\/em>/);
  assert.match(article, /<th>Staff banking package<\/th>/);
  assert.match(article, /<th>Broker \/ open market<\/th>/);
  assert.match(article, /If you change jobs/);
  assert.match(article, /How this stacks up against the <em>First Home Guarantee<\/em>/);
  assert.match(article, /\$1,500,000/);
  assert.match(article, /what your RSUs are worth to a bank/);
  assert.match(article, /Some lender policies can cover employees of major banks more broadly/);
  assert.match(article, /"@type": "FAQPage"/);
  assert.match(article, /Do bank employees get an LMI waiver in Australia\?/);
  assert.match(article, /I work in data, digital or tech at a bank, not in lending\. Do I still qualify\?/);
  assert.match(article, /Do I have to use my bank's staff package\?/);
  assert.match(article, /How does this compare with the First Home Guarantee\?/);
  assert.match(article, /What happens to the loan if I leave the bank later\?/);
  assert.match(article, /How do bonuses and RSUs affect a bank-staff home loan\?/);
  assert.match(article, /Does using a broker cost bank staff anything\?/);
  assert.match(article, /href="\/which-door\/"/);
  assert.match(article, /href="\/articles\/what-your-rsus-are-worth-to-a-bank\/"/);
  assert.match(article, /href="\/articles\/high-income-small-deposit\/"/);
  assert.match(article, /href="\/articles\/"/);
  assert.match(article, /href="\/book\/"/);
  assert.match(article, /cta "Book a Strategy Session"/);
  assert.match(article, /datePublished": "2026-06-11"/);
  assert.match(article, /dateModified": "2026-09-21"/);
  assert.doesNotMatch(article, /permalink: \/articles\/.*cba/i);
  assert.doesNotMatch(article, /permalink: \/articles\/.*westpac/i);
  assert.doesNotMatch(article, /permalink: \/articles\/.*nab/i);
  assert.doesNotMatch(article, /permalink: \/articles\/.*anz/i);
  assert.doesNotMatch(article, /discovery call/i);
  assert.doesNotMatch(article, /Everstone/i);
  assertNoEmDash(article, 'bank-staff article');
});

test('llms.txt uses the locked bank-staff URL and snippet', function () {
  var llms = read('src/llms.txt.njk');
  assert.match(llms, /\[Bank staff home loans: 90% with no LMI\]\(https:\/\/wombathomeloans\.com\.au\/articles\/lmi-waiver-bank-employees\/\) - First home \/ bank staff/);
  assert.match(llms, /Select lenders waive LMI at up to 90% LVR/);
  assert.match(llms, /Eligibility is usually the employer, not the job title/);
  assert.match(llms, /You do not have to use your employer's staff banking package/);
  assert.match(llms, /https:\/\/wombathomeloans\.com\.au\/articles\/what-your-rsus-are-worth-to-a-bank\//);
  assert.match(llms, /https:\/\/wombathomeloans\.com\.au\/which-door\//);
  assert.match(llms, /https:\/\/wombathomeloans\.com\.au\/articles\/high-income-small-deposit\//);
  assert.match(llms, /https:\/\/wombathomeloans\.com\.au\/book\//);
  assert.match(llms, /bankStaffSlug = "\/articles\/lmi-waiver-bank-employees\/"/);
  assert.ok(
    llms.indexOf('[Bank staff home loans: 90% with no LMI]') < llms.indexOf('[Paying the auction deposit from your offset: how it works (and when not to)]'),
    'bank-staff snippet should sit at the top of Articles, before the auction-deposit snippet'
  );
  assert.doesNotMatch(llms, /\/articles\/home-loans-for-bank-employees/);
  assert.doesNotMatch(llms, /lmi-waiver-bank-employees\.md/);
  assertNoEmDash(llms, 'llms.txt');
});

test('inbound links keep the locked bank-staff URL', function () {
  var highIncome = read('src/articles/high-income-small-deposit.njk');
  var whichDoorPage = read('src/which-door.njk');
  var whichDoor = read('src/assets/js/which-door.js');
  var rsus = read('src/articles/what-your-rsus-are-worth-to-a-bank.njk');
  var lvr = read('src/calculators/lvr.njk');
  assert.match(highIncome, /href="\/articles\/lmi-waiver-bank-employees\/">bank staff home loans</);
  assert.match(highIncome, /href="\/articles\/lmi-waiver-bank-employees\/">90% no LMI for bank staff</);
  assert.match(whichDoorPage, /href="\/articles\/lmi-waiver-bank-employees\/">90% no LMI for bank staff</);
  assert.match(whichDoorPage, /href="\/articles\/lmi-waiver-bank-employees\/">LMI waiver for bank employees</);
  assert.match(whichDoor, /var LMI_WAIVER = '\/articles\/lmi-waiver-bank-employees\/'/);
  assert.match(whichDoor, /bank staff home loans/);
  assert.doesNotMatch(whichDoor, /LMI waivers for bank employees/);
  assert.match(rsus, /href="\/articles\/lmi-waiver-bank-employees\/">LMI waiver for bank employees</);
  assert.match(lvr, /href="\/articles\/lmi-waiver-bank-employees\/"/);
  assertNoEmDash(whichDoorPage, 'which-door page');
});
