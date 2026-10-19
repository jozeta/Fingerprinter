// Companies & Adversaries: evidence-based catalogue with filters, entity detail, relationship graph and evidence distribution.
import { esc, download } from '../core/util.js';
import { EVIDENCE_LEVELS, RELATIONS, PURPOSES } from '../core/constants.js';
import { filterEntities } from '../analysis/filters.js';
import { exportAssociations } from '../analysis/report.js';
import { evidenceChip, relationLabel, sourceLink, statusChip, mount } from './components.js';
import { barChart, bipartiteGraph, stackedBars } from './charts.js';

const ef = { q: '', type: '', purpose: '', technique: '', relation: '', maxEvidence: '', recency: '' };
const opt = (v, l, cur) => `<option value="${esc(v)}" ${cur === v ? 'selected' : ''}>${esc(l)}</option>`;

function detail(app, e) {
  return `<section class="panel mb-3" id="entity-detail" tabindex="-1" aria-labelledby="ed-h">
    <div class="d-flex justify-content-between align-items-start gap-2"><div>
      <h2 class="h5 mb-1" id="ed-h">${esc(e.name)}</h2>
      <div class="small text-muted mb-2">${esc(e.entityType)} · ${esc(e.organizationCategory)}${e.adversaryCategory ? ` · adversary category: ${esc(e.adversaryCategory)}` : ''} · purposes: ${e.purpose.map((p) => esc(PURPOSES[p] || p)).join(', ')}</div></div>
      <button class="btn-close" data-close aria-label="Close entity detail"></button></div>
    <p>${esc(e.description)}</p>
    <p class="small"><strong>Evidence summary:</strong> ${esc(e.evidenceSummary)}</p>
    <p class="small"><strong>Caveats:</strong> ${esc(e.limitations)} · Confidence: ${esc(e.confidence)} · Last verified: ${esc(e.lastVerified || 'not re-verified in this revision')}</p>
    <div class="table-responsive"><table class="table table-sm align-middle"><thead><tr><th>Technique</th><th>Relation</th><th>Evidence</th><th>What the evidence says</th><th>Your browser</th></tr></thead><tbody>
      ${e.associations.slice().sort((a, b) => a.evidenceLevel - b.evidenceLevel).map((a) => { const d = app.defs.find((x) => x.id === a.techniqueId); const r = app.results[a.techniqueId];
        return `<tr><td><a href="#" data-action="detail" data-id="${esc(a.techniqueId)}">${esc(d?.name || a.techniqueId)}</a></td><td class="small">${relationLabel(a.relation)}</td><td>${evidenceChip(a.evidenceLevel)}</td><td class="small">${esc(a.summary)}<br>${a.sources.map((s) => sourceLink(app.sources, s)).join('<br>')}</td><td>${r ? statusChip(r.executionStatus) : '<span class="small text-muted">not run</span>'}</td></tr>`; }).join('')}
    </tbody></table></div>
    <p class="small text-muted mb-0">"Your browser" shows what <em>this lab</em> measured locally. It does not mean ${esc(e.name)} has observed or fingerprinted you.</p>
  </section>`;
}

export function render(view, app) {
  const ents = app.catalogue.entities;
  const list = filterEntities(ents, ef);
  const focus = ents.find((e) => e.entityId === app.entityFocus);
  const types = [...new Set(ents.map((e) => e.entityType))];
  const evRows = Object.entries(EVIDENCE_LEVELS).map(([k, v]) => ({ label: v.label, value: ents.flatMap((e) => e.associations).filter((a) => a.evidenceLevel === Number(k)).length }));
  const techIds = [...new Set(list.flatMap((e) => e.associations.map((a) => a.techniqueId)))];

  const root = mount(view, `
    <h1 class="page-title">Companies &amp; adversaries</h1>
    <p class="lead-muted">A curated, versioned catalogue (v${esc(app.catalogue.catalogueVersion)}, updated ${esc(app.catalogue.lastUpdated)}) of organisations, technologies and adversary categories, with an explicit evidence level for <em>each</em> technique association. ${esc(app.catalogue.policy)}</p>
    <form class="panel mb-3" id="ef" role="search" aria-label="Filter entities"><div class="row g-2">
      <div class="col-md-3"><label class="form-label small mb-1" for="ef-q">Search</label><input class="form-control form-control-sm" id="ef-q" name="q" value="${esc(ef.q)}"></div>
      <div class="col-6 col-md-3"><label class="form-label small mb-1" for="ef-type">Entity type</label><select class="form-select form-select-sm" id="ef-type" name="type">${opt('', 'Any', ef.type)}${types.map((t) => opt(t, t, ef.type)).join('')}</select></div>
      <div class="col-6 col-md-2"><label class="form-label small mb-1" for="ef-purpose">Purpose</label><select class="form-select form-select-sm" id="ef-purpose" name="purpose">${opt('', 'Any', ef.purpose)}${Object.entries(PURPOSES).map(([k, v]) => opt(k, v, ef.purpose)).join('')}</select></div>
      <div class="col-6 col-md-2"><label class="form-label small mb-1" for="ef-relation">Relation</label><select class="form-select form-select-sm" id="ef-relation" name="relation">${opt('', 'Any', ef.relation)}${Object.entries(RELATIONS).map(([k, v]) => opt(k, v, ef.relation)).join('')}</select></div>
      <div class="col-6 col-md-2"><label class="form-label small mb-1" for="ef-ev">Evidence at least</label><select class="form-select form-select-sm" id="ef-ev" name="maxEvidence">${opt('', 'Any', ef.maxEvidence)}${Object.entries(EVIDENCE_LEVELS).map(([k, v]) => opt(k, v.short, ef.maxEvidence)).join('')}</select></div>
      <div class="col-6 col-md-3"><label class="form-label small mb-1" for="ef-tech">Technique</label><select class="form-select form-select-sm" id="ef-tech" name="technique">${opt('', 'Any', ef.technique)}${app.defs.filter((d) => app.assocIndex[d.id]).map((d) => opt(d.id, d.name, ef.technique)).join('')}</select></div>
      <div class="col-6 col-md-3"><label class="form-label small mb-1" for="ef-rec">Source recency</label><select class="form-select form-select-sm" id="ef-rec" name="recency">${opt('', 'Any', ef.recency)}${opt('verified-12m', 'Verified in last 12 months', ef.recency)}${opt('not-verified', 'Not re-verified', ef.recency)}</select></div>
      <div class="col-md-6 d-flex align-items-end gap-2"><span class="fw-semibold" aria-live="polite">${list.length} of ${ents.length} entities</span><button type="button" class="btn btn-sm btn-link" data-clear>Clear filters</button><button type="button" class="btn btn-sm btn-outline-secondary ms-auto" data-export>Export associations JSON</button></div>
    </div></form>
    ${focus ? detail(app, focus) : ''}
    <div class="row g-3 mb-3">${list.map((e) => `<div class="col-md-6 col-xl-4"><article class="panel h-100 d-flex flex-column">
      <div class="small text-muted">${esc(e.entityType)}${e.adversaryCategory ? ' · <strong>adversary category</strong>' : ''}</div>
      <h2 class="h6 mt-1">${esc(e.name)}</h2><p class="small mb-2">${esc(e.description)}</p>
      <div class="d-flex flex-wrap gap-1 mb-2">${[1, 2, 3, 4, 5].map((l) => { const n = e.associations.filter((a) => a.evidenceLevel === l).length; return n ? `${evidenceChip(l)}<span class="small me-1">×${n}</span>` : ''; }).join('')}</div>
      <button class="btn btn-sm btn-outline-primary mt-auto" data-entity="${esc(e.entityId)}">View techniques &amp; evidence</button></article></div>`).join('') || '<p class="text-muted">No entities match.</p>'}</div>
    <div class="row g-3">
      <div class="col-xl-8"><section class="panel"><div class="panel-title">Company-to-technique relationships (filtered)</div>
        ${bipartiteGraph(list.map((e) => ({ id: e.entityId, label: e.name.length > 30 ? `${e.name.slice(0, 29)}…` : e.name })), techIds.map((id) => ({ id, label: app.defs.find((d) => d.id === id)?.name || id })),
          list.flatMap((e) => e.associations.map((a) => ({ from: e.entityId, to: a.techniqueId, cls: `edge-l${a.evidenceLevel}`, label: `${e.name} → ${a.techniqueId}: ${RELATIONS[a.relation]}, ${EVIDENCE_LEVELS[a.evidenceLevel].label}` }))),
          { title: 'Company-to-technique relationship graph', desc: 'Lines connect entities to techniques. Line style encodes evidence: solid = confirmed/documented (L1–L2), dashed = research-supported (L3), dotted = category-level or unverified (L4–L5). Hover a line for details.',
            legend: '<span class="legend-line l1"></span>L1–L2 &nbsp; <span class="legend-line l3"></span>L3 research &nbsp; <span class="legend-line l4"></span>L4–L5 category/unverified' })}
      </section></div>
      <div class="col-xl-4"><section class="panel"><div class="panel-title">Evidence quality distribution</div>
        ${barChart(evRows, { title: 'Associations by evidence level', desc: 'Number of entity–technique associations at each evidence level across the whole catalogue. Higher counts at L4–L5 mean more uncertainty.', compact: true })}
        <div class="panel-title mt-3">Evidence by type of organisation</div>
        ${stackedBars(types.map((t) => ({ label: t, counts: ents.filter((e) => e.entityType === t).flatMap((e) => e.associations).reduce((a, x) => { a[`ev${x.evidenceLevel}`] = (a[`ev${x.evidenceLevel}`] || 0) + 1; return a; }, {}) })),
          { title: 'Evidence by organisation type', desc: 'Associations per organisation type, coloured by evidence level from L1 (darkest, strongest) to L5.', segs: [1, 2, 3, 4, 5].map((l) => ({ key: `ev${l}`, label: EVIDENCE_LEVELS[l].short, cls: `seg-ev${l}` })), endLabel: (r, sum) => `${sum} links` })}
        <dl class="small mt-2 mb-0">${Object.entries(EVIDENCE_LEVELS).map(([k, v]) => `<dt>${evidenceChip(k)} ${esc(v.label)}</dt><dd class="text-muted">${esc(v.help)}</dd>`).join('')}</dl>
      </section></div>
    </div>`);

  const form = root.querySelector('#ef');
  form.addEventListener('change', () => { const fd = new FormData(form); for (const k of Object.keys(ef)) ef[k] = fd.get(k) || ''; render(view, app); });
  form.addEventListener('submit', (e) => { e.preventDefault(); form.dispatchEvent(new Event('change')); }); // Enter in search
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-entity]');
    if (b) { app.entityFocus = b.dataset.entity; render(view, app); view.querySelector('#entity-detail')?.focus(); return; }
    if (e.target.closest('[data-close]')) { app.entityFocus = null; render(view, app); }
    if (e.target.closest('[data-clear]')) { Object.keys(ef).forEach((k) => { ef[k] = ''; }); render(view, app); }
    if (e.target.closest('[data-export]')) download('entity-technique-associations.json', JSON.stringify(exportAssociations(app.catalogue, app.sources), null, 2));
  });
}

export function update() { /* results changes only affect the open detail table; re-render on next visit */ }
