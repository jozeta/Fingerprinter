// Application bootstrap: load catalogues, register tests, route views, run tests. State lives in memory only.
import { registerAll, allTests, checkIntegrity, getTest } from './core/registry.js';
import { runMany, runOne } from './core/engine.js';
import { loadSettings, saveSettings } from './core/store.js';
import { $, announce, esc } from './core/util.js';
import { ALL_DEFINITIONS } from './tests/index.js';
import { indexAssociations, emptyFilter } from './analysis/filters.js';
import { defaultSelection } from './analysis/profile.js';
import { activeAdapter } from './adapters/server-adapter.js';
import * as overview from './ui/overview.js';
import * as testsView from './ui/tests.js';
import * as signals from './ui/signals.js';
import * as entities from './ui/entities.js';
import * as compare from './ui/compare.js';
import * as assessment from './ui/assessment.js';
import * as learn from './ui/learn.js';
import * as methodology from './ui/methodology.js';
import * as settingsView from './ui/settings.js';
import { openDetail } from './ui/detail.js';
import { hydrateIcons } from './ui/icons.js';
import { initTooltips } from './ui/tooltip.js';
import { APP_VERSION } from './core/constants.js';

const VIEWS = { overview, tests: testsView, signals, entities, compare, assessment, learn, methodology, settings: settingsView };

export const app = {
  defs: [], sources: {}, catalogue: { entities: [] }, assocIndex: {}, integrityProblems: [],
  results: {}, settings: loadSettings(), running: false, abort: null, progress: null,
  selection: null, // Set of test ids in the fingerprint profile; null = default selection
  lab: { pointer: [], keys: [] }, snapshots: [], filter: emptyFilter(), route: 'overview', current: null,
  listeners: new Set(),
  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
  emit(what) { this.listeners.forEach((fn) => fn(what)); },

  associationsFor(id) {
    return (this.assocIndex[id] || []).map(({ entity, association }) => ({ entityId: entity.entityId, name: entity.name, relation: association.relation, evidenceLevel: association.evidenceLevel }));
  },
  runOptions(extra = {}) {
    return { repeat: this.settings.repeat, timeoutMs: this.settings.timeoutMs, associationsFor: (id) => this.associationsFor(id),
      options: { lab: this.lab, serverObservations: this.serverObservations, ...extra } };
  },
  getSelection() { return this.selection || defaultSelection(this.defs, this.results); },

  async runAll() {
    if (this.running) return;
    const list = this.defs.filter((d) => this.settings.includeAdvanced || d.tier === 'basic');
    this.running = true; this.abort = new AbortController(); this.progress = { done: 0, total: list.length, current: '' };
    this.serverObservations = activeAdapter.enabled ? await activeAdapter.observe() : {};
    announce(`Running ${list.length} tests.`); renderRunBox(); this.emit('run-start');
    await runMany(list, { ...this.runOptions(), signal: this.abort.signal, results: {},
      onResult: (r, i, total) => { this.results[r.testId] = r; this.progress = { done: i + 1, total, current: r.techniqueName }; renderRunBox(); this.emit('result'); } });
    const cancelled = this.abort.signal.aborted;
    this.running = false; this.abort = null; this.lastRunAt = new Date();
    announce(cancelled ? 'Run cancelled. Remaining tests were skipped.' : 'All tests finished.');
    renderRunBox(); this.emit('run-end');
  },
  cancel() { this.abort?.abort(); },
  async rerun(id, extra = {}) {
    const def = getTest(id); if (!def) return;
    const r = await runOne(def, { ...this.runOptions(extra), results: this.results });
    this.results[id] = r; announce(`${def.name}: ${r.executionStatus}`); this.emit('result'); return r;
  },
  updateSettings(patch) { Object.assign(this.settings, patch); saveSettings(this.settings); applyTheme(); this.emit('settings'); },
  navigate(route) { location.hash = `#/${route}`; },
  openDetail(id) { openDetail(this, id); },
};

function applyTheme() {
  const t = app.settings.theme === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : app.settings.theme;
  document.documentElement.dataset.bsTheme = t;
}

function renderRunBox() {
  const box = $('#run-box'); if (!box) return;
  const ran = Object.keys(app.results).length;
  if (app.running) {
    const p = app.progress;
    box.innerHTML = `<div class="fw-semibold mb-1">Running ${p.done}/${p.total}</div>
      <div class="progress mb-2" role="progressbar" aria-label="Test progress" aria-valuenow="${p.done}" aria-valuemin="0" aria-valuemax="${p.total}" style="height:6px"><div class="progress-bar" style="width:${(p.done / p.total) * 100}%"></div></div>
      <div class="small text-muted text-truncate mb-2">${esc(p.current)}</div>
      <button class="btn btn-sm btn-outline-danger w-100" data-action="cancel"><i class="bi bi-stop-circle" aria-hidden="true"></i> Cancel run</button>`;
  } else {
    box.innerHTML = ran
      ? `<div class="small mb-2">${ran} results in memory${app.lastRunAt ? ` · ${app.lastRunAt.toLocaleTimeString()}` : ''}</div><button class="btn btn-sm btn-primary w-100" data-action="run"><i class="bi bi-arrow-repeat" aria-hidden="true"></i> Run again</button>`
      : `<div class="small mb-2">No tests run yet.</div><a class="btn btn-sm btn-primary w-100" href="#/overview"><i class="bi bi-play" aria-hidden="true"></i> Review &amp; start</a>`;
  }
}

// Fade sections up as they scroll into view, once per page visit (never during live result updates).
function revealOnScroll(view) {
  if (app.running || matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const els = [...view.querySelectorAll('.panel, .lesson, .test-row, .section-head')].slice(0, 80);
  const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  els.forEach((el, i) => { el.classList.add('reveal'); el.style.setProperty('--d', `${Math.min(i, 8) * 40}ms`); io.observe(el); });
}

// Brief "Copied" confirmation on any button with data-copied-label after a successful copy.
export function confirmCopy(btn, ok) {
  if (!btn) return;
  const label = btn.dataset.label || btn.textContent; btn.dataset.label = label;
  btn.textContent = ok ? 'Copied ✓' : 'Copy failed'; btn.classList.add('copied');
  setTimeout(() => { btn.textContent = label; btn.classList.remove('copied'); }, 1800);
}

function route() {
  const name = (location.hash.match(/^#\/([a-z]+)/) || [])[1] || 'overview';
  app.route = VIEWS[name] ? name : 'overview';
  document.querySelectorAll('#nav-links .nav-link').forEach((a) => { const on = a.dataset.route === app.route; a.classList.toggle('active', on); a.toggleAttribute('aria-current', on); if (on) a.setAttribute('aria-current', 'page'); });
  const view = $('#view');
  app.current = VIEWS[app.route];
  app.current.render(view, app);
  revealOnScroll(view);
  document.title = `${document.querySelector(`[data-route="${app.route}"]`)?.textContent.trim()} · Fingerprinting Lab`;
  view.focus({ preventScroll: true }); window.scrollTo(0, 0);
  bootstrap.Offcanvas.getInstance('#sidebar')?.hide();
}

let pending = false;
app.on((what) => {
  if (pending) return;
  pending = true;
  requestAnimationFrame(() => { pending = false; (app.current.update || app.current.render)($('#view'), app, what); });
});

async function loadJSON(path) {
  const res = await fetch(path, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
}

async function init() {
  window.__fplabStarted = true; // read by js/boot-check.js
  hydrateIcons();
  initTooltips();
  const v = document.getElementById('app-version'); if (v) v.textContent = `Version ${APP_VERSION}`;
  applyTheme();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
  try {
    const [sources, catalogue] = await Promise.all([loadJSON('data/sources.json'), loadJSON('data/entities.json')]);
    app.sources = sources.sources; app.sourcesVersion = sources.catalogueVersion; app.catalogue = catalogue;
  } catch (e) {
    $('#view').innerHTML = `<div class="alert alert-danger">Could not load catalogues (${esc(e.message)}). Serve this folder over HTTP, e.g. <code>python3 scripts/serve.py</code>; ES modules and fetch do not work from <code>file://</code>.</div>`;
    return;
  }
  registerAll(ALL_DEFINITIONS);
  app.defs = allTests();
  app.assocIndex = indexAssociations(app.catalogue.entities);
  app.integrityProblems = checkIntegrity(app.sources);
  if (app.integrityProblems.length) console.warn('Catalogue integrity problems:', app.integrityProblems);
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-action]'); if (!a) return;
    if (a.dataset.action === 'run') app.runAll();
    if (a.dataset.action === 'cancel') app.cancel();
    if (a.dataset.action === 'detail') app.openDetail(a.dataset.id);
    if (a.dataset.action === 'go') app.navigate(a.dataset.route);
  });
  addEventListener('hashchange', route);
  renderRunBox();
  route();
}

init();
