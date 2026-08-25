'use strict';

var fs = require('fs');
var path = require('path');
var test = require('node:test');
var assert = require('node:assert/strict');

var home = fs.readFileSync(path.join(__dirname, '..', 'src/index.njk'), 'utf8');

function pos(needle) {
  var i = home.indexOf(needle);
  assert.ok(i !== -1, 'expected to find: ' + needle);
  return i;
}

test('homepage sections follow the locked order', function () {
  var order = [
    'class="hero"',
    'class="proof-strip"',
    'class="lender-strip"',
    'class="section video-intro"',
    'id="how-i-help"',
    'id="story"',
    'id="process"',
    'id="reviews"',
    'id="articles"',
    'id="tools-scroller"',
    'id="podcast-scroller"',
    'class="container faq"',
    'id="book"',
    'id="newsletter"',
  ];
  var last = -1;
  order.forEach(function (needle) {
    var i = pos(needle);
    assert.ok(i > last, needle + ' should come after the previous landmark');
    last = i;
  });
});

test('homepage has a tools slider, no mid-page Wrap form, no SMSF lending offer', function () {
  assert.match(home, /id="tools-scroller"/);
  assert.match(home, /id="tools-prev"/);
  assert.match(home, /id="tools-next"/);
  assert.match(home, /First-home buyers with complicated payslips/);
  assert.match(home, /The next move/);
  assert.match(home, /Refinancers/);
  assert.match(home, /Asset &amp; equipment finance/);
  assert.doesNotMatch(home, /SMSF/);
  assert.doesNotMatch(home, /limited recourse/i);
  assert.doesNotMatch(home, /newsletter-email/);
  assert.doesNotMatch(home, /<form[^>]*kit\.com\/newsletter/);
  assert.match(home, /wrap-quiet/);
  assert.match(home, /The Wombat Wrap/);
  assert.match(home, /id="newsletter"/);
});
