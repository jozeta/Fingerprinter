// Printable report: render escaped report HTML into the print root and open the browser print dialog (print or "Save as PDF").
import { printableReport } from '../analysis/report.js';
import { assess } from '../analysis/assessment.js';
import { recommend } from '../analysis/recommendations.js';
import { buildProfile } from '../analysis/profile.js';

export async function printReport(app, { title = 'Browser Fingerprinting & Privacy Lab report', comparison = null, include = { assessment: true, recommendations: true, profile: true } } = {}) {
  const has = Object.keys(app.results).length > 0;
  const html = printableReport({
    title, defs: app.defs, results: app.results, sources: app.sources, comparison, entityCatalogueVersion: app.catalogue.catalogueVersion,
    assessment: has && include.assessment ? assess(app.defs, app.results, { repeat: app.settings.repeat }) : null,
    recommendations: has && include.recommendations ? recommend(app.results) : null,
    profile: has && include.profile ? await buildProfile(app.defs, app.results, app.getSelection()) : null,
  });
  const root = document.getElementById('print-root');
  root.innerHTML = html;
  window.print();
}
