// Small shared helpers. Everything rendered into HTML must pass through esc().
export const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export class TimeoutError extends Error {
  constructor(ms) { super(`Timed out after ${ms} ms`); this.name = 'TimeoutError'; }
}

/** Reject with TimeoutError if `promise` does not settle within `ms`. */
export function withTimeout(promise, ms) {
  let id;
  return Promise.race([
    Promise.resolve(promise).finally(() => clearTimeout(id)),
    new Promise((_, reject) => { id = setTimeout(() => reject(new TimeoutError(ms)), ms); }),
  ]);
}

/** Resolve to `fallback` instead of rejecting when `promise` is too slow. Used for APIs that may never answer. */
export async function settleWithin(promise, ms, fallback) {
  try { return await withTimeout(promise, ms); } catch (e) { if (e instanceof TimeoutError) return fallback; throw e; }
}

/** Yield to the event loop so long runs never freeze the page. */
export const yieldToBrowser = () => (globalThis.scheduler?.yield ? globalThis.scheduler.yield() : new Promise((r) => setTimeout(r, 0)));

export const hasDOM = () => typeof document !== 'undefined' && typeof window !== 'undefined';

export const short = (v, n = 120) => { const s = typeof v === 'string' ? v : JSON.stringify(v); return s && s.length > n ? `${s.slice(0, n)}…` : s; };

export function formatValue(v) {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

export function download(filename, text, type = 'application/json') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function announce(message) {
  const live = document.getElementById('live-region');
  if (live) { live.textContent = ''; setTimeout(() => { live.textContent = message; }, 30); }
}
