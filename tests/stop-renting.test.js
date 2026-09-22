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
  assert.match(page, /\snetlify(?:\s|>)/);
  assert.match(page, /data-netlify="true"/);
  assert.match(page, /netlify-honeypot="bot-field"/);
  assert.match(page, /data-netlify-honeypot="bot-field"/);
  assert.match(page, /name="bot-field"/);
  assert.match(page, /name="form-name" value="stop-renting-callback"/);
  assert.match(page, /id="stop-renting-name"/);
  assert.match(page, /id="stop-renting-email"/);
  assert.match(page, /id="stop-renting-phone"/);
  assert.match(page, /action="\/stop-renting\/"/);
  assert.match(page, /Zap\/webhook can hook form name stop-renting-callback later/);
  assert.match(page, /placeholder="Your name"/);
  assert.match(page, /placeholder="you@email.com"/);
  assert.match(page, /placeholder="Mobile number"/);
  assert.match(page, /name="name"/);
  assert.match(page, /name="email"/);
  assert.match(page, /name="phone"/);
  assert.match(page, /Leave your mobile and Tom will call you back/);
  assert.match(page, />\s*Request a callback\s*</);
  assert.match(page, /data-loading-label="Sending…"/);
  assert.match(page, /20\+ years inside the banks\. Tom maps which first-home doors are open with a smaller deposit/);
  assert.match(page, /This requests a call back\. It does not book a time/);
  assert.match(page, /We only use this to call you back\. No spam list/);
  assert.equal((page.match(/data-umami-event="stop-renting-self-book"/g) || []).length, 2);
  assert.equal((page.match(/href="\/book\/"[^>]*data-umami-event="stop-renting-self-book"[^>]*>Prefer to pick a time\?/g) || []).length, 2);
  assert.match(page, /Please add a name, email, and mobile so we can call you back/);
  assert.match(page, /data-stop-renting-success-copy/);
  assert.match(page, /Thanks\. Tom will call you on the mobile you entered/);
  assert.match(page, /This is a call back\. It is not a booked Strategy Session/);
  assert.match(page, /Leaving your number does not book a calendar slot/);
  assert.doesNotMatch(page, /pick a time now/);
  assert.doesNotMatch(page, /lock in a Strategy Session/);
  assert.doesNotMatch(page, /Book a time with Tom/);
  assert.doesNotMatch(page, /Or pick a time yourself/);
  assert.doesNotMatch(page, /Click to book here/);
  assert.doesNotMatch(page, /discovery call/i);
  assert.doesNotMatch(page, /data-umami-event="stop-renting-callback"/);
  assert.doesNotMatch(page, /data-umami-event="book-a-call"/);
  assert.match(page, /umami\.track\('stop-renting-callback'\)/);
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
  assert.match(css, /\.ads-form__trust/);
  assert.match(css, /\.ads-form__status--success \[data-stop-renting-success-copy\]/);
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

test('callback script reads fields by id and splits validation from submit errors', function () {
  var scriptMatch = page.match(/<script>([\s\S]*?)<\/script>\s*\{% endblock %}/);
  assert.ok(scriptMatch, 'inline callback script is present');
  var script = scriptMatch[1];

  assert.doesNotMatch(script, /form\.elements\.name/);
  assert.match(script, /getElementById\('stop-renting-name'\)/);
  assert.match(script, /getElementById\('stop-renting-email'\)/);
  assert.match(script, /getElementById\('stop-renting-phone'\)/);
  assert.match(script, /var name = nameEl && nameEl\.value/);
  assert.match(script, /var email = emailEl && emailEl\.value/);
  assert.match(script, /var phone = phoneEl && phoneEl\.value/);

  assert.match(script, /var validationError = 'Please add a name, email, and mobile so we can call you back\.'/);
  assert.match(script, /var submitError = 'Something went wrong sending that\. Please try again or pick a time at \/book\/\.'/);
  assert.match(script, /showError\(validationError\)/);
  assert.match(script, /showError\(submitError\)/);
  assert.match(script, /function callWhen\(date\)/);
  assert.match(script, /timeZone: 'Australia\/Sydney'/);
  assert.match(script, /return 'today'/);
  assert.match(script, /return 'next business morning'/);
  assert.match(script, /showSuccess\(phone\)/);
  assert.match(script, /Thanks\. Tom will call you on /);
  assert.equal(script.split("umami.track('stop-renting-callback')").length - 1, 1);
  var trackAt = script.indexOf("umami.track('stop-renting-callback')");
  var showAt = script.indexOf('function showSuccess');
  var submitAt = script.indexOf("form.addEventListener('submit'");
  assert.ok(showAt !== -1 && showAt < trackAt && trackAt < submitAt, 'callback event is only inside showSuccess');

  assert.match(script, /window\.location && window\.location\.pathname/);
  assert.match(script, /'\/stop-renting\/'/);
  assert.match(script, /redirect: 'manual'/);
  assert.match(script, /res\.type === 'opaqueredirect'/);
  assert.match(script, /status >= 200 && status < 300/);

  assert.match(page, /Please add a name, email, and mobile so we can call you back/);
  assert.match(page, /Something went wrong sending that\. Please try again or pick a time at \/book\/\./);
  assert.notEqual(
    'Please add a name, email, and mobile so we can call you back.',
    'Something went wrong sending that. Please try again or pick a time at /book/.'
  );
});

test('callback promise is same day before 4pm Sydney, otherwise next business morning', function () {
  var scriptMatch = page.match(/function callWhen\(date\) \{[\s\S]*?\n  \}/);
  assert.ok(scriptMatch, 'callWhen is present');
  var body = scriptMatch[0]
    .replace(/^function callWhen\(date\) \{\n/, '')
    .replace(/\n  \}$/, '');
  var callWhen = new Function('date', body);

  function at(iso) {
    return callWhen(new Date(iso));
  }

  assert.equal(at('2026-09-22T00:30:00Z'), 'today');
  assert.equal(at('2026-09-22T05:59:00Z'), 'today');
  assert.equal(at('2026-09-27T21:30:00Z'), 'today');
  assert.equal(at('2026-09-22T06:00:00Z'), 'next business morning');
  assert.equal(at('2026-09-25T07:00:00Z'), 'next business morning');
  assert.equal(at('2026-09-26T05:00:00Z'), 'next business morning');
  assert.equal(at('2026-09-26T21:00:00Z'), 'next business morning');
});

test('Netlify form detection attributes survive an Eleventy build', function () {
  var { execFileSync } = require('child_process');
  var os = require('os');
  var outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stop-renting-build-'));
  try {
    execFileSync(process.execPath, [
      path.join(root, 'node_modules/@11ty/eleventy/cmd.cjs'),
      '--input=src',
      '--output=' + outDir,
      '--config=.eleventy.js'
    ], { cwd: root, encoding: 'utf8' });

    var built = fs.readFileSync(path.join(outDir, 'stop-renting/index.html'), 'utf8');
    assert.match(built, /<form[\s\S]*?name="stop-renting-callback"[\s\S]*?>/);
    assert.match(built, /<form[\s\S]*?data-netlify="true"[\s\S]*?>/);
    assert.match(built, /<form[\s\S]*?\snetlify(?:\s|=|>)/);
    assert.match(built, /<form[\s\S]*?netlify-honeypot="bot-field"[\s\S]*?>/);
    assert.match(built, /name="form-name" value="stop-renting-callback"/);
    assert.match(built, /id="stop-renting-name"/);
    assert.match(built, /getElementById\('stop-renting-name'\)/);
    assert.doesNotMatch(built, /form\.elements\.name/);
  } finally {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
});
