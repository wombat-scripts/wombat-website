'use strict';

var fs = require('fs');
var path = require('path');
var test = require('node:test');
var assert = require('node:assert/strict');

var root = path.join(__dirname, '..');
var calcs = fs.readFileSync(path.join(root, 'src/calculators/index.njk'), 'utf8');
var nav = fs.readFileSync(path.join(root, 'src/_includes/nav.njk'), 'utf8');
var css = fs.readFileSync(path.join(root, 'src/_includes/css/styles.css'), 'utf8');

var slugs = [
  'repayments',
  'borrowing-power',
  'extra-repayments',
  'refinance',
  'buying-costs',
  'lvr',
  'offset-vs-basic',
];

test('calculators hub lists the seven calculators and not the quiz or hub', function () {
  slugs.forEach(function (slug) {
    assert.match(calcs, new RegExp('href="/calculators/' + slug + '/"'));
    assert.match(calcs, new RegExp('/images/calc-previews/' + slug + '\\.webp'));
    assert.ok(
      fs.existsSync(path.join(root, 'src/images/calc-previews', slug + '.webp')),
      'missing preview for ' + slug
    );
  });
  assert.equal((calcs.match(/Open calculator →/g) || []).length, 7);
  assert.doesNotMatch(calcs, /Which door is actually open\?/);
  assert.doesNotMatch(calcs, /Building vs buying/);
  assert.doesNotMatch(calcs, /href="\/which-door\/"/);
  assert.doesNotMatch(calcs, /href="\/construction\/"/);
  assert.doesNotMatch(calcs, /answer five questions/);
  assert.doesNotMatch(calcs, /five questions about the deposit/);
  assert.doesNotMatch(calcs, /\u2014/);
});

test('calculators hub cards use a hover preview, not a long essay', function () {
  assert.match(calcs, /calc-hub-card__preview/);
  assert.match(calcs, /polaroid polaroid--tape calc-hub-card__preview/);
  assert.match(css, /\.calc-hub-card:hover \.calc-hub-card__preview img/);
  assert.match(css, /transform: scale\(1\.13\)/);
  assert.match(calcs, /Week to week cost, and how the balance falls\./);
  assert.doesNotMatch(calcs, /Principal &amp; interest or interest-only, with a chart/);
  assert.doesNotMatch(calcs, /including the 3% assessment buffer/);
});

test('eyebrow rule is not a dash prefix', function () {
  assert.match(css, /\.eyebrow::before \{ content: none;/);
  assert.doesNotMatch(css, /width: 1\.5rem;\s*height: 1px;/);
  assert.doesNotMatch(calcs, /eyebrow--plain/);
  assert.doesNotMatch(calcs + css, /\u2014/);
});

test('nav label matches the calculators page', function () {
  assert.match(nav, /href="\/calculators\/">Calculators</);
  assert.doesNotMatch(nav, /href="\/calculators\/">Tools</);
});
