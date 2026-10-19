// Verifies that every item in the required 65-test list is implemented, and that its constraints hold.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ALL_DEFINITIONS } from '../../js/tests/index.js';
import { runOne } from '../../js/core/engine.js';
import { COVERAGE } from './coverage-map.mjs';

const byId = Object.fromEntries(ALL_DEFINITIONS.map((d) => [d.id, d]));
const items = COVERAGE.flatMap(([, list]) => list);
const src = (f) => fs.readFileSync(new URL(`../../js/tests/${f}`, import.meta.url), 'utf8');
const body = (file, id) => { const s = src(file); const i = s.indexOf(`id: '${id}'`); return s.slice(i, s.indexOf('define({', i + 10) > 0 ? s.indexOf('define({', i + 10) : undefined); };

test('all 65 required tests are listed exactly once and map to registered techniques', () => {
  assert.deepEqual(items.map((i) => i[0]), Array.from({ length: 65 }, (_, k) => k + 1));
  for (const [n, name, ids] of items) for (const id of ids) assert.ok(byId[id], `#${n} ${name}: missing test "${id}"`);
});

test('#7 high-entropy Client Hints are an opt-in read', async () => {
  assert.equal(byId['client-hints-high'].interaction, true);
  assert.equal((await runOne(byId['client-hints-high'])).executionStatus, 'interaction-required');
  assert.doesNotMatch(body('browser.js', 'client-hints\''), /getHighEntropyValues\(/, 'low-entropy test must not read high-entropy values');
});

test('#38 battery is presence-only and #41 media devices never enumerates', () => {
  // Match actual method calls (".name("), not the explanatory text that mentions them.
  assert.doesNotMatch(body('hardware.js', 'battery'), /\.getBattery\(/);
  assert.doesNotMatch(body('media.js', 'media-devices'), /\.enumerateDevices\(/);
});

test('#36 WebRTC presence creates no peer connection; #60–65 server items never fabricate values', async () => {
  assert.doesNotMatch(body('apis.js', 'webrtc-presence'), /new RTCPeerConnection/);
  for (const id of ['srv-http-headers', 'srv-ip', 'srv-tls', 'srv-http2-http3', 'srv-tcp', 'srv-client-hint-headers', 'srv-cross-visit']) {
    const r = await runOne(byId[id]);
    assert.equal(r.executionStatus, 'server-only', id); assert.equal(r.rawResult, null, id);
  }
});
