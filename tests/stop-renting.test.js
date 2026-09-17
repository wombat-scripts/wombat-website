'use strict';

var fs = require('fs');
var path = require('path');
var test = require('node:test');
var assert = require('node:assert/strict');

var root = path.join(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

var page = read('src/stop-renting.njk');
var layout = read('src/_layouts/ads.njk');
var css = read('src/_includes/css/styles.css');

test('stop-renting ads LP is a top-level form-first callback page', function () {
  assert.match(page, /permalink:\s*\/stop-renting\//);
  assert.match(page, /layout:\s*ads\.njk/);
  assert.match(page, /<h1 class="display">Still renting, even though your income is fine\?<\/h1>/);
  assert.match(page, /If 20% cash is not sitting there, you still may have a door/);
  assert.match(page, /name="stop-renting-callback"/);
  assert.match(page, /data-netlify="true"/);
  assert.match(page, /netlify-honeypot="bot-field"/);
  assert.match(page, /name="bot-field"/);
  assert.match(page, /name="form-name" value="stop-renting-callback"/);
  assert.match(page, /Zap\/webhook can hook form name stop-renting-callback later/);
  assert.match(page, /placeholder="Your name"/);
  assert.match(page, /placeholder="you@email.com"/);
  assert.match(page, /placeholder="Mobile number"/);
  assert.match(page, /name="name"/);
  assert.match(page, /name="email"/);
  assert.match(page, /name="phone"/);
  assert.match(page, />\s*Request a callback\s*</);
  assert.match(page, /data-loading-label="Sending…"/);
  assert.match(page, /We will call you to find a time for a 30-minute Strategy Session/);
  assert.match(page, /We only use this to call you back about a Strategy Session. No spam list/);
  assert.match(page, /href="\/book\/"[^>]*>Or pick a time yourself</);
  assert.match(page, /Please add a name, email, and mobile so we can call you back/);
  assert.match(page, /Thanks. Tom will call you soon to lock in a Strategy Session/);
  assert.match(page, /href="\/book\/"[^>]*>pick a time now</);
  assert.match(page, /data-umami-event="stop-renting-callback"/);
  assert.match(page, /You want to buy a first home and stop renting/);
  assert.match(page, /Your income is solid, but the deposit is not 20%/);
  assert.match(page, /href="\/articles\/buy-with-a-tiny-deposit\/"/);
  assert.match(page, /href="\/which-door\/"/);
  assert.match(page, /href="\/articles\/deposit-bond-first-home\/"/);
  assert.doesNotMatch(page, /auction-deposit-from-offset/);
  assert.doesNotMatch(page, /calendly\.com/);
});

test('ads chrome is logo-only and carries ACL, CRN, and site address', function () {
  assert.match(layout, /class="ads-lp"/);
  assert.match(layout, /logo-horizontal\.svg/);
  assert.match(layout, /class="ads-nav"/);
  assert.match(layout, /class="ads-footer"/);
  assert.match(layout, /\{\{\s*site\.address\s*\}\}/);
  assert.match(layout, /\{\{\s*site\.acl\s*\}\}/);
  assert.match(layout, /\{\{\s*site\.crn\s*\}\}/);
  assert.doesNotMatch(layout, /How it works/);
  assert.doesNotMatch(layout, /Who I help/);
  assert.doesNotMatch(layout, /Postal/);
  assert.doesNotMatch(layout, /virtual office/i);
  assert.doesNotMatch(layout, /include "nav\.njk"/);
  assert.doesNotMatch(layout, /include "footer\.njk"/);
  assert.match(css, /\.ads-hero__grid/);
  assert.match(css, /\.ads-form-card/);
});

test('stop-renting copy stays brand-safe', function () {
  var blob = page + '\n' + layout;
  assert.doesNotMatch(blob, /—/);
  assert.doesNotMatch(blob, /\bCBA\b|CommBank|Commonwealth Bank|Westpac|\bANZ\b|\bNAB\b|Macquarie/);
  assert.doesNotMatch(blob, /\bcorporate\b/i);
  assert.doesNotMatch(blob, /bank staff/i);
  assert.doesNotMatch(blob, /\bRSU\b|\bRSUs\b/);
  assert.doesNotMatch(blob, /guaranteed|guarantee you/i);
  assert.doesNotMatch(blob, /SMSF/);
});

test('stop-renting uses Tom\'s 1200x630 rental OG photo, not the sitewide headshot', function () {
  assert.match(page, /ogImage:\s*\/assets\/og-stop-renting\.jpg/);
  assert.match(layout, /og:image.*\{\{\s*ogImage or '\/assets\/og-image\.jpg'\s*\}\}/);
  assert.match(layout, /twitter:image.*\{\{\s*ogImage or '\/assets\/og-image\.jpg'\s*\}\}/);
  assert.match(layout, /og:image:width" content="1200"/);
  assert.match(layout, /og:image:height" content="630"/);
  assert.match(layout, /twitter:card" content="summary_large_image"/);

  var ogPath = path.join(root, 'src/assets/og-stop-renting.jpg');
  var defaultOgPath = path.join(root, 'src/assets/og-image.jpg');
  assert.ok(fs.existsSync(ogPath), 'page-specific OG JPG is in src/assets');
  assert.ok(fs.existsSync(defaultOgPath), 'sitewide default OG JPG stays in place');

  var jpeg = fs.readFileSync(ogPath);
  assert.equal(jpeg[0], 0xff);
  assert.equal(jpeg[1], 0xd8);
  var sof = jpeg.indexOf(Buffer.from([0xff, 0xc0]));
  assert.ok(sof >= 0, 'JPEG has a SOF0 marker');
  var height = jpeg.readUInt16BE(sof + 5);
  var width = jpeg.readUInt16BE(sof + 7);
  assert.equal(width, 1200);
  assert.equal(height, 630);

  var defaultJpeg = fs.readFileSync(defaultOgPath);
  assert.ok(defaultJpeg.length !== jpeg.length, 'page OG file is not a copy of the sitewide headshot');
});

test('ads LP does not rewrite organic booking or homepage CTAs', function () {
  var book = read('src/book.njk');
  var home = read('src/index.njk');
  var firstHome = read('src/first-home-buyers.njk');
  var nav = read('src/_includes/nav.njk');
  var footer = read('src/_includes/footer.njk');

  assert.doesNotMatch(book, /stop-renting-callback/);
  assert.doesNotMatch(home, /stop-renting-callback/);
  assert.doesNotMatch(firstHome, /stop-renting-callback/);
  assert.doesNotMatch(nav, /stop-renting/);
  assert.doesNotMatch(footer, /stop-renting/);
  assert.match(book, /calendly-inline-widget/);
  assert.match(home, /Book a Strategy Session/);
});
