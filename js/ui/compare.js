// Fingerprint Comparison: current run vs saved or imported snapshots. Saving is an explicit user action.
import { esc, download, announce } from '../core/util.js';
import { snapshotFromResults, compareSnapshots, stabilityAcross, CLASSES } from '../analysis/compare.js';
import { exportSnapshot, validateImport, meta } from '../analysis/report.js';
import { buildProfile } from '../analysis/profile.js';
import { listSnapshots, saveSnapshot, deleteSnapshot } from '../core/store.js';
import { mount, emptyState } from './components.js';
import { STATUSES } from '../core/constants.js';

const label = (st) => (st ? STATUSES[st]?.label || st : '—');
import { barChart } from './charts.js';
import { printReport } from './print.js';
import { codeSectionHTML, bindCodeSection } from './code-compare.js';

const pick = { a: '', b: 'current' };

async function currentSnapshot(app) {
  if (!Object.keys(app.results).length) return null;
  const profile = await buildProfile(app.defs, app.results, app.getSelection());
  return { id: 'current', label: 'Current run (in memory)', createdAt: new Date().toISOString(), profileDigest: profile.digest.hex, entries: await snapshotFromResults(app.results) };
}

const INTERPRET = {
  changed: 'The value differs. It could be a setting change, an update, hardware, or measurement noise. It does not necessarily mean better privacy.',
  randomized: 'At least one side reported randomized output. Randomization breaks linking via this signal but can itself be detectable.',
  'newly-blocked': 'The API was blocked in B but readable in A, consistent with a privacy setting or a hardened profile.',
  'newly-available': 'The value was blocked in A but readable in B.',
  inconclusive: 'One side errored, was skipped, needs interaction, or has a different major test version. No conclusion is drawn.',
  added: 'Only present in B (e.g. a test that did not run in A).', removed: 'Only present in A.', unchanged: 'Same digest (or same status when no value).',
};

export async function render(view, app) {
  const current = await currentSnapshot(app);
  const saved = listSnapshots().map((s) => ({ ...s, source: 'saved' }));
  const all = [...(current ? [current] : []), ...saved, ...app.snapshots];
  if (!pick.a && all.length > 1) pick.a = all.find((s) => s.id !== 'current')?.id || '';
  const A = all.find((s) => s.id === pick.a), B = all.find((s) => s.id === pick.b);
  const cmp = A && B ? compareSnapshots(A.entries, B.entries) : null;
  app.lastComparison = cmp;
  const stab = all.length >= 2 ? stabilityAcross(all.map((s) => s.entries)).filter((x) => x.observations >= 2) : [];
  const opts = (cur) => all.map((s) => `<option value="${esc(s.id)}" ${s.id === cur ? 'selected' : ''}>${esc(s.label)}${s.createdAt ? ` · ${esc(new Date(s.createdAt).toLocaleString())}` : ''}${s.imported ? ' (imported)' : ''}</option>`).join('');
  const name = (id) => app.defs.find((d) => d.id === id)?.name || id;

  const root = mount(view, `
    <h1 class="page-title">Fingerprint comparison</h1>
    <p class="lead-muted">See what changes between two setups: before and after changing a setting, or between two computers or browsers. Copy a result code, keep it, then paste it here later.</p>
    ${codeSectionHTML(app)}
    <div class="section-head"><h2>Saved snapshots in this browser</h2><span class="small text-muted">Digests only, for quick before/after checks</span></div>
    <div class="row g-3 mb-3">
      <div class="col-lg-6"><section class="panel h-100"><div class="panel-title">Save or export the current run</div>
        ${current ? `<label class="form-label small" for="snap-label">Label</label><input id="snap-label" class="form-control form-control-sm mb-2" value="My browser, default settings" maxlength="80">
        <div class="d-flex flex-wrap gap-2"><button class="btn btn-sm btn-primary" data-save>Save in this browser</button><button class="btn btn-sm btn-outline-secondary" data-export-snap>Download snapshot JSON</button></div>
        <p class="small text-muted mt-2 mb-0">Saving stores the snapshot in this browser's localStorage under <code>fplab:snapshots</code> until you delete it (Settings → Clear all local data). Nothing is uploaded.</p>` : emptyState('Run the tests to create a snapshot.', '<button class="btn btn-primary btn-sm" data-action="run">Run client-side tests</button>')}
      </section></div>
      <div class="col-lg-6"><section class="panel h-100"><div class="panel-title">Import a snapshot from another browser or profile</div>
        <input type="file" class="form-control form-control-sm" accept="application/json,.json" id="import" aria-describedby="import-help">
        <p class="small text-muted mt-2 mb-0" id="import-help">The file is parsed as data and validated against the snapshot schema; it is never executed. Imported snapshots stay in memory only.</p>
        <div id="import-msg" class="small mt-2" role="status"></div>
        ${saved.length ? `<div class="panel-title mt-3">Saved snapshots</div><ul class="small mb-0">${saved.map((s) => `<li>${esc(s.label)} · ${esc(new Date(s.createdAt).toLocaleString())} <button class="btn btn-link btn-sm p-0 ms-1" data-del="${esc(s.id)}">delete</button></li>`).join('')}</ul>` : ''}
      </section></div>
    </div>
    ${all.length >= 2 ? `
    <section class="panel mb-3"><div class="row g-2 align-items-end">
      <div class="col-md-5"><label class="form-label small" for="pa">Profile A (before)</label><select id="pa" class="form-select form-select-sm">${opts(pick.a)}</select></div>
      <div class="col-md-5"><label class="form-label small" for="pb">Profile B (after)</label><select id="pb" class="form-select form-select-sm">${opts(pick.b)}</select></div>
      <div class="col-md-2 d-grid gap-1"><button class="btn btn-sm btn-outline-secondary" data-print ${cmp ? '' : 'disabled'}>Print report</button><button class="btn btn-sm btn-outline-secondary" data-export-cmp ${cmp ? '' : 'disabled'}>Export JSON</button></div></div>
      ${A && B ? `<p class="small mt-2 mb-0">Profile digests: A <code>${esc(A.profileDigest?.slice(0, 16))}…</code> · B <code>${esc(B.profileDigest?.slice(0, 16))}…</code> → ${A.profileDigest === B.profileDigest ? '<strong>identical</strong>' : '<strong>different</strong>'}. A different digest does not imply better privacy: any single changed signal changes it.</p>` : ''}
    </section>
    ${cmp ? `<div class="row g-3 mb-3"><div class="col-lg-5"><section class="panel h-100"><div class="panel-title">Before / after summary</div>
      ${barChart(Object.entries(cmp.counts).map(([k, v]) => ({ label: CLASSES[k], value: v })), { title: 'Comparison classes', desc: 'How many tests fall into each comparison class between A and B.' })}</section></div>
      <div class="col-lg-7"><section class="panel h-100"><div class="panel-title">How to interpret</div><dl class="small mb-0">${Object.entries(INTERPRET).map(([k, v]) => `<dt class="diff-${k}">${esc(CLASSES[k])}</dt><dd class="text-muted">${esc(v)}</dd>`).join('')}</dl></section></div></div>
    <section class="panel mb-3"><div class="panel-title">Per-signal comparison</div><div class="table-responsive"><table class="table table-sm align-middle"><thead><tr><th>Signal</th><th>A</th><th>B</th><th>Result</th></tr></thead><tbody>
      ${cmp.rows.filter((r) => r.class !== 'unchanged').concat(cmp.rows.filter((r) => r.class === 'unchanged')).map((r) => `<tr><td>${esc(name(r.testId))}</td><td class="small">${esc(label(r.a?.status))}${r.a?.protection === 'randomized' ? ' (randomized)' : ''}</td><td class="small">${esc(label(r.b?.status))}${r.b?.protection === 'randomized' ? ' (randomized)' : ''}</td><td class="fw-semibold diff-${r.class}">${esc(CLASSES[r.class])}</td></tr>`).join('')}
    </tbody></table></div></section>` : ''}
    ${stab.length ? `<section class="panel"><div class="panel-title">Signal stability across all ${all.length} available profiles</div>
      ${barChart(stab.filter((s) => s.distinct > 1).map((s) => ({ label: name(s.testId), value: s.distinct, note: `of ${s.observations}` })).slice(0, 20), { title: 'Distinct values per signal', desc: 'Signals that took more than one distinct value across the available snapshots. 1 distinct value = stable across these runs.' })}
      <p class="small text-muted mb-0">${stab.filter((s) => s.distinct === 1).length} signals had a single value across all snapshots (stable in this sample).</p></section>` : ''}` : (current ? emptyState('Save this run or import a snapshot to compare. Tip: save now, then change a privacy setting, run again and compare.') : '')}`);

  bindCodeSection(root, app, () => render(view, app));
  root.querySelector('[data-save]')?.addEventListener('click', () => {
    const label = root.querySelector('#snap-label').value.trim() || 'Snapshot';
    saveSnapshot({ ...current, id: `s${Date.now()}`, label, source: 'saved' });
    announce('Snapshot saved locally.'); render(view, app);
  });
  root.querySelector('[data-export-snap]')?.addEventListener('click', () => {
    const label = root.querySelector('#snap-label').value.trim() || 'Snapshot';
    download('fingerprint-snapshot.json', JSON.stringify(exportSnapshot(label, current.entries, current.profileDigest, app.catalogue.catalogueVersion), null, 2));
  });
  root.querySelector('#import').addEventListener('change', async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const res = validateImport(await file.text());
    const msg = root.querySelector('#import-msg');
    if (!res.ok) { msg.innerHTML = `<span class="text-danger">Import rejected:</span><ul class="mb-0">${res.problems.slice(0, 8).map((p) => `<li>${esc(p)}</li>`).join('')}</ul>`; return; }
    app.snapshots.push({ ...res.snapshot, id: `i${Date.now()}` }); announce('Snapshot imported.'); render(view, app);
  });
  root.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => { deleteSnapshot(b.dataset.del); render(view, app); }));
  root.querySelector('#pa')?.addEventListener('change', (e) => { pick.a = e.target.value; render(view, app); });
  root.querySelector('#pb')?.addEventListener('change', (e) => { pick.b = e.target.value; render(view, app); });
  root.querySelector('[data-print]')?.addEventListener('click', () => printReport(app, { title: `Comparison report: ${A.label} vs ${B.label}`, comparison: cmp }));
  root.querySelector('[data-export-cmp]')?.addEventListener('click', () => download('comparison.json', JSON.stringify({ ...meta(app.catalogue.catalogueVersion), kind: 'comparison', a: A.label, b: B.label, ...cmp }, null, 2)));
}

export function update(view, app, what) { if (what === 'run-end') render(view, app); }
