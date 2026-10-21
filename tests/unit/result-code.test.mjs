// Result codes (encode/decode, safety limits, redaction), side-by-side comparison and interpretations.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeResultCode, decodeResultCode, buildPayload, CODE_PREFIX, validatePayload } from '../../js/analysis/result-code.js';
import { compareResults, classify, fieldDiffs, isDifference } from '../../js/analysis/side-by-side.js';
import { interpret } from '../../js/analysis/interpret.js';
import { buildResult } from '../../js/core/schema.js';
import { ALL_DEFINITIONS } from '../../js/tests/index.js';
import { defs as fxDefs, results as fxResults } from './fixtures.mjs';

const byId = Object.fromEntries(ALL_DEFINITIONS.map((d) => [d.id, d]));
const res = (id, outcome) => buildResult(byId[id], outcome, { started: Date.now(), duration: 1 });

test('full code round-trips with values; compact code carries digests only', async () => {
  const code = await encodeResultCode(fxResults, { includeValues: true });
  assert.ok(code.startsWith(CODE_PREFIX));
  assert.match(code, /^FPLAB1\.[A-Za-z0-9_-]+$/);
  const d = await decodeResultCode(code);
  assert.equal(d.ok, true, d.problems.join());
  assert.deepEqual(d.data.r['fx-a'][4], { a: 1, b: 2 });
  assert.equal(d.data.r['fx-srv'].length, 4, 'server-only results carry no value');
  const compact = await decodeResultCode(await encodeResultCode(fxResults, { includeValues: false }));
  assert.equal(compact.data.full, false);
  assert.ok(Object.values(compact.data.r).every((e) => e.length === 4));
  assert.ok(!JSON.stringify(compact.data).includes('value-b'));
});

test('codes never contain local IP addresses', async () => {
  const r = { 'webrtc-local': res('webrtc-local', { status: 'measured', raw: { candidates: 2, mdnsObfuscated: false, exposedAddresses: ['192.168.1.23', 'fe80::1'] } }) };
  const d = await decodeResultCode(await encodeResultCode(r, { includeValues: true }));
  assert.ok(!JSON.stringify(d.data).includes('192.168'));
  assert.equal(d.data.r['webrtc-local'][4].exposedAddresses, 2);
});

test('decoding rejects garbage, truncation, wrong prefix and hostile payloads', async () => {
  assert.equal((await decodeResultCode('')).ok, false);
  assert.equal((await decodeResultCode('hello world')).ok, false);
  assert.equal((await decodeResultCode('FPLAB1.!!!')).ok, false);
  const good = await encodeResultCode(fxResults);
  assert.equal((await decodeResultCode(good.slice(0, good.length / 2))).ok, false, 'truncated code');
  assert.equal((await decodeResultCode('FPLAB1.' + 'A'.repeat(1_600_000))).ok, false, 'oversized code');
  const plain = (obj) => 'FPLAB1U.' + Buffer.from(JSON.stringify(obj)).toString('base64url');
  assert.equal((await decodeResultCode(plain({ v: 1, r: { '<script>': ['measured', 'unknown', '1.0.0', null] } }))).ok, false);
  assert.equal((await decodeResultCode(plain({ v: 1, r: { ok: ['pwned', 'unknown', '1.0.0', null] } }))).ok, false);
  assert.equal((await decodeResultCode(plain({ v: 2, r: {} }))).ok, false);
  assert.deepEqual(validatePayload({ v: 1, r: { ok: ['measured', 'none-detected', '1.0.0', 'abcdef0123', { x: 1 }] } }), []);
});

test('decompression is size-limited (zip-bomb guard)', async () => {
  const bomb = Buffer.from(JSON.stringify({ v: 1, r: {}, pad: 'x'.repeat(6_000_000) }));
  const deflated = Buffer.from(await new Response(new Blob([bomb]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer());
  const d = await decodeResultCode('FPLAB1.' + deflated.toString('base64url'));
  assert.equal(d.ok, false);
  assert.match(d.problems[0], /too large/);
});

test('side-by-side: classification and field-level differences', async () => {
  const e = (s, d, v, p = 'none-detected') => (v === undefined ? [s, p, '1.0.0', d] : [s, p, '1.0.0', d, v]);
  assert.equal(classify(e('measured', 'aa'), e('measured', 'aa')), 'same');
  assert.equal(classify(e('measured', 'aa'), e('measured', 'bb')), 'changed');
  assert.equal(classify(e('measured', 'aa', 1, 'randomized'), e('measured', 'bb', 2)), 'randomized');
  assert.equal(classify(e('blocked', null), e('measured', 'aa')), 'newly-blocked');
  assert.equal(classify(e('measured', 'aa'), e('blocked', null)), 'newly-available');
  assert.equal(classify(e('measured', 'aa'), null), 'only-now');
  const f = fieldDiffs({ detected: ['Arial', 'Calibri'], candidates: 40 }, { detected: ['Arial', 'Menlo'], candidates: 40 });
  const det = f.find((x) => x.key === 'detected');
  assert.equal(det.differs, true); assert.deepEqual(det.onlyNow, ['Calibri']); assert.deepEqual(det.onlyThen, ['Menlo']);
  assert.equal(f.find((x) => x.key === 'candidates').differs, false);

  const now = await buildPayload(fxResults);
  const then = structuredClone(now); then.r['fx-b'][3] = 'ff'.repeat(10); then.r['fx-b'][4] = 'value-c';
  const cmp = compareResults(now, then, fxDefs);
  assert.equal(cmp.rows.find((r) => r.id === 'fx-b').kind, 'changed');
  assert.equal(cmp.rows.filter((r) => isDifference(r.kind)).length, 1);
  assert.equal(cmp.rows.find((r) => r.id === 'fx-c').volatile, true);
});

test('interpretations produce text for every status and never throw', () => {
  for (const d of ALL_DEFINITIONS) {
    for (const status of ['measured', 'blocked', 'unsupported', 'server-only', 'error']) {
      const text = interpret(d, buildResult(d, { status, raw: {} }, { started: Date.now(), duration: 0 }));
      assert.equal(typeof text, 'string'); assert.ok(text.length > 20, `${d.id}/${status}`);
    }
  }
  const fonts = interpret(byId.fonts, res('fonts', { status: 'measured', raw: { candidates: 40, detected: ['Arial', 'Calibri'] } }));
  assert.match(fonts, /2 appear to be installed/);
});
