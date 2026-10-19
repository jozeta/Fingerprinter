// Settings: theme, run parameters, export options, local data management, server adapter status.
import { esc, download, announce } from '../core/util.js';
import { clearAll, listSnapshots, STORAGE_NAMESPACE } from '../core/store.js';
import { activeAdapter } from '../adapters/server-adapter.js';
import { exportResults } from '../analysis/report.js';
import { mount } from './components.js';
import { printReport } from './print.js';

export function render(view, app) {
  const s = app.settings;
  const root = mount(view, `
    <h1 class="page-title">Settings</h1>
    <p class="lead-muted">Settings live in memory unless you enable "Remember settings".</p>
    <div class="row g-3">
      <div class="col-lg-6 d-grid gap-3 align-content-start">
        <section class="panel"><h2 class="h6">Appearance</h2>
          <fieldset><legend class="form-label small">Theme</legend>${['system', 'light', 'dark'].map((t) => `<div class="form-check form-check-inline"><input class="form-check-input" type="radio" name="theme" id="th-${t}" value="${t}" ${s.theme === t ? 'checked' : ''}><label class="form-check-label" for="th-${t}">${t === 'system' ? 'System preference' : t[0].toUpperCase() + t.slice(1)}</label></div>`).join('')}</fieldset>
        </section>
        <section class="panel"><h2 class="h6">Test execution</h2>
          <label class="form-label small" for="repeat">Repeated renders for consistency checks (canvas, WebGL, audio): <strong id="repeat-v">${s.repeat}</strong></label>
          <input type="range" class="form-range" id="repeat" min="1" max="5" value="${s.repeat}">
          <label class="form-label small mt-2" for="timeout">Per-test timeout (ms)</label>
          <select id="timeout" class="form-select form-select-sm">${[2000, 5000, 10000].map((v) => `<option value="${v}" ${s.timeoutMs === v ? 'selected' : ''}>${v}</option>`).join('')}</select>
          <div class="form-check form-switch mt-3"><input class="form-check-input" type="checkbox" role="switch" id="adv" ${s.includeAdvanced ? 'checked' : ''}><label class="form-check-label" for="adv">Include advanced tests in "Run"</label></div>
        </section>
        <section class="panel"><h2 class="h6">Export &amp; reports</h2>
          <div class="form-check form-switch"><input class="form-check-input" type="checkbox" role="switch" id="raw" ${s.exportRaw ? 'checked' : ''}><label class="form-check-label" for="raw">Include raw data in results export</label></div>
          <p class="small text-muted">Raw data can include your exact GPU model, fonts, languages, timezone and (if you ran it) local IP addresses. It is off by default.</p>
          <div class="d-flex flex-wrap gap-2"><button class="btn btn-sm btn-outline-secondary" data-export ${Object.keys(app.results).length ? '' : 'disabled'}>Export full results JSON</button><button class="btn btn-sm btn-outline-secondary" data-print ${Object.keys(app.results).length ? '' : 'disabled'}>Printable report</button></div>
        </section>
      </div>
      <div class="col-lg-6 d-grid gap-3 align-content-start">
        <section class="panel"><h2 class="h6">Local persistence</h2>
          <div class="form-check form-switch"><input class="form-check-input" type="checkbox" role="switch" id="remember" ${s.remember ? 'checked' : ''}><label class="form-check-label" for="remember">Remember settings in this browser</label></div>
          <p class="small text-muted">Stored under <code>${esc(STORAGE_NAMESPACE)}settings</code>. Saved snapshots: ${listSnapshots().length}.</p>
          <button class="btn btn-sm btn-outline-danger" data-clear>Clear all local data (settings, snapshots, results in memory)</button>
        </section>
        <section class="panel"><h2 class="h6">Server adapter</h2>
          <p class="small mb-1">Status: <strong>${activeAdapter.enabled ? 'enabled' : 'disabled'}</strong> (${esc(activeAdapter.id)})</p>
          <p class="small text-muted mb-0">The static build includes only a null adapter, so server-only techniques show as "Server-only". A deployer can add an adapter that discloses its endpoint, what it observes and stores, retention and logging. The visitor must consent before it runs. See <code>docs/SERVER-ADAPTER.md</code>.</p>
        </section>
      </div>
    </div>`);

  const upd = (patch) => { app.updateSettings(patch); announce('Setting saved.'); };
  root.querySelectorAll('input[name="theme"]').forEach((r) => r.addEventListener('change', () => upd({ theme: r.value })));
  root.querySelector('#repeat').addEventListener('input', (e) => { root.querySelector('#repeat-v').textContent = e.target.value; upd({ repeat: Number(e.target.value) }); });
  root.querySelector('#timeout').addEventListener('change', (e) => upd({ timeoutMs: Number(e.target.value) }));
  root.querySelector('#adv').addEventListener('change', (e) => upd({ includeAdvanced: e.target.checked }));
  root.querySelector('#raw').addEventListener('change', (e) => upd({ exportRaw: e.target.checked }));
  root.querySelector('#remember').addEventListener('change', (e) => upd({ remember: e.target.checked }));
  root.querySelector('[data-export]').addEventListener('click', () => download('fingerprint-results.json', JSON.stringify(exportResults(app.results, { includeRaw: s.exportRaw, entityCatalogueVersion: app.catalogue.catalogueVersion }), null, 2)));
  root.querySelector('[data-print]').addEventListener('click', () => printReport(app));
  root.querySelector('[data-clear]').addEventListener('click', () => {
    clearAll(); app.results = {}; app.selection = null; app.snapshots = []; app.lab.pointer = []; app.lab.keys = [];
    app.updateSettings({ remember: false }); announce('All local data cleared.'); render(view, app); app.emit('cleared');
  });
}

export function update() {}
