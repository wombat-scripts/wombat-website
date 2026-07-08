/* =============================================================================
   Wombat Home Loans — Calculator engine
   -----------------------------------------------------------------------------
   Loaded only on /calculators/ pages, after Chart.js (CDN, deferred in order).
   Vanilla JS, no build step. One file drives all four calculators; each page
   declares which one it is via data-calc="..." on its main section.

   Assumptions are deliberately simple and stated on each page. These are
   guides, not credit advice.
   ============================================================================= */

(function () {
  'use strict';

  var root = document.querySelector('[data-calc]');
  if (!root) return;

  /* ── Brand palette (mirrors CSS tokens in styles.css) ─────────────────── */
  var C = {
    navy: '#1c476a',
    navyDeep: '#060b38',
    steel: '#507fa9',
    blueLight: '#97bcd7',
    bluePale: '#cadbe5',
    gold: '#c89a4a',
    success: '#2f7d5c',
    danger: '#b8443c',
    line: '#e6e2dc',
    inkSoft: '#4a4a4a'
  };

  /* ── Chart.js theme ────────────────────────────────────────────────────── */
  if (window.Chart) {
    Chart.defaults.font.family = '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    Chart.defaults.font.size = 13;
    Chart.defaults.color = C.inkSoft;
    Chart.defaults.borderColor = 'rgba(28, 71, 106, 0.08)';
    Chart.defaults.plugins.tooltip.backgroundColor = C.navyDeep;
    Chart.defaults.plugins.tooltip.padding = 12;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.plugins.tooltip.titleFont = { weight: 600 };
    Chart.defaults.plugins.tooltip.boxPadding = 4;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.boxWidth = 8;
    Chart.defaults.plugins.legend.labels.padding = 16;
    Chart.defaults.animation.duration = 350;
  }

  /* ── Formatting ────────────────────────────────────────────────────────── */
  var audFmt = new Intl.NumberFormat('en-AU', {
    style: 'currency', currency: 'AUD', maximumFractionDigits: 0
  });
  var numFmt = new Intl.NumberFormat('en-AU');

  function fmt$(n)  { return audFmt.format(Math.round(n)); }
  function fmtNum(n){ return numFmt.format(Math.round(n)); }
  function fmtPct(n){ return (Math.round(n * 100) / 100) + '%'; }
  function fmtYears(n){ return n + (n === 1 ? ' year' : ' years'); }

  function yearsMonths(totalMonths) {
    totalMonths = Math.round(totalMonths);
    var y = Math.floor(totalMonths / 12);
    var m = totalMonths % 12;
    if (y === 0) return m + (m === 1 ? ' month' : ' months');
    var out = y + (y === 1 ? ' year' : ' years');
    if (m > 0) out += ' ' + m + (m === 1 ? ' month' : ' months');
    return out;
  }

  /* ── Finance maths ─────────────────────────────────────────────────────── */
  var FREQ = { weekly: 52, fortnightly: 26, monthly: 12 };

  /* Standard amortising payment. */
  function pmt(P, annualPct, years, perYear) {
    var r = annualPct / 100 / perYear;
    var n = Math.round(years * perYear);
    if (n <= 0) return 0;
    if (r === 0) return P / n;
    return P * r / (1 - Math.pow(1 + r, -n));
  }

  /* Period-by-period simulation.
     opts: ioYears (interest-only period), extra (extra per period),
           offset (constant offset balance). Returns yearly-sampled arrays. */
  function schedule(P, annualPct, years, perYear, opts) {
    opts = opts || {};
    var r = annualPct / 100 / perYear;
    var ioPeriods = Math.round((opts.ioYears || 0) * perYear);
    var extra = opts.extra || 0;
    var offset = Math.min(opts.offset || 0, P);
    var basePay = pmt(P, annualPct, years - (opts.ioYears || 0), perYear);

    var bal = P, totalInterest = 0, i = 0;
    var balances = [P], interests = [0];
    var maxPeriods = 100 * perYear;

    while (bal > 0.005 && i < maxPeriods) {
      i++;
      var interest = Math.max(0, bal - offset) * r;
      var pay = (i <= ioPeriods) ? interest : basePay + extra;
      if (i > ioPeriods && pay > bal + interest) pay = bal + interest;
      totalInterest += interest;
      bal = bal + interest - pay;
      if (i % perYear === 0) {
        balances.push(Math.max(0, bal));
        interests.push(totalInterest);
      }
    }
    if (i % perYear !== 0) {
      balances.push(Math.max(0, bal));
      interests.push(totalInterest);
    }
    return {
      payment: basePay,
      periods: i,
      months: i / perYear * 12,
      totalInterest: totalInterest,
      balances: balances,
      interests: interests,
      perYear: perYear
    };
  }

  /* Australian resident income tax, 2025–26 rates, incl. Medicare levy (2%)
     and LITO. Simplified: no HECS, offsets beyond LITO, or levy reductions. */
  function incomeTax(income) {
    var brackets = [[18200, 0], [45000, 0.16], [135000, 0.30], [190000, 0.37], [Infinity, 0.45]];
    var t = 0, prev = 0;
    for (var k = 0; k < brackets.length; k++) {
      if (income > prev) t += (Math.min(income, brackets[k][0]) - prev) * brackets[k][1];
      prev = brackets[k][0];
    }
    var lito = 0;
    if (income <= 37500) lito = 700;
    else if (income <= 45000) lito = 700 - (income - 37500) * 0.05;
    else if (income <= 66667) lito = 325 - (income - 45000) * 0.015;
    t = Math.max(0, t - Math.max(0, lito));
    if (income > 27222) t += income * 0.02;
    return t;
  }
  function netAnnual(gross) { return gross - incomeTax(gross); }

  /* Present value of an annuity — used for borrowing power. */
  function maxLoanFromSurplus(monthlySurplus, assessPct, years) {
    if (monthlySurplus <= 0) return 0;
    var r = assessPct / 100 / 12;
    var n = years * 12;
    return monthlySurplus * (1 - Math.pow(1 + r, -n)) / r;
  }

  /* ── UI helpers ────────────────────────────────────────────────────────── */
  function $(id) { return document.getElementById(id); }

  function paintRange(el) {
    var min = +el.min || 0, max = +el.max || 100, v = +el.value;
    var p = (max === min) ? 0 : (v - min) / (max - min) * 100;
    el.style.background = 'linear-gradient(to right, ' + C.navy + ' 0%, ' + C.navy + ' ' + p + '%, ' + C.bluePale + ' ' + p + '%)';
  }

  /* Range slider + $ text input, kept in sync. Typed values may exceed the
     slider max — the slider pins, the typed value wins. */
  function bindMoney(rangeId, inputId, onChange) {
    var r = $(rangeId), inp = $(inputId);
    function parse() { return parseFloat(String(inp.value).replace(/[^0-9.]/g, '')) || 0; }
    r.addEventListener('input', function () {
      inp.value = fmtNum(+r.value);
      paintRange(r);
      onChange();
    });
    inp.addEventListener('change', function () {
      var v = Math.max(0, parse());
      inp.value = fmtNum(v);
      r.value = Math.min(Math.max(v, +r.min), +r.max);
      paintRange(r);
      onChange();
    });
    inp.value = fmtNum(+r.value);
    paintRange(r);
    return { get value() { return parse(); } };
  }

  /* Range slider with a live <output> label (rates, terms, counts). */
  function bindRange(rangeId, outId, fmtFn, onChange) {
    var r = $(rangeId), out = $(outId);
    function upd() { out.textContent = fmtFn(+r.value); paintRange(r); }
    r.addEventListener('input', function () { upd(); onChange(); });
    upd();
    return { get value() { return +r.value; } };
  }

  /* Segmented control (group of buttons with aria-pressed). */
  function bindSeg(segId, onChange) {
    var el = $(segId);
    var btns = el.querySelectorAll('button');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        onChange();
      });
    });
    return { get value() { return el.querySelector('[aria-pressed="true"]').dataset.value; } };
  }

  /* Animated number update (respects prefers-reduced-motion). */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function setStat(el, value, fmtFn) {
    fmtFn = fmtFn || fmt$;
    if (typeof el === 'string') el = $(el);
    if (!el) return;
    if (reduceMotion || typeof value !== 'number') {
      el.textContent = (typeof value === 'number') ? fmtFn(value) : value;
      el._v = (typeof value === 'number') ? value : 0;
      return;
    }
    var from = el._v || 0;
    el._v = value;
    var t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / 400, 1);
      p = 1 - Math.pow(1 - p, 3);
      el.textContent = fmtFn(from + (value - from) * p);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function setText(id, text) { var el = $(id); if (el) el.textContent = text; }

  /* Create-or-update a Chart.js chart. */
  var charts = {};
  function upsertChart(key, canvasId, config) {
    if (charts[key]) {
      charts[key].data = config.data;
      charts[key].options = config.options;
      charts[key].update();
      return charts[key];
    }
    var el = $(canvasId);
    if (!el || !window.Chart) return null;
    charts[key] = new Chart(el.getContext('2d'), config);
    return charts[key];
  }

  function yearLabels(n) {
    var out = [];
    for (var i = 0; i <= n; i++) out.push(i === 0 ? 'Now' : 'Yr ' + i);
    return out;
  }

  var moneyTick = function (v) {
    if (Math.abs(v) >= 1000000) return '$' + (v / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
    if (Math.abs(v) >= 1000) return '$' + Math.round(v / 1000) + 'k';
    return '$' + v;
  };
  var moneyTooltip = function (ctx) {
    return ctx.dataset.label + ': ' + fmt$(ctx.parsed.y !== undefined && ctx.parsed.y !== null ? ctx.parsed.y : ctx.parsed);
  };

  /* ══════════════════════════════════════════════════════════════════════
     1. LOAN REPAYMENTS
     ══════════════════════════════════════════════════════════════════════ */
  function initRepayments() {
    var ready = false;
    var cb = function () { if (ready) update(); };

    var amount  = bindMoney('r-amount', 'r-amount-input', cb);
    var rate    = bindRange('r-rate', 'r-rate-out', fmtPct, cb);
    var term    = bindRange('r-term', 'r-term-out', fmtYears, cb);
    var freq    = bindSeg('r-freq', cb);
    var rtype   = bindSeg('r-type', cb);
    var ioYears = bindRange('r-io', 'r-io-out', fmtYears, cb);

    function update() {
      var P = amount.value;
      var isIO = rtype.value === 'io';
      $('r-io-wrap').hidden = !isIO;

      var per = FREQ[freq.value];
      var io = isIO ? Math.min(ioYears.value, term.value - 1) : 0;
      var s = schedule(P, rate.value, term.value, per, { ioYears: io });
      var ioPay = P * rate.value / 100 / per;
      var perLabel = { weekly: 'per week', fortnightly: 'per fortnight', monthly: 'per month' }[freq.value];

      setStat('r-hero', isIO ? ioPay : s.payment);
      setText('r-hero-label', isIO
        ? 'Repayments ' + perLabel + ' during the interest-only period'
        : 'Repayments ' + perLabel);
      setText('r-hero-note', isIO
        ? 'Stepping up to ' + fmt$(s.payment) + ' ' + perLabel + ' once the interest-only period ends.'
        : 'Principal and interest over ' + fmtYears(term.value) + ' at ' + fmtPct(rate.value) + '.');

      setStat('r-stat-interest', s.totalInterest);
      setStat('r-stat-total', P + s.totalInterest);
      setText('r-stat-payments', fmtNum(s.periods) + ' payments');

      var years = Math.ceil(s.periods / per);
      var labels = yearLabels(years);
      upsertChart('rBalance', 'r-chart-balance', {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Loan balance',
              data: s.balances,
              borderColor: C.navy,
              backgroundColor: 'rgba(28, 71, 106, 0.10)',
              fill: true,
              tension: 0.35,
              pointRadius: 0,
              pointHitRadius: 12,
              borderWidth: 2.5
            },
            {
              label: 'Interest paid so far',
              data: s.interests,
              borderColor: C.gold,
              borderDash: [6, 5],
              fill: false,
              tension: 0.35,
              pointRadius: 0,
              pointHitRadius: 12,
              borderWidth: 2
            }
          ]
        },
        options: {
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          scales: {
            y: { ticks: { callback: moneyTick }, beginAtZero: true },
            x: { grid: { display: false }, ticks: { maxTicksLimit: 9 } }
          },
          plugins: { tooltip: { callbacks: { label: moneyTooltip } } }
        }
      });

      upsertChart('rSplit', 'r-chart-split', {
        type: 'doughnut',
        data: {
          labels: ['The home (principal)', 'The bank (interest)'],
          datasets: [{
            data: [P, Math.round(s.totalInterest)],
            backgroundColor: [C.navy, C.blueLight],
            borderColor: '#fdfcfa',
            borderWidth: 3,
            hoverOffset: 6
          }]
        },
        options: {
          maintainAspectRatio: false,
          cutout: '62%',
          plugins: {
            legend: { position: 'bottom' },
            tooltip: { callbacks: { label: function (ctx) { return ctx.label + ': ' + fmt$(ctx.parsed); } } }
          }
        }
      });

      setText('r-split-note',
        'For every dollar you borrow, you repay about $' +
        ((P + s.totalInterest) / P).toFixed(2).replace('.00', '') +
        '. Interest is ' + Math.round(s.totalInterest / (P + s.totalInterest) * 100) +
        '% of everything you’ll hand over — which is exactly why the rate, and the structure, matter.');
    }

    ready = true;
    update();
  }

  /* ══════════════════════════════════════════════════════════════════════
     2. BORROWING POWER
     ══════════════════════════════════════════════════════════════════════ */
  function initBorrowing() {
    var ready = false;
    var cb = function () { if (ready) update(); };

    var applicants = bindSeg('b-applicants', cb);
    var inc1    = bindMoney('b-inc1', 'b-inc1-input', cb);
    var inc2    = bindMoney('b-inc2', 'b-inc2-input', cb);
    var rental  = bindMoney('b-rental', 'b-rental-input', cb);
    var deps    = bindRange('b-deps', 'b-deps-out', function (v) { return String(v); }, cb);
    var expenses = bindMoney('b-expenses', 'b-expenses-input', cb);
    var debts   = bindMoney('b-debts', 'b-debts-input', cb);
    var cc      = bindMoney('b-cc', 'b-cc-input', cb);
    var rate    = bindRange('b-rate', 'b-rate-out', fmtPct, cb);
    var deposit = bindMoney('b-deposit', 'b-deposit-input', cb);

    function borrowingAt(assessPct, surplus) {
      return maxLoanFromSurplus(surplus, assessPct, 30);
    }

    function update() {
      var two = applicants.value === '2';
      $('b-inc2-wrap').hidden = !two;

      var grossAnnual = inc1.value + 0.8 * rental.value + (two ? inc2.value : 0);
      var netMonthly = (netAnnual(inc1.value + 0.8 * rental.value) + (two ? netAnnual(inc2.value) : 0)) / 12;
      var grossMonthly = grossAnnual / 12;
      var taxMonthly = grossMonthly - netMonthly;

      var hem = (two ? 3900 : 2600) + 450 * deps.value;
      var living = Math.max(expenses.value, hem);
      var hemApplied = living > expenses.value;
      setText('b-hem-note', hemApplied
        ? 'We’ve used a household benchmark of ' + fmt$(living) + '/month instead of your figure — lenders do the same when declared expenses look light.'
        : 'Using your declared living expenses of ' + fmt$(living) + '/month.');

      var commitments = debts.value + cc.value * 0.038;
      var surplus = netMonthly - living - commitments;
      var assess = rate.value + 3;
      var loan = borrowingAt(assess, surplus);

      setStat('b-hero', loan);
      setText('b-hero-note', loan > 0
        ? 'Assessed at ' + fmtPct(assess) + ' (your rate of ' + fmtPct(rate.value) + ' plus the 3% APRA serviceability buffer), over 30 years.'
        : 'On these numbers there’s no surplus left to service a loan — but inputs rarely tell the whole story. Worth a conversation.');

      setStat('b-stat-budget', loan + deposit.value);
      setStat('b-stat-repay', pmt(loan, rate.value, 30, 12));
      setText('b-stat-assess', fmtPct(assess));

      var repayCapacity = Math.max(0, surplus);
      upsertChart('bSplit', 'b-chart-split', {
        type: 'doughnut',
        data: {
          labels: ['Tax', 'Living expenses', 'Other commitments', 'Available for a loan'],
          datasets: [{
            data: [
              Math.max(0, Math.round(taxMonthly)),
              Math.round(living),
              Math.round(commitments),
              Math.round(repayCapacity)
            ],
            backgroundColor: [C.bluePale, C.blueLight, C.steel, C.navy],
            borderColor: '#fdfcfa',
            borderWidth: 3,
            hoverOffset: 6
          }]
        },
        options: {
          maintainAspectRatio: false,
          cutout: '62%',
          plugins: {
            legend: { position: 'bottom' },
            tooltip: { callbacks: { label: function (ctx) { return ctx.label + ': ' + fmt$(ctx.parsed) + '/month'; } } }
          }
        }
      });

      var rates = [], powers = [];
      for (var rr = 4; rr <= 9.001; rr += 0.5) {
        rates.push(fmtPct(rr));
        powers.push(Math.round(borrowingAt(rr + 3, surplus)));
      }
      upsertChart('bSens', 'b-chart-sens', {
        type: 'line',
        data: {
          labels: rates,
          datasets: [{
            label: 'Borrowing power',
            data: powers,
            borderColor: C.navy,
            backgroundColor: 'rgba(28, 71, 106, 0.10)',
            fill: true,
            tension: 0.35,
            pointRadius: 3,
            pointBackgroundColor: C.navy,
            borderWidth: 2.5
          }]
        },
        options: {
          maintainAspectRatio: false,
          scales: {
            y: { ticks: { callback: moneyTick }, beginAtZero: true },
            x: { grid: { display: false }, title: { display: true, text: 'Interest rate (before the 3% assessment buffer)' } }
          },
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: function (ctx) { return 'Approx. ' + fmt$(ctx.parsed.y); } } }
          }
        }
      });
    }

    ready = true;
    update();
  }

  /* ══════════════════════════════════════════════════════════════════════
     3. EXTRA REPAYMENTS & OFFSET
     ══════════════════════════════════════════════════════════════════════ */
  function initExtra() {
    var ready = false;
    var cb = function () { if (ready) update(); };

    var amount = bindMoney('e-amount', 'e-amount-input', cb);
    var rate   = bindRange('e-rate', 'e-rate-out', fmtPct, cb);
    var term   = bindRange('e-term', 'e-term-out', fmtYears, cb);
    var extra  = bindMoney('e-extra', 'e-extra-input', cb);
    var offset = bindMoney('e-offset', 'e-offset-input', cb);

    function update() {
      var P = amount.value;
      var base = schedule(P, rate.value, term.value, 12, {});
      var boosted = schedule(P, rate.value, term.value, 12, { extra: extra.value, offset: offset.value });

      var saved = base.totalInterest - boosted.totalInterest;
      var monthsSaved = base.periods - boosted.periods;

      setStat('e-hero', saved);
      setText('e-hero-note', saved > 0
        ? 'That’s interest that stays in your pocket instead of going to the bank — and you’re mortgage-free ' + yearsMonths(monthsSaved) + ' sooner.'
        : 'Add an extra repayment or an offset balance above to see what it saves you.');

      setText('e-stat-time', monthsSaved > 0 ? yearsMonths(monthsSaved) + ' sooner' : '—');
      setText('e-stat-payoff', yearsMonths(boosted.periods));
      setStat('e-stat-base-int', base.totalInterest);
      setStat('e-stat-new-int', boosted.totalInterest);

      var years = Math.ceil(base.periods / 12);
      upsertChart('eBalance', 'e-chart-balance', {
        type: 'line',
        data: {
          labels: yearLabels(years),
          datasets: [
            {
              label: 'Minimum repayments only',
              data: base.balances,
              borderColor: C.steel,
              borderDash: [6, 5],
              fill: false,
              tension: 0.35,
              pointRadius: 0,
              pointHitRadius: 12,
              borderWidth: 2
            },
            {
              label: 'With your extra repayments / offset',
              data: boosted.balances,
              borderColor: C.navy,
              backgroundColor: 'rgba(28, 71, 106, 0.10)',
              fill: true,
              tension: 0.35,
              pointRadius: 0,
              pointHitRadius: 12,
              borderWidth: 2.5
            }
          ]
        },
        options: {
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          scales: {
            y: { ticks: { callback: moneyTick }, beginAtZero: true },
            x: { grid: { display: false }, ticks: { maxTicksLimit: 9 } }
          },
          plugins: { tooltip: { callbacks: { label: moneyTooltip } } }
        }
      });

      upsertChart('eInterest', 'e-chart-interest', {
        type: 'bar',
        data: {
          labels: ['Total interest'],
          datasets: [
            {
              label: 'Minimum repayments only',
              data: [Math.round(base.totalInterest)],
              backgroundColor: C.blueLight,
              borderRadius: 8,
              barPercentage: 0.6
            },
            {
              label: 'With extra / offset',
              data: [Math.round(boosted.totalInterest)],
              backgroundColor: C.navy,
              borderRadius: 8,
              barPercentage: 0.6
            }
          ]
        },
        options: {
          maintainAspectRatio: false,
          indexAxis: 'y',
          scales: {
            x: { ticks: { callback: moneyTick }, beginAtZero: true },
            y: { grid: { display: false } }
          },
          plugins: {
            tooltip: { callbacks: { label: function (ctx) { return ctx.dataset.label + ': ' + fmt$(ctx.parsed.x); } } }
          }
        }
      });
    }

    ready = true;
    update();
  }

  /* ══════════════════════════════════════════════════════════════════════
     4. REFINANCE
     ══════════════════════════════════════════════════════════════════════ */
  function initRefinance() {
    var ready = false;
    var cb = function () { if (ready) update(); };

    var balance  = bindMoney('f-balance', 'f-balance-input', cb);
    var term     = bindRange('f-term', 'f-term-out', fmtYears, cb);
    var oldRate  = bindRange('f-old-rate', 'f-old-rate-out', fmtPct, cb);
    var newRate  = bindRange('f-new-rate', 'f-new-rate-out', fmtPct, cb);
    var upfront  = bindMoney('f-upfront', 'f-upfront-input', cb);
    var annualFee = bindMoney('f-fee', 'f-fee-input', cb);
    var cashback = bindMoney('f-cashback', 'f-cashback-input', cb);

    function update() {
      var P = balance.value;
      var n = term.value * 12;
      var oldP = pmt(P, oldRate.value, term.value, 12);
      var newP = pmt(P, newRate.value, term.value, 12);
      var monthlySave = oldP - newP - annualFee.value / 12;

      function netAt(m) {
        return (oldP - newP) * m - annualFee.value * m / 12 - upfront.value + cashback.value;
      }

      var breakeven = null;
      if (monthlySave > 0) {
        for (var m = 0; m <= n; m++) {
          if (netAt(m) >= 0) { breakeven = m; break; }
        }
      } else if (netAt(0) >= 0 && monthlySave <= 0) {
        breakeven = cashback.value >= upfront.value ? 0 : null;
      }

      setStat('f-hero', monthlySave, function (v) { return (v < 0 ? '−' : '') + fmt$(Math.abs(v)); });
      setText('f-hero-note', monthlySave > 0
        ? 'Lower repayments every month at ' + fmtPct(newRate.value) + ' instead of ' + fmtPct(oldRate.value) + ', on the same remaining term.'
        : 'On these numbers the switch doesn’t pay — the new deal needs to be sharper, or the fees lower.');

      setText('f-stat-breakeven', breakeven === null ? 'Never' : (breakeven === 0 ? 'Immediately' : yearsMonths(breakeven)));
      setStat('f-stat-5yr', netAt(Math.min(60, n)), function (v) { return (v < 0 ? '−' : '') + fmt$(Math.abs(v)); });
      setStat('f-stat-term', netAt(n), function (v) { return (v < 0 ? '−' : '') + fmt$(Math.abs(v)); });

      upsertChart('fCompare', 'f-chart-compare', {
        type: 'bar',
        data: {
          labels: ['Monthly repayment'],
          datasets: [
            {
              label: 'Current loan (' + fmtPct(oldRate.value) + ')',
              data: [Math.round(oldP)],
              backgroundColor: C.blueLight,
              borderRadius: 8,
              barPercentage: 0.6
            },
            {
              label: 'New loan (' + fmtPct(newRate.value) + ')',
              data: [Math.round(newP)],
              backgroundColor: C.navy,
              borderRadius: 8,
              barPercentage: 0.6
            }
          ]
        },
        options: {
          maintainAspectRatio: false,
          indexAxis: 'y',
          scales: {
            x: { ticks: { callback: moneyTick }, beginAtZero: true },
            y: { grid: { display: false } }
          },
          plugins: {
            tooltip: { callbacks: { label: function (ctx) { return ctx.dataset.label + ': ' + fmt$(ctx.parsed.x); } } }
          }
        }
      });

      var horizon = Math.min(120, n);
      var labels = [], series = [];
      for (var mm = 0; mm <= horizon; mm += 3) {
        labels.push(mm === 0 ? 'Now' : (mm % 12 === 0 ? 'Yr ' + (mm / 12) : ''));
        series.push(Math.round(netAt(mm)));
      }
      upsertChart('fCumulative', 'f-chart-cumulative', {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Net position after switching',
            data: series,
            borderColor: C.navy,
            borderWidth: 2.5,
            pointRadius: 0,
            pointHitRadius: 12,
            tension: 0.3,
            fill: {
              target: 'origin',
              above: 'rgba(47, 125, 92, 0.12)',
              below: 'rgba(184, 68, 60, 0.10)'
            }
          }]
        },
        options: {
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          scales: {
            y: { ticks: { callback: moneyTick } },
            x: { grid: { display: false }, ticks: { autoSkip: false, maxRotation: 0, callback: function (v, i) { return labels[i] || null; } } }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                title: function (items) { var i = items[0].dataIndex * 3; return i === 0 ? 'At switching' : yearsMonths(i) + ' in'; },
                label: function (ctx) {
                  var v = ctx.parsed.y;
                  return (v >= 0 ? 'Ahead by ' : 'Behind by ') + fmt$(Math.abs(v));
                }
              }
            }
          }
        }
      });
    }

    ready = true;
    update();
  }

  /* ── Dispatch ──────────────────────────────────────────────────────────── */
  var inits = {
    repayments: initRepayments,
    borrowing: initBorrowing,
    extra: initExtra,
    refinance: initRefinance
  };
  var kind = root.dataset.calc;
  if (inits[kind]) inits[kind]();
})();
