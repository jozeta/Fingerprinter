// Learning Center: lessons (theory) and exercises that use the real test engine (measured) or labeled illustrations.
import { esc } from '../core/util.js';
import { digest } from '../core/hash.js';
import { getTest } from '../core/registry.js';
import { runOne } from '../core/engine.js';
import { buildProfile } from '../analysis/profile.js';
import { mount, kvTable } from './components.js';
import { ILLUSTRATIONS } from './illustrations.js';
import { EFF_ENTROPY } from '../analysis/commonness.js';

const B = { measured: '<span class="chip badge-measured-data">Uses your browser</span>', illustrative: '<span class="chip badge-illustrative">Illustrative example</span>', theory: '<span class="chip badge-theory">Theory</span>' };

const LESSONS = [
  ['fundamentals', 'What is a browser fingerprint?', 'Your browser shares many small details: screen size, fonts, graphics chip, language, time zone. One detail is shared by millions. All of them together often describe only a few browsers, or just yours. A website can combine them into an ID without storing anything on your device.'],
  ['passive', 'Passive and active fingerprinting', '<strong>Passive</strong>: details your browser sends with every request anyway, like your IP address and HTTP headers. <strong>Active</strong>: a script on the page asks questions or makes the browser do something, such as drawing an image or processing a silent sound, and measures the result. Passive tracking is invisible, even to privacy tools that watch scripts.'],
  ['cookies', 'Fingerprints vs cookies', 'A cookie is a note a site stores on your device. You can see it and delete it. A fingerprint is never stored; it is worked out again on every visit. Trackers often use both: if you delete the cookie, the fingerprint lets them reconnect you to your old profile.'],
  ['ip', 'Fingerprints vs IP addresses', 'Your IP address belongs to the network you are on. It changes when you move from home Wi-Fi to mobile data, and many people can share one. A fingerprint belongs to your browser and device, so it stays the same across networks. Combined, they are stronger: a VPN hides the IP but not the fingerprint, and a time zone that does not match the IP location gives the VPN away.'],
  ['entropy', 'How unique am I? (bits and crowds)', 'Think of a crowd that looks exactly like you. Every useful detail roughly halves that crowd; each halving is called one <em>bit</em>. About 33 halvings would single out one person on Earth. Real numbers depend on who is in the comparison group: test sites visited by privacy enthusiasts report far more uniqueness than studies of ordinary visitors (83.6% vs 33.6% unique). That is why this lab does not give you a uniqueness score.'],
  ['correlation', 'Why details overlap', 'Details are not independent. Your fonts depend on your operating system; your graphics chip affects how canvas images look. Overlapping details add less than they seem. Details that <em>contradict</em> each other, like a "Windows" browser with a Mac-only graphics chip, are rare and stand out.'],
  ['canvas', 'Canvas and WebGL: drawing gives you away', 'A script draws text and shapes on a hidden canvas and reads back the pixels. The picture looks the same to you, but tiny differences in fonts, smoothing and the graphics chip make the pixels differ between devices. A hash of the pixels becomes a compact, stable ID, unless your browser adds noise or blocks the read-back.'],
  ['audio', 'Audio fingerprinting without sound', 'A script builds a small audio chain (a tone through a compressor) and processes it silently in memory. Nothing plays. Different browsers and processors round the numbers slightly differently, which mostly reveals your browser and system type.'],
  ['defenses', 'How browsers defend you', '<strong>Look the same</strong>: Tor and Mullvad Browser make every user report identical values. <strong>Shuffle</strong>: Brave, Safari and Firefox add small random changes so values differ per site or session. <strong>Hide</strong>: browsers reveal fewer details (fewer fonts, a frozen User-Agent). <strong>Block</strong>: tracking protection stops known fingerprinting scripts before they run.'],
  ['timeline', 'What happens when a tracking script runs', 'A site includes a script from an analytics, advertising or anti-fraud company. Within a fraction of a second it reads dozens of traits, combines them into a short code and sends it home. The company compares the code with ones it has seen before. Nothing pops up and nothing is stored on your device.'],
  ['fuzzy', 'Why small changes do not shake trackers off', 'Fingerprints drift: a browser update, a new font, an external monitor. Trackers know this, so they compare traits one by one and accept a close match. Changing one detail rarely helps; it usually just adds a "new version" of you to their records.'],
  ['vpn', 'VPNs, private windows and fingerprints', 'A VPN hides your IP address but not your browser\'s traits. A private window forgets cookies and history when closed, but your screen, fonts and graphics chip stay the same. Only browsers built for uniformity (Tor Browser, Mullvad Browser) aim to hide both.'],
  ['lies', 'Why faking your details can backfire', 'Extensions that fake your screen size or browser name often make you <em>more</em> unique: very few people tell exactly the same lie, and fakes rarely match your other traits. Built-in browser protections are safer because many people share them.'],
  ['mobile', 'Phones and computers', 'Phones of the same model with the same system version look very alike, so they are harder to tell apart by traits alone; they are often tracked through apps and logins instead. Computers vary much more in screens, fonts, graphics and installed software.'],
  ['evidence', 'How this lab rates evidence', 'Every link between a company and a technique carries a level. L1 means confirmed (for example in published source code), L2 documented by the company itself, L3 shown by independent research, L4 plausible for that kind of company but unverified, and L5 unverified. This keeps rumours apart from facts.'],
  [null, 'Why deleting cookies is not enough', 'Clearing cookies removes stored IDs, but your fonts, screen and graphics chip stay the same, so a fingerprint does too. Try Exercise 1: the result does not change after clearing.'],
  [null, 'Reading a fingerprint digest', 'A digest (like SHA-256) is a short code made from exactly the details you selected. Change one character and the whole code changes. Two equal codes mean equal inputs, but say nothing about how many other people share them. Real trackers compare details one by one and tolerate small changes.'],
  [null, 'Is this a security hole?', 'No. Sharing your screen size or graphics chip does not let anyone take over your computer. It is a <em>privacy</em> issue when used to follow you without your consent. In the EU, reading this information for tracking generally requires your consent, just like cookies.'],
  [null, 'Who uses this, and why?', 'The same techniques serve very different goals: banks use them to spot account takeover, shops to stop bots, advertisers to follow you across sites, and scammers to hide from security scanners. The Companies &amp; Adversaries page shows who is documented to use what, and how strong the evidence is. Research in 2025 also showed these details can be used to guess demographics such as age group.'],
];

const lab = { active: false, last: null, down: {} };

export function render(view, app) {
  const root = mount(view, `
    <h1 class="page-title">Learning center</h1>
    <p class="lead-muted">Short explanations with pictures, followed by exercises that run on your own browser.</p>
    <div class="row g-3">
      <div class="col-12"><div class="lesson-grid">${LESSONS.map(([ill, t, body]) => `<article class="lesson"><h3>${esc(t)}</h3>${ill ? ILLUSTRATIONS[ill] : ''}<p>${body}</p></article>`).join('')}</div></div>
      <div class="col-12"><div class="section-head"><h2>Try it yourself</h2><span class="small text-muted">${B.measured} uses your browser · ${B.illustrative} is an example</span></div></div>
      <div class="col-12"><div class="lesson-grid">
        <section class="panel"><div class="panel-title">Exercise 1: Does clearing storage change your fingerprint? ${B.measured}</div>
          <ol class="small"><li>Compute the digest of your current stable signals.</li><li>Clear all of this lab's stored data (everything under the <code>fplab</code> namespace).</li><li>Re-measure and compare.</li></ol>
          <button class="btn btn-sm btn-primary" data-ex1>Run exercise</button><div id="ex1" class="small mt-2" role="status"></div></section>
        <section class="panel"><div class="panel-title">Exercise 2: Is your canvas output stable or randomized? ${B.measured}</div>
          <p class="small">Renders the canvas test five times and compares digests. Identical digests suggest a stable signal; different digests suggest noise injection.</p>
          <button class="btn btn-sm btn-primary" data-ex2>Render 5 times</button><div id="ex2" class="small mt-2" role="status"></div></section>
        <section class="panel"><div class="panel-title">Exercise 3: Anonymity sets ${B.illustrative}</div>
          <p class="small">Illustration only, not your data. Assumes 8 billion people and independent, evenly distributed signals, which real data never are.</p>
          <label for="bits" class="form-label small">Bits of identifying information: <strong id="bits-v">10</strong></label>
          <input type="range" class="form-range" id="bits" min="0" max="34" value="3">
          <svg class="illus people" viewBox="0 0 300 76" aria-hidden="true">${Array.from({ length: 128 }, (_, k) => `<circle cx="${6 + (k % 32) * 9.2}" cy="${8 + Math.floor(k / 32) * 18}" r="3.6" data-k="${k}"/>`).join('')}</svg>
          <p class="small mb-0" id="bits-out" aria-live="polite"></p></section>
        <section class="panel" id="bits-ex"><div class="panel-title">Exercise 4: Your signals in bits ${B.illustrative}</div>
          <p class="small">How much the signals that the EFF study measured would narrow you down, using that study's average figures (2010, 470,161 browsers). Only signals your browser actually revealed are counted.</p>
          <div id="bits-bars"></div>
          <p class="small text-muted mb-0">An illustration, not a measurement of you: averages from an older, self-selected sample, and signals overlap, so real totals are lower.</p></section>
        <section class="panel"><div class="panel-title">Exercise 5: Digest sensitivity ${B.measured}</div>
          <label class="form-label small" for="dg">Type anything. The SHA-256 digest is computed locally.</label>
          <input id="dg" class="form-control form-control-sm mb-2" value="Europe/Stockholm">
          <div class="mono small text-break" id="dg-out" aria-live="polite"></div></section>
        <section class="panel"><div class="panel-title">Exercise 6: Behavior lab ${B.measured}</div>
          <p class="small">Nothing is recorded until you press <em>Start</em>. Pointer data comes only from the pad; for typing, only key-press <em>timings</em> are kept, never which keys. Data stays in memory and is cleared by <em>Reset</em>.</p>
          <div class="d-flex gap-2 mb-2"><button class="btn btn-sm btn-primary" data-lab-start aria-pressed="false">Start recording</button><button class="btn btn-sm btn-outline-secondary" data-lab-reset>Reset</button><button class="btn btn-sm btn-outline-primary" data-lab-analyze>Analyze</button></div>
          <canvas class="lab-pad mb-2" id="pad" aria-label="Pointer recording pad. Move your pointer here after pressing Start."></canvas>
          <label class="form-label small" for="typing">Typing box</label><textarea id="typing" class="form-control form-control-sm" rows="2" autocomplete="off" spellcheck="false"></textarea>
          <div id="lab-out" class="small mt-2" role="status"></div></section>
      </div></div>
    </div>`);

  // Exercise 1
  root.querySelector('[data-ex1]').addEventListener('click', async (e) => {
    const out = root.querySelector('#ex1'); e.target.disabled = true;
    const stableDefs = app.defs.filter((d) => d.includeByDefault && !d.serverRequired && !d.interaction);
    const measure = async () => { const res = {}; for (const d of stableDefs) res[d.id] = await runOne(d, { ...app.runOptions(), results: res }); return res; };
    out.textContent = 'Measuring…';
    const before = await measure();
    const selection = new Set(stableDefs.map((d) => d.id));
    const d1 = (await buildProfile(stableDefs, before, selection)).digest.hex;
    // Only the lab's own namespace: cookies on localhost are shared across ports, so never touch other cookies.
    try { for (const st of [localStorage, sessionStorage]) Object.keys(st).filter((k) => k.startsWith('fplab')).forEach((k) => st.removeItem(k)); } catch {}
    document.cookie.split(';').map((c) => c.split('=')[0].trim()).filter((n) => n.startsWith('fplab')).forEach((n) => { document.cookie = `${n}=; max-age=0; path=/`; });
    const after = await measure();
    const d2 = (await buildProfile(stableDefs, after, selection)).digest.hex;
    out.innerHTML = `<p class="mb-1">Before: <code>${esc(d1.slice(0, 24))}…</code><br>After clearing storage: <code>${esc(d2.slice(0, 24))}…</code></p>
      <p class="mb-0 fw-semibold">${d1 === d2 ? 'Identical. Clearing storage did not change the fingerprint.' : 'Different. Some signal changed between measurements (e.g. randomization or a volatile value); open the Signal Explorer to see which.'}</p>
      <p class="text-muted mb-0">Note: this cleared the lab's saved settings and snapshots, if you had any.</p>`;
    e.target.disabled = false;
  });

  // Exercise 2
  root.querySelector('[data-ex2]').addEventListener('click', async (e) => {
    e.target.disabled = true;
    const def = getTest('canvas-2d'); const ds = [];
    for (let i = 0; i < 5; i++) { const r = await runOne(def, { repeat: 1 }); ds.push(r.rawResult?.digest || r.executionStatus); }
    const uniq = new Set(ds).size;
    root.querySelector('#ex2').innerHTML = `<ol class="mono mb-1">${ds.map((d) => `<li>${esc(String(d).slice(0, 32))}</li>`).join('')}</ol><strong>${uniq === 1 ? 'Stable: all five renders were identical.' : `${uniq} distinct digests: output appears randomized.`}</strong>`;
    e.target.disabled = false;
  });

  // Exercise 3
  const bits = root.querySelector('#bits');
  const showBits = () => { const b = Number(bits.value); root.querySelector('#bits-v').textContent = b; const crowd = 8e9 / 2 ** b;
    const keep = Math.max(1, Math.round(128 / 2 ** Math.min(b, 7)));
    root.querySelectorAll('.people circle').forEach((c) => { const on = Number(c.dataset.k) < keep; c.style.fill = on ? 'var(--s-measured)' : 'var(--ice)'; });
    root.querySelector('#bits-out').textContent = crowd >= 1 ? `Illustration: about ${Math.round(crowd).toLocaleString()} people would share this combination.` : 'Illustration: fewer than one person on average. In theory, unique.'; };
  bits.addEventListener('input', showBits); showBits();

  // Exercise 6: EFF 2010 bits for signals revealed in this browser (illustrative)
  const host = root.querySelector('#bits-bars');
  // Plugin lists are standardised in today's browsers, so the 2010 plugin figure is shown but never counted.
  const OUTDATED = { 'plugins-mime': 'not counted: plugin lists are the same for everyone today' };
  const rows = Object.entries(EFF_ENTROPY).map(([id, e]) => ({ id, ...e, name: app.defs.find((d) => d.id === id)?.name || id, on: !OUTDATED[id] && ['measured', 'inferred'].includes(app.results[id]?.executionStatus), note: OUTDATED[id] }));
  if (!Object.keys(app.results).length) host.innerHTML = '<p class="small"><button class="btn btn-sm btn-primary" data-action="run">Run the checks</button> to fill this in.</p>';
  else {
    const total = rows.filter((r) => r.on).reduce((a, r) => a + r.bits, 0);
    host.innerHTML = `<div class="bits-stack" role="img" aria-label="${total.toFixed(1)} bits out of 33">${rows.filter((r) => r.on).map((r, i) => `<span style="flex:${r.bits};--i:${i}" title="${esc(r.name)}: ${r.bits} bits"><em>${esc(r.name.split(' ')[0])}</em></span>`).join('')}<i class="bits-line" style="left:${Math.min(100, (33 / Math.max(33, total)) * 100)}%"></i></div>
      <table class="table table-sm small mt-2 mb-1"><tbody>${rows.map((r) => `<tr class="${r.on ? '' : 'text-muted'}"><td>${esc(r.name)}</td><td>${r.bits} bits</td><td>${r.note ? esc(r.note) : r.on ? 'revealed here' : r.id.startsWith('srv-') ? 'server-only' : 'not revealed'}${r.id === 'fonts' && r.on ? ' (2010 figure via Flash; an upper bound today)' : ''}</td></tr>`).join('')}</tbody></table>
      <p class="small mb-1"><strong>${total.toFixed(1)} bits</strong> from these signals alone; the line marks 33 bits, roughly enough to single out one person among 8 billion.</p>`;
  }

  // Exercise 4
  const dg = root.querySelector('#dg');
  const showDigest = async () => { const d = await digest(dg.value); root.querySelector('#dg-out').textContent = `${d.algorithm}: ${d.hex}`; };
  dg.addEventListener('input', showDigest); showDigest();

  // Exercise 5: behavior lab (records only after Start, only inside these widgets)
  const pad = root.querySelector('#pad'), ctx = pad.getContext('2d'), typing = root.querySelector('#typing');
  const fit = () => { pad.width = pad.clientWidth; pad.height = pad.clientHeight; };
  fit();
  const startBtn = root.querySelector('[data-lab-start]');
  const setActive = (on) => { lab.active = on; startBtn.textContent = on ? 'Stop recording' : 'Start recording'; startBtn.setAttribute('aria-pressed', String(on)); };
  setActive(false);
  startBtn.addEventListener('click', () => setActive(!lab.active));
  root.querySelector('[data-lab-reset]').addEventListener('click', () => { app.lab.pointer = []; app.lab.keys = []; ctx.clearRect(0, 0, pad.width, pad.height); typing.value = ''; root.querySelector('#lab-out').textContent = 'Cleared.'; });
  pad.addEventListener('pointermove', (e) => {
    if (!lab.active || app.lab.pointer.length > 4000) return;
    const p = { x: e.offsetX, y: e.offsetY, t: e.timeStamp, trusted: e.isTrusted }; const prev = app.lab.pointer.at(-1); app.lab.pointer.push(p);
    if (prev) { ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--lab-accent'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(p.x, p.y); ctx.stroke(); }
  });
  typing.addEventListener('keydown', (e) => { if (lab.active && !lab.down[e.code]) lab.down[e.code] = e.timeStamp; });
  typing.addEventListener('keyup', (e) => {
    if (!lab.active || !lab.down[e.code]) return;
    app.lab.keys.push({ dwell: e.timeStamp - lab.down[e.code], flight: lab.last ? lab.down[e.code] - lab.last : null });
    delete lab.down[e.code]; lab.last = e.timeStamp;
  });
  root.querySelector('[data-lab-analyze]').addEventListener('click', async () => {
    const p = await app.rerun('pointer-dynamics'), k = await app.rerun('keystroke-timing');
    root.querySelector('#lab-out').innerHTML = `<div class="row g-2"><div class="col-sm-6"><strong>Pointer</strong>${p.rawResult ? kvTable(p.rawResult) : `<p class="mb-0 text-muted">${esc(p.notes[0])}</p>`}</div>
      <div class="col-sm-6"><strong>Typing</strong>${k.rawResult ? kvTable(k.rawResult) : `<p class="mb-0 text-muted">${esc(k.notes[0])}</p>`}</div></div>
      <p class="text-muted mb-0 mt-1">Humans show high speed variability and frequent direction changes; scripted movement is often straight and regular.</p>`;
  });
}

export function update() { /* exercises manage their own state */ }
