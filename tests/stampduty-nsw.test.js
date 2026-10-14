// NSW stamp duty cases for the buying-costs calculator (run: node --test tests/stampduty-nsw.test.js)
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '../src/assets/js/calculators.js'), 'utf8');
const body = src.slice(src.indexOf('  function dutyEngine(DATA) {'), src.indexOf('  /* end dutyEngine */'));
const dutyEngine = new Function(body + '\nreturn dutyEngine;')();
const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/_data/stampduty.json'), 'utf8'));
const { baseDuty, fhbDuty } = dutyEngine(DATA);
const cents = (n) => Math.round(n * 100) / 100;

const fhb = [[750000, 0], [800000, 0], [850000, 9796.75], [900000, 19593.5], [1000000, 39187], [1200000, 48187]];
for (const [v, want] of fhb) {
  test(`NSW first home $${v} -> $${want}`, () => assert.strictEqual(cents(fhbDuty('NSW', v, false).duty), want));
}
const gen = [[850000, 32437], [1200000, 48187], [1000000, 39187], [18001, 226.5], [1000, 20], [3870000, 194137], [3870100, 194144]];
for (const [v, want] of gen) {
  test(`NSW general $${v} -> $${want}`, () => assert.strictEqual(cents(baseDuty('NSW', v, true)), want));
}
test('NSW government fees = transfer + mortgage registration ($182.73 x 2)', () => assert.strictEqual(DATA.states.NSW.regFees, 365.46));
test('NSW last reviewed 14 Oct 2026', () => assert.strictEqual(DATA.states.NSW.lastReviewed, '2026-10-14'));
