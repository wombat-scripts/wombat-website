'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var H = require('../src/assets/js/house-and-land-cash-math.js');

function fixture(overrides) {
  var base = {
    land: 500000,
    build: 600000,
    cash: 107000,
    firstHome: true,
    lvr: 0.9,
    ratePct: null,
    weeklyRent: 0,
    landToPcMonths: 12,
    holding: 0,
    otherCash: 0,
    depositPct: 5
  };
  Object.keys(overrides || {}).forEach(function (k) { base[k] = overrides[k]; });
  return base;
}

test('full duty: land 500000 = 16687', function () {
  var d = H.fullDuty(500000);
  assert.equal(d.status, 'full');
  assert.equal(d.amount, 16687);
});

test('full duty: home 1100000 regression = 43687 (not shown in UI)', function () {
  var d = H.fullDuty(1100000);
  assert.equal(d.status, 'full');
  assert.equal(d.amount, 43687);
});

test('full duty: premium over 3870000 is out of range', function () {
  var d = H.fullDuty(3870001);
  assert.equal(d.status, 'out_of_range');
  assert.equal(d.amount, null);
});

test('full duty: exactly 3870000 still computes', function () {
  var d = H.fullDuty(3870000);
  assert.equal(d.status, 'full');
  assert.ok(d.amount > 0);
});

test('FHBAS: land 350000 duty 0', function () {
  var d = H.dutyForLand(350000, true);
  assert.equal(d.status, 'exempt');
  assert.equal(d.amount, 0);
});

test('FHBAS: land 450000 is full duty', function () {
  var d = H.dutyForLand(450000, true);
  var full = H.fullDuty(450000);
  assert.equal(d.status, 'full');
  assert.equal(d.amount, full.amount);
});

test('FHBAS: concessional band does not invent a dollar', function () {
  var samples = [370000, 390000, 400000, 410000, 430000, 449999];
  samples.forEach(function (land) {
    var d = H.dutyForLand(land, true);
    assert.equal(d.status, 'confirm', 'land ' + land);
    assert.equal(d.amount, null, 'land ' + land + ' must not invent duty');
  });
  var mid = H.dutyForLand(400000, true);
  assert.ok(Array.isArray(mid.samples));
  assert.deepEqual(mid.samples, H.FHBAS_SAMPLES);
  assert.equal(H.FHBAS_SAMPLES[0].duty, 2761.4);
  assert.equal(H.FHBAS_SAMPLES[1].duty, 5552.8);
  assert.equal(H.FHBAS_SAMPLES[2].duty, 8514.2);
  assert.equal(H.FHBAS_SAMPLES[3].duty, 11475.6);
});

test('first-home no: always full duty on land, including the vacant-land exempt band', function () {
  var d = H.dutyForLand(300000, false);
  assert.equal(d.status, 'full');
  assert.equal(d.amount, H.fullDuty(300000).amount);
  assert.ok(d.amount > 0);
});

test('default 90% walk: hard fail on dollars', function () {
  var r = H.calculate(fixture());
  assert.equal(r.ok, true);
  assert.equal(r.C, 1100000);
  assert.equal(r.L, 990000);
  assert.equal(r.E, 110000);
  assert.equal(r.duty.amount, 16687);
  assert.equal(r.fhog.amount, 0);
  assert.equal(r.cashAfter, 90313);
  assert.equal(r.shortOfE, 19687);
  assert.equal(r.buffer, null);
  assert.equal(r.invoices.length, 0);
  assert.ok(r.flags.some(function (f) { return f.id === 'cash_lt_e'; }));
  assert.ok(r.flags.some(function (f) { return f.id === 'cash_lt_duty_e'; }));
  assert.ok(r.flags.some(function (f) { return f.id === 'fhog_zero'; }));
});

test('same package at 95%: walk proceeds, builder deposit from own funds', function () {
  var r = H.calculate(fixture({ lvr: 0.95 }));
  assert.equal(r.C, 1100000);
  assert.equal(r.L, 1045000);
  assert.equal(r.E, 55000);
  assert.equal(r.duty.amount, 16687);
  assert.equal(r.fhog.amount, 0);
  assert.equal(r.cashAfter, 90313);
  assert.equal(r.buffer, 35313);
  assert.equal(r.shortOfE, null);
  assert.ok(r.invoices.length > 0);

  var land = r.invoices.filter(function (i) { return i.id === 'land'; })[0];
  var deposit = r.invoices.filter(function (i) { return i.id === 'deposit'; })[0];
  assert.equal(land.amount, 500000);
  assert.equal(land.fromOwn, 55000);
  assert.equal(land.fromBuffer, 0);
  assert.equal(land.fromLender, 445000);
  assert.equal(deposit.amount, 30000);
  assert.equal(deposit.ownCheque, 30000);
  assert.equal(deposit.fromLender, 0);
  assert.equal(deposit.fromBuffer, 30000);
});

test('cash 80k at 95%: covers E, buffer 8313', function () {
  var r = H.calculate(fixture({ cash: 80000, lvr: 0.95 }));
  assert.equal(r.duty.amount, 16687);
  assert.equal(r.cashAfter, 63313);
  assert.equal(r.E, 55000);
  assert.equal(r.buffer, 8313);
  assert.equal(r.shortOfE, null);
  var deposit = r.invoices.filter(function (i) { return i.id === 'deposit'; })[0];
  assert.equal(deposit.amount, 30000);
  assert.equal(deposit.fromBuffer, 8313);
  assert.equal(deposit.fromLender, 21687);
});

test('FHOG is 10000 at or under 750k and still shown as 0 over the cap', function () {
  var under = H.calculate(fixture({ land: 300000, build: 400000, cash: 200000, firstHome: true, lvr: 0.9 }));
  assert.equal(under.C, 700000);
  assert.equal(under.fhog.amount, 10000);
  var over = H.calculate(fixture());
  assert.equal(over.fhog.amount, 0);
  assert.equal(over.fhog.capped, true);
});

test('FHOG is 0 when not first-home even under the cap', function () {
  var r = H.calculate(fixture({ land: 300000, build: 400000, cash: 200000, firstHome: false, lvr: 0.9 }));
  assert.equal(r.C, 700000);
  assert.equal(r.fhog.amount, 0);
  assert.equal(r.duty.amount, H.fullDuty(300000).amount);
});

test('builder deposit over 10% is an error', function () {
  var r = H.calculate(fixture({ depositPct: 10.1, lvr: 0.95 }));
  assert.equal(r.ok, false);
  assert.ok(r.errors.some(function (e) { return e.id === 'depositPct'; }));
});

test('builder deposit at 10% is allowed (HBA s8 max) when stages still sum to 100', function () {
  var r = H.calculate(fixture({
    depositPct: 10,
    lvr: 0.95,
    stages: [
      { id: 'deposit', label: 'Builder deposit', pct: 10 },
      { id: 'base', label: 'Base', pct: 10 },
      { id: 'frame', label: 'Frame', pct: 15 },
      { id: 'lockup', label: 'Lock-up', pct: 35 },
      { id: 'fixing', label: 'Fixing', pct: 25 },
      { id: 'pc', label: 'Practical completion', pct: 5 }
    ]
  }));
  assert.equal(r.ok, true);
  var deposit = r.invoices.filter(function (i) { return i.id === 'deposit'; })[0];
  assert.equal(deposit.amount, 60000);
});

test('custom stage percentages must sum to 100 with deposit', function () {
  var r = H.calculate(fixture({
    lvr: 0.95,
    depositPct: 5,
    stages: [
      { id: 'deposit', label: 'Builder deposit', pct: 5 },
      { id: 'base', label: 'Base', pct: 10 },
      { id: 'frame', label: 'Frame', pct: 15 },
      { id: 'lockup', label: 'Lock-up', pct: 35 },
      { id: 'fixing', label: 'Fixing', pct: 25 },
      { id: 'pc', label: 'Practical completion', pct: 9 }
    ]
  }));
  assert.equal(r.ok, false);
  assert.ok(r.errors.some(function (e) { return e.id === 'stages'; }));
});

test('rate empty skips IO and P&I but still walks', function () {
  var r = H.calculate(fixture({ lvr: 0.95, ratePct: null }));
  assert.equal(r.ok, true);
  assert.ok(r.invoices.length > 0);
  assert.equal(r.monthly, null);
  assert.equal(r.piEstimate, null);
});

test('rate present produces IO rows and a 30-year P&I estimate', function () {
  var r = H.calculate(fixture({ lvr: 0.95, ratePct: 6, weeklyRent: 700 }));
  assert.ok(r.monthly);
  assert.equal(r.monthly.skippedIO, false);
  assert.equal(r.monthly.rows.length, 12);
  assert.ok(r.monthly.totalIO > 0);
  assert.ok(r.piEstimate > 0);
  var afterLand = r.invoices[0].drawnAfter;
  assert.equal(r.monthly.rows[0].drawn, afterLand);
  assert.ok(Math.abs(r.monthly.rows[0].io - afterLand * 0.06 / 12) < 0.02);
});

test('build months over 24 raises a copy-only flag', function () {
  var r = H.calculate(fixture({ lvr: 0.95, landToPcMonths: 30 }));
  assert.ok(r.flags.some(function (f) { return f.id === 'over24'; }));
});

test('95% flag is present when they pick 95', function () {
  var r = H.calculate(fixture({ lvr: 0.95 }));
  assert.ok(r.flags.some(function (f) { return f.id === 'lvr95'; }));
  var at90 = H.calculate(fixture());
  assert.ok(at90.flags.every(function (f) { return f.id !== 'lvr95'; }));
});

test('cash after duty negative: cannot settle land', function () {
  var r = H.calculate(fixture({ cash: 10000, lvr: 0.95 }));
  assert.equal(r.cannotSettleLand, true);
  assert.ok(r.cashAfter < 0);
  assert.equal(r.invoices.length, 0);
});

test('default stages sum to 100', function () {
  var sum = H.DEFAULT_STAGES.reduce(function (s, st) { return s + st.pct; }, 0);
  assert.equal(sum, 100);
});

test('L is floor of C times LVR', function () {
  var r = H.calculate(fixture({ land: 333333, build: 333334, cash: 200000, lvr: 0.9, firstHome: false }));
  assert.equal(r.C, 666667);
  assert.equal(r.L, Math.floor(666667 * 0.9));
  assert.equal(r.E, r.C - r.L);
});
