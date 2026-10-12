'use strict';

var fs = require('fs');
var path = require('path');
var test = require('node:test');
var assert = require('node:assert/strict');

var root = path.join(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

test('article hero reserves a 16:9 cover slot and is not lazy-loaded', function () {
  var partial = read('src/_includes/partials/article-hero.njk');
  var css = read('src/_includes/css/styles.css');
  var layout = read('src/_layouts/article.njk');

  assert.match(layout, /partials\/article-hero\.njk/);
  assert.match(partial, /width="\{\{ thumbnail \| imageWidth \}\}"/);
  assert.match(partial, /height="\{\{ thumbnail \| imageHeight \}\}"/);
  assert.match(partial, /decoding="async"/);
  assert.doesNotMatch(partial, /loading="lazy"/);
  assert.match(css, /\.article-hero \{[\s\S]*aspect-ratio:\s*16\s*\/\s*9/);
  assert.match(css, /\.article-hero \{[\s\S]*max-height:\s*28rem/);
  assert.match(css, /\.article-hero img \{[\s\S]*object-fit:\s*cover/);
});

test('usable thumbnails have plain alt text and unsuitable ones do not', function () {
  var withAlt = read('src/articles/help-to-buy-what-it-is.md');
  assert.match(withAlt, /thumbnailAlt: "A couple in front of a brick house, holding a set of keys towards the camera"/);

  var flagged = [
    'src/articles/7-ways-a-mortgage-broker-saves-you-time-and-money.md',
    'src/articles/getting-mortgage-ready.njk',
    'src/articles/kiwisaver-australian-deposit.njk',
    'src/articles/split-loans-explained.md',
    'src/articles/the-real-costs-for-overseas-buyers.md',
    'src/articles/guarantor-loan-risks.md',
    'src/articles/how-much-can-i-borrow.md',
    'src/articles/fixed-vs-variable-rate.md',
    'src/articles/how-offset-accounts-could-save-you-thousands.md',
    'src/articles/diversifying-your-property-investment-portfolio.md',
    'src/articles/exchange-of-contracts-66w-certificates-and-finance-approval.md',
    'src/articles/how-should-you-prepare-for-a-mortgage-broker-meeting.md',
  ];
  flagged.forEach(function (rel) {
    assert.doesNotMatch(read(rel), /thumbnailAlt:/, rel + ' should stay without a hero');
  });

  var articlesDir = path.join(root, 'src/articles');
  fs.readdirSync(articlesDir).forEach(function (name) {
    if (name === 'index.njk') return;
    var text = fs.readFileSync(path.join(articlesDir, name), 'utf8');
    var match = text.match(/thumbnailAlt:\s*"([^"]*)"/);
    if (!match) return;
    assert.doesNotMatch(match[1], /\u2014|\u2013/, name + ' alt has a dash');
    assert.ok(match[1].length > 20 && match[1].length < 160, name + ' alt length');
  });
});
