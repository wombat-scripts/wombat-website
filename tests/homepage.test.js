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
  ];
  var last = -1;
  order.forEach(function (needle) {
    var i = pos(home, needle);
    assert.ok(i > last, needle + ' should come after the previous landmark');
    last = i;
  });
});

test('quiz card sits in the Tools scroller, not under Book', function () {
  var toolsBlock = home.slice(home.indexOf('id="tools"'), home.indexOf('class="container faq"'));
  var bookBlock = home.slice(home.indexOf('id="book"'));
  assert.match(toolsBlock, /Which door is actually open\?/);
  assert.match(toolsBlock, /Get started in 2 minutes/);
  assert.match(toolsBlock, /id="tools-scroller"/);
  assert.match(toolsBlock, /href="\/which-door\/"/);
  assert.doesNotMatch(bookBlock, /Which door is actually open\?/);
  assert.doesNotMatch(bookBlock, /Get started in 2 minutes/);
  assert.doesNotMatch(home, /id="which-door-card"/);
  assert.doesNotMatch(home, /class="quiz-after"/);
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
    home.indexOf('Get started in 2 minutes') > home.indexOf('id="tools"') &&
      home.indexOf('Get started in 2 minutes') < home.indexOf('id="book"'),
    'Get started in 2 minutes belongs on the quiz card in Tools, not the Book band'
  );
  assert.doesNotMatch(home, /SMSF/);
  assert.doesNotMatch(home, /limited recourse/i);
  assert.doesNotMatch(home, /\u2014/);
});

test('homepage Tools is a 3-card scroller like Articles and Reviews', function () {
  assert.match(home, /id="tools"/);
  assert.match(home, /id="tools-scroller"/);
  assert.match(home, /id="tools-prev"/);
  assert.match(home, /id="tools-next"/);
  assert.match(home, /Building vs buying/);
  assert.match(home, /Wombat Property Search/);
  assert.match(home, /Which door is actually open\?/);
  assert.match(home, /id="articles-scroller"/);
  assert.match(css, /#tools-scroller \.index-card/);
  assert.match(css, /scroll-snap-align: start/);
  assert.doesNotMatch(home, /class="tools-grid"/);
  assert.doesNotMatch(home, /id="podcast-scroller"/);
  assert.doesNotMatch(home, /The Property Web/);
  assert.doesNotMatch(home, /The Wombat Wrap/);
  assert.doesNotMatch(home, /Connect on LinkedIn/);
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

test('nav and footer use Kitchen table chrome and the Gosford address', function () {
  assert.match(nav, /How it works/);
  assert.match(nav, /Who I help/);
  assert.match(nav, /href="\/calculators\/">Calculators</);
  assert.doesNotMatch(nav, /href="\/calculators\/">Tools</);
  assert.match(nav, /Book a Strategy Session/);
  assert.match(nav, /logo-horizontal\.svg/);
  assert.match(footer, /Suite 1, 86 Mann St, Gosford NSW 2250/);
  assert.doesNotMatch(footer, /GOSFORD/);
  assert.doesNotMatch(footer, /virtual office/i);
  assert.doesNotMatch(footer, /not a shopfront/i);
  assert.doesNotMatch(footer, /Postal \//);
  assert.match(footer, /logo-horizontal\.svg/);
  assert.doesNotMatch(footer, /logo-horizontal-white/);
  assert.doesNotMatch(nav + footer, /\u2014/);
});
