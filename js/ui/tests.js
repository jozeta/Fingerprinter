// Fingerprint Tests: searchable catalogue with composable filters and sorting. Filter form persists across result updates.
import { esc } from '../core/util.js';
import { CATEGORIES, STATUSES, PURPOSES, DATA_TYPES, RELEVANCE, EVIDENCE_LEVELS } from '../core/constants.js';
import { filterAndSort, emptyFilter, bestEvidence } from '../analysis/filters.js';
import { statusChip, protectionChip, evidenceChip, categoryLabel, previewLine, mount } from './components.js';
import { icon } from './icons.js';
import { stackedBars, segmentOf } from './charts.js';

const lastStatus = {};

const opt = (v, label, cur) => `<option value="${esc(v)}" ${String(cur) === String(v) ? 'selected' : ''}>${esc(label)}</option>`;

function activeCount(f) {
  return ['tier', 'relevance', 'dataType', 'entity', 'adversary', 'purpose', 'maxEvidence', 'availability', 'api'].filter((k) => f[k]).length + (f.statuses.length ? 1 : 0);
}

function filterForm(app) {
  const f = app.filter;
  const adversaries = [...new Set(app.catalogue.entities.map((e) => e.adversaryCategory).filter(Boolean))];
  const orgs = app.catalogue.entities.filter((e) => !e.adversaryCategory);
  const n = activeCount(f);
  const sel = (id, label, inner) => `<div class="col-6 col-md-4 col-xl-3"><label class="form-label small mb-1" for="f-${id}">${label}</label><select id="f-${id}" name="${id}" class="form-select form-select-sm">${inner}</select></div>`;
  return `
  <form id="filters" role="search" aria-label="Filter checks">
    <div class="toolbar">
      <div class="search">${icon('search')}<label class="visually-hidden" for="f-q">Search</label><input id="f-q" name="q" class="form-control form-control-sm" value="${esc(f.q)}" placeholder="Search checks, e.g. GPU, fonts, timezone"></div>
      <label class="visually-hidden" for="f-sort">Sort by</label>
      <select id="f-sort" name="sort" class="form-select form-select-sm" style="width:auto">${[['catalogue', 'Default order'], ['name', 'Name'], ['category', 'Category'], ['status', 'Result'], ['evidence', 'Evidence quality'], ['relevance', 'Most identifying']].map(([k, v]) => opt(k, v, f.sort)).join('')}</select>
      <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-toggle="collapse" data-bs-target="#more-filters" aria-expanded="${n ? 'true' : 'false'}" aria-controls="more-filters">${icon('sliders')} More filters${n ? `<span class="badge-count">${n}</span>` : ''}</button>
      <button type="button" class="btn btn-sm btn-link" data-clear>Clear</button>
    </div>
    <fieldset class="cat-scroll" aria-label="Category"><legend class="visually-hidden">Category</legend>${Object.entries(CATEGORIES).map(([k, c]) => `<input type="checkbox" class="btn-check" id="cat-${k}" name="categories" value="${k}" ${f.categories.includes(k) ? 'checked' : ''}><label class="btn btn-outline-secondary" for="cat-${k}">${icon(k)} ${esc(c.label)}</label>`).join('')}</fieldset>
    <div id="more-filters" class="collapse ${n ? 'show' : ''}"><div class="more-filters"><div class="row g-2">
      ${sel('tier', 'Level', opt('', 'All', f.tier) + opt('basic', 'Basic', f.tier) + opt('advanced', 'Advanced', f.tier))}
      ${sel('relevance', 'How identifying', opt('', 'All', f.relevance) + Object.entries(RELEVANCE).map(([k, v]) => opt(k, v, f.relevance)).join(''))}
      ${sel('availability', 'How it runs', [['', 'Any'], ['auto', 'Automatically'], ['secure', 'Needs HTTPS / localhost'], ['interaction', 'Only when you start it'], ['permission', 'Needs a permission'], ['server', 'Server-only']].map(([k, v]) => opt(k, v, f.availability)).join(''))}
      ${sel('dataType', 'Data type', opt('', 'All', f.dataType) + Object.entries(DATA_TYPES).map(([k, v]) => opt(k, v, f.dataType)).join(''))}
      ${sel('entity', 'Company or technology', opt('', 'Any', f.entity) + orgs.map((e) => opt(e.entityId, e.name, f.entity)).join(''))}
      ${sel('adversary', 'Adversary type', opt('', 'Any', f.adversary) + adversaries.map((a) => opt(a, a, f.adversary)).join(''))}
      ${sel('purpose', 'Purpose', opt('', 'Any', f.purpose) + Object.entries(PURPOSES).map(([k, v]) => opt(k, v, f.purpose)).join(''))}
      ${sel('maxEvidence', 'Evidence at least', opt('', 'Any', f.maxEvidence) + Object.entries(EVIDENCE_LEVELS).map(([k, v]) => opt(k, `${v.label}`, f.maxEvidence)).join(''))}
      <div class="col-md-6"><label class="form-label small mb-1" for="f-api">Browser API contains</label><input id="f-api" name="api" class="form-control form-control-sm" value="${esc(f.api)}" placeholder="e.g. navigator, WebGL, matchMedia"></div>
      <div class="col-12"><fieldset><legend class="form-label small mb-1">Result</legend><div class="d-flex flex-wrap gap-1">${Object.entries(STATUSES).map(([k, st]) => `<input type="checkbox" class="btn-check" id="st-${k}" name="statuses" value="${k}" ${f.statuses.includes(k) ? 'checked' : ''}><label class="btn btn-sm btn-outline-secondary" for="st-${k}">${esc(st.label)}</label>`).join('')}</div></fieldset></div>
    </div></div></div>
  </form>`;
}

function row(app, d) {
  const r = app.results[d.id];
  const changed = r && lastStatus[d.id] !== undefined && lastStatus[d.id] !== r.executionStatus;
  lastStatus[d.id] = r?.executionStatus;
  const best = bestEvidence(app.assocIndex[d.id]);
  const nEnt = (app.assocIndex[d.id] || []).length;
  return `<li class="test-row">
    <div><div class="meta mb-1">${categoryLabel(d.category)} ${d.tier === 'advanced' ? '<span class="chip chip-outline">Advanced</span>' : ''}${d.serverRequired ? '<span class="chip tone-server">server-only</span>' : ''}${d.interaction ? '<span class="chip chip-outline">interactive</span>' : ''}</div>
      <h3><a href="#" data-action="detail" data-id="${d.id}">${esc(d.name)}</a></h3></div>
    <div class="test-actions">${r ? (changed ? statusChip(r.executionStatus).replace('class="chip', 'class="chip pop') : statusChip(r.executionStatus)) : '<span class="chip chip-outline">Not run</span>'}${r ? protectionChip(r.protectionIndicator) : ''}</div>
    <div class="summary">${esc(d.simple)}</div>
    <div class="preview">${previewLine(r)}</div>
    <div class="meta" style="grid-column:1/-1"><span class="chip chip-outline">Relevance: ${esc(d.relevance)}</span>${best ? `${evidenceChip(best)}<span class="small text-muted">${nEnt} documented association${nEnt === 1 ? '' : 's'}</span>` : '<span class="small text-muted">no documented associations</span>'}
      <span class="ms-auto d-flex gap-1"><button class="btn btn-sm btn-outline-secondary" data-action="detail" data-id="${d.id}">Details</button>${d.serverRequired ? '' : `<button class="btn btn-sm btn-outline-primary" data-rerun="${d.id}" aria-label="Run ${esc(d.name)}"><i class="bi bi-play" aria-hidden="true"></i> Run</button>`}</span></div>
  </li>`;
}

function list(view, app) {
  const items = filterAndSort(app.defs, app.filter, { results: app.results, assocIndex: app.assocIndex, catalogueOrder: app.defs.map((d) => d.id) });
  view.querySelector('#count').textContent = `${items.length} of ${app.defs.length} checks`;
  const counts = items.reduce((a, d) => { const st = app.results[d.id]?.executionStatus; if (st) { const k = segmentOf(st); a[k] = (a[k] || 0) + 1; } return a; }, {});
  view.querySelector('#summary').innerHTML = Object.keys(counts).length ? stackedBars([{ label: 'Shown checks', counts }], { title: 'Results of the shown checks', desc: 'Results of the checks matching your filters.' }) : '';
  view.querySelector('#test-list').innerHTML = items.length ? items.map((d) => row(app, d)).join('') : '<li class="panel text-muted">No techniques match these filters. <button class="btn btn-link p-0" data-clear>Clear all filters</button></li>';
}

export function render(view, app) {
  const root = mount(view, `
    <h1 class="page-title">Fingerprint tests</h1>
    <p class="lead-muted">Every check this lab can run, what it looks at and what your browser answered. Open a check to read how it works, who uses it and how to protect yourself.</p>
    ${filterForm(app)}
    <div class="d-flex flex-wrap align-items-center gap-2 mt-3"><span id="count" class="fw-semibold" aria-live="polite"></span>
      ${Object.keys(app.results).length ? '' : '<button class="btn btn-sm btn-primary ms-auto" data-action="run">Run the checks</button>'}</div>
    <div id="summary" class="mt-2"></div>
    <ul id="test-list" class="list-unstyled d-grid gap-2 mt-2"></ul>`);
  const form = root.querySelector('#filters');
  const read = () => {
    const fd = new FormData(form);
    for (const k of ['q', 'tier', 'relevance', 'dataType', 'sort', 'entity', 'adversary', 'purpose', 'maxEvidence', 'availability', 'api']) app.filter[k] = fd.get(k) || (k === 'sort' ? 'catalogue' : '');
    app.filter.categories = fd.getAll('categories'); app.filter.statuses = fd.getAll('statuses');
    list(view, app);
  };
  form.addEventListener('input', read);
  form.addEventListener('submit', (e) => e.preventDefault());
  root.addEventListener('click', async (e) => {
    if (e.target.closest('[data-clear]')) { app.filter = emptyFilter(); render(view, app); return; }
    const b = e.target.closest('[data-rerun]');
    if (b) { b.disabled = true; await app.rerun(b.dataset.rerun, { userInitiated: true }); }
  });
  list(view, app);
}

export function update(view, app) { if (view.querySelector('#test-list')) list(view, app); else render(view, app); }
