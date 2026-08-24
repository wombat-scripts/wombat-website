/* =============================================================================
   Wombat Home Loans — NSW house-and-land cash walk (math)
   -----------------------------------------------------------------------------
   Pure functions. No DOM. Safe to require() from Node tests and to load in
   the browser. This is a cash-timing estimate, not an approval or max-loan.
   ============================================================================= */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.HouseAndLandCash = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var FHOG_AMOUNT = 10000;
  var FHOG_CAP = 750000;
  var FHBAS_EXEMPT_TO = 350000;
  var FHBAS_FULL_FROM = 450000;
  var PREMIUM_OVER = 3870000;
  var HBA_MAX_DEPOSIT_PCT = 10;
  var GENUINE_SAVINGS_PCT = 5;
  var DEFAULT_LVR = 0.9;
  var DEFAULT_LAND_TO_PC = 12;
  var PI_YEARS = 30;

  var FHBAS_SAMPLES = [
    { land: 370000, duty: 2761.4 },
    { land: 390000, duty: 5552.8 },
    { land: 410000, duty: 8514.2 },
    { land: 430000, duty: 11475.6 }
  ];

  var DEFAULT_STAGES = [
    { id: 'deposit', label: 'Builder deposit', pct: 5 },
    { id: 'base', label: 'Base', pct: 10 },
    { id: 'frame', label: 'Frame', pct: 15 },
    { id: 'lockup', label: 'Lock-up', pct: 35 },
    { id: 'fixing', label: 'Fixing', pct: 25 },
    { id: 'pc', label: 'Practical completion', pct: 10 }
  ];

  function roundCents(n) {
    return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  }

  function evenSplit(total, n) {
    total = Math.max(0, Math.round(Number(total) || 0));
    n = Math.max(1, n);
    var base = Math.floor(total / n);
    var rem = total - base * n;
    var out = [];
    for (var i = 0; i < n; i++) out.push(base + (i < rem ? 1 : 0));
    return out;
  }

  function stagePctSum(stages) {
    return roundCents(stages.reduce(function (s, st) { return s + Number(st.pct || 0); }, 0));
  }

  function cloneStages(stages) {
    return (stages || DEFAULT_STAGES).map(function (st) {
      return {
        id: st.id,
        label: st.label,
        pct: Number(st.pct),
        months: st.months == null || st.months === '' ? null : Number(st.months)
      };
    });
  }

  /* NSW transfer duty 2026/27 (Revenue NSW updated 19 Aug 2026).
     Dutiable value for this tool is vacant land price only.
     Premium duty over $3,870,000 is out of range — we do not compute it. */
  function fullDuty(dutiable) {
    var v = Number(dutiable);
    if (!isFinite(v) || v < 0) {
      return { status: 'invalid', amount: null };
    }
    if (v > PREMIUM_OVER) {
      return { status: 'out_of_range', amount: null };
    }
    if (v === 0) {
      return { status: 'full', amount: 0 };
    }

    var amount;
    if (v <= 18000) {
      amount = Math.max(20, roundCents(v / 100 * 1.25));
    } else if (v <= 38000) {
      amount = roundCents(225 + (v - 18000) / 100 * 1.5);
    } else if (v <= 103000) {
      amount = roundCents(525 + (v - 38000) / 100 * 1.75);
    } else if (v <= 387000) {
      amount = roundCents(1662 + (v - 103000) / 100 * 3.5);
    } else if (v <= 1290000) {
      amount = roundCents(11602 + (v - 387000) / 100 * 4.5);
    } else {
      amount = roundCents(52237 + (v - 1290000) / 100 * 5.5);
    }
    return { status: 'full', amount: amount };
  }

  function dutyForLand(land, firstHome) {
    var v = Number(land);
    if (!firstHome) return fullDuty(v);

    if (v <= FHBAS_EXEMPT_TO) {
      return { status: 'exempt', amount: 0 };
    }
    if (v >= FHBAS_FULL_FROM) {
      return fullDuty(v);
    }
    if (v > FHBAS_EXEMPT_TO && v < FHBAS_FULL_FROM) {
      return {
        status: 'confirm',
        amount: null,
        samples: FHBAS_SAMPLES.slice()
      };
    }
    return fullDuty(v);
  }

  function monthlyPI(principal, annualPct) {
    var P = Number(principal);
    var rate = Number(annualPct);
    if (!isFinite(P) || P <= 0 || !isFinite(rate) || rate <= 0) return null;
    var r = rate / 100 / 12;
    var n = PI_YEARS * 12;
    if (r === 0) return P / n;
    return P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  }

  function monthlyIO(drawn, annualPct) {
    var P = Number(drawn);
    var rate = Number(annualPct);
    if (!isFinite(P) || P <= 0 || !isFinite(rate) || rate <= 0) return 0;
    return P * (rate / 100) / 12;
  }

  function monthlyRent(weeklyRent) {
    var w = Number(weeklyRent) || 0;
    if (w <= 0) return 0;
    return w * 52 / 12;
  }

  function validate(input) {
    var errors = [];
    var land = Number(input.land);
    var build = Number(input.build);
    var cash = Number(input.cash);
    var depositPct = input.depositPct == null ? 5 : Number(input.depositPct);
    var holding = Number(input.holding || 0);
    var otherCash = Number(input.otherCash || 0);
    var stages = cloneStages(input.stages);

    if (!isFinite(land) || land <= 0) errors.push({ id: 'land', message: 'Enter the vacant land price.' });
    if (!isFinite(build) || build <= 0) errors.push({ id: 'build', message: 'Enter the fixed-price build.' });
    if (!isFinite(cash) || cash < 0) errors.push({ id: 'cash', message: 'Enter the cash already in an Australian account.' });
    if (input.firstHome !== true && input.firstHome !== false) {
      errors.push({ id: 'firstHome', message: 'Say whether you are both first-home buyers.' });
    }
    if (holding < 0) errors.push({ id: 'holding', message: 'Holding already paid cannot be negative.' });
    if (holding > land && land > 0) errors.push({ id: 'holding', message: 'Holding already paid cannot be more than the land price.' });
    if (otherCash < 0) errors.push({ id: 'otherCash', message: 'Other cash at land settlement cannot be negative.' });
    if (!isFinite(depositPct) || depositPct < 0) {
      errors.push({ id: 'depositPct', message: 'Enter a builder deposit percentage.' });
    } else if (depositPct > HBA_MAX_DEPOSIT_PCT) {
      errors.push({
        id: 'depositPct',
        message: 'Builder deposit cannot be over 10%. That is the Home Building Act s8 maximum (the typical HIA figure is 5%, not the legal cap).'
      });
    }

    var depositStage = stages.filter(function (st) { return st.id === 'deposit'; })[0];
    if (depositStage && isFinite(depositPct)) depositStage.pct = depositPct;

    var sum = stagePctSum(stages);
    var depositCapped = errors.some(function (e) { return e.id === 'depositPct'; });
    if (!depositCapped && Math.abs(sum - 100) > 0.001) {
      errors.push({
        id: 'stages',
        message: 'Stage percentages must add to 100%, including the deposit. They currently add to ' + sum + '%.'
      });
    }

    var lvr = Number(input.lvr);
    if (lvr !== 0.9 && lvr !== 0.95) {
      errors.push({ id: 'lvr', message: 'Pick 90% or 95% LVR.' });
    }

    return { errors: errors, stages: stages, depositPct: depositPct };
  }

  function payFromPools(amount, pools, useBuffer, facilityLeft) {
    var remaining = roundCents(amount);
    var fromOwn = Math.min(remaining, pools.ownFirst);
    pools.ownFirst = roundCents(pools.ownFirst - fromOwn);
    remaining = roundCents(remaining - fromOwn);

    var fromBuffer = 0;
    if (useBuffer) {
      fromBuffer = Math.min(remaining, pools.buffer);
      pools.buffer = roundCents(pools.buffer - fromBuffer);
      remaining = roundCents(remaining - fromBuffer);
    }

    var fromLender = Math.min(remaining, Math.max(0, facilityLeft));
    remaining = roundCents(remaining - fromLender);

    return {
      fromOwn: fromOwn,
      fromBuffer: fromBuffer,
      fromLender: fromLender,
      shortfall: remaining,
      ownCheque: roundCents(fromOwn + fromBuffer)
    };
  }

  function buildFlags(input, ctx) {
    var flags = [];
    var cash = Number(input.cash);
    var depositAmt = ctx.depositAmt;
    var baseAmt = ctx.baseAmt;

    if (cash < ctx.E) {
      flags.push({
        id: 'cash_lt_e',
        tone: 'fail',
        message: 'Cash is short of the property equity (E) by ' +
          Math.round(ctx.E - cash) +
          '. At ' + Math.round(ctx.lvr * 100) + '% that gap is the hole you have to fill before a lender will settle the land.'
      });
    }

    if (ctx.dutyAmount != null && cash < ctx.dutyAmount + ctx.E) {
      flags.push({
        id: 'cash_lt_duty_e',
        tone: 'fail',
        message: 'Cash does not cover duty plus property equity. Duty is extra — it is not part of the LVR.'
      });
    }

    if (ctx.cashAfter != null && depositAmt + baseAmt > ctx.cashAfter) {
      flags.push({
        id: 'deposit_base',
        tone: 'warn',
        message: 'Builder deposit plus base is more than the cash left after duty. Those early build cheques can empty the account even if land settlement looks fine.'
      });
    }

    if (ctx.C > FHOG_CAP) {
      flags.push({
        id: 'fhog_zero',
        tone: 'note',
        message: 'Package is over $750,000, so the First Home Owner Grant is $0. Do not assume a grant.'
      });
    }

    if (ctx.lvr >= 0.95) {
      flags.push({
        id: 'lvr95',
        tone: 'note',
        message: 'Default here is 90%. Some construction lenders will not do 95%.'
      });
    }

    if (ctx.buildMonths > 24) {
      flags.push({
        id: 'over24',
        tone: 'note',
        message: 'Many lenders want the build finished inside 24 months.'
      });
    }

    return flags;
  }

  function calculate(raw) {
    var input = raw || {};
    var checked = validate(input);
    if (checked.errors.length) {
      return { ok: false, errors: checked.errors };
    }

    var land = Number(input.land);
    var build = Number(input.build);
    var cash = Number(input.cash);
    var firstHome = input.firstHome === true;
    var lvr = Number(input.lvr);
    var ratePct = input.ratePct === '' || input.ratePct == null ? null : Number(input.ratePct);
    if (ratePct != null && !isFinite(ratePct)) ratePct = null;
    if (ratePct != null && ratePct <= 0) ratePct = null;
    var weeklyRent = Number(input.weeklyRent || 0);
    var landToPcMonths = input.landToPcMonths == null || input.landToPcMonths === ''
      ? DEFAULT_LAND_TO_PC
      : Math.max(0, Math.round(Number(input.landToPcMonths)));
    var holding = Number(input.holding || 0);
    var otherCash = Number(input.otherCash || 0);
    var stages = checked.stages;
    var depositPct = checked.depositPct;

    var C = roundCents(land + build);
    var L = Math.floor(C * lvr);
    var E = roundCents(C - L);

    var duty = dutyForLand(land, firstHome);
    var fhogAmount = firstHome && C <= FHOG_CAP ? FHOG_AMOUNT : 0;

    var cashAfter = null;
    var buffer = null;
    var cannotSettleLand = false;
    var shortOfE = null;
    var invoices = [];
    var monthly = null;
    var piEstimate = null;
    var drawnAtPc = null;

    if (duty.amount != null) {
      cashAfter = roundCents(cash - duty.amount - otherCash);
      if (cashAfter < 0) {
        cannotSettleLand = true;
      } else if (cashAfter < E) {
        shortOfE = roundCents(E - cashAfter);
      } else {
        buffer = roundCents(cashAfter - E);
      }
    }

    var monthSlices = stages.map(function (st, i) {
      if (st.months != null && isFinite(st.months) && st.months >= 0) return Math.round(st.months);
      return evenSplit(landToPcMonths, stages.length)[i];
    });
    var buildMonths = monthSlices.reduce(function (s, m) { return s + m; }, 0);

    var depositAmt = roundCents(build * depositPct / 100);
    var baseStage = stages.filter(function (st) { return st.id === 'base'; })[0];
    var baseAmt = baseStage ? roundCents(build * Number(baseStage.pct) / 100) : 0;

    var flags = buildFlags(input, {
      C: C,
      E: E,
      lvr: lvr,
      dutyAmount: duty.amount,
      cashAfter: cashAfter,
      depositAmt: depositAmt,
      baseAmt: baseAmt,
      buildMonths: buildMonths
    });

    if (duty.amount != null && !cannotSettleLand && shortOfE == null) {
      var pools = { ownFirst: E, buffer: buffer };
      var facilityLeft = L;
      var drawn = 0;
      var landInvoice = roundCents(Math.max(0, land - holding));

      /* Land cheque: required equity first, then the lender. Extra cash
         (buffer) stays in the account for later build invoices — that is
         the whole point of the walk. */
      var landPay = payFromPools(landInvoice, pools, false, facilityLeft);
      drawn = roundCents(drawn + landPay.fromLender);
      facilityLeft = Math.max(0, L - drawn);
      invoices.push({
        id: 'land',
        label: 'Land settlement',
        month: 0,
        amount: landInvoice,
        fromOwn: landPay.fromOwn,
        fromBuffer: landPay.fromBuffer,
        fromLender: landPay.fromLender,
        shortfall: landPay.shortfall,
        ownCheque: landPay.ownCheque,
        drawnAfter: drawn
      });

      var monthCursor = 0;
      stages.forEach(function (st, i) {
        monthCursor += monthSlices[i];
        var amount = roundCents(build * Number(st.pct) / 100);
        var pay = payFromPools(amount, pools, true, facilityLeft);
        drawn = roundCents(drawn + pay.fromLender);
        facilityLeft = Math.max(0, L - drawn);
        invoices.push({
          id: st.id,
          label: st.label,
          month: monthCursor,
          amount: amount,
          fromOwn: pay.fromOwn,
          fromBuffer: pay.fromBuffer,
          fromLender: pay.fromLender,
          shortfall: pay.shortfall,
          ownCheque: pay.ownCheque,
          drawnAfter: drawn
        });
      });

      drawnAtPc = drawn;
      if (ratePct != null) {
        piEstimate = monthlyPI(drawn, ratePct);
        monthly = buildMonthly(invoices, ratePct, weeklyRent, buildMonths);
      } else if (weeklyRent > 0 && buildMonths > 0) {
        monthly = buildMonthly(invoices, null, weeklyRent, buildMonths);
      }
    }

    return {
      ok: true,
      errors: [],
      C: C,
      L: L,
      E: E,
      duty: duty,
      fhog: {
        amount: fhogAmount,
        capped: C > FHOG_CAP,
        note: 'Paid via the lender or Revenue NSW, not pocket cash on day one.'
      },
      cashAfter: cashAfter,
      buffer: buffer,
      cannotSettleLand: cannotSettleLand,
      shortOfE: shortOfE,
      invoices: invoices,
      flags: flags,
      monthly: monthly,
      piEstimate: piEstimate,
      drawnAtPc: drawnAtPc,
      genuineSavings: roundCents(C * GENUINE_SAVINGS_PCT / 100),
      depositAmt: depositAmt,
      baseAmt: baseAmt,
      buildMonths: buildMonths,
      ratePct: ratePct,
      weeklyRent: weeklyRent,
      landToPcMonths: landToPcMonths
    };
  }

  function drawnAtStartOfMonth(invoices, month) {
    var drawn = 0;
    for (var i = 0; i < invoices.length; i++) {
      if (invoices[i].month < month) drawn = invoices[i].drawnAfter;
    }
    return drawn;
  }

  function buildMonthly(invoices, ratePct, weeklyRent, buildMonths) {
    var rent = monthlyRent(weeklyRent);
    var rows = [];
    var totalIO = 0;
    var totalRent = 0;
    var months = Math.max(0, buildMonths);

    for (var m = 1; m <= months; m++) {
      var drawn = drawnAtStartOfMonth(invoices, m);
      var io = ratePct == null ? 0 : monthlyIO(drawn, ratePct);
      totalIO = roundCents(totalIO + io);
      totalRent = roundCents(totalRent + rent);
      var due = invoices.filter(function (inv) { return inv.month === m; });
      rows.push({
        month: m,
        drawn: drawn,
        io: roundCents(io),
        rent: roundCents(rent),
        cashOut: roundCents(io + rent),
        invoices: due.map(function (inv) { return inv.id; })
      });
    }

    return {
      rows: rows,
      totalIO: totalIO,
      totalRent: totalRent,
      totalCashOut: roundCents(totalIO + totalRent),
      monthlyRent: roundCents(rent),
      skippedIO: ratePct == null
    };
  }

  return {
    FHOG_AMOUNT: FHOG_AMOUNT,
    FHOG_CAP: FHOG_CAP,
    FHBAS_EXEMPT_TO: FHBAS_EXEMPT_TO,
    FHBAS_FULL_FROM: FHBAS_FULL_FROM,
    PREMIUM_OVER: PREMIUM_OVER,
    HBA_MAX_DEPOSIT_PCT: HBA_MAX_DEPOSIT_PCT,
    FHBAS_SAMPLES: FHBAS_SAMPLES,
    DEFAULT_STAGES: DEFAULT_STAGES,
    DEFAULT_LVR: DEFAULT_LVR,
    DEFAULT_LAND_TO_PC: DEFAULT_LAND_TO_PC,
    roundCents: roundCents,
    evenSplit: evenSplit,
    fullDuty: fullDuty,
    dutyForLand: dutyForLand,
    monthlyPI: monthlyPI,
    monthlyIO: monthlyIO,
    validate: validate,
    calculate: calculate
  };
}));
