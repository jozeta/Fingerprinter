// Methodology & Sources: aggregation, assessment rules, scales, network-request disclosure and the source registry.
import { esc } from '../core/util.js';
import { APP_VERSION, RESULT_SCHEMA_VERSION, TEST_CATALOGUE_VERSION, STATUSES, CONFIDENCE, EVIDENCE_LEVELS, PROTECTION, MATURITY } from '../core/constants.js';
import { ASSESSMENT_RULES } from '../analysis/assessment.js';
import { hasWebCrypto } from '../core/hash.js';
import { mount } from './components.js';

export function render(view, app) {
  const src = Object.entries(app.sources).sort((a, b) => a[1].title.localeCompare(b[1].title));
  const used = (id) => app.defs.filter((d) => d.sources.includes(id)).length + app.catalogue.entities.filter((e) => e.sourceReferences.includes(id)).length;
  mount(view, `
    <h1 class="page-title">Methodology &amp; sources</h1>
    <p class="lead-muted">App ${esc(APP_VERSION)} · test catalogue ${esc(TEST_CATALOGUE_VERSION)} (${app.defs.length} techniques) · entity catalogue ${esc(app.catalogue.catalogueVersion)} · source registry ${esc(app.sourcesVersion)} · result schema ${esc(RESULT_SCHEMA_VERSION)}</p>
    ${app.integrityProblems.length ? `<div class="alert alert-warning">Catalogue integrity problems: ${esc(app.integrityProblems.join('; '))}</div>` : '<p class="small text-muted">Catalogue integrity check passed: every source, technique and dependency reference resolves.</p>'}
    <div class="row g-3">
      <div class="col-lg-6 d-grid gap-3 align-content-start">
        <section class="panel"><h2 class="h6">Fingerprint aggregation</h2><ol class="small mb-0">
          <li>Each test returns a raw result and, where justified, a normalized result (e.g. the canvas digest instead of pixel data; detected-font list instead of measurements). Raw results are preserved separately.</li>
          <li>Eligible signals: status revealed or estimated (codes <code>measured</code>, <code>inferred</code>), a non-null normalized value, and no randomization detected.</li>
          <li>Default selection: eligible signals whose definition is not volatile (window size, battery, timing are excluded). You can change the selection in the Signal Explorer.</li>
          <li>Canonical form: JSON with recursively sorted keys of <code>{testId: normalizedResult}</code>. Timestamps, durations, and raw data are never included.</li>
          <li>Digest: ${hasWebCrypto() ? 'SHA-256 via Web Crypto (available in this context).' : 'SHA-256 via Web Crypto when available; <strong>in this context it is not</strong>, so a labeled non-cryptographic fallback (cyrb53) is used.'}</li>
          <li>The digest summarizes the selected measurements. <strong>It is not a measure of global uniqueness or entropy</strong>, and no uniqueness percentage is reported because no representative comparison dataset is used.</li></ol></section>
        <section class="panel"><h2 class="h6">Privacy assessment rules</h2><ol class="small mb-0">${ASSESSMENT_RULES.map((r) => `<li>${esc(r)}</li>`).join('')}</ol>
          <p class="small text-muted mt-2 mb-0">"Relevance" (high/medium/low) per technique is assigned from cited literature, not measured here. The assessment is qualitative and separate from security severity.</p></section>
        <section class="panel"><h2 class="h6">Execution statuses</h2><dl class="small mb-0">${Object.entries(STATUSES).map(([k, s]) => `<dt>${esc(s.label)} <code>${esc(k)}</code></dt><dd class="text-muted">${esc(s.help)}</dd>`).join('')}</dl></section>
        <section class="panel"><h2 class="h6">Confidence scale</h2><dl class="small mb-0">${Object.entries(CONFIDENCE).map(([k, v]) => `<dt>${esc(k)}</dt><dd class="text-muted">${esc(v)}</dd>`).join('')}</dl></section>
        <section class="panel"><h2 class="h6">Protection indicators</h2><dl class="small mb-0">${Object.entries(PROTECTION).map(([k, v]) => `<dt>${esc(v.label)}</dt><dd class="text-muted">${esc(v.help)}</dd>`).join('')}</dl></section>
      </div>
      <div class="col-lg-6 d-grid gap-3 align-content-start">
        <section class="panel"><h2 class="h6">Evidence levels for associations</h2><dl class="small mb-0">${Object.entries(EVIDENCE_LEVELS).map(([k, v]) => `<dt>L${k}: ${esc(v.label)}</dt><dd class="text-muted">${esc(v.help)}</dd>`).join('')}</dl>
          <p class="small text-muted mt-2 mb-0">A company name in a generic article is not treated as evidence. Marketing claims are not treated as independently verified behaviour.</p></section>
        <section class="panel"><h2 class="h6">Technique maturity</h2><dl class="small mb-0">${Object.entries(MATURITY).map(([k, v]) => `<dt>${esc(v)}</dt><dd class="text-muted">${k === 'demonstrated' ? 'Observed in the wild or implemented in shipping libraries/products.' : k === 'research' ? 'Described in published research; deployment not established.' : 'An inference this lab makes from indicators; may be wrong.'}</dd>`).join('')}</dl></section>
        <section class="panel"><h2 class="h6">Network requests made by this app</h2><ul class="small mb-0">
          <li>Loading its own files (HTML, CSS, JS, fonts, <code>data/*.json</code>) from the same origin. All dependencies are self-hosted.</li>
          <li><strong>No other requests.</strong> No analytics, no advertising, no CDN, no IP lookup, no STUN/TURN servers. The WebRTC check uses no ICE servers.</li>
          <li>The optional server adapter is disabled and ships as a null implementation (see <code>docs/SERVER-ADAPTER.md</code>).</li>
          <li>Enforced by a Content Security Policy: <code>default-src 'self'; connect-src 'self'</code>.</li></ul></section>
        <section class="panel"><h2 class="h6">Data handling</h2><ul class="small mb-0"><li>Results live in memory and vanish when the tab closes.</li><li>localStorage is used only for settings (when "remember settings" is on) and snapshots you save; both are under <code>fplab:</code> and removable in Settings.</li><li>The storage test writes and immediately deletes one probe value per mechanism.</li><li>Exports are generated locally and exclude raw values unless you choose to include them.</li></ul></section>
      </div>
    </div>
    <section class="panel mt-3"><h2 class="h6">Source registry (${src.length})</h2>
      <p class="small text-muted">"Checked" = URL and cited claim verified on that date. Sources without a date are cited from prior knowledge and were not re-verified in this revision.</p>
      <div class="table-responsive"><table class="table table-sm small"><thead><tr><th>Source</th><th>Type</th><th>Checked</th><th>Supports</th><th>Used by</th></tr></thead><tbody>
      ${src.map(([id, s]) => `<tr><td><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a><br><span class="text-muted">${esc(s.publisher)}</span></td><td>${esc(s.type)}</td><td>${esc(s.dateChecked || '—')}</td><td>${esc(s.supports)}</td><td>${used(id)}</td></tr>`).join('')}
      </tbody></table></div></section>`);
}

export function update() {}
