/* =============================================================================
   Wombat Home Loans — NSW house-and-land cash walk (UI)
   -----------------------------------------------------------------------------
   Client-side only. Paints /construction/house-and-land-cash/. No backend.
   Math lives in house-and-land-cash-math.js.
   ============================================================================= */

(function () {
  'use strict';

  var H = window.HouseAndLandCash;
  if (!H) return;

  var root = document.querySelector('[data-hlc]');
  if (!root) return;

  var aud0 = new Intl.NumberFormat('en-AU', {
    style: 'currency', currency: 'AUD', maximumFractionDigits: 0
  });
  var aud2 = new Intl.NumberFormat('en-AU', {
    style: 'currency', currency: 'AUD', minimumFractionDigits: 2, maximumFractionDigits: 2
  });

  function fmt$(n, cents) {
    if (n == null || !isFinite(n)) return '—';
    if (cents || Math.abs(n - Math.round(n)) > 0.001) return aud2.format(n);
    return aud0.format(n);
  }

  function parseMoney(el) {
    var raw = String(el.value || '').replace(/[^0-9.]/g, '');
    if (raw === '') return el.id === 'hlc-rate' ? null : 0;
    var n = parseFloat(raw);
    return isFinite(n) ? n : 0;
  }

  function parseOptionalRate(el) {
    var raw = String(el.value || '').replace(/[^0-9.]/g, '');
    if (raw === '') return null;
    var n = parseFloat(raw);
    return isFinite(n) && n > 0 ? n : null;
  }

  function formatMoneyField(el) {
    var n = parseMoney(el);
    if (String(el.value || '').trim() === '') return;
    el.value = new Intl.NumberFormat('en-AU').format(Math.round(n));
  }

  var moneyIds = ['hlc-land', 'hlc-build', 'hlc-cash', 'hlc-rent', 'hlc-holding', 'hlc-other'];
  var stageState = H.DEFAULT_STAGES.map(function (st) {
    return { id: st.id, label: st.label, pct: st.pct, months: null };
  });

  function pressedValue(id) {
    var btn = document.querySelector('#' + id + ' button[aria-pressed="true"]');
    return btn ? btn.getAttribute('data-value') : '';
  }

  function bindSeg(id) {
    var wrap = document.getElementById(id);
    if (!wrap) return;
    wrap.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      wrap.querySelectorAll('button').forEach(function (b) {
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
      render();
    });
  }

  function readStages() {
    return stageState.map(function (st) {
      return { id: st.id, label: st.label, pct: Number(st.pct), months: st.months };
    });
  }

  function stageSum() {
    return stageState.reduce(function (s, st) { return s + Number(st.pct || 0); }, 0);
  }

  function paintStages() {
    var host = document.getElementById('hlc-stages');
    if (!host) return;
    host.innerHTML = stageState.map(function (st) {
      return '<div class="hlc-stage">' +
        '<span class="hlc-stage__name">' + st.label + '</span>' +
        '<label class="hlc-stage__field"><span class="sr-only">' + st.label + ' percent</span>' +
          '<input data-stage-pct="' + st.id + '" type="text" inputmode="decimal" value="' + st.pct + '">' +
          '<span aria-hidden="true">%</span></label>' +
        '<label class="hlc-stage__field"><span class="sr-only">' + st.label + ' months</span>' +
          '<input data-stage-mo="' + st.id + '" type="text" inputmode="numeric" value="' +
            (st.months == null ? '' : st.months) + '" placeholder="auto">' +
          '<span aria-hidden="true">mo</span></label>' +
        '</div>';
    }).join('');
    paintStageSum();
  }

  function paintStageSum() {
    var el = document.getElementById('hlc-stage-sum');
    if (!el) return;
    var sum = Math.round(stageSum() * 100) / 100;
    el.textContent = 'Stage percentages add to ' + sum + '%.';
    el.classList.toggle('is-bad', Math.abs(sum - 100) > 0.001);
  }

  function inputs() {
    var fhb = pressedValue('hlc-fhb');
    var lvrRaw = pressedValue('hlc-lvr');
    var deposit = parseMoney(document.getElementById('hlc-deposit'));
    var depositStage = stageState.filter(function (st) { return st.id === 'deposit'; })[0];
    if (depositStage) depositStage.pct = deposit;
    return {
      land: parseMoney(document.getElementById('hlc-land')),
      build: parseMoney(document.getElementById('hlc-build')),
      cash: parseMoney(document.getElementById('hlc-cash')),
      firstHome: fhb === 'yes' ? true : fhb === 'no' ? false : null,
      lvr: lvrRaw === '95' ? 0.95 : lvrRaw === '90' ? 0.9 : null,
      ratePct: parseOptionalRate(document.getElementById('hlc-rate')),
      weeklyRent: parseMoney(document.getElementById('hlc-rent')),
      landToPcMonths: parseMoney(document.getElementById('hlc-months')) || 12,
      holding: parseMoney(document.getElementById('hlc-holding')),
      otherCash: parseMoney(document.getElementById('hlc-other')),
      depositPct: deposit,
      stages: readStages()
    };
  }

  function setHidden(id, hide) {
    var el = document.getElementById(id);
    if (el) el.hidden = !!hide;
  }

  function renderErrors(errors) {
    document.getElementById('hlc-hero-label').textContent = 'Need a bit more';
    document.getElementById('hlc-hero').textContent = 'Check the inputs';
    document.getElementById('hlc-hero-note').textContent = errors.map(function (e) { return e.message; }).join(' ');
    document.getElementById('hlc-stats').innerHTML = '';
    setHidden('hlc-walk-card', true);
    setHidden('hlc-month-card', true);
    setHidden('hlc-duty-card', true);
    var flags = document.getElementById('hlc-flags');
    flags.innerHTML = errors.map(function (e) {
      return '<li class="hlc-flag hlc-flag--fail">' + e.message + '</li>';
    }).join('');
    setHidden('hlc-flags-card', errors.length === 0);
  }

  function stat(label, value, note) {
    return '<div class="calc-stat">' +
      '<span class="calc-stat__label">' + label + '</span>' +
      '<span class="calc-stat__value">' + value + '</span>' +
      (note ? '<span class="calc-field__hint">' + note + '</span>' : '') +
      '</div>';
  }

  function renderDuty(r) {
    var card = document.getElementById('hlc-duty-card');
    var body = document.getElementById('hlc-duty-body');
    if (!card || !body) return;

    if (r.duty.status === 'confirm') {
      card.hidden = false;
      body.innerHTML =
        '<p>Duty on this vacant-land price is concessional (strictly between $350,000 and $450,000). This tool will not invent a sliding formula or an exact dollar.</p>' +
        '<p>Confirm on the official calculator: <a href="https://apps09.revenue.nsw.gov.au/erevenue/calculators/fhba.php" target="_blank" rel="noopener">Revenue NSW FHBAS vacant land</a>.</p>' +
        '<p>Assumes you qualify for FHBAS. Confirm on Revenue NSW before you exchange.</p>' +
        '<p class="calc-field__hint">Published 2026/27 sample points, examples only. Do not interpolate these into a fake exact dollar for other values.</p>' +
        '<ul class="hlc-samples">' +
          r.duty.samples.map(function (s) {
            return '<li>Land ' + fmt$(s.land) + ' → duty ' + fmt$(s.duty, true) + '</li>';
          }).join('') +
        '</ul>';
      return;
    }

    if (r.duty.status === 'out_of_range') {
      card.hidden = false;
      body.innerHTML = '<p>Land over $3,870,000 attracts NSW premium duty. This tool will not compute that figure. Confirm on Revenue NSW, or <a href="/book/">book a strategy session</a>.</p>';
      return;
    }

    if (r.duty.status === 'exempt') {
      card.hidden = false;
      body.innerHTML = '<p>First-home vacant land at or under $350,000: duty is $0 under FHBAS (if you qualify). Confirm on Revenue NSW before you exchange.</p>';
      return;
    }

    card.hidden = false;
    var extra = r.duty.amount === 0
      ? ''
      : '<p>Full NSW transfer duty on the land price only. Assumes you qualify for FHBAS if you said you are a first-home buyer. Confirm on Revenue NSW before you exchange.</p>';
    body.innerHTML = '<p>Duty used in this walk: <strong>' + fmt$(r.duty.amount) + '</strong>.</p>' + extra;
  }

  function renderWalk(r) {
    var card = document.getElementById('hlc-walk-card');
    var table = document.getElementById('hlc-walk');
    if (!card || !table) return;
    if (!r.invoices || !r.invoices.length) {
      card.hidden = true;
      return;
    }
    card.hidden = false;
    var tb = table.querySelector('tbody');
    tb.innerHTML = r.invoices.map(function (inv) {
      var when = inv.id === 'land' ? 'Land' : ('Month ' + inv.month);
      return '<tr>' +
        '<th scope="row">' + inv.label + '<span class="hlc-when">' + when + '</span></th>' +
        '<td>' + fmt$(inv.amount) + '</td>' +
        '<td>' + fmt$(inv.ownCheque) + '</td>' +
        '<td>' + fmt$(inv.fromLender) + '</td>' +
        '<td>' + fmt$(inv.drawnAfter) + '</td>' +
        '</tr>';
    }).join('');
  }

  function renderMonthly(r) {
    var card = document.getElementById('hlc-month-card');
    var table = document.getElementById('hlc-month');
    var note = document.getElementById('hlc-month-note');
    var total = document.getElementById('hlc-month-total');
    var pi = document.getElementById('hlc-pi');
    if (!card) return;

    if (!r.monthly) {
      card.hidden = true;
      pi.hidden = true;
      return;
    }

    card.hidden = false;
    if (r.monthly.skippedIO) {
      note.textContent = 'No interest rate typed, so interest-only is skipped. Rent until practical completion is still shown.';
    } else {
      note.textContent = 'Interest-only is the drawn balance times your rate, divided by 12. Rent runs until practical completion. Shown as cash while you wait.';
    }

    var tb = table.querySelector('tbody');
    tb.innerHTML = r.monthly.rows.map(function (row) {
      return '<tr>' +
        '<th scope="row">' + row.month + '</th>' +
        '<td>' + fmt$(row.drawn) + '</td>' +
        '<td>' + (r.monthly.skippedIO ? '—' : fmt$(row.io)) + '</td>' +
        '<td>' + fmt$(row.rent) + '</td>' +
        '<td>' + fmt$(row.cashOut) + '</td>' +
        '</tr>';
    }).join('');

    var bits = [];
    if (!r.monthly.skippedIO) bits.push('Interest-only while you wait: ' + fmt$(r.monthly.totalIO) + ' all up');
    if (r.monthly.totalRent > 0) bits.push('Rent until practical completion: ' + fmt$(r.monthly.totalRent));
    if (r.monthly.totalCashOut > 0) bits.push('Cash while you wait: ' + fmt$(r.monthly.totalCashOut));
    total.textContent = bits.join('. ') + (bits.length ? '.' : '');

    if (r.piEstimate != null) {
      pi.hidden = false;
      pi.innerHTML = 'After practical completion, a simple 30-year principal-and-interest estimate on the ' +
        fmt$(r.drawnAtPc) + ' drawn is <strong>' + fmt$(r.piEstimate) + '</strong> a month. Estimate only. No APRA 3% buffer.';
    } else {
      pi.hidden = true;
    }
  }

  function render() {
    paintStageSum();
    var r = H.calculate(inputs());
    var hero = document.getElementById('hlc-hero');
    var label = document.getElementById('hlc-hero-label');
    var note = document.getElementById('hlc-hero-note');
    var stats = document.getElementById('hlc-stats');
    var result = document.getElementById('hlc-result');

    if (!r.ok) {
      result.classList.remove('hlc-result--fail', 'hlc-result--ok');
      renderErrors(r.errors);
      document.getElementById('hlc-savings').textContent = '';
      return;
    }

    var statsHtml = [
      stat('Package (C)', fmt$(r.C), 'Land plus build'),
      stat('Loan (L)', fmt$(r.L), 'Floor of C × LVR'),
      stat('Equity (E)', fmt$(r.E), 'C minus L. Duty is extra'),
      stat(
        'First Home Owner Grant',
        fmt$(r.fhog.amount),
        r.fhog.note
      )
    ];
    if (r.duty.amount != null) {
      statsHtml.splice(3, 0, stat('Duty on land', fmt$(r.duty.amount), '2026/27 NSW transfer duty'));
      statsHtml.push(stat('Cash after duty', fmt$(r.cashAfter), r.buffer != null ? 'Buffer above E: ' + fmt$(r.buffer) : ''));
    }
    stats.innerHTML = statsHtml.join('');

    document.getElementById('hlc-savings').textContent =
      '5% of this package is ' + fmt$(r.genuineSavings) +
      '. Lenders usually want that already in Australia.';

    result.classList.remove('hlc-result--fail', 'hlc-result--ok');

    if (r.duty.status === 'confirm' || r.duty.status === 'out_of_range') {
      label.textContent = 'Duty not pinned down';
      hero.textContent = 'Confirm first';
      note.textContent = r.duty.status === 'confirm'
        ? 'Duty is concessional in this vacant-land band. Confirm the dollar on Revenue NSW, then come back.'
        : 'Premium duty is out of range for this tool.';
    } else if (r.cannotSettleLand) {
      result.classList.add('hlc-result--fail');
      label.textContent = 'Cannot settle the land';
      hero.textContent = fmt$(Math.abs(r.cashAfter));
      note.textContent = 'Cash after duty and other land-settlement cash is negative. You cannot settle the land on these numbers.';
    } else if (r.shortOfE != null) {
      result.classList.add('hlc-result--fail');
      label.textContent = 'Short of equity';
      hero.textContent = fmt$(r.shortOfE);
      note.textContent = 'After duty you have ' + fmt$(r.cashAfter) +
        ' left. Property equity is ' + fmt$(r.E) +
        '. That gap is the hole at this LVR. Hard stop: the walk does not start.';
    } else {
      result.classList.add('hlc-result--ok');
      label.textContent = 'Buffer after equity';
      hero.textContent = fmt$(r.buffer);
      note.textContent = 'Cash after duty covers the ' + fmt$(r.E) +
        ' equity. Extra above that sits as a buffer for later cheques.';
    }

    var flagItems = r.flags.map(function (f) {
      return '<li class="hlc-flag hlc-flag--' + f.tone + '">' + f.message + '</li>';
    });
    document.getElementById('hlc-flags').innerHTML = flagItems.join('');
    setHidden('hlc-flags-card', flagItems.length === 0);

    renderDuty(r);
    renderWalk(r);
    renderMonthly(r);
  }

  bindSeg('hlc-fhb');
  bindSeg('hlc-lvr');

  moneyIds.forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', render);
    el.addEventListener('blur', function () {
      formatMoneyField(el);
      render();
    });
  });

  ['hlc-rate', 'hlc-months', 'hlc-deposit'].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', function () {
      if (id === 'hlc-deposit') {
        var n = parseMoney(el);
        var depositStage = stageState.filter(function (st) { return st.id === 'deposit'; })[0];
        if (depositStage) depositStage.pct = n;
        var box = document.querySelector('[data-stage-pct="deposit"]');
        if (box) box.value = n;
      }
      render();
    });
  });

  document.getElementById('hlc-stages').addEventListener('input', function (e) {
    var pctId = e.target.getAttribute('data-stage-pct');
    var moId = e.target.getAttribute('data-stage-mo');
    if (pctId) {
      var st = stageState.filter(function (s) { return s.id === pctId; })[0];
      if (st) st.pct = parseFloat(String(e.target.value).replace(/[^0-9.]/g, '')) || 0;
      if (pctId === 'deposit') {
        document.getElementById('hlc-deposit').value = String(st.pct);
      }
    }
    if (moId) {
      var stm = stageState.filter(function (s) { return s.id === moId; })[0];
      var raw = String(e.target.value).replace(/[^0-9]/g, '');
      if (stm) stm.months = raw === '' ? null : parseInt(raw, 10);
    }
    render();
  });

  paintStages();
  render();
})();
