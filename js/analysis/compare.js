// Compare two snapshots. A changed fingerprint does NOT automatically mean better privacy.
import { digest } from '../core/hash.js';

const VALUE = new Set(['measured', 'inferred']);
const INCONCLUSIVE = new Set(['error', 'skipped', 'interaction-required', 'permission-required']);

export const CLASSES = {
  added: 'Only in B', removed: 'Only in A', changed: 'Different', unchanged: 'Same', randomized: 'Scrambled on purpose',
  'newly-blocked': 'Now hidden', 'newly-available': 'Now revealed', inconclusive: 'Cannot compare',
};

/** Reduce a results map to a comparable snapshot entry per test (digests only, no raw data). */
export async function snapshotFromResults(results) {
  const entries = {};
  for (const [id, r] of Object.entries(results)) {
    entries[id] = {
      testId: id, testVersion: r.testVersion, status: r.executionStatus, protection: r.protectionIndicator,
      digest: VALUE.has(r.executionStatus) && r.normalizedResult !== null ? (await digest(r.normalizedResult)).hex : null,
    };
  }
  return entries;
}

export function classify(a, b) {
  if (!a && b) return 'added';
  if (a && !b) return 'removed';
  if (INCONCLUSIVE.has(a.status) || INCONCLUSIVE.has(b.status)) return 'inconclusive';
  if (a.testVersion && b.testVersion && a.testVersion.split('.')[0] !== b.testVersion.split('.')[0]) return 'inconclusive';
  if (a.protection === 'randomized' || b.protection === 'randomized') return 'randomized';
  const aVal = VALUE.has(a.status), bVal = VALUE.has(b.status);
  if (aVal && b.status === 'blocked') return 'newly-blocked';
  if (a.status === 'blocked' && bVal) return 'newly-available';
  if (aVal && bVal) {
    if (a.digest === null || b.digest === null) return 'inconclusive';
    return a.digest === b.digest ? 'unchanged' : 'changed';
  }
  return a.status === b.status ? 'unchanged' : 'changed';
}

/** entriesA/entriesB: snapshot entries maps. Returns rows + counts. */
export function compareSnapshots(entriesA, entriesB) {
  const ids = [...new Set([...Object.keys(entriesA), ...Object.keys(entriesB)])].sort();
  const rows = ids.map((id) => ({ testId: id, a: entriesA[id] || null, b: entriesB[id] || null, class: classify(entriesA[id], entriesB[id]) }));
  const counts = Object.fromEntries(Object.keys(CLASSES).map((k) => [k, 0]));
  rows.forEach((r) => { counts[r.class]++; });
  return { rows, counts };
}

/** Stability across N snapshots: per test, how many distinct digests were observed. */
export function stabilityAcross(snapshots) {
  const ids = [...new Set(snapshots.flatMap((s) => Object.keys(s)))];
  return ids.map((id) => {
    const ds = snapshots.map((s) => s[id]?.digest ?? null).filter((d) => d !== null);
    return { testId: id, observations: ds.length, distinct: new Set(ds).size };
  });
}
