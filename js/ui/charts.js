// Accessible SVG charts. Each chart has <title>/<desc>, visible value labels, and a text-table alternative.
import { esc } from '../core/util.js';
import { setTip } from './tooltip.js';

let uid = 0;

// Animate a chart only the first time it appears in a session, so live re-renders during a run do not replay motion.
const seen = new Set();
export const firstTime = (key) => (seen.has(key) ? false : (seen.add(key), true));

/**
 * Horizontal bar chart in HTML (labels stay readable on phones). rows: [{label, value, note?}].
 * Values are labelled numerically; colour is not the only channel. A data table is always available.
 */
export function barChart(rows, { title, desc, max, unit = '' }) {
  const anim = firstTime(`bar:${title}`);
  const m = max ?? Math.max(1, ...rows.map((r) => r.value));
  const body = rows.map((r, i) => `<div class="hbar-row"><span class="hbar-label">${esc(r.label)}</span>
      <span class="hbar-track"><span class="hbar-fill${anim ? ' grow' : ''}" style="--i:${i};width:${Math.max(0, (r.value / m) * 100)}%" title="${esc(r.label)}: ${esc(r.value)}${esc(unit)}"></span></span>
      <span class="hbar-val">${esc(r.value)}${esc(unit)}${r.note ? ` · ${esc(r.note)}` : ''}</span></div>`).join('');
  return `<figure class="mb-0"><div class="chart hbars" role="img" aria-label="${esc(title)}. ${esc(desc)}">${body}</div>
    <details class="chart-caption"><summary>Data table</summary><table class="table table-sm mb-0"><thead><tr><th>Item</th><th>Value</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${esc(r.label)}</td><td>${esc(r.value)}${esc(unit)}</td></tr>`).join('')}</tbody></table></details>
    <figcaption class="chart-caption">${esc(desc)}</figcaption></figure>`;
}

/**
 * Circular network graph. nodes: [{id,label,kind}], edges: [{from,to,cls,label}].
 * Edge styles (solid/dashed/dotted) encode evidence type, described in the legend and table.
 */
export function networkGraph(nodes, edges, { title, desc, size = 560, legend = '' }) {
  const id = `g${++uid}`;
  // Ellipse wider than tall, with side padding in the viewBox so end-anchored labels are never clipped.
  const pad = 180, c = size / 2, Ry = size / 2 - 30, Rx = size / 2 + 40;
  const pos = {};
  nodes.forEach((n, i) => { const a = (i / nodes.length) * Math.PI * 2 - Math.PI / 2; pos[n.id] = { x: c + Rx * Math.cos(a), y: c + Ry * Math.sin(a), a }; });
  const lines = edges.filter((e) => pos[e.from] && pos[e.to]).map((e) => `<line class="${esc(e.cls)}" x1="${pos[e.from].x}" y1="${pos[e.from].y}" x2="${pos[e.to].x}" y2="${pos[e.to].y}"><title>${esc(e.label || '')}</title></line>`).join('');
  const dots = nodes.map((n) => {
    const p = pos[n.id], right = Math.cos(p.a) >= 0;
    return `<g><circle class="node ${n.kind === 'entity' ? 'node-entity' : ''}" cx="${p.x}" cy="${p.y}" r="6"></circle>
      <text x="${p.x + (right ? 10 : -10)}" y="${p.y + 4}" text-anchor="${right ? 'start' : 'end'}" style="font-size:11px">${esc(n.label)}</text></g>`;
  }).join('');
  return `<figure class="mb-0"><svg class="chart w-100" viewBox="${-pad} 0 ${size + pad * 2} ${size}" role="img" aria-labelledby="${id}-t ${id}-d" style="max-width:${size + pad * 2}px">
    <title id="${id}-t">${esc(title)}</title><desc id="${id}-d">${esc(desc)}</desc>${lines}${dots}</svg>
    <div class="chart-caption">${legend}</div>
    <details class="chart-caption"><summary>Relationships as a table (${edges.length})</summary><table class="table table-sm mb-0"><thead><tr><th>From</th><th>To</th><th>Type</th></tr></thead><tbody>${edges.map((e) => `<tr><td>${esc(nodes.find((n) => n.id === e.from)?.label)}</td><td>${esc(nodes.find((n) => n.id === e.to)?.label)}</td><td>${esc(e.label)}</td></tr>`).join('')}</tbody></table></details>
    <figcaption class="chart-caption">${esc(desc)}</figcaption></figure>`;
}

/** Bipartite graph: left nodes (entities) to right nodes (techniques). */
export function bipartiteGraph(left, right, edges, { title, desc, legend = '' }) {
  const id = `b${++uid}`;
  const rowH = 22, H = Math.max(left.length, right.length) * rowH + 20, W = 760, lx = 210, rx = W - 230;
  const ly = (i) => 15 + i * ((H - 30) / Math.max(1, left.length - 1 || 1));
  const ry = (i) => 15 + i * ((H - 30) / Math.max(1, right.length - 1 || 1));
  const li = Object.fromEntries(left.map((n, i) => [n.id, i])), ri = Object.fromEntries(right.map((n, i) => [n.id, i]));
  const lines = edges.filter((e) => e.from in li && e.to in ri).map((e) => `<path class="${esc(e.cls)}" fill="none" d="M${lx},${ly(li[e.from])} C${(lx + rx) / 2},${ly(li[e.from])} ${(lx + rx) / 2},${ry(ri[e.to])} ${rx},${ry(ri[e.to])}"><title>${esc(e.label)}</title></path>`).join('');
  const lnodes = left.map((n, i) => `<circle class="node node-entity" cx="${lx}" cy="${ly(i)}" r="5"></circle><text x="${lx - 10}" y="${ly(i) + 4}" text-anchor="end" style="font-size:11px">${esc(n.label)}</text>`).join('');
  const rnodes = right.map((n, i) => `<circle class="node" cx="${rx}" cy="${ry(i)}" r="5"></circle><text x="${rx + 10}" y="${ry(i) + 4}" style="font-size:11px">${esc(n.label)}</text>`).join('');
  return `<figure class="mb-0"><svg class="chart w-100" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="${id}-t ${id}-d"><title id="${id}-t">${esc(title)}</title><desc id="${id}-d">${esc(desc)}</desc>${lines}${lnodes}${rnodes}</svg>
    <div class="chart-caption">${legend}</div><figcaption class="chart-caption">${esc(desc)}</figcaption></figure>`;
}

/** Status series, in validated order. Text labels always accompany the colour. */
export const STATUS_SEGMENTS = [
  { key: 'measured', label: 'Revealed', cls: 'seg-measured', statuses: ['measured'] },
  { key: 'inferred', label: 'Estimated', cls: 'seg-inferred', statuses: ['inferred'] },
  { key: 'blocked', label: 'Hidden by browser', cls: 'seg-blocked', statuses: ['blocked'] },
  { key: 'none', label: 'Not available or not run', cls: 'seg-none', statuses: ['unsupported', 'permission-required', 'interaction-required', 'error', 'skipped'] },
  { key: 'server', label: 'Only servers see this', cls: 'seg-server', statuses: ['server-only'] },
];
export const segmentOf = (status) => STATUS_SEGMENTS.find((s) => s.statuses.includes(status))?.key || 'none';

export const statusLegend = (segs = STATUS_SEGMENTS) => `<div class="legend">${segs.map((s) => `<span><span class="sw ${s.cls.replace('seg-', 'swatch-')}" style="background:var(--s-${s.key})"></span>${esc(s.label)}</span>`).join('')}</div>`;

/**
 * 100% stacked horizontal bars in HTML. rows: [{label, counts: {segKey: n}}].
 * 2px gaps between segments; counts in text at the row end; optional hover/focus box per segment; table alternative.
 */
export function stackedBars(rows, { title, desc, segs = STATUS_SEGMENTS, endLabel = null, tips = null }) {
  const id = `s${++uid}`, anim = firstTime(`stack:${title}`);
  const body = rows.map((r, i) => {
    const sum = segs.reduce((a, s) => a + (r.counts[s.key] || 0), 0);
    const parts = segs.map((s) => {
      const n = r.counts[s.key] || 0; if (!n) return '';
      const tipKey = tips ? `${id}:${i}:${s.key}` : null;
      if (tipKey) setTip(tipKey, tips(r, s, n, sum));
      const aria = `${esc(r.label)}: ${n} ${esc(s.label.toLowerCase())}`;
      return `<span class="seg ${s.cls}" style="flex:${n}" ${tipKey ? `data-tip="${tipKey}" tabindex="0" role="img" aria-label="${aria}"` : `title="${aria}"`}></span>`;
    }).join('');
    const tail = endLabel ? endLabel(r, sum) : `${(r.counts.measured || 0) + (r.counts.inferred || 0)}/${sum} readable`;
    return `<div class="hbar-row"><span class="hbar-label">${esc(r.label)}</span><span class="hbar-track stack${anim ? ' grow' : ''}" style="--i:${i}">${parts}</span><span class="hbar-val">${esc(tail)}</span></div>`;
  }).join('');
  return `<figure class="mb-0">${statusLegend(segs)}<div class="chart hbars" role="${tips ? 'group' : 'img'}" aria-label="${esc(title)}. ${esc(desc)}">${body}</div>
    <details class="chart-caption"><summary>Data table</summary><table class="table table-sm mb-0"><thead><tr><th>Row</th>${segs.map((s) => `<th>${esc(s.label)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr><td>${esc(r.label)}</td>${segs.map((s) => `<td>${r.counts[s.key] || 0}</td>`).join('')}</tr>`).join('')}</tbody></table></details>
    <figcaption class="chart-caption">${esc(desc)}</figcaption></figure>`;
}

/** Count matrix (heat table) with one-hue sequential fill; every cell shows its number. */
export function countMatrix(rowLabels, colLabels, values, { title, desc }) {
  const max = Math.max(1, ...values.flat());
  const cell = (v) => { const p = Math.round((v / max) * 100); return p > 55 ? `<td style="background:var(--s-measured);color:var(--on-accent)" title="${v}">${v}</td>` : `<td style="background:color-mix(in srgb, var(--s-measured) ${Math.round(p * 0.6)}%, var(--frost));color:var(--ink)" title="${v}">${v}</td>`; };
  return `<figure class="mb-0"><table class="matrix" aria-label="${esc(title)}"><thead><tr><th></th>${colLabels.map((c) => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead>
    <tbody>${rowLabels.map((r, i) => `<tr><th scope="row">${esc(r)}</th>${values[i].map(cell).join('')}</tr>`).join('')}</tbody></table>
    <figcaption class="chart-caption">${esc(desc)}</figcaption></figure>`;
}

/**
 * Fingerprint-ridge figure: one ridge per category, one segment per technique, coloured by result.
 * Ridges open at the bottom like a real fingerprint. New results "ink in" once (stroke-draw animation).
 */
const inked = new Set();
export function ridgeFigure(groups, { title, desc, tipFor = null, scanning = false }) {
  const id = `r${++uid}`, cx = 200, cy = 222;
  const start = 118, end = 422; // degrees, gap at the bottom
  const pt = (rx, ry, a, dy) => { const t = (a * Math.PI) / 180; return [cx + rx * Math.cos(t), cy + dy + ry * Math.sin(t)]; };
  const paths = groups.map((g, gi) => {
    const rx = 30 + gi * 13.5, ry = rx * 1.13, dy = -gi * 1.8, n = g.items.length || 1;
    const span = (end - start) / n, gap = Math.min(5, span * 0.3);
    return g.items.map((it, k) => {
      const a0 = start + k * span + gap / 2, a1 = start + (k + 1) * span - gap / 2;
      const [x0, y0] = pt(rx, ry, a0, dy), [x1, y1] = pt(rx, ry, a1, dy);
      const seg = it.status ? segmentOf(it.status) : 'pending';
      const key = `${it.id}:${seg}`, draw = seg !== 'pending' && !inked.has(key);
      if (draw) inked.add(key);
      if (tipFor) setTip(`ridge:${it.id}`, tipFor(it, g));
      return `<path class="${draw ? 'draw' : ''}" pathLength="1" style="stroke:var(--s-${seg});animation-delay:${draw ? (gi * 40 + k * 18) : 0}ms" d="M${x0.toFixed(1)} ${y0.toFixed(1)} A${rx} ${ry.toFixed(1)} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}" data-action="detail" data-id="${esc(it.id)}" ${tipFor ? `data-tip="ridge:${esc(it.id)}" tabindex="0" role="button" aria-label="${esc(it.name)}, ${esc(g.label)}"` : ''}>${tipFor ? '' : `<title>${esc(g.label)}: ${esc(it.name)}</title>`}</path>`;
    }).join('');
  }).join('');
  return `<figure class="ridge-wrap mb-0"><svg class="ridge w-100" viewBox="0 0 400 430" role="${tipFor ? 'group' : 'img'}" aria-labelledby="${id}-t ${id}-d" style="max-width:440px;cursor:pointer">
    <title id="${id}-t">${esc(title)}</title><desc id="${id}-d">${esc(desc)}</desc>
    <ellipse class="core" cx="${cx}" cy="${cy + 4}" rx="18" ry="22"></ellipse><path class="core-ridge" d="M${cx - 8} ${cy + 12} C ${cx - 10} ${cy - 6}, ${cx + 10} ${cy - 6}, ${cx + 8} ${cy + 12}"></path>${paths}
    ${scanning ? `<g class="scan" style="transform-origin:${cx}px ${cy}px;animation-delay:-${Math.round((globalThis.performance?.now() ?? 0) % 2200)}ms"><path d="M${cx} ${cy} L${cx} ${cy - 200} A200 200 0 0 1 ${cx + 120} ${cy - 160} Z"></path></g>` : ''}</svg></figure>`;
}
