// Side-by-side comparison of two result payloads (the current run and a pasted result code).
import { canonicalize } from '../core/hash.js';

const VALUE = new Set(['measured', 'inferred']);

export const KINDS = {
  same: 'Same', changed: 'Different', randomized: 'Randomised', 'newly-blocked': 'Now blocked', 'newly-available': 'Now readable',
  'status-changed': 'Result type changed', 'only-now': 'Only in this run', 'only-then': 'Only in pasted result', unknown: 'Cannot compare',
};
export const isDifference = (kind) => kind !== 'same';

/** Flatten a value into [key, value] pairs, one nesting level deep, keeping arrays whole. */
export function flatten(value, prefix = '', depth = 0) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return [[prefix || 'value', value]];
  const out = [];
  for (const k of Object.keys(value)) {
    const v = value[k], key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v) && depth < 1) out.push(...flatten(v, key, depth + 1));
    else out.push([key, v]);
  }
  return out;
}

const same = (a, b) => canonicalize(a) === canonicalize(b);
const asText = (v) => (Array.isArray(v) ? v.map((x) => (typeof x === 'object' ? JSON.stringify(x) : String(x))) : null);

/** Field-level differences for two values (null when a side has no value). */
export function fieldDiffs(a, b) {
  const fa = new Map(a === null || a === undefined ? [] : flatten(a)), fb = new Map(b === null || b === undefined ? [] : flatten(b));
  const keys = [...new Set([...fa.keys(), ...fb.keys()])];
  return keys.map((key) => {
    const va = fa.get(key), vb = fb.get(key), differs = !same(va ?? null, vb ?? null);
    const la = asText(va), lb = asText(vb);
    const added = la && lb ? lb.filter((x) => !la.includes(x)) : null;   // present in pasted only
    const removed = la && lb ? la.filter((x) => !lb.includes(x)) : null; // present now only
    return { key, now: va, then: vb, differs, onlyNow: removed, onlyThen: added };
  });
}

export function classify(now, then) {
  if (now && !then) return 'only-now';
  if (!now && then) return 'only-then';
  if (!now && !then) return 'unknown';
  const [sNow, pNow, vNow, dNow] = now, [sThen, pThen, vThen, dThen] = then;
  if (vNow.split('.')[0] !== vThen.split('.')[0]) return 'unknown';
  if (VALUE.has(sNow) && VALUE.has(sThen)) {
    if (dNow && dThen) {
      if (dNow === dThen) return 'same';
      return pNow === 'randomized' || pThen === 'randomized' ? 'randomized' : 'changed';
    }
    if (now.length > 4 && then.length > 4) return same(now[4], then[4]) ? 'same' : 'changed';
    return pNow === 'randomized' || pThen === 'randomized' ? 'randomized' : 'unknown';
  }
  if (VALUE.has(sThen) && sNow === 'blocked') return 'newly-blocked';
  if (sThen === 'blocked' && VALUE.has(sNow)) return 'newly-available';
  return sNow === sThen ? 'same' : 'status-changed';
}

/**
 * Compare two payloads. defs supplies names, categories and stability.
 * Returns { rows, counts } where each row has id, def, now, then, kind, fields.
 */
export function compareResults(nowPayload, thenPayload, defs) {
  const byId = Object.fromEntries(defs.map((d) => [d.id, d]));
  const ids = [...new Set([...Object.keys(nowPayload.r), ...Object.keys(thenPayload.r)])];
  const order = (id) => { const i = defs.findIndex((d) => d.id === id); return i < 0 ? 1e6 : i; };
  const rows = ids.sort((a, b) => order(a) - order(b)).map((id) => {
    const now = nowPayload.r[id] || null, then = thenPayload.r[id] || null;
    const kind = classify(now, then);
    return { id, def: byId[id] || null, now, then, kind, volatile: byId[id]?.stability === 'volatile', fields: fieldDiffs(now?.[4] ?? null, then?.[4] ?? null) };
  });
  const counts = Object.fromEntries(Object.keys(KINDS).map((k) => [k, 0]));
  rows.forEach((r) => { counts[r.kind]++; });
  return { rows, counts };
}
