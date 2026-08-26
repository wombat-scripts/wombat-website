'use strict';

var fs = require('fs');
var path = require('path');
var test = require('node:test');
var assert = require('node:assert/strict');

var home = fs.readFileSync(path.join(__dirname, '..', 'src/index.njk'), 'utf8');
var css = fs.readFileSync(path.join(__dirname, '..', 'src/_includes/css/styles.css'), 'utf8');
var nav = fs.readFileSync(path.join(__dirname, '..', 'src/_includes/nav.njk'), 'utf8');
var footer = fs.readFileSync(path.join(__dirname, '..', 'src/_includes/footer.njk'), 'utf8');

function pos(hay, needle) {
  var i = hay.indexOf(needle);
  assert.ok(i !== -1, 'expected to find: ' + needle);
  return i;
}

test('homepage sections follow the Kitchen table order', function () {
  var order = [
    'class="hero"',
    'class="lender-strip"',
    'class="section video-intro"',
    'id="how-i-help"',
    'id="story"',
    'id="process"',
    'id="reviews"',
    'id="articles"',
    'id="tools"',
    'class="container faq"',
    'id="book"',
    'id="which-door-card"',
  ];
  var last = -1;
  order.forEach(function (needle) {
    var i = pos(home, needle);
    assert.ok(i > last, needle + ' should come after the previous landmark');
    last = i;
  });
});

test('quiz card sits after the book band, not in the tools slider', function () {
  assert.ok(
    home.indexOf('id="book"') < home.indexOf('id="which-door-card"'),
    'Which door card must come after Book'
  );
  assert.ok(
    home.indexOf('id="tools"') < home.indexOf('id="book"'),
    'tools stay above Book'
  );
  var toolsBlock = home.slice(home.indexOf('id="tools"'), home.indexOf('class="container faq"'));
  assert.doesNotMatch(toolsBlock, /Which door is actually open\?/);
  assert.match(home, /id="which-door-card"/);
  assert.match(home, /Which door is actually open\?/);
});

test('homepage has Kitchen table hero, tickets, and locked Who I help', function () {
  assert.match(home, /Financially fluent\. Mortgage confused\?/);
  assert.match(home, /tom_booking\.webp/);
  assert.match(home, /class="polaroid polaroid--hero"/);
  assert.match(home, /thirty minutes\. genuinely no obligation\./);
  assert.match(home, /Tom Carr\. Mortgage broker\. Ex-banker\. Sydney local\./);
  assert.match(home, /5\.0 Google/);
  assert.match(home, /20\+ years in the banks/);
  assert.match(home, /40\+ lenders/);
  assert.match(home, /Complicated payslips\. A first home\./);
  assert.match(home, /First-home buyers with complicated payslips/);
  assert.match(home, /The next move/);
  assert.match(home, /Refinancers/);
  assert.match(home, /Asset &amp; equipment finance/);
  assert.match(home, /tom-community\.webp/);
  assert.match(home, /class="polaroid polaroid--run"/);
  assert.match(home, /class="notebook"/);
  assert.doesNotMatch(home, /RSUs vesting next quarter/);
  assert.doesNotMatch(home, /ESS scheme HR never quite explained/);
  assert.doesNotMatch(home, /discovery call/i);
  assert.doesNotMatch(home, /Get started in 2 minutes[\s\S]{0,200}hero/);
  assert.ok(
    home.indexOf('Get started in 2 minutes') > home.indexOf('id="book"'),
    'Get started in 2 minutes belongs on the quiz card after Book, not the hero'
  );
  assert.doesNotMatch(home, /SMSF/);
  assert.doesNotMatch(home, /limited recourse/i);
  assert.doesNotMatch(home, /\u2014/);
});

test('homepage follows mockups: two tool cards, no podcast or Wrap', function () {
  assert.match(home, /id="tools"/);
  assert.match(home, /class="tools-grid"/);
  assert.match(home, /Building vs buying/);
  assert.match(home, /Wombat Property Search/);
  assert.match(home, /id="articles-scroller"/);
  assert.doesNotMatch(home, /id="tools-scroller"/);
  assert.doesNotMatch(home, /id="tools-prev"/);
  assert.doesNotMatch(home, /id="tools-next"/);
  assert.doesNotMatch(home, /id="podcast-scroller"/);
  assert.doesNotMatch(home, /The Property Web/);
  assert.doesNotMatch(home, /The Wombat Wrap/);
  assert.doesNotMatch(home, /All tools/);
});

test('skin tokens are Kitchen table, not navy Fraunces', function () {
  assert.match(css, /#f7f3ec/);
  assert.match(css, /#1e2430/);
  assert.match(css, /#8a4a34/);
  assert.match(css, /Zilla Slab/);
  assert.match(css, /IBM Plex Sans/);
  assert.doesNotMatch(css, /Fraunces/);
  assert.doesNotMatch(css, /Plus Jakarta Sans/);
  assert.doesNotMatch(css, /#1c476a/);
  assert.doesNotMatch(css, /#060b38/);
});

test('nav and footer use Kitchen table chrome and Gosford virtual office', function () {
  assert.match(nav, /How it works/);
  assert.match(nav, /Who I help/);
  assert.match(nav, /Book a Strategy Session/);
  assert.match(nav, /logo-horizontal\.svg/);
  assert.match(footer, /Suite 1, 86 Mann St, GOSFORD NSW 2250/);
  assert.match(footer, /Postal \/ virtual office, not a shopfront/);
  assert.match(footer, /Sydney based, Australia-wide/);
  assert.match(footer, /logo-horizontal\.svg/);
  assert.doesNotMatch(footer, /logo-horizontal-white/);
  assert.doesNotMatch(nav + footer, /\u2014/);
});
