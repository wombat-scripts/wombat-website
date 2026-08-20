/* =============================================================================
   Wombat Home Loans — Which door can you actually walk?
   -----------------------------------------------------------------------------
   Client-side path finder for /which-door/. No backend. No email capture.
   General information, not a credit assessment.
   ============================================================================= */

(function (root) {
  'use strict';

  var HA_CAPS = 'https://www.housingaustralia.gov.au/support-buy-home/property-price-caps';
  var LMI_WAIVER = '/articles/lmi-waiver-bank-employees/';
  var SMALL_DEPOSIT = '/articles/high-income-small-deposit/';
  var KIWISAVER = '/articles/kiwisaver-australian-deposit/';
  var FIELDS = ['firstHome', 'location', 'price', 'cash', 'waiver'];

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

  function refreshReady() {
    var a = answers();
    var ok = complete(a);
    submitBtn.disabled = !ok;
    if (needAll) needAll.hidden = ok;
    paintSelected();
  }

  /* ── Door list helpers ─────────────────────────────────────────────────── */

  function door(name, status, note) {
    return { name: name, status: status, note: note || '' };
  }

  function doorsFor(primary, extras) {
    var order = [
      { key: 'standard', name: 'Standard 20% loan' },
      { key: 'waiver', name: '90% LMI waiver' },
      { key: 'scheme', name: 'Government 5% scheme' },
      { key: 'has', name: 'HAS SmartShare or OwnHome' }
    ];
    return order.map(function (d) {
      if (d.key === primary) return door(d.name, 'open', extras[d.key] || 'This is the one I would walk first.');
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
      headline: 'A standard 20% loan',
      paragraphs: [
        'You already have the deposit most people are still chasing. Skip the fancy products.',
        'A normal loan at 80% is the largest buffer and usually the cheapest structure.',
        'The government 5% scheme and an LMI waiver are doors you do not need. HAS and OwnHome cost more for a problem you do not have.',
        'Cash in: about 20% of the price, plus stamp duty and buying costs.',
        'The downside is time. You waited to save it. That is also the point.'
      ],
      doors: doorsFor('standard', {
        waiver: 'Not the lead. You already have 20%.',
        waiverStatus: 'closed',
        scheme: 'Not the lead. You already have 20%.',
        schemeStatus: 'closed',
        has: 'Shut on purpose. More cost for no gain.',
        hasStatus: 'closed'
      })
    };
  }

  function resultWaiver() {
    return {
      headline: 'A 90% LMI waiver',
      paragraphs: [
        'You have about 10% and a job that often gets LMI waived. One mortgage. No LMI if the lender’s list actually includes you.',
        'The government 5% scheme is a backup, not the lead, because you already have more cash. HAS and OwnHome are the expensive doors. Leave them shut.',
        'Cash in: about 10% of the price, plus stamp duty and buying costs.',
        'The downside is the list. If your job is not on that lender’s list, this door closes and we look at the next one.',
        'I wrote up the bank-staff version here: <a href="' + LMI_WAIVER + '">LMI waivers for bank employees</a>.'
      ],
      doors: doorsFor('waiver', {
        standard: 'Closed unless you already have 20%.',
        standardStatus: 'closed',
        scheme: 'Backup if the waiver list says no and you are a first-home buyer under the cap.',
        schemeStatus: 'backup',
        has: 'The expensive backup if the cheaper doors fail.',
        hasStatus: 'backup'
      })
    };
  }

  function resultScheme(kind) {
    var headline = 'The government 5% scheme';
    var why = 'You are a first-home buyer, you can get to 5%, and this price sits under the Housing Australia cap for that area. That is the first door I walk.';

    if (kind === 'sydney') {
      why = 'You are a first-home buyer, you can get to 5%, and a Sydney, Illawarra, Newcastle or Lake Macquarie price under $1.5 million sits under the published cap. That is the first door I walk.';
    } else if (kind === 'nsw') {
      why = 'You are a first-home buyer, you can get to 5%, and an other-NSW price under $800,000 sits under the published cap. That is the first door I walk.';
    } else if (kind === 'state') {
      headline = 'Probably the 5% scheme';
      why = 'You are a first-home buyer and you can get to 5%. In another state the scheme is only open if that postcode is under that state’s cap. I am not going to invent the cap. Check <a href="' + HA_CAPS + '" target="_blank" rel="noopener">Housing Australia</a>.';
    } else if (kind === 'check') {
      headline = 'The 5% scheme is the first door to check';
      why = 'You are a first-home buyer and you can get to 5%. I do not have a firm location or price yet, so I will not pretend the cap is fine.';
    }

    var paragraphs = [
      why,
      'A 90% waiver needs about 10% and the right job. A standard 20% loan is nicer if you have it. HAS and OwnHome wait until the cheaper doors are actually closed.',
      'Cash in: about 5% of the price (or the 10% you already have), plus stamp duty and buying costs. You still need to service the loan.',
      'The downside is the cap. Neighbouring streets can sit in different buckets. Confirm the postcode on <a href="' + HA_CAPS + '" target="_blank" rel="noopener">Housing Australia</a> before you fall in love with a suburb.'
    ];

    if (kind === 'check') {
      paragraphs = [
        why,
        'If the property is under the cap, this is usually the cheapest small-deposit path. If it is not, we fall through.',
        'A waiver needs about 10% and the right job. HAS and OwnHome wait until the cheaper doors are actually closed.',
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
        has: 'The expensive backup if the scheme fails on the postcode or servicing.',
        hasStatus: 'backup'
      })
    };
  }

  function resultHas(reason) {
    var why = 'The cheaper doors look closed. That is the only reason we are here.';

    if (reason === 'under3') {
      why = 'Under 3% is not enough for the 5% scheme or a 10% waiver. The cheaper doors are closed on cash.';
    } else if (reason === 'owned') {
      why = 'You have owned in Australia before, so the government 5% scheme is usually closed. You do not have 20%, and you do not have a 10% waiver lined up. That leaves the expensive doors.';
    } else if (reason === 'closed-cap') {
      why = 'The 5% scheme is likely closed on the cap. Other NSW sits at $800,000. $800,000 to $1.5 million is over that line. You do not have a 20% deposit or a 10% waiver, so we are looking at HAS or OwnHome.';
    } else if (reason === 'closed-price') {
      why = 'Over $1.5 million closes the 5% scheme on price. You do not have a 20% deposit or a 10% waiver. HAS or OwnHome is the remaining path.';
    } else if (reason === 'owned-no-waiver') {
      why = 'You have owned in Australia before, so the government 5% scheme is usually closed. About 10% without a job waiver does not open the clean 90% door. HAS or OwnHome is what is left.';
    }

    return {
      headline: 'HAS SmartShare or OwnHome',
      paragraphs: [
        why,
        'HAS is a second facility next to a normal first mortgage. OwnHome lends you the deposit as a second loan. Both are expensive. Both are real.',
        'Cash in: as little as about 2.5% for HAS, or even less for OwnHome, plus stamp duty and buying costs. Locked KiwiSaver is not cash a lender can see this year. I wrote that up here: <a href="' + KIWISAVER + '">Can you use KiwiSaver as an Australian house deposit?</a>',
        'The downside, especially with HAS: you do not share losses if the property falls. You still owe the second facility. OwnHome means two repayments from day one.',
        'The longer walk through both products is here: <a href="' + SMALL_DEPOSIT + '">High income, almost no deposit</a>.'
      ],
      doors: doorsFor('has', {
        standard: 'Closed unless you already have 20%.',
        standardStatus: 'closed',
        waiver: 'Closed unless you have about 10% and the job is on the list.',
        waiverStatus: 'closed',
        scheme: reason === 'owned' || reason === 'owned-no-waiver'
          ? 'Usually closed if you have owned in Australia before.'
          : (reason === 'closed-cap' || reason === 'closed-price'
            ? 'Closed on the price cap.'
            : 'Closed on cash, first-home status, or the cap.'),
        schemeStatus: 'closed'
      })
    };
  }

  function resultCheckWaiver() {
    return {
      headline: 'Check the LMI waiver first',
      paragraphs: [
        'You have about 10%. You have owned in Australia before, so the government 5% scheme is usually closed.',
        'If a lender will waive LMI for your job, that is the clean door. One mortgage. No LMI if the list actually includes you.',
        'If they will not, HAS or OwnHome is the backup. I will not pick the expensive door while the job question is still a blank.',
        'Cash in if the waiver works: about 10% of the price, plus stamp duty and buying costs.',
        'I wrote up the bank-staff version here: <a href="' + LMI_WAIVER + '">LMI waivers for bank employees</a>.'
      ],
      doors: [
        door('90% LMI waiver', 'check', 'First thing to confirm.'),
        door('HAS SmartShare or OwnHome', 'backup', 'Only if the waiver list says no.'),
        door('Government 5% scheme', 'closed', 'Usually closed if you have owned here before.'),
        door('Standard 20% loan', 'closed', 'You do not have 20% in play this year.')
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
        door('Standard 20% loan', 'check', 'Only if you already have 20%.'),
        door('90% LMI waiver', 'check', 'Needs about 10% and the right job.'),
        door('Government 5% scheme', 'check', 'Needs a first home, about 5%, and a postcode under the cap.'),
        door('HAS SmartShare or OwnHome', 'check', 'Only once the cheaper doors are actually closed.')
      ]
    };
  }

  /* ── Decision order ────────────────────────────────────────────────────── */

  function decide(a) {
    if (a.cash === 'about20') return resultStandard();
    if (a.cash === 'about10' && a.waiver === 'yes') return resultWaiver();
    if (a.cash === 'under3') return resultHas('under3');

    if (a.cash === 'unsure') return resultBlanks(a);

    var cashForScheme = a.cash === 'about5' || a.cash === 'about10';

    if (a.firstHome === 'unsure' && cashForScheme) return resultBlanks(a);

    if (a.firstHome === 'owned') {
      if (a.cash === 'about10' && a.waiver === 'unsure') return resultCheckWaiver();
      if (a.cash === 'about10' && a.waiver === 'no') return resultHas('owned-no-waiver');
      return resultHas('owned');
    }

    if (a.firstHome === 'yes' && cashForScheme) {
      var cap = schemeCap(a.location, a.price);
      if (cap === 'open-sydney') return resultScheme('sydney');
      if (cap === 'open-nsw') return resultScheme('nsw');
      if (cap === 'check-state') return resultScheme('state');
      if (cap === 'check') return resultScheme('check');
      if (cap === 'closed-cap') return resultHas('closed-cap');
      if (cap === 'closed-price') return resultHas('closed-price');
    }

    return resultHas('fallback');
  }

  root.WombatWhichDoor = { decide: decide, schemeCap: schemeCap };

  if (typeof document === 'undefined') return;
  var form = document.getElementById('wd-form');
  if (!form) return;

  var submitBtn = document.getElementById('wd-submit');
  var needAll = document.getElementById('wd-need-all');
  var empty = document.getElementById('wd-empty');
  var result = document.getElementById('wd-result');
  var headlineEl = document.getElementById('wd-headline');
  var copyEl = document.getElementById('wd-copy');
  var doorsEl = document.getElementById('wd-doors');
  var resetBtn = document.getElementById('wd-reset');
  var resultCard = document.getElementById('wd-result-card');

  /* ── Render ────────────────────────────────────────────────────────────── */

  function statusLabel(status) {
    if (status === 'open') return 'Walk this';
    if (status === 'backup') return 'Backup';
    if (status === 'check') return 'Check';
    return 'Closed';
  }

  function render(model) {
    headlineEl.textContent = model.headline;
    copyEl.innerHTML = model.paragraphs.map(function (p) {
      return '<p>' + p + '</p>';
    }).join('');

    doorsEl.innerHTML = model.doors.map(function (d) {
      return (
        '<div class="quiz-door quiz-door--' + d.status + '">' +
          '<span class="quiz-door__status">' + statusLabel(d.status) + '</span>' +
          '<span class="quiz-door__name">' + d.name + '</span>' +
          (d.note ? '<span class="quiz-door__note">' + d.note + '</span>' : '') +
        '</div>'
      );
    }).join('');

    empty.hidden = true;
    result.hidden = false;
  }

  function resetQuiz() {
    form.reset();
    empty.hidden = false;
    result.hidden = true;
    headlineEl.textContent = '';
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
