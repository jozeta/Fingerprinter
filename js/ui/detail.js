// Technique detail panel: the 17 items required for every test (spec §10).
import { esc } from '../core/util.js';
import { getTest } from '../core/registry.js';
import { MATURITY, STABILITY, CONFIDENCE, PROTECTION, PURPOSES } from '../core/constants.js';
import { statusChip, protectionChip, evidenceChip, relevanceChip, categoryLabel, kvTable, rawView, sourceLink, relationLabel } from './components.js';
import { interpret } from '../analysis/interpret.js';
import { commonBlock } from './components.js';

const CONCERN = {
  privacy: 'Privacy consideration: the value can contribute to identification. It is not a security vulnerability.',
  limitation: 'Mostly a browser capability or limitation; low privacy weight on its own.',
  security: 'Conventional security relevance.',
};

let offcanvas;

export function openDetail(app, id) {
  const d = getTest(id); if (!d) return;
  const body = document.getElementById('detail-body');
  document.getElementById('detail-title').textContent = d.name;
  renderBody(app, d, body);
  offcanvas ||= new bootstrap.Offcanvas('#detail');
  offcanvas.show();
}

function renderBody(app, d, body) {
  const r = app.results[d.id];
  const assocs = app.assocIndex[d.id] || [];
  const combos = d.combinesWith.map((c) => {
    const other = app.defs.find((x) => x.id === c.id);
    return `<li><a href="#" data-goto="${esc(c.id)}">${esc(other?.name || c.id)}</a>: ${esc(c.note)} <span class="chip ${c.basis === 'documented' ? 'ev-3' : 'ev-4'}">${c.basis}</span>${c.source ? ` ${sourceLink(app.sources, c.source)}` : ''}</li>`;
  }).join('');
  const sec = (n, title, html) => `<section class="detail-section"><h3><span class="text-muted">${n}.</span> ${title}</h3>${html}</section>`;

  body.innerHTML = `
    <div class="d-flex flex-wrap gap-2 mb-3 align-items-center">${categoryLabel(d.category)} ${r ? statusChip(r.executionStatus) : statusChip('skipped')} ${r ? protectionChip(r.protectionIndicator, true) : ''}
      ${relevanceChip(d.relevance)} <span class="chip chip-outline">${esc(d.tier)}</span> <span class="chip chip-outline">${esc(MATURITY[d.maturity])}</span> <span class="chip chip-outline mono">${esc(d.id)} v${esc(d.version)}</span></div>
    ${sec(1, 'What the technique is', `<p>${esc(d.simple)}</p>`)}
    ${sec(2, 'How it works', `<p>${d.how}</p>`)}
    ${sec(3, 'What the browser exposes', `<p class="mb-1">${esc(d.exposes)}</p><p class="small text-muted mb-0">APIs: ${d.apis.map((a) => `<code>${esc(a)}</code>`).join(', ') || 'none (derived)'} · Data type: ${esc(d.dataType)} · Purposes: ${d.purpose.map((p) => esc(PURPOSES[p])).join(', ')}</p>`)}
    ${sec(4, 'Your result', r ? `
      <div class="lead-meaning"><strong>What this means:</strong> ${esc(interpret(d, r))}</div>
      <p class="mb-2">${statusChip(r.executionStatus)} <span class="small text-muted">at ${esc(new Date(r.executionTimestamp).toLocaleTimeString())} · ${esc(r.executionDuration)} ms · confidence <strong>${esc(r.confidence)}</strong> (${esc(CONFIDENCE[r.confidence])})</span></p>
      ${r.image ? `<img class="render-preview mb-2" src="${esc(r.image)}" alt="Rendering produced by this test in your browser">` : ''}
      ${kvTable(r.rawResult)}
      ${r.notes.length ? `<ul class="small mt-2 mb-0">${r.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
      ${r.errorDetails ? `<div class="alert alert-secondary small mt-2 mb-0">${esc(r.errorDetails)}</div>` : ''}` : '<p class="text-muted">Not run yet.</p>')}
    ${sec(5, 'Raw / structured data', r ? `<details><summary>Show full result object (schema ${esc(r.schemaVersion)})</summary>${rawView({ ...r, image: r.image ? '[preview image omitted]' : null })}</details>` : '<p class="text-muted mb-0">—</p>')}
    ${sec(6, 'In plain language', `<p>${esc(d.simple)} ${esc(d.privacyImpact)}</p>`)}
    ${sec(7, 'Technical explanation', `<div>${d.technical}</div>`)}
    ${sec(8, 'Why it can contribute to fingerprinting', `<p>Relevance <strong>${esc(d.relevance)}</strong>: ${esc(d.relevanceBasis)}</p><div class="explain-body p-0">${commonBlock(d, r)}</div>`)}
    ${sec(9, 'Commonly combined with', combos ? `<ul class="mb-0">${combos}</ul>` : '<p class="text-muted mb-0">No combinations recorded.</p>')}
    ${sec(10, 'Stability', `<p class="mb-0">${esc(STABILITY[d.stability])}. ${d.stability === 'volatile' ? 'Changes frequently; excluded from the default fingerprint profile.' : d.stability === 'semi-stable' ? 'Can change with settings, updates or environment.' : 'Usually constant for a device/browser until updates or hardware changes.'}${r?.protectionIndicator ? ` Protection indicator: ${esc(PROTECTION[r.protectionIndicator]?.label)}.` : ''}</p>`)}
    ${sec(11, 'Defenses that may alter the result', `<p class="mb-0">${esc(d.defenses)}</p>`)}
    ${sec(12, 'Type of concern', `<p class="mb-0">${esc(CONCERN[d.concern])}</p>`)}
    ${sec(13, 'Limitations & confidence', `<ul class="mb-0">${d.limitations.map((l) => `<li>${esc(l)}</li>`).join('')}<li>Requirements: ${d.secureContext ? 'secure context; ' : ''}${d.serverRequired ? 'server-side observation; ' : ''}${d.interaction ? 'user-initiated; ' : ''}${d.permissions.length ? `permissions: ${esc(d.permissions.join(', '))}` : 'no permissions'}</li></ul>`)}
    ${sec(14, 'Documented organisation / technology associations', assocs.length ? `<table class="table table-sm"><thead><tr><th>Entity</th><th>Relation</th><th>Evidence</th><th>Summary</th></tr></thead><tbody>${assocs.sort((x, y) => x.association.evidenceLevel - y.association.evidenceLevel).map(({ entity, association: a }) => `<tr><td><a href="#/entities" data-entity="${esc(entity.entityId)}">${esc(entity.name)}</a></td><td>${relationLabel(a.relation)}</td><td>${evidenceChip(a.evidenceLevel)}</td><td class="small">${esc(a.summary)}</td></tr>`).join('')}</tbody></table><p class="small text-muted mb-0">Associations describe documented relationships. They do not mean any of these organisations has observed your browser.</p>` : '<p class="text-muted mb-0">No documented associations in the catalogue.</p>')}
    ${sec(15, 'Evidence sources', `<ul class="small mb-0">${d.sources.map((s) => `<li>${sourceLink(app.sources, s)}<br><span class="text-muted">${esc(app.sources[s]?.supports || '')}</span></li>`).join('')}</ul>`)}
    ${sec(16, 'Recommended mitigations', `<ul class="mb-0">${d.mitigations.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>`)}
    ${sec(17, 'Rerun', `<button class="btn btn-outline-primary btn-sm" data-rerun><i class="bi bi-arrow-repeat" aria-hidden="true"></i> ${d.interaction ? 'Run now (you initiated it)' : 'Rerun this test'}</button>`)}`;

  body.querySelector('[data-rerun]').addEventListener('click', async (e) => {
    e.target.disabled = true;
    await app.rerun(d.id, { userInitiated: true });
    renderBody(app, d, body);
  });
  body.querySelectorAll('[data-goto]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); const t = getTest(a.dataset.goto); if (t) { document.getElementById('detail-title').textContent = t.name; renderBody(app, t, body); } }));
  body.querySelectorAll('[data-entity]').forEach((a) => a.addEventListener('click', () => { app.entityFocus = a.dataset.entity; offcanvas.hide(); }));
}
