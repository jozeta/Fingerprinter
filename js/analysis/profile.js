// Local fingerprint profile. A digest summarizes the selected measurements; it is NOT a measure of global uniqueness.
import { canonicalize, digest } from '../core/hash.js';

const VALUE_STATUSES = new Set(['measured', 'inferred']);

/** Why a result can or cannot enter the profile. Returns null when eligible. */
export function ineligibleReason(result) {
  if (!result) return 'not run';
  if (!VALUE_STATUSES.has(result.executionStatus)) return `status: ${result.executionStatus}`;
  if (result.normalizedResult === null || result.normalizedResult === undefined) return result.protectionIndicator === 'randomized' ? 'randomized output' : 'no normalized value';
  if (result.protectionIndicator === 'randomized') return 'randomized output';
  return null;
}

/** Default selection: eligible results whose definition opts in (stable/semi-stable, not volatile, not server-only). */
export function defaultSelection(defs, results) {
  return new Set(defs.filter((d) => d.includeByDefault && !ineligibleReason(results[d.id])).map((d) => d.id));
}

/**
 * Build the canonical profile for a selection.
 * Only normalizedResult values are used; timestamps, durations and raw data never enter the digest.
 */
export async function buildProfile(defs, results, selection) {
  const signals = {}, included = [], excluded = [];
  for (const d of defs) {
    const r = results[d.id];
    const reason = ineligibleReason(r);
    if (reason) { excluded.push({ testId: d.id, reason }); continue; }
    if (!selection.has(d.id)) { excluded.push({ testId: d.id, reason: 'excluded by you' }); continue; }
    signals[d.id] = r.normalizedResult;
    included.push(d.id);
  }
  const canonical = canonicalize(signals);
  const perSignal = {};
  for (const id of included) perSignal[id] = (await digest(signals[id])).hex;
  const total = await digest(canonical);
  return { included, excluded, canonical, canonicalBytes: canonical.length, perSignal, digest: total };
}

/** How the digest changes when each included signal is removed (demonstrates the avalanche property). */
export async function leaveOneOut(defs, results, selection) {
  const base = await buildProfile(defs, results, selection);
  const out = [];
  for (const id of base.included) {
    const s = new Set(selection); s.delete(id);
    out.push({ testId: id, digest: (await buildProfile(defs, results, s)).digest.hex });
  }
  return { base: base.digest.hex, variants: out };
}
