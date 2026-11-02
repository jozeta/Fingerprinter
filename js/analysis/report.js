// Exports, import validation and printable reports. Nothing is uploaded; files are produced locally for download.
import { APP_NAME, APP_VERSION, RESULT_SCHEMA_VERSION, TEST_CATALOGUE_VERSION, EXPORT_FORMAT, STATUSES } from '../core/constants.js';
import { esc } from '../core/util.js';


export function meta(entityCatalogueVersion) {
  return {
    format: EXPORT_FORMAT, app: APP_NAME, appVersion: APP_VERSION, resultSchemaVersion: RESULT_SCHEMA_VERSION,
    testCatalogueVersion: TEST_CATALOGUE_VERSION, entityCatalogueVersion, generatedAt: new Date().toISOString(),
    browserContext: { userAgent: globalThis.navigator?.userAgent ?? null, secureContext: globalThis.isSecureContext ?? null },
    dataHandling: 'Generated locally in your browser. Not uploaded anywhere.',
  };
}

/** Full results export. Raw values are excluded unless includeRaw is true; rendering previews are always excluded. */
export function exportResults(results, { includeRaw = false, entityCatalogueVersion }) {
  const out = {};
  for (const [id, r] of Object.entries(results)) {
    const { image, ...rest } = r;
    out[id] = includeRaw ? rest : { ...rest, rawResult: rest.rawResult === null ? null : '[excluded: enable "include raw data" to export]',
      normalizedResult: rest.normalizedResult === null ? null : '[excluded]' };
  }
  return { ...meta(entityCatalogueVersion), kind: 'results', includesRawData: includeRaw, results: out };
}

export const exportProfile = (profile, entityCatalogueVersion) => ({ ...meta(entityCatalogueVersion), kind: 'profile',
  digest: profile.digest, included: profile.included, excluded: profile.excluded, perSignalDigests: profile.perSignal });

export const exportAssociations = (catalogue, sources) => ({ ...meta(catalogue.catalogueVersion), kind: 'associations', policy: catalogue.policy, entities: catalogue.entities, sources });

/** Printable HTML report body (escaped). Opened in the print view; the user prints to paper or PDF. */
export function printableReport({ title, defs, results, assessment, recommendations, profile, sources, comparison, entityCatalogueVersion }) {
  const m = meta(entityCatalogueVersion);
  const row = (d) => { const r = results[d.id]; return `<tr><td>${esc(d.name)}</td><td>${esc(r ? STATUSES[r.executionStatus]?.label || r.executionStatus : 'Not run')}</td><td>${esc(r?.protectionIndicator ?? '')}</td><td>${esc(r?.confidence ?? '')}</td><td>${esc(d.relevance)}</td></tr>`; };
  const srcIds = [...new Set(defs.flatMap((d) => d.sources))];
  return `
  <h1>${esc(title)}</h1>
  <p class="small">${esc(m.app)} v${esc(m.appVersion)} · test catalogue ${esc(m.testCatalogueVersion)} · entity catalogue ${esc(m.entityCatalogueVersion)} · result schema ${esc(m.resultSchemaVersion)}<br>
  Generated ${esc(m.generatedAt)} · Browser context: ${esc(m.browserContext.userAgent)}</p>
  <p class="small"><strong>Data handling:</strong> generated locally; not uploaded. Raw values are not included in this report.</p>
  ${assessment ? `<h2>Privacy assessment</h2><p>Exposure level: <strong>${esc(assessment.level)}</strong> (confidence ${esc(assessment.confidence)}, coverage ${Math.round(assessment.coverage * 100)}%). This is a qualitative privacy-exposure estimate, not a security-vulnerability rating, and not a measure of global uniqueness.</p>` : ''}
  ${profile ? `<h2>Local fingerprint digest</h2><p><code>${esc(profile.digest.hex)}</code> (${esc(profile.digest.algorithm)}, ${profile.included.length} signals). A digest summarizes the selected measurements; it is not proof of identity.</p>` : ''}
  ${comparison ? `<h2>Comparison</h2><p>${Object.entries(comparison.counts).map(([k, v]) => `${esc(k)}: ${v}`).join(' · ')}</p>
    <table><thead><tr><th>Test</th><th>A</th><th>B</th><th>Result</th></tr></thead><tbody>${comparison.rows.map((r) => `<tr><td>${esc(r.testId)}</td><td>${esc(STATUSES[r.a?.status]?.label ?? '—')}</td><td>${esc(STATUSES[r.b?.status]?.label ?? '—')}</td><td>${esc(r.class)}</td></tr>`).join('')}</tbody></table>` : ''}
  ${recommendations ? `<h2>Mitigation recommendations</h2><ol>${recommendations.items.map((i) => `<li><strong>${esc(i.title)}</strong>: ${esc(i.why)}<br>Benefit: ${esc(i.benefit)}<br>Compatibility: ${esc(i.compatibility)}<br>Limitations: ${esc(i.limitations)}${i.browserAdvice ? `<br>${esc(i.browserAdvice)}` : ''}</li>`).join('')}</ol><p class="small">No single mitigation eliminates fingerprinting, and none guarantees anonymity.</p>` : ''}
  ${defs ? `<h2>Execution statuses</h2><table><thead><tr><th>Technique</th><th>Status</th><th>Protection</th><th>Confidence</th><th>Relevance</th></tr></thead><tbody>${defs.map(row).join('')}</tbody></table>` : ''}
  <h2>Limitations</h2><ul><li>Results reflect this browser, profile and moment; many values change with updates, settings or hardware.</li><li>Server-side signals (IP, TLS, HTTP headers) are not measured by this static app.</li><li>Associations with organisations describe documented or researched relationships; they do not state that any organisation fingerprinted you.</li></ul>
  ${sources ? `<h2>Sources</h2><ol class="small">${srcIds.filter((s) => sources[s]).map((s) => `<li>${esc(sources[s].title)}: ${esc(sources[s].url)}${sources[s].dateChecked ? ` (checked ${esc(sources[s].dateChecked)})` : ''}</li>`).join('')}</ol>` : ''}`;
}
