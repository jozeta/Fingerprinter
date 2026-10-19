// Signal Explorer: choose which signals form the local profile, watch the digest change, see composition and correlations.
import { esc, download } from '../core/util.js';
import { canonicalize } from '../core/hash.js';
import { buildProfile, ineligibleReason, defaultSelection, leaveOneOut } from '../analysis/profile.js';
import { exportProfile } from '../analysis/report.js';
import { statusChip, protectionChip, mount, emptyState } from './components.js';
import { barChart, networkGraph } from './charts.js';

export async function render(view, app) {
  if (!Object.keys(app.results).length) {
    mount(view, `<h1 class="page-title">Signal explorer</h1>${emptyState('Run the tests first to explore your signals.', '<button class="btn btn-primary" data-action="run">Run client-side tests</button>')}${graphPanel(app)}`);
    return;
  }
  const sel = app.getSelection();
  const profile = await buildProfile(app.defs, app.results, sel);
  app.profile = profile;
  const rows = app.defs.filter((d) => !d.serverRequired).map((d) => {
    const r = app.results[d.id], why = ineligibleReason(r);
    return `<tr><td><input class="form-check-input" type="checkbox" id="sig-${d.id}" data-sig="${d.id}" ${sel.has(d.id) && !why ? 'checked' : ''} ${why ? 'disabled' : ''} aria-describedby="why-${d.id}"></td>
      <td><label for="sig-${d.id}">${esc(d.name)}</label> <a href="#" data-action="detail" data-id="${d.id}" class="small">details</a></td>
      <td>${r ? statusChip(r.executionStatus) : ''} ${r ? protectionChip(r.protectionIndicator) : ''}</td>
      <td class="small">${esc(d.stability)}</td>
      <td class="small text-muted" id="why-${d.id}">${why ? esc(why) : profile.perSignal[d.id] ? `<code>${esc(profile.perSignal[d.id].slice(0, 16))}…</code>` : 'excluded by you'}</td></tr>`;
  }).join('');
  const comp = profile.included.map((id) => ({ label: app.defs.find((d) => d.id === id).name, value: canonicalize(app.results[id].normalizedResult).length }))
    .sort((a, b) => b.value - a.value).slice(0, 15);

  const root = mount(view, `
    <h1 class="page-title">Signal explorer</h1>
    <p class="lead-muted">The local fingerprint is a ${esc(profile.digest.algorithm)} digest of the <em>normalized</em> values you select. Timestamps, durations and randomized outputs are never included. A digest summarizes measured data; it is not proof of identity and not a uniqueness score.</p>
    <section class="panel mb-3" aria-live="polite">
      <div class="panel-title">Current local digest</div>
      <div class="mono fs-6 text-break mb-1">${esc(profile.digest.hex)}</div>
      <div class="small text-muted">${profile.included.length} signals · ${profile.canonicalBytes} bytes canonical JSON · ${esc(profile.digest.algorithm)}</div>
      <div class="d-flex flex-wrap gap-2 mt-2">
        <button class="btn btn-sm btn-outline-secondary" data-reset>Reset to default selection</button>
        <button class="btn btn-sm btn-outline-secondary" data-loo>Show effect of removing each signal</button>
        <button class="btn btn-sm btn-outline-secondary" data-export>Export profile JSON</button>
      </div>
      <div id="loo" class="mt-2"></div>
    </section>
    <div class="row g-3">
      <div class="col-xl-7"><section class="panel"><div class="panel-title">Signals (toggle to include or exclude)</div>
        <div class="table-responsive"><table class="table table-sm align-middle"><thead><tr><th scope="col"><span class="visually-hidden">Include</span></th><th scope="col">Signal</th><th scope="col">Status</th><th scope="col">Stability</th><th scope="col">Digest / reason</th></tr></thead><tbody>${rows}</tbody></table></div>
      </section></div>
      <div class="col-xl-5"><section class="panel mb-3"><div class="panel-title">Signal composition</div>
        ${comp.length ? barChart(comp, { title: 'Bytes contributed per signal', desc: 'Size of each signal\'s canonical value in the profile (top 15). Size reflects data volume, not identifying power.', unit: ' B', compact: true }) : '<p class="text-muted">No signals selected.</p>'}
      </section></div>
    </div>
    <div class="mt-3">${graphPanel(app)}</div>`);

  root.addEventListener('change', (e) => {
    const id = e.target.dataset.sig; if (!id) return;
    const s = new Set(app.getSelection()); e.target.checked ? s.add(id) : s.delete(id);
    app.selection = s; render(view, app);
  });
  root.querySelector('[data-reset]').addEventListener('click', () => { app.selection = defaultSelection(app.defs, app.results); render(view, app); });
  root.querySelector('[data-export]').addEventListener('click', () => download('fingerprint-profile.json', JSON.stringify(exportProfile(profile, app.catalogue.catalogueVersion), null, 2)));
  root.querySelector('[data-loo]').addEventListener('click', async () => {
    const res = await leaveOneOut(app.defs, app.results, app.getSelection());
    root.querySelector('#loo').innerHTML = `<p class="small mb-1">Removing any single signal produces a completely different digest. That is why trackers compare signals individually (fuzzy matching) rather than relying on one hash.</p>
      <table class="table table-sm small"><thead><tr><th>Without</th><th>Digest</th></tr></thead><tbody>${res.variants.map((v) => `<tr><td>${esc(app.defs.find((d) => d.id === v.testId).name)}</td><td class="mono">${esc(v.digest.slice(0, 24))}…</td></tr>`).join('')}</tbody></table>`;
  });
}

function graphPanel(app) {
  const nodes = app.defs.filter((d) => d.combinesWith.length || app.defs.some((x) => x.combinesWith.some((c) => c.id === d.id))).map((d) => ({ id: d.id, label: d.name.length > 26 ? `${d.name.slice(0, 25)}…` : d.name }));
  const edges = app.defs.flatMap((d) => d.combinesWith.map((c) => ({ from: d.id, to: c.id, cls: c.basis === 'documented' ? 'edge-documented' : 'edge-hypothetical', label: `${c.basis}: ${c.note}` })));
  return `<section class="panel"><div class="panel-title">Signal correlation graph</div>
    ${networkGraph(nodes, edges, { size: 860, title: 'Signal correlation graph', desc: 'Signals that are commonly combined or that constrain each other. Solid lines are documented in a cited source; dashed lines are hypothetical relationships described by this lab.',
      legend: '<span class="legend-line"></span>documented (cited) &nbsp; <span class="legend-line dashed"></span>hypothetical / explanatory' })}
  </section>`;
}

export const update = render;
