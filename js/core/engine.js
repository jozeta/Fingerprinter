// Execution engine: sequential, cancellable, time-bounded, yields between tests.
import { buildResult } from './schema.js';
import { withTimeout, yieldToBrowser, TimeoutError } from './util.js';

export const DEFAULT_TIMEOUT_MS = 5000;

const now = () => (globalThis.performance?.now ? performance.now() : Date.now());

/**
 * Run one test definition. Never throws: exceptions and timeouts become status "error".
 * ctx gives tests: signal (AbortSignal), repeat (count for consistency checks), results (earlier results, for dependsOn).
 */
export async function runOne(def, { signal, timeoutMs = DEFAULT_TIMEOUT_MS, repeat = 3, results = {}, associationsFor = () => [], options = {} } = {}) {
  const started = Date.now();
  const t0 = now();
  let outcome;
  if (signal?.aborted) {
    outcome = { status: 'skipped', notes: ['Run was cancelled before this test started.'] };
  } else {
    try {
      outcome = await withTimeout(Promise.resolve().then(() => def.run({ signal, repeat, results, options })), timeoutMs);
      if (!outcome || typeof outcome !== 'object') outcome = { status: 'error', error: 'Test returned no outcome' };
    } catch (e) {
      outcome = e instanceof TimeoutError
        ? { status: 'error', error: `Timed out after ${timeoutMs} ms. The API did not answer (blocked, throttled or hung).` }
        : { status: 'error', error: `${e?.name || 'Error'}: ${e?.message || e}` };
    }
  }
  return buildResult(def, outcome, { started, duration: now() - t0 }, associationsFor(def.id));
}

/**
 * Run many tests in order. Dependencies (dependsOn) are sorted to run after their prerequisites.
 * onResult(result, index, total) fires after each test so the UI can update progressively.
 */
export async function runMany(defs, { signal, onResult, ...opts } = {}) {
  const ordered = orderByDependencies(defs);
  const results = { ...(opts.results || {}) };
  for (let i = 0; i < ordered.length; i++) {
    const r = await runOne(ordered[i], { ...opts, signal, results });
    results[r.testId] = r;
    onResult?.(r, i, ordered.length);
    await yieldToBrowser();
  }
  return results;
}

export function orderByDependencies(defs) {
  const ids = new Set(defs.map((d) => d.id));
  const done = new Set(), out = [];
  const visit = (d, stack = new Set()) => {
    if (done.has(d.id)) return;
    if (stack.has(d.id)) throw new Error(`Dependency cycle at ${d.id}`);
    stack.add(d.id);
    for (const dep of d.dependsOn || []) { const dd = defs.find((x) => x.id === dep); if (dd && ids.has(dep)) visit(dd, stack); }
    done.add(d.id); out.push(d);
  };
  defs.forEach((d) => visit(d));
  return out;
}
