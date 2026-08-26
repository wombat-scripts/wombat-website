/* =============================================================================
   Wombat Home Loans. Which door is actually open?
   -----------------------------------------------------------------------------
   Client-side path finder for /which-door/. No backend. No email capture.
   General information, not a credit assessment.
   Door names are solution types, not product or lender brands.
   ============================================================================= */

(function (root) {
  'use strict';

  var HA_CAPS = 'https://www.housingaustralia.gov.au/support-buy-home/property-price-caps';
  var LMI_WAIVER = '/articles/lmi-waiver-bank-employees/';
  var SMALL_DEPOSIT = '/articles/high-income-small-deposit/';
  var KIWISAVER = '/articles/kiwisaver-australian-deposit/';
  var FIELDS = ['firstHome', 'location', 'price', 'cash', 'waiver'];

  var DOOR_NAME = {
    standard: 'Standard 20% deposit loan',
    waiver: 'Occupation LMI waiver at about 90%',
    scheme: 'Government 5% first-home scheme',
    shared: 'Shared-equity / second-mortgage deposit help',
    borrowed: 'Borrowed-deposit / deposit-boost second loan'
  };

  function answers() {
    var out = {};
    FIELDS.forEach(function (name) {
      var el = form.querySelector('input[name="' + name + '"]:checked');
      out[name] = el ? el.value : '';
    });
    return out;
  }

  function complete(a) {
    return FIELDS.every(function (k) { return a[k]; });
  }

  function paintSelected() {
    form.querySelectorAll('.quiz-option').forEach(function (label) {
      var input = label.querySelector('input');
      label.classList.toggle('is-selected', !!(input && input.checked));
    });
  }

  var DOOR_SVG = '<svg class="quiz-door-svg" viewBox="0 0 24 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 30V12.2A7 7 0 0 1 12 6a7 7 0 0 1 7 6.2V30"/><path d="M4 30h16"/><circle cx="15.3" cy="19" r="1.15" fill="currentColor" stroke="none"/></svg>';

  function paintProgress(a) {
    if (!progressEl) return;
    var done = 0;
    var markedNow = false;
    FIELDS.forEach(function (name) {
      var answered = !!a[name];
      if (answered) done += 1;
      var step = progressEl.querySelector('[data-step="' + name + '"]');
      if (!step) return;
      step.classList.toggle('is-done', answered);
      step.classList.toggle('is-now', !answered && !markedNow);
      if (!answered && !markedNow) markedNow = true;
    });
    progressEl.style.setProperty('--wd-done', String(done));
    if (progressBar) {
      progressBar.setAttribute('aria-valuenow', String(done));
    }
    if (progressCount) progressCount.textContent = String(done);
  }

  function refreshReady() {
    var a = answers();
    var ok = complete(a);
    submitBtn.disabled = !ok;
    if (needAll) needAll.hidden = ok;
    paintSelected();
    paintProgress(a);
  }

  /* ── Door list helpers ─────────────────────────────────────────────────── */

  function door(name, status, note) {
    return { name: name, status: status, note: note || '' };
  }

  function doorsFor(primary, extras) {
    var order = [
      { key: 'standard', name: DOOR_NAME.standard },
      { key: 'waiver', name: DOOR_NAME.waiver },
      { key: 'scheme', name: DOOR_NAME.scheme },
      { key: 'shared', name: DOOR_NAME.shared },
      { key: 'borrowed', name: DOOR_NAME.borrowed }
    ];
    return order.map(function (d) {
      if (d.key === primary) return door(d.name, 'open', extras[d.key] || 'This is the one I would open first.');
      return door(d.name, extras[d.key + 'Status'] || 'closed', extras[d.key] || '');
    });
  }

  /* ── Scheme cap for a known NSW location ───────────────────────────────── */

  function schemeCap(location, price) {
    if (price === 'over1500') return 'closed-price';
    if (location === 'other') return 'check-state';
    if (location === 'unsure' || price === 'unsure') return 'check';
    if (location === 'sydney' && (price === 'under800' || price === 'mid')) return 'open-sydney';
    if (location === 'nsw' && price === 'under800') return 'open-nsw';
    if (location === 'nsw' && price === 'mid') return 'closed-cap';
    return 'check';
  }

  /* ── Result builders ───────────────────────────────────────────────────── */

  function resultStandard() {
    return {
      headline: 'A standard 20% deposit loan',
      paragraphs: [
        'You already have the deposit most people are still chasing. Skip the fancy products.',
        'A normal loan at 80% is the largest buffer and usually the cheapest structure.',
        'The government 5% first-home scheme and an occupation LMI waiver are doors you do not need. Shared-equity and borrowed-deposit second loans cost more for a problem you do not have.',
        'Cash in: about 20% of the price, plus stamp duty and buying costs.',
        'The downside is time. You waited to save it. That is also the point.'
      ],
      doors: doorsFor('standard', {
        waiver: 'Not the lead. You already have 20%.',
        waiverStatus: 'closed',
        scheme: 'Not the lead. You already have 20%.',
        schemeStatus: 'closed',
        shared: 'Shut on purpose. More cost for no gain.',
        sharedStatus: 'closed',
        borrowed: 'Shut on purpose. More cost for no gain.',
        borrowedStatus: 'closed'
      })
    };
  }

  function resultWaiver() {
    return {
      headline: 'An occupation LMI waiver at about 90%',
      paragraphs: [
        'You have about 10% and a job that often gets LMI waived. One mortgage. No LMI if the lender’s list actually includes you.',
        'The government 5% first-home scheme is a backup, not the lead, because you already have more cash. Shared-equity and borrowed-deposit second loans are the expensive doors. Leave them shut.',
        'Cash in: about 10% of the price, plus stamp duty and buying costs.',
        'The downside is the list. If your job is not on that lender’s list, this door closes and we look at the next one.',
        'I wrote up the bank-staff version here: <a href="' + LMI_WAIVER + '">LMI waivers for bank employees</a>.'
      ],
      doors: doorsFor('waiver', {
        standard: 'Closed unless you already have 20%.',
        standardStatus: 'closed',
        scheme: 'Backup if the waiver list says no and you are a first-home buyer under the cap.',
        schemeStatus: 'backup',
        shared: 'The expensive backup if the cheaper doors fail.',
        sharedStatus: 'backup',
        borrowed: 'The other expensive backup if the cheaper doors fail.',
        borrowedStatus: 'backup'
      })
    };
  }

  function resultScheme(kind) {
    var headline = 'The government 5% first-home scheme';
    var why = 'You are a first-home buyer, you can get to 5%, and this price sits under the Housing Australia cap for that area. That is the first door I open.';

    if (kind === 'sydney') {
      why = 'You are a first-home buyer, you can get to 5%, and a Sydney, Illawarra, Newcastle or Lake Macquarie price under $1.5 million sits under the published cap. That is the first door I open.';
    } else if (kind === 'nsw') {
      why = 'You are a first-home buyer, you can get to 5%, and an other-NSW price under $800,000 sits under the published cap. That is the first door I open.';
    } else if (kind === 'state') {
      headline = 'Probably the 5% first-home scheme';
      why = 'You are a first-home buyer and you can get to 5%. In another state the scheme is only open if that postcode is under that state’s cap. I am not going to invent the cap. Check <a href="' + HA_CAPS + '" target="_blank" rel="noopener">Housing Australia</a>.';
    } else if (kind === 'check') {
      headline = 'The 5% first-home scheme is the first door to check';
      why = 'You are a first-home buyer and you can get to 5%. I do not have a firm location or price yet, so I will not pretend the cap is fine.';
    }

    var paragraphs = [
      why,
      'An occupation LMI waiver needs about 10% and the right job. A standard 20% deposit loan is nicer if you have it. Shared-equity and borrowed-deposit second loans wait until the cheaper doors are actually closed.',
      'Cash in: about 5% of the price (or the 10% you already have), plus stamp duty and buying costs. You still need to service the loan.',
      'The downside is the cap. Neighbouring streets can sit in different buckets. Confirm the postcode on <a href="' + HA_CAPS + '" target="_blank" rel="noopener">Housing Australia</a> before you fall in love with a suburb.'
    ];

    if (kind === 'check') {
      paragraphs = [
        why,
        'If the property is under the cap, this is usually the cheapest small-deposit path. If it is not, we fall through.',
        'A waiver needs about 10% and the right job. Shared-equity and borrowed-deposit second loans wait until the cheaper doors are actually closed.',
        'Bring a suburb and a price to the call and I will tell you if this door is open.'
      ];
    }

    return {
      headline: headline,
      paragraphs: paragraphs,
      doors: doorsFor('scheme', {
        standard: 'Closed unless you already have 20%.',
        standardStatus: 'closed',
        waiver: 'Backup if you have about 10% and the job is on the list.',
        waiverStatus: 'backup',
        shared: 'The expensive backup if the scheme fails on the postcode or servicing.',
        sharedStatus: 'backup',
        borrowed: 'The other expensive backup if the scheme fails on the postcode or servicing.',
        borrowedStatus: 'backup'
      })
    };
  }

  function resultExpensive(reason) {
    var why = 'The cheaper doors look closed. That is the only reason we are here.';

    if (reason === 'under3') {
      why = 'Under 3% is not enough for the 5% first-home scheme or a 10% waiver. The cheaper doors are closed on cash.';
    } else if (reason === 'owned') {
      why = 'You have owned in Australia before, so the government 5% first-home scheme is usually closed. You do not have 20%, and you do not have a 10% waiver lined up. That leaves the expensive doors.';
    } else if (reason === 'closed-cap') {
      why = 'The 5% first-home scheme is likely closed on the cap. Other NSW sits at $800,000. $800,000 to $1.5 million is over that line. You do not have a 20% deposit or a 10% waiver, so we are looking at shared-equity or a borrowed-deposit second loan.';
    } else if (reason === 'closed-price') {
      why = 'Over $1.5 million closes the 5% first-home scheme on price. You do not have a 20% deposit or a 10% waiver. Shared-equity or a borrowed-deposit second loan is the remaining path.';
    } else if (reason === 'owned-no-waiver') {
      why = 'You have owned in Australia before, so the government 5% first-home scheme is usually closed. About 10% without a job waiver does not open the clean 90% door. Shared-equity or a borrowed-deposit second loan is what is left.';
    }

    return {
      headline: 'Shared-equity / second-mortgage deposit help',
      paragraphs: [
        why,
        'Shared-equity help sits as a second mortgage next to a normal first loan. A borrowed-deposit second loan lends you the deposit. Both are expensive. Both are real.',
        'Cash in: as little as about 2.5% for shared-equity help, or even less if you borrow the deposit, plus stamp duty and buying costs. Locked KiwiSaver is not cash a lender can see this year. I wrote that up here: <a href="' + KIWISAVER + '">Can you use KiwiSaver as an Australian house deposit?</a>',
        'The downside with shared equity: you do not share losses if the property falls. You still owe the second facility. A borrowed deposit means two repayments from day one.',
        'The longer walk through both paths is here: <a href="' + SMALL_DEPOSIT + '">High income, almost no deposit</a>.'
      ],
      doors: doorsFor('shared', {
        standard: 'Closed unless you already have 20%.',
        standardStatus: 'closed',
        waiver: 'Closed unless you have about 10% and the job is on the list.',
        waiverStatus: 'closed',
        scheme: reason === 'owned' || reason === 'owned-no-waiver'
          ? 'Usually closed if you have owned in Australia before.'
          : (reason === 'closed-cap' || reason === 'closed-price'
            ? 'Closed on the price cap.'
            : 'Closed on cash, first-home status, or the cap.'),
        schemeStatus: 'closed',
        borrowed: 'The other expensive door. Same test: cheaper doors actually closed.',
        borrowedStatus: 'backup'
      })
    };
  }

  function resultCheckWaiver() {
    return {
      headline: 'Check the occupation LMI waiver first',
      paragraphs: [
        'You have about 10%. You have owned in Australia before, so the government 5% first-home scheme is usually closed.',
        'If a lender will waive LMI for your job, that is the clean door. One mortgage. No LMI if the list actually includes you.',
        'If they will not, shared-equity or a borrowed-deposit second loan is the backup. I will not pick the expensive door while the job question is still a blank.',
        'Cash in if the waiver works: about 10% of the price, plus stamp duty and buying costs.',
        'I wrote up the bank-staff version here: <a href="' + LMI_WAIVER + '">LMI waivers for bank employees</a>.'
      ],
      doors: [
        door(DOOR_NAME.waiver, 'check', 'First thing to confirm.'),
        door(DOOR_NAME.shared, 'backup', 'Only if the waiver list says no.'),
        door(DOOR_NAME.borrowed, 'backup', 'The other expensive backup if the waiver list says no.'),
        door(DOOR_NAME.scheme, 'closed', 'Usually closed if you have owned here before.'),
        door(DOOR_NAME.standard, 'closed', 'You do not have 20% in play this year.')
      ]
    };
  }

  function resultBlanks(a) {
    var extra = 'Book the thirty minutes and bring the real numbers. First-home status, a suburb, a price, and the cash you can actually use this year.';

    if (a.firstHome === 'unsure' && (a.cash === 'about5' || a.cash === 'about10')) {
      extra = 'If you are a first-home buyer and can get to 5%, the scheme is the first door to check. If you have owned here before, that door is usually closed. I will not pick one from a blank.';
    } else if (a.cash === 'unsure') {
      extra = 'Without a cash figure I cannot tell 20% from 5% from under 3%. That is the number that picks the door.';
    }

    return {
      headline: 'Too many blanks',
      paragraphs: [
        'I will not guess a door from a half-filled form.',
        extra,
        'I will tell you which door is open, including not yet.'
      ],
      doors: [
        door(DOOR_NAME.standard, 'check', 'Only if you already have 20%.'),
        door(DOOR_NAME.waiver, 'check', 'Needs about 10% and the right job.'),
        door(DOOR_NAME.scheme, 'check', 'Needs a first home, about 5%, and a postcode under the cap.'),
        door(DOOR_NAME.shared, 'check', 'Only once the cheaper doors are actually closed.'),
        door(DOOR_NAME.borrowed, 'check', 'Only once the cheaper doors are actually closed.')
      ]
    };
  }

  /* ── Decision order ────────────────────────────────────────────────────── */

  function decide(a) {
    if (a.cash === 'about20') return resultStandard();
    if (a.cash === 'about10' && a.waiver === 'yes') return resultWaiver();
    if (a.cash === 'under3') return resultExpensive('under3');

    if (a.cash === 'unsure') return resultBlanks(a);

    var cashForScheme = a.cash === 'about5' || a.cash === 'about10';

    if (a.firstHome === 'unsure' && cashForScheme) return resultBlanks(a);

    if (a.firstHome === 'owned') {
      if (a.cash === 'about10' && a.waiver === 'unsure') return resultCheckWaiver();
      if (a.cash === 'about10' && a.waiver === 'no') return resultExpensive('owned-no-waiver');
      return resultExpensive('owned');
    }

    if (a.firstHome === 'yes' && cashForScheme) {
      var cap = schemeCap(a.location, a.price);
      if (cap === 'open-sydney') return resultScheme('sydney');
      if (cap === 'open-nsw') return resultScheme('nsw');
      if (cap === 'check-state') return resultScheme('state');
      if (cap === 'check') return resultScheme('check');
      if (cap === 'closed-cap') return resultExpensive('closed-cap');
      if (cap === 'closed-price') return resultExpensive('closed-price');
    }

    return resultExpensive('fallback');
  }

  root.WombatWhichDoor = { decide: decide, schemeCap: schemeCap, DOOR_NAME: DOOR_NAME };

  if (typeof document === 'undefined') return;
  var form = document.getElementById('wd-form');
  if (!form) return;

  var submitBtn = document.getElementById('wd-submit');
  var needAll = document.getElementById('wd-need-all');
  var empty = document.getElementById('wd-empty');
  var result = document.getElementById('wd-result');
  var headlineEl = document.getElementById('wd-headline');
  var kickerEl = document.getElementById('wd-kicker');
  var copyEl = document.getElementById('wd-copy');
  var doorsEl = document.getElementById('wd-doors');
  var resetBtn = document.getElementById('wd-reset');
  var resultCard = document.getElementById('wd-result-card');
  var progressEl = document.getElementById('wd-progress');
  var progressBar = document.getElementById('wd-progress-bar');
  var progressCount = document.getElementById('wd-progress-count');

  /* ── Render ────────────────────────────────────────────────────────────── */

  function statusLabel(status) {
    if (status === 'open') return 'Open this';
    if (status === 'backup') return 'Backup';
    if (status === 'check') return 'Check';
    return 'Closed';
  }

  function stampKicker(doors) {
    if (doors.some(function (d) { return d.status === 'open'; })) return 'Open this';
    if (doors.some(function (d) { return d.status === 'check'; })) return 'Check first';
    return 'Not yet';
  }

  function render(model) {
    if (kickerEl) kickerEl.textContent = stampKicker(model.doors);
    headlineEl.textContent = model.headline;
    copyEl.innerHTML = model.paragraphs.map(function (p) {
      return '<p>' + p + '</p>';
    }).join('');

    doorsEl.innerHTML = model.doors.map(function (d) {
      return (
        '<div class="quiz-door quiz-door--' + d.status + '">' +
          '<span class="quiz-door__icon">' + DOOR_SVG + '</span>' +
          '<span class="quiz-door__status">' + statusLabel(d.status) + '</span>' +
          '<span class="quiz-door__name">' + d.name + '</span>' +
          (d.note ? '<span class="quiz-door__note">' + d.note + '</span>' : '') +
        '</div>'
      );
    }).join('');

    empty.hidden = true;
    result.hidden = false;
    result.classList.remove('is-in');
    void result.offsetWidth;
    result.classList.add('is-in');
  }

  function resetQuiz() {
    form.reset();
    empty.hidden = false;
    result.hidden = true;
    result.classList.remove('is-in');
    headlineEl.textContent = '';
    if (kickerEl) kickerEl.textContent = 'Open this';
    copyEl.innerHTML = '';
    doorsEl.innerHTML = '';
    refreshReady();
    form.querySelector('input').focus();
  }

  form.addEventListener('change', refreshReady);
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var a = answers();
    if (!complete(a)) return;
    render(decide(a));
    if (resultCard && window.matchMedia('(max-width: 900px)').matches) {
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      resultCard.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }
  });
  if (resetBtn) resetBtn.addEventListener('click', resetQuiz);

  refreshReady();
})(typeof window !== 'undefined' ? window : global);
