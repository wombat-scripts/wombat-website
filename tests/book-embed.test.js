'use strict';

var fs = require('fs');
var path = require('path');
var test = require('node:test');
var assert = require('node:assert/strict');

function read(rel) {
  return fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
}

var book = read('src/book.njk');
var css = read('src/_includes/css/styles.css');
var base = read('src/_layouts/base.njk');
var site = read('src/_data/site.json');

test('book embed keeps the official Calendly inline widget', function () {
  assert.match(book, /class="calendly-inline-widget"/);
  assert.match(book, /data-url="\{\{ site\.calendlyEvent \}\}\?hide_event_type_details=1&amp;hide_gdpr_banner=1"/);
  assert.match(book, /data-resize="true"/);
  assert.match(book, /style="min-width:320px;height:700px;"/);
  assert.match(book, /src="https:\/\/assets\.calendly\.com\/assets\/external\/widget\.js" async/);
  assert.match(site, /"calendlyEvent": "https:\/\/calendly\.com\/tom-wombathomeloans\/strategy-session"/);
  assert.match(book, /I'll tell you what's possible\./);
});

test('waiting UI is static HTML inside the 700px embed', function () {
  var waitAt = book.indexOf('class="book-embed__wait"');
  var widgetAt = book.indexOf('class="calendly-inline-widget"');
  assert.ok(waitAt !== -1 && waitAt < widgetAt, 'waiting markup paints before the widget div');
  assert.match(book, /data-book-embed/);
  assert.match(book, /aria-busy="true"/);
  assert.match(book, /aria-live="polite"/);
  assert.match(book, /Loading available times…/);
  assert.doesNotMatch(book, /—/);
  assert.match(css, /\.book-embed \.calendly-inline-widget \{\s*position: relative;[\s\S]*min-height: 700px;/);
  assert.match(css, /\.book-embed\.is-ready \.book-embed__wait/);
  assert.match(css, /\.book-embed__wait\[hidden\]/);
});

test('loader hides on calendly.event_type_viewed and iframe-load fallback', function () {
  var messageAt = book.indexOf('calendly.event_type_viewed');
  var scriptAt = book.indexOf('assets/external/widget.js');
  assert.ok(messageAt !== -1 && scriptAt !== -1 && messageAt < scriptAt, 'listener is registered before widget.js');
  assert.match(book, /event\.origin !== "https:\/\/calendly\.com"/);
  assert.match(book, /iframeGraceMs = 1200/);
  assert.match(book, /addEventListener\("load"/);
});

test('Calendly connection hints are emitted for /book/ only', function () {
  var guardAt = base.indexOf('page.url == "/book/"');
  assert.ok(guardAt !== -1, 'hints are gated to the book page');
  var block = base.slice(guardAt, guardAt + 900);
  assert.match(block, /rel="preconnect" href="https:\/\/assets\.calendly\.com" crossorigin/);
  assert.match(block, /rel="preconnect" href="https:\/\/calendly\.com"/);
  assert.match(block, /rel="dns-prefetch" href="https:\/\/calendly\.com"/);
  assert.match(block, /rel="preload" as="script" href="https:\/\/assets\.calendly\.com\/assets\/external\/widget\.js"/);
  assert.equal(base.indexOf('assets.calendly.com', guardAt + 900), -1);
});
