// Shared rendering helpers. All dynamic text goes through esc().
import { esc, short } from '../core/util.js';
import { STATUSES, PROTECTION, EVIDENCE_LEVELS, CATEGORIES, RELEVANCE, RELATIONS } from '../core/constants.js';
import { icon } from './icons.js';

export const statusChip = (status) => {
  const s = STATUSES[status] || STATUSES.skipped;
  return `<span class="chip tone-${s.tone}" title="${esc(s.help)}"><i class="bi ${s.icon}" aria-hidden="true"></i>${esc(s.label)}</span>`;
};

// Lists show only informative indicators; the detail panel passes verbose=true to also show "none detected".
export const protectionChip = (p, verbose = false) => (!p || p === 'unknown' || (p === 'none-detected' && !verbose) ? '' : `<span class="chip chip-outline" title="${esc(PROTECTION[p]?.help)}"><i class="bi bi-shield" aria-hidden="true"></i>${esc(PROTECTION[p]?.label || p)}</span>`);

export const evidenceChip = (level) => `<span class="chip ev-${level}" title="${esc(EVIDENCE_LEVELS[level]?.help)}">${esc(EVIDENCE_LEVELS[level]?.short || `L${level}`)}</span>`;

export const relevanceChip = (r) => `<span class="chip chip-outline" title="Fingerprinting relevance (literature-based, not measured)">Relevance: ${esc(RELEVANCE[r] || r)}</span>`;

export const categoryLabel = (c) => `<span class="cat-label">${icon(c)} ${esc(CATEGORIES[c]?.label || c)}</span>`;

export const relationLabel = (r) => esc(RELATIONS[r] || r);

export const sourceLink = (sources, id) => {
  const s = sources[id];
  if (!s) return `<span class="text-danger">unknown source ${esc(id)}</span>`;
  return `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a> <span class="text-muted small">(${esc(s.type)}${s.dateChecked ? `, checked ${esc(s.dateChecked)}` : ', not re-verified'})</span>`;
};

/** Flatten an object one level into key/value rows for compact display. */
export function kvTable(obj) {
  if (obj === null || obj === undefined) return '<p class="text-muted mb-0">No value (nothing was measured).</p>';
  if (typeof obj !== 'object' || Array.isArray(obj)) return `<div class="raw-view mono">${esc(JSON.stringify(obj, null, 2))}</div>`;
  return `<table class="kv"><tbody>${Object.entries(obj).map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td class="mono">${esc(typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v))}</td></tr>`).join('')}</tbody></table>`;
}

export const rawView = (v) => `<pre class="raw-view mono" tabindex="0" aria-label="Raw result JSON">${esc(JSON.stringify(v, null, 2))}</pre>`;

/** One-line preview of a result for list rows. */
export function previewLine(r) {
  if (!r) return '';
  if (r.rawResult === null) return r.notes?.[0] ? `<span class="text-muted">${esc(r.notes[0])}</span>` : (r.errorDetails ? `<span class="text-muted">${esc(r.errorDetails)}</span>` : '');
  const v = r.rawResult;
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return `<code>${esc(short(Array.isArray(v) ? `${v.length} items` : v, 140))}</code>`;
  // Readable "label value" pairs instead of raw JSON: lists become counts, nested objects a short summary.
  const fmt = (x) => (Array.isArray(x) ? `${x.length} item${x.length === 1 ? '' : 's'}` : x && typeof x === 'object' ? `${Object.keys(x).length} values` : short(String(x), 48));
  return Object.entries(v).slice(0, 4).map(([k, x]) => `<span class="pv"><span class="pv-k">${esc(k.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase())}</span> <span class="pv-v">${esc(fmt(x))}</span></span>`).join('');
}

/** Replace a view's content with a fresh root element so listeners never accumulate across re-renders. */
export function mount(view, html) {
  const root = document.createElement('div');
  root.innerHTML = html;
  view.replaceChildren(root);
  return root;
}

export const emptyState =(msg, action = '') => `<div class="panel text-center py-4"><p class="mb-2 text-muted">${msg}</p>${action}</div>`;
