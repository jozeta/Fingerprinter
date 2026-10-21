// Result codes UI: copy the current result as a text code, paste an older code, compare side by side.
import { esc, copyText, download, announce } from '../core/util.js';
import { CATEGORIES } from '../core/constants.js';
import { encodeResultCode, decodeResultCode, buildPayload } from '../analysis/result-code.js';
import { compareResults, KINDS, isDifference } from '../analysis/side-by-side.js';
import { statusChip } from './components.js';

const state = { code: '', full: true, pasted: null, pastedText: '', onlyDiff: true, hideVolatile: true, q: '', cat: '' };

const fmtVal = (v) => (v === null || v === undefined ? '—' : Array.isArray(v) ? `${v.length} item${v.length === 1 ? '' : 's'}` : typeof v === 'object' ? JSON.stringify(v) : String(v));
const kindClass = (k) => (k === 'same' ? 'kind-same' : k === 'newly-blocked' ? 'kind-blocked' : 'kind-diff');

function valueCell(entry, fields, side) {
  if (!entry) return '<span class="text-muted">Not in this result</span>';
  const head = statusChip(entry[0]);
  if (entry.length < 5) return `${head}<div class="small text-muted mt-1">${entry[3] ? `Fingerprint ${esc(entry[3].slice(0, 12))}… (values not included in a compact code)` : ''}</div>`;
  const rows = fields.map((f) => {
    const v = side === 'now' ? f.now : f.then;
    const only = side === 'now' ? f.onlyNow : f.onlyThen;
    const extra = f.differs && only && only.length ? `<span class="${side === 'now' ? 'minus' : 'plus'}"> ${side === 'now' ? 'only here' : 'only there'}: ${esc(only.slice(0, 6).join(', '))}${only.length > 6 ? ` +${only.length - 6}` : ''}</span>` : '';
    return `<span class="fld ${f.differs ? 'diff' : ''}"><span class="k">${esc(f.key)}</span> <span class="v">${esc(fmtVal(v).slice(0, 160))}</span>${extra}</span>`;
  }).join('');
  return `${head}<div class="mt-1">${rows}</div>`;
}

function table(app, cmp) {
  const rows = cmp.rows.filter((r) => (!state.onlyDiff || isDifference(r.kind)) && (!state.hideVolatile || !r.volatile)
    && (!state.cat || r.def?.category === state.cat) && (!state.q || `${r.id} ${r.def?.name || ''}`.toLowerCase().includes(state.q.toLowerCase())));
  const body = rows.map((r) => {
    const showFields = r.fields.filter((f) => !state.onlyDiff || f.differs || r.fields.length <= 4);
    return `<tr class="${isDifference(r.kind) ? 'is-diff' : ''}">
      <td><a href="#" data-action="detail" data-id="${esc(r.id)}"><strong>${esc(r.def?.name || r.id)}</strong></a><div class="small text-muted">${esc(CATEGORIES[r.def?.category]?.label || '')}${r.volatile ? ' · changes by itself' : ''}</div></td>
      <td>${valueCell(r.now, showFields, 'now')}</td>
      <td>${valueCell(r.then, showFields, 'then')}</td>
      <td><span class="kind ${kindClass(r.kind)}">${esc(KINDS[r.kind])}</span>${isDifference(r.kind) && r.fields.some((f) => f.differs) ? `<div class="small text-muted mt-1">${r.fields.filter((f) => f.differs).length} field(s) differ</div>` : ''}</td></tr>`;
  }).join('');
  return rows.length ? `<div class="sbs-wrap"><table class="sbs"><thead><tr><th style="width:22%">Check</th><th>This run</th><th>Pasted result</th><th style="width:12%">Difference</th></tr></thead><tbody>${body}</tbody></table></div>`
    : `<p class="text-muted">${state.onlyDiff ? 'No differences with these filters. Turn off "Only differences" to see everything.' : 'No checks match these filters.'}</p>`;
}

export function codeSectionHTML(app) {
  const ran = Object.keys(app.results).length > 0;
  const p = state.pasted;
  return `
  <section class="panel mb-4" aria-labelledby="rc-h">
    <h2 class="h5" id="rc-h">Save this result as a code</h2>
    <p class="small text-muted">A result code is one line of text that contains this whole test result. Keep it, then later paste it here to compare: after changing settings, or on another computer or browser.</p>
    ${ran ? `<div class="d-flex flex-wrap gap-2 mb-2">
        <button class="btn btn-primary btn-sm" data-code="full">Copy full result code</button>
        <button class="btn btn-outline-secondary btn-sm" data-code="compact">Copy compact code</button>
        ${state.code ? '<button class="btn btn-outline-secondary btn-sm" data-code="download">Download as .txt</button>' : ''}
      </div>
      <p class="small text-muted mb-2"><strong>Full</strong> includes your actual values (screen, graphics chip, fonts, languages, time zone…) so the comparison can show them side by side. Anyone you share it with can read them. <strong>Compact</strong> contains only fingerprints of the values: it shows <em>whether</em> something changed, not what. Local IP addresses are never included.</p>
      ${state.code ? `<label class="visually-hidden" for="rc-out">Your result code</label><textarea id="rc-out" class="form-control code-box" rows="3" readonly>${esc(state.code)}</textarea>
        <div class="small text-muted mt-1" role="status" id="rc-status">${state.full ? 'Full' : 'Compact'} code, ${state.code.length.toLocaleString()} characters.</div>` : '<div class="small" role="status" id="rc-status"></div>'}`
      : '<p class="mb-0"><button class="btn btn-primary btn-sm" data-action="run">Run the checks</button> <span class="small text-muted">to create a result code.</span></p>'}
  </section>

  <section class="panel mb-4" aria-labelledby="pc-h">
    <h2 class="h5" id="pc-h">Compare with an earlier result</h2>
    <p class="small text-muted">Paste a result code you saved before. It is read as plain data on this page and never sent anywhere.</p>
    <label class="visually-hidden" for="rc-in">Paste a result code</label>
    <textarea id="rc-in" class="form-control code-box mb-2" rows="3" placeholder="FPLAB1.…">${esc(state.pastedText)}</textarea>
    <div class="d-flex flex-wrap gap-2 align-items-center">
      <button class="btn btn-primary btn-sm" data-code="compare" ${ran ? '' : 'disabled'}>Compare with this run</button>
      ${p ? '<button class="btn btn-link btn-sm" data-code="clear">Clear</button>' : ''}
      ${ran ? '' : '<span class="small text-muted">Run the checks first, then compare.</span>'}
    </div>
    <div id="pc-msg" class="small mt-2" role="status"></div>
    ${p && ran ? '<div id="sbs-root" class="mt-3"></div>' : ''}
  </section>`;
}

async function renderComparison(root, app) {
  const host = root.querySelector('#sbs-root'); if (!host || !state.pasted) return;
  const now = await buildPayload(app.results, { includeValues: true });
  const cmp = compareResults(now, state.pasted, app.defs);
  const considered = cmp.rows.filter((r) => !(state.hideVolatile && r.volatile));
  const hiddenVolatile = cmp.rows.length - considered.length;
  const visibleCounts = considered.reduce((a, r) => ((a[r.kind] = (a[r.kind] || 0) + 1), a), {});
  const diffs = considered.filter((r) => isDifference(r.kind)).length;
  const meta = state.pasted;
  host.innerHTML = `
    <div class="d-flex flex-wrap gap-3 align-items-baseline mb-2">
      <div class="fs-4 fw-bold">${diffs} difference${diffs === 1 ? '' : 's'}</div>
      <div class="small text-muted">Pasted result from ${esc(new Date(meta.at).toLocaleString())}${meta.ua ? `, ${esc(meta.ua.slice(0, 90))}${meta.ua.length > 90 ? '…' : ''}` : ''}${meta.full ? '' : ' (compact code: values not included)'}</div>
    </div>
    <div class="d-flex flex-wrap gap-2 mb-3">${Object.entries(visibleCounts).filter(([, n]) => n).map(([k, n]) => `<span class="kind ${kindClass(k)}">${esc(KINDS[k])}: ${n}</span>`).join('')}${state.hideVolatile && hiddenVolatile ? `<span class="small text-muted">${hiddenVolatile} self-changing check(s) hidden</span>` : ''}</div>
    <div class="toolbar mb-2">
      <div class="form-check form-switch me-2"><input class="form-check-input" type="checkbox" role="switch" id="sbs-diff" ${state.onlyDiff ? 'checked' : ''}><label class="form-check-label small" for="sbs-diff">Only differences</label></div>
      <div class="form-check form-switch me-2"><input class="form-check-input" type="checkbox" role="switch" id="sbs-vol" ${state.hideVolatile ? 'checked' : ''}><label class="form-check-label small" for="sbs-vol">Hide checks that change by themselves (window size, timing, battery)</label></div>
      <input class="form-control form-control-sm" style="max-width:220px" id="sbs-q" placeholder="Search checks" value="${esc(state.q)}" aria-label="Search checks">
      <select class="form-select form-select-sm" style="width:auto" id="sbs-cat" aria-label="Category"><option value="">All categories</option>${Object.entries(CATEGORIES).map(([k, c]) => `<option value="${k}" ${state.cat === k ? 'selected' : ''}>${esc(c.label)}</option>`).join('')}</select>
    </div>
    <div id="sbs-table">${table(app, cmp)}</div>
    <p class="small text-muted mt-2 mb-0">Highlighted rows differ; highlighted fields show exactly which values changed. "Randomised" means a browser protection changes the value on purpose. A difference does not automatically mean better privacy.</p>`;
  const redraw = () => { host.querySelector('#sbs-table').innerHTML = table(app, cmp); };
  host.querySelector('#sbs-diff').addEventListener('change', (e) => { state.onlyDiff = e.target.checked; redraw(); });
  host.querySelector('#sbs-vol').addEventListener('change', (e) => { state.hideVolatile = e.target.checked; renderComparison(root, app); });
  host.querySelector('#sbs-q').addEventListener('input', (e) => { state.q = e.target.value; redraw(); });
  host.querySelector('#sbs-cat').addEventListener('change', (e) => { state.cat = e.target.value; redraw(); });
}

/** Wire up events. rerender() re-renders the whole Compare view. */
export function bindCodeSection(root, app, rerender) {
  const status = (msg) => { const el = root.querySelector('#rc-status'); if (el) el.textContent = msg; announce(msg); };
  root.querySelectorAll('[data-code]').forEach((b) => b.addEventListener('click', async () => {
    const what = b.dataset.code;
    if (what === 'full' || what === 'compact') {
      b.disabled = true;
      state.full = what === 'full';
      state.code = await encodeResultCode(app.results, { includeValues: state.full });
      const ok = await copyText(state.code);
      rerender();
      status(ok ? `Copied the ${state.full ? 'full' : 'compact'} result code (${state.code.length.toLocaleString()} characters). Paste it somewhere safe.` : 'Could not copy automatically. Select the code below and copy it.');
    }
    if (what === 'download') download(`fingerprint-result-${new Date().toISOString().slice(0, 10)}.txt`, state.code, 'text/plain');
    if (what === 'clear') { state.pasted = null; state.pastedText = ''; rerender(); }
    if (what === 'compare') {
      const text = root.querySelector('#rc-in').value;
      const res = await decodeResultCode(text);
      const msg = root.querySelector('#pc-msg');
      if (!res.ok) { msg.innerHTML = `<span class="text-danger">${esc(res.problems[0])}</span>${res.problems.length > 1 ? ` <span class="text-muted">(${res.problems.length - 1} more problem(s))</span>` : ''}`; return; }
      state.pasted = res.data; state.pastedText = text.trim();
      rerender();
      announce('Comparison ready.');
    }
  }));
  root.querySelector('#rc-out')?.addEventListener('focus', (e) => e.target.select());
  renderComparison(root, app);
}

/** Copy a full code directly (used by the Overview "save" button). */
export async function copyFullCode(app) {
  state.full = true; state.code = await encodeResultCode(app.results, { includeValues: true });
  return { ok: await copyText(state.code), length: state.code.length };
}

