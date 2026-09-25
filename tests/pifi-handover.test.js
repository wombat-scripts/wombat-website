'use strict';

var fs = require('fs');
var path = require('path');
var test = require('node:test');
var assert = require('node:assert/strict');

var root = path.join(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

test('handover payload omits empty notes and pins the Strategy Session return url', async function () {
  var lib = await import('../netlify/functions/pifi-handover-lib.mjs');
  var result = lib.validateInput({
    email: 'sarah@example.com',
    address: '12 Example Street, Parramatta NSW 2150',
    journey: 'buy',
    context: '   ',
    returnUrl: 'https://evil.example/phish',
  });
  assert.equal(result.ok, true);
  assert.equal(result.body.context, undefined);
  assert.equal(result.body.reference, undefined);
  assert.equal(result.body.returnUrl, 'https://www.wombathomeloans.com.au/book/');
  assert.equal(result.body.email, 'sarah@example.com');
  assert.equal(result.body.journey, 'buy');
});

test('handover keeps notes when the customer wrote some', async function () {
  var lib = await import('../netlify/functions/pifi-handover-lib.mjs');
  var result = lib.validateInput({
    email: 'sarah@example.com',
    address: '12 Example Street, Parramatta NSW 2150',
    journey: 'price',
    context: 'First home buyer with a 20% deposit.',
  });
  assert.equal(result.ok, true);
  assert.equal(result.body.context, 'First home buyer with a 20% deposit.');
});

test('handover rejects a vague address and a bad email', async function () {
  var lib = await import('../netlify/functions/pifi-handover-lib.mjs');
  assert.equal(lib.validateInput({
    email: 'sarah@example.com',
    address: 'Sydney',
    journey: 'buy',
  }).ok, false);
  assert.equal(lib.validateInput({
    email: ' sarah@example.com',
    address: '12 Example Street, Parramatta NSW 2150',
    journey: 'buy',
  }).ok, false);
});

test('upstream errors map to friendly copy and the right retry rule', async function () {
  var lib = await import('../netlify/functions/pifi-handover-lib.mjs');
  assert.equal(lib.mapUpstream(401, { message: 'unauthorized' }).retryable, false);
  assert.equal(lib.mapUpstream(422, { error: 'unusable_address' }).status, 422);
  assert.match(lib.mapUpstream(422, { error: 'unusable_address' }).message, /couldn't match that address/);
  assert.equal(lib.mapUpstream(409, { error: 'cap_reached' }).retryable, false);
  assert.equal(lib.mapUpstream(400, { error: 'invalid_return_url' }).retryable, false);
  assert.equal(lib.mapUpstream(400, { message: ['journey'] }).retryable, false);
  assert.equal(lib.mapUpstream(500, { error: 'account_unavailable' }).retryable, true);
  assert.equal(lib.mapUpstream(500, { error: 'report_unavailable' }).retryable, true);
  assert.equal(lib.mapUpstream(500, { error: 'link_unavailable' }).retryable, false);
  assert.equal(lib.mapUpstream(500, { message: 'boom' }).retryable, true);
  assert.doesNotMatch(lib.mapUpstream(401, { message: 'secret-key-value' }).message, /secret-key/);
});

test('QA host guard refuses the live API host', async function () {
  var lib = await import('../netlify/functions/pifi-handover-lib.mjs');
  assert.equal(lib.assertQaHost('https://api.qa.pifiproperty.com/'), 'https://api.qa.pifiproperty.com');
  assert.throws(function () {
    lib.assertQaHost('https://api.pifiproperty.com');
  });
});

test('source does not embed a partner key or the live handover host', function () {
  var files = [
    'netlify/functions/pifi-handover.mjs',
    'netlify/functions/pifi-handover-lib.mjs',
    'src/property-iq.njk',
    'src/assets/js/property-iq.js',
    'src/index.njk',
    'src/_includes/footer.njk',
  ];
  files.forEach(function (rel) {
    var text = read(rel);
    assert.doesNotMatch(text, /https:\/\/api\.pifiproperty\.com/);
    assert.doesNotMatch(text, /PIFI_PARTNER_KEY\s*=\s*['"][^'"]+['"]/);
    assert.doesNotMatch(text, /Bearer [A-Za-z0-9_\-]{8,}/);
    assert.doesNotMatch(text, /\u2014/);
  });
  var page = read('src/property-iq.njk');
  assert.match(page, /id="piq-consent"/);
  assert.match(page, /value="buy"/);
  assert.match(page, /value="price"/);
  var client = read('src/assets/js/property-iq.js');
  assert.match(client, /35000/);
  assert.match(client, /location\.assign\(url\)/);
  assert.doesNotMatch(client, /umami\.track\([^)]*url/);
  var fn = read('netlify/functions/pifi-handover.mjs');
  assert.match(fn, /AbortSignal\.timeout\(TIMEOUT_MS\)/);
  assert.match(fn, /Authorization: `Bearer \$\{key\}`/);
});

test('handler returns the upstream url unchanged and retries one generic 500', async function () {
  var calls = [];
  var previous = globalThis.fetch;
  globalThis.fetch = async function (url, opts) {
    calls.push({ url: url, opts: opts });
    if (calls.length === 1) {
      return new Response(JSON.stringify({ message: 'boom' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({
      url: 'https://wombathl.pifiproperty.com/s/abc',
      referralId: 'do-not-return',
    }), {
      status: 201,
      headers: { 'content-type': 'application/json' },
    });
  };
  process.env.PIFI_API_HOST = 'https://api.qa.pifiproperty.com';
  process.env.PIFI_PARTNER_KEY = 'qa-test-key';
  var mod = await import('../netlify/functions/pifi-handover.mjs');
  var req = new Request('http://local/.netlify/functions/pifi-handover', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: 'sarah@example.com',
      address: '12 Example Street, Parramatta NSW 2150',
      journey: 'buy',
      context: '   ',
    }),
  });
  var res = await mod.default(req);
  var body = await res.json();
  var sent = JSON.parse(calls[0].opts.body);
  assert.equal(res.status, 201);
  assert.equal(body.url, 'https://wombathl.pifiproperty.com/s/abc');
  assert.equal(body.referralId, undefined);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, 'https://api.qa.pifiproperty.com/v1/partner/handover');
  assert.equal(calls[0].opts.headers.Authorization, 'Bearer qa-test-key');
  assert.equal(sent.context, undefined);
  assert.equal(sent.returnUrl, 'https://www.wombathomeloans.com.au/book/');
  assert.doesNotMatch(JSON.stringify(body), /qa-test-key/);
  globalThis.fetch = previous;
  delete process.env.PIFI_PARTNER_KEY;
  delete process.env.PIFI_API_HOST;
});

test('handler does not retry a 401 and refuses the live host', { concurrency: false }, async function () {
  var calls = 0;
  var previous = globalThis.fetch;
  globalThis.fetch = async function () {
    calls += 1;
    return new Response(JSON.stringify({ message: 'nope' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  };
  process.env.PIFI_API_HOST = 'https://api.qa.pifiproperty.com';
  process.env.PIFI_PARTNER_KEY = 'qa-test-key';
  var mod = await import('../netlify/functions/pifi-handover.mjs');
  var payload = JSON.stringify({
    email: 'sarah@example.com',
    address: '12 Example Street, Parramatta NSW 2150',
    journey: 'price',
  });
  var denied = await mod.default(new Request('http://local/', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: payload,
  }));
  var deniedBody = await denied.json();
  assert.equal(denied.status, 401);
  assert.equal(calls, 1);
  assert.equal(deniedBody.retryable, false);
  assert.doesNotMatch(deniedBody.message, /nope/);

  process.env.PIFI_API_HOST = 'https://api.pifiproperty.com';
  var blocked = await mod.default(new Request('http://local/', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: payload,
  }));
  assert.equal(blocked.status, 503);
  assert.equal(calls, 1);
  globalThis.fetch = previous;
  delete process.env.PIFI_PARTNER_KEY;
  delete process.env.PIFI_API_HOST;
});

test('calculators hub has a light Property IQ link and still seven calculators', function () {
  var calcs = read('src/calculators/index.njk');
  assert.match(calcs, /href="\/property-iq\/"/);
  assert.match(calcs, /Try Property IQ/);
  assert.match(calcs, /Free PropIQ report on any address/);
  assert.equal((calcs.match(/Open calculator →/g) || []).length, 7);
});
