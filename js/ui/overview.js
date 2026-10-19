// Overview: hero with the live fingerprint-ridge figure, pre-run explanation (nothing auto-runs),
// result breakdowns (category × status, relevance × outcome), distinctive signals and limitations.
import { esc } from '../core/util.js';
import { STATUSES, CATEGORIES } from '../core/constants.js';
import { statusChip, mount } from './components.js';
import { stackedBars, countMatrix, ridgeFigure, segmentOf, statusLegend, firstTime } from './charts.js';
import { assess } from '../analysis/assessment.js';

const VALUE = new Set(['measured', 'inferred']);
const LEVEL_TEXT = { low: 'Low', moderate: 'Moderate', elevated: 'Elevated', indeterminate: 'Not enough data' };

function countUp(root) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  root.querySelectorAll('[data-count]').forEach((el) => {
    const to = Number(el.dataset.count), t0 = performance.now();
    const step = (t) => { const p = Math.min(1, (t - t0) / 700); el.textContent = Math.round(to * (1 - (1 - p) ** 3)); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}

export function render(view, app) {
  const results = app.results, ran = Object.values(results);
  const counts = Object.fromEntries(Object.keys(STATUSES).map((s) => [s, 0]));
  ran.forEach((r) => counts[r.executionStatus]++);
  const groups = Object.entries(CATEGORIES).map(([k, c]) => ({ key: k, label: c.label, items: app.defs.filter((d) => d.category === k).map((d) => ({ id: d.id, name: d.name, status: results[d.id]?.executionStatus })) })).filter((g) => g.items.length);
  const auto = app.defs.filter((d) => !d.serverRequired && !d.interaction);
  const readable = counts.measured + counts.inferred;

  const hero = `
  <section class="hero">
    <div>
      <h1>See what any website can learn about your browser.</h1>
      <p>Websites can recognise a browser without cookies, just by reading how it is set up and how it draws, sounds and calculates. This lab runs ${auto.length} of those checks on your own browser, shows the results, and explains each one in plain language.</p>
      ${ran.length ? `<div class="kpis" aria-label="Summary">
          <div><div class="kpi" data-count="${readable}">${readable}</div><div class="kpi-label">signals your browser revealed</div></div>
          <div><div class="kpi" data-count="${counts.blocked}">${counts.blocked}</div><div class="kpi-label">blocked by your browser</div></div>
          <div><div class="kpi" data-count="${ran.length}">${ran.length}</div><div class="kpi-label">checks completed of ${app.defs.length}</div></div>
        </div>` : `
        <ul class="mt-3 mb-3 small" style="max-width:52ch">
          <li>Everything runs on this page. <strong>Nothing is sent anywhere</strong>, and results disappear when you close the tab.</li>
          <li><strong>No permission prompts</strong>: no camera, microphone, location or notifications.</li>
          <li>${app.defs.filter((d) => d.interaction).length} checks only run if you start them, and ${app.defs.filter((d) => d.serverRequired).length} server-side techniques are explained but cannot be measured here.</li>
        </ul>`}
      <div class="d-flex flex-wrap gap-2 mt-3">
        ${app.running ? '<button class="btn btn-outline-secondary" data-action="cancel">Stop</button>' : `<button class="btn btn-primary" data-action="run">${ran.length ? 'Run the checks again' : 'Run the checks'}</button>`}
        <a class="btn btn-outline-secondary" href="#/tests">${ran.length ? 'See every result' : 'Read about each check first'}</a>
      </div>
    </div>
    <div>
      ${ridgeFigure(groups, { title: 'Your fingerprint, by category', desc: 'Each ridge is one category of checks and each segment one check. Colour shows the result: blue revealed, amber estimated, green blocked, grey unavailable, violet server-only. Click a segment for details.' })}
      ${statusLegend()}
      <p class="small text-muted mb-0">Each ridge is a category, each segment a check. Click a segment to open it.</p>
    </div>
  </section>`;

  if (!ran.length) { const root = mount(view, `${hero}<p class="small text-muted mt-4">Exposing these properties is normal for every browser. It is a <em>privacy</em> question, not a sign that your browser is broken or hacked.</p>`); countUp(root); return; }

  const catRows = groups.map((g) => ({ label: g.label, counts: g.items.reduce((a, it) => { const s = it.status ? segmentOf(it.status) : 'pending'; a[s] = (a[s] || 0) + 1; return a; }, {}) }));
  const rel = ['high', 'medium', 'low'];
  const cols = ['Readable', 'Protected', 'Unknown'];
  const matrix = rel.map((lv) => {
    const ds = app.defs.filter((d) => d.relevance === lv && results[d.id] && !d.serverRequired);
    const r = ds.filter((d) => VALUE.has(results[d.id].executionStatus) && results[d.id].protectionIndicator !== 'randomized').length;
    const p = ds.filter((d) => results[d.id].executionStatus === 'blocked' || ['randomized', 'standardized'].includes(results[d.id].protectionIndicator)).length;
    return [r, p, ds.length - r - p];
  });
  const distinctive = app.defs.filter((d) => d.relevance === 'high' && VALUE.has(results[d.id]?.executionStatus) && results[d.id].protectionIndicator !== 'randomized');
  const protections = app.defs.filter((d) => ['randomized', 'standardized', 'blocked'].includes(results[d.id]?.protectionIndicator));
  const a = assess(app.defs, results, { repeat: app.settings.repeat });
  const combos = app.defs.flatMap((d) => d.combinesWith.filter((c) => c.basis === 'documented').map((c) => ({ a: d, b: app.defs.find((x) => x.id === c.id), c })))
    .filter((x) => x.b && VALUE.has(results[x.a.id]?.executionStatus) && VALUE.has(results[x.b.id]?.executionStatus))
    .filter((x, i, arr) => arr.findIndex((y) => [y.a.id, y.b.id].sort().join() === [x.a.id, x.b.id].sort().join()) === i); // each pair once

  const root = mount(view, `${hero}
  <div class="section-head"><h2>Results by category</h2><a href="#/tests" class="small">Open the full list</a></div>
  <div class="row g-4">
    <div class="col-xl-8"><section class="panel h-100">
      <div class="panel-title">What each category revealed</div><div class="panel-sub">Share of checks per category by result. "Readable" counts revealed and estimated values.</div>
      ${stackedBars(catRows, { title: 'Results by category', desc: 'Each bar is a category, split by result. Longer blue and amber parts mean more readable signals.' })}
    </section></div>
    <div class="col-xl-4"><section class="panel h-100">
      <div class="panel-title">Privacy exposure</div><div class="panel-sub">A rough, rule-based rating, not a security score.</div>
      <p class="mb-1"><span class="fs-2 fw-bold">${esc(LEVEL_TEXT[a.level])}</span></p>
      <p class="small text-muted">Confidence ${esc(a.confidence)}, based on ${a.ranCount} checks. <a href="#/assessment">Why, and what to do</a></p>
      <div class="panel-title mt-3">How identifying are the readable signals?</div><div class="panel-sub">Rows: how useful a signal is for tracking, according to research.</div>
      ${countMatrix(['High', 'Medium', 'Low'], cols, matrix, { title: 'Relevance by outcome', desc: 'Darker cells hold more checks. Readable high-relevance signals matter most for tracking.' })}
    </section></div>
  </div>
  <div class="section-head"><h2>What stands out</h2></div>
  <div class="row g-4">
    <div class="col-lg-4"><section class="panel h-100"><div class="panel-title">Most identifying signals you revealed</div><div class="panel-sub">High-relevance checks that returned a stable value.</div>
      ${distinctive.length ? `<ul class="mb-0">${distinctive.map((d) => `<li><a href="#" data-action="detail" data-id="${d.id}">${esc(d.name)}</a></li>`).join('')}</ul>` : '<p class="text-muted mb-0">None. Your browser protected or withheld every high-relevance signal.</p>'}</section></div>
    <div class="col-lg-4"><section class="panel h-100"><div class="panel-title">Signals that are stronger together</div><div class="panel-sub">Pairs that research shows are combined, both readable here.</div>
      ${combos.length ? `<ul class="mb-0">${combos.map((x) => `<li>${esc(x.a.name)} + ${esc(x.b.name)}</li>`).join('')}</ul>` : '<p class="text-muted mb-0">No documented pair was fully readable.</p>'}
      <p class="small mt-2 mb-0"><a href="#/signals">Explore all connections</a></p></section></div>
    <div class="col-lg-4"><section class="panel h-100"><div class="panel-title">Protections your browser used</div><div class="panel-sub">Blocked, randomised or standardised results.</div>
      ${protections.length ? `<ul class="mb-0">${protections.map((d) => `<li><a href="#" data-action="detail" data-id="${d.id}">${esc(d.name)}</a> <span class="small text-muted">${esc(results[d.id].protectionIndicator)}</span></li>`).join('')}</ul>` : '<p class="text-muted mb-0">None seen. That does not prove no protection is active.</p>'}</section></div>
  </div>
  <div class="section-head"><h2>Every check, by result</h2></div>
  <div class="d-flex flex-wrap gap-2">${Object.entries(counts).filter(([, n]) => n).map(([s, n]) => `<a href="#/tests" class="text-decoration-none" data-status-link="${s}">${statusChip(s)} <span class="small text-muted">${n}</span></a>`).join('')}</div>
  <div class="section-head"><h2>Keep in mind</h2></div>
  <ul class="small text-muted" style="max-width:80ch">
    <li>This page only looks at <em>your</em> browser. It cannot see what any company does, and it never claims a company has tracked you.</li>
    <li>There is no "you are 1 in a million" number: that would need a large, representative comparison database, which this lab deliberately does not have.</li>
    <li>Your IP address, network and HTTP details are visible to every server you visit, but this page cannot measure them.</li>
    <li>"Blocked" or "unavailable" means unknown, not pass or fail.</li>
  </ul>`);

  root.querySelectorAll('[data-status-link]').forEach((el) => el.addEventListener('click', () => { app.filter.statuses = [el.dataset.statusLink]; }));
  if (firstTime('kpis')) countUp(root);
}
