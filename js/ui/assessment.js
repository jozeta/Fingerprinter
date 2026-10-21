// Privacy Assessment: qualitative exposure level, confidence, factors, exposure summary and recommendations.
import { esc, download } from '../core/util.js';
import { assess, ASSESSMENT_RULES } from '../analysis/assessment.js';
import { recommend } from '../analysis/recommendations.js';
import { meta } from '../analysis/report.js';
import { mount, emptyState, sourceLink } from './components.js';
import { stackedBars, segmentOf } from './charts.js';
import { printReport } from './print.js';

const LEVEL_TEXT = {
  low: 'Most strongly identifying client-side surfaces appear protected or unavailable.',
  moderate: 'Some strongly identifying surfaces are readable; others are protected.',
  elevated: 'Most strongly identifying client-side surfaces are readable and stable across repeated measurements.',
  indeterminate: 'Too many tests did not produce a definitive result to draw a conclusion.',
};

export function render(view, app) {
  if (!Object.keys(app.results).length) { mount(view, `<h1 class="page-title">Privacy assessment</h1>${emptyState('Run the tests first.', '<button class="btn btn-primary" data-action="run">Run client-side tests</button>')}`); return; }
  const a = assess(app.defs, app.results, { repeat: app.settings.repeat });
  const rec = recommend(app.results);
  const name = (id) => app.defs.find((d) => d.id === id)?.name || id;
  const VALUE = ['measured', 'inferred'];
  const byRelevance = ['high', 'medium', 'low'].map((lv) => ({ label: `${lv[0].toUpperCase()}${lv.slice(1)} relevance`,
    counts: app.defs.filter((d) => d.relevance === lv && app.results[d.id]).reduce((acc, d) => { const r = app.results[d.id]; const k = r.protectionIndicator === 'randomized' ? 'blocked' : segmentOf(r.executionStatus); acc[k] = (acc[k] || 0) + 1; return acc; }, {}) }));


  const root = mount(view, `
    <h1 class="page-title">Privacy assessment</h1>
    <p class="lead-muted">A qualitative estimate of how much stable, identifying information ordinary websites can read from this browser. It is kept separate from security: none of this indicates a vulnerability or compromise.</p>
    <div class="row g-3 mb-3">
      <div class="col-lg-5"><section class="panel h-100" aria-labelledby="lvl">
        <div class="panel-title">Exposure level</div>
        <p class="mb-1"><span id="lvl" class="fs-3 fw-bold text-capitalize">${esc(a.level)}</span></p>
        <p>${esc(LEVEL_TEXT[a.level])}</p>
        <p class="small mb-1"><strong>Confidence: ${esc(a.confidence)}</strong>. Coverage ${Math.round(a.coverage * 100)}% (${a.ranCount} client-side tests, repeat count ${app.settings.repeat}).</p>
        <p class="small text-muted mb-0">Revealed or estimated: ${a.measuredCount} results. Not available or not run: ${a.unknown.length}. Only servers can see (not assessed): ${a.serverOnlyCount}.</p>
        <div class="d-flex flex-wrap gap-2 mt-3"><button class="btn btn-sm btn-outline-secondary" data-print>Print / PDF report</button><button class="btn btn-sm btn-outline-secondary" data-export>Export mitigation report JSON</button></div>
      </section></div>
      <div class="col-lg-7"><section class="panel h-100"><div class="panel-title">Where your exposure comes from</div><div class="panel-sub">The high-relevance row matters most.</div>
        ${stackedBars(byRelevance, { title: 'Results by relevance tier', desc: 'Checks grouped by how identifying research considers them. Scrambled results are counted as hidden. This counts signals; it does not measure uniqueness.' })}
      </section></div>
    </div>
    <div class="row g-3 mb-3">
      <div class="col-md-6"><section class="panel h-100"><div class="panel-title">Readable high-relevance signals (H = ${a.exposedHigh.length})</div>
        ${a.exposedHigh.length ? `<ul class="mb-0">${a.exposedHigh.map((id) => `<li><a href="#" data-action="detail" data-id="${id}">${esc(name(id))}</a></li>`).join('')}</ul>` : '<p class="text-muted mb-0">None.</p>'}</section></div>
      <div class="col-md-6"><section class="panel h-100"><div class="panel-title">Protected high-relevance signals (P = ${a.protectedHigh.length})</div>
        ${a.protectedHigh.length ? `<ul class="mb-0">${a.protectedHigh.map((id) => `<li><a href="#" data-action="detail" data-id="${id}">${esc(name(id))}</a>: ${esc(app.results[id].executionStatus === 'blocked' ? 'blocked' : app.results[id].protectionIndicator)}</li>`).join('')}</ul>` : '<p class="text-muted mb-0">None detected.</p>'}</section></div>
    </div>
    <section class="panel mb-3"><div class="panel-title">How the level is decided (documented rules)</div><ol class="small mb-0">${ASSESSMENT_RULES.map((r) => `<li>${esc(r)}</li>`).join('')}</ol></section>
    <section class="panel"><div class="panel-title">Recommendations for this browser</div>
      <p class="small text-muted">Browser family (inferred, may be wrong): <strong>${esc(rec.browser)}</strong>. No single measure eliminates fingerprinting and none guarantees anonymity.</p>
      <div class="d-grid gap-2">${rec.items.map((i) => `<article class="border rounded p-3">
        <h2 class="h6 mb-1">${esc(i.title)}</h2>
        <p class="small mb-1"><strong>Why (from your results):</strong> ${esc(i.why)}</p>
        <p class="small mb-1"><strong>Expected benefit:</strong> ${esc(i.benefit)}</p>
        <p class="small mb-1"><strong>Compatibility impact:</strong> ${esc(i.compatibility)}</p>
        <p class="small mb-1"><strong>Limitations:</strong> ${esc(i.limitations)}</p>
        ${i.browserAdvice ? `<p class="small mb-1"><strong>For your browser:</strong> ${esc(i.browserAdvice)}</p>` : ''}
        <p class="small mb-0 text-muted">Sources: ${i.sources.map((s) => sourceLink(app.sources, s)).join(' · ')}</p></article>`).join('')}</div>
    </section>`);

  root.querySelector('[data-print]').addEventListener('click', () => printReport(app, { title: 'Privacy assessment & mitigation report' }));
  root.querySelector('[data-export]').addEventListener('click', () => download('privacy-mitigation-report.json', JSON.stringify({ ...meta(app.catalogue.catalogueVersion), kind: 'mitigation-report', assessment: a, rules: ASSESSMENT_RULES, recommendations: rec }, null, 2)));
}

export function update(view, app, what) { if (what === 'run-end' || what === 'result') render(view, app); }
