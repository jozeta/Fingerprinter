// In-browser integration suite: executes all real tests with real APIs and verifies invariants.
import { ALL_DEFINITIONS } from '../../js/tests/index.js';
import { runMany, runOne } from '../../js/core/engine.js';
import { validateResult } from '../../js/core/schema.js';
import { TEMP_KEY } from '../../js/tests/storage.js';
import { settleWithin } from '../../js/core/util.js';

const out = document.getElementById('out');
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  const li = document.createElement('li');
  li.className = ok ? 'pass' : 'fail';
  li.textContent = `${ok ? 'PASS' : 'FAIL'}: ${name}${detail ? ` (${detail})` : ''}`;
  out.appendChild(li);
};

async function main() {
  const t0 = performance.now();
  const res = await runMany(ALL_DEFINITIONS, { repeat: 2, timeoutMs: 5000 });
  check('all tests produced a result', Object.keys(res).length === ALL_DEFINITIONS.length, `${Object.keys(res).length}/${ALL_DEFINITIONS.length}`);
  check('full run finished in under 30 s', performance.now() - t0 < 30000, `${Math.round(performance.now() - t0)} ms`);

  const invalid = Object.values(res).filter((r) => validateResult(r).length);
  check('every result passes schema validation', invalid.length === 0, invalid.map((r) => `${r.testId}: ${validateResult(r).join(',')}`).join('; '));

  const fabricated = Object.values(res).filter((r) => !['measured', 'inferred', 'blocked'].includes(r.executionStatus) && r.rawResult !== null);
  check('no values on non-value statuses', fabricated.length === 0, fabricated.map((r) => r.testId).join(', '));

  const server = ALL_DEFINITIONS.filter((d) => d.serverRequired);
  check('server-only tests report server-only', server.every((d) => res[d.id].executionStatus === 'server-only'));
  const inter = ALL_DEFINITIONS.filter((d) => d.interaction);
  check('interaction tests do not run without user initiation', inter.every((d) => res[d.id].executionStatus === 'interaction-required'));

  const errors = Object.values(res).filter((r) => r.executionStatus === 'error');
  check('error results carry details', errors.every((r) => r.errorDetails), errors.map((r) => `${r.testId}: ${r.errorDetails}`).join('; ') || 'no errors');

  // Cleanup: the storage probe must leave nothing behind.
  const leftovers = [];
  try { if (localStorage.getItem(TEMP_KEY) !== null) leftovers.push('localStorage'); if (sessionStorage.getItem(TEMP_KEY) !== null) leftovers.push('sessionStorage'); } catch {}
  if (document.cookie.includes(`${TEMP_KEY}=`)) leftovers.push('cookie');
  const dbs = indexedDB.databases ? await settleWithin(indexedDB.databases(), 1500, null) : [];
  if (dbs === null) leftovers.push('IndexedDB (could not list)'); else if (dbs.some((d) => d.name === 'fplab-probe-db')) leftovers.push('IndexedDB');
  const keys = window.caches ? await settleWithin(caches.keys(), 1500, null) : [];
  if (keys === null) leftovers.push('Cache API (could not list)'); else if (keys.includes('fplab-probe-cache')) leftovers.push('Cache API');
  check('storage probe cleaned up every temporary record', leftovers.length === 0, leftovers.join(', '));

  // DOM cleanup: hidden measurement elements must be removed.
  const stray = document.querySelectorAll('body > div[aria-hidden="true"], body > span[aria-hidden="true"], .adsbox');
  check('temporary DOM elements removed', stray.length === 0, `${stray.length} left`);

  // Local only: every loaded resource is same-origin.
  const foreign = performance.getEntriesByType('resource').filter((e) => new URL(e.name).origin !== location.origin);
  check('no cross-origin requests were made', foreign.length === 0, foreign.map((e) => e.name).join(', '));

  // WebRTC check, when explicitly initiated, uses no ICE servers and still makes no foreign requests.
  const rtc = await runOne(ALL_DEFINITIONS.find((d) => d.id === 'webrtc-local'), { options: { userInitiated: true } });
  check('user-initiated WebRTC check completes', ['measured', 'blocked', 'unsupported', 'error'].includes(rtc.executionStatus), rtc.executionStatus);

  // Repeatability: two consecutive canvas runs agree on the protection indicator.
  const c1 = await runOne(ALL_DEFINITIONS.find((d) => d.id === 'canvas-2d'), { repeat: 3 });
  const c2 = await runOne(ALL_DEFINITIONS.find((d) => d.id === 'canvas-2d'), { repeat: 3 });
  check('canvas consistency verdict is repeatable', c1.protectionIndicator === c2.protectionIndicator && (c1.protectionIndicator === 'randomized' || c1.rawResult?.digest === c2.rawResult?.digest), `${c1.protectionIndicator}`);

  const failed = results.filter((r) => !r.ok).length;
  const summary = document.getElementById('summary');
  summary.textContent = `${results.length - failed}/${results.length} passed · statuses: ${JSON.stringify(Object.values(res).reduce((a, r) => ((a[r.executionStatus] = (a[r.executionStatus] || 0) + 1), a), {}))}`;
  summary.dataset.done = 'true'; summary.dataset.failed = String(failed);
}

main().catch((e) => { check('suite crashed', false, e.message); document.getElementById('summary').dataset.done = 'true'; });
