// Minimal Chrome DevTools Protocol driver for headless smoke tests (no dependencies; Node 22+ global WebSocket).
// Usage: node scripts/cdp-driver.mjs <browser-binary> <base-url> <out-dir>
// Runs: (1) the in-browser suite in real time, (2) a UI smoke test through every view, collecting console errors and screenshots.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const [bin, base, outDir] = process.argv.slice(2);
if (!bin || !base || !outDir) { console.error('usage: node scripts/cdp-driver.mjs <browser> <base-url> <out-dir>'); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'fplab-cdp-'));
const port = 9300 + Math.floor(Math.random() * 500);
const proc = spawn(bin, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--window-size=1366,900', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function target() {
  for (let i = 0; i < 50; i++) {
    try { const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = list.find((t) => t.type === 'page'); if (p) return p; } catch {}
    await sleep(200);
  }
  throw new Error('browser did not start');
}

const t = await target();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let id = 0; const pending = new Map(); const logs = [];
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') logs.push(`EXCEPTION ${m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text}`);
  if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) logs.push(`${m.params.type.toUpperCase()} ${m.params.args.map((a) => a.value ?? a.description).join(' ')}`);
  if (m.method === 'Log.entryAdded' && ['error'].includes(m.params.entry.level)) logs.push(`LOG ${m.params.entry.text} ${m.params.entry.url || ''}`);
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); return r.result?.result?.value; };
const waitFor = async (expr, ms = 60000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await evaluate(expr)) return true; await sleep(250); } return false; };
const shot = async (name) => { await evaluate('window.scrollTo(0, 0)'); const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }); fs.writeFileSync(path.join(outDir, `${name}.png`), Buffer.from(r.result.data, 'base64')); };

await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
let failures = 0;

// 1) Browser integration suite, real time.
await send('Page.navigate', { url: `${base}/tests/browser/index.html` });
await waitFor(`document.getElementById('summary')?.dataset.done === 'true'`, 90000);
console.log('SUITE', await evaluate(`document.getElementById('summary').textContent`));
console.log(await evaluate(`[...document.querySelectorAll('#out li')].map(l => '  ' + l.textContent).join('\\n')`));
failures += Number(await evaluate(`document.getElementById('summary').dataset.failed || 1`));

// 2) UI smoke test.
logs.length = 0;
await send('Page.navigate', { url: `${base}/index.html#/overview` });
await waitFor(`!!document.querySelector('[data-action="run"]')`, 20000);
const autoRan = await evaluate(`document.querySelectorAll('.test-row').length === 0 && !document.querySelector('.kpi')`);
console.log('UI no auto-run before consent:', autoRan);
await shot('01-overview-prerun');
await evaluate(`document.querySelector('main [data-action="run"]').click()`);
const finished = await waitFor(`document.querySelector('#run-box')?.textContent.includes('results in memory')`, 90000);
console.log('UI run finished:', finished, '|', await evaluate(`document.querySelector('#run-box').textContent.trim()`));
await sleep(500);
await shot('02-overview');
for (const route of ['tests', 'signals', 'entities', 'compare', 'assessment', 'learn', 'methodology', 'settings']) {
  await evaluate(`location.hash = '#/${route}'`);
  await sleep(900);
  const h1 = await evaluate(`document.querySelector('main h1')?.textContent`);
  console.log(`VIEW ${route}: h1="${h1}" chars=${await evaluate(`document.querySelector('main').innerText.length`)}`);
  await shot(`view-${route}`);
}
// Interactions: filter, detail panel, entity detail, signal toggle, save snapshot + compare.
await evaluate(`location.hash = '#/tests'`); await sleep(600);
await evaluate(`const q = document.querySelector('#f-q'); q.value = 'canvas'; q.dispatchEvent(new Event('input', {bubbles:true}))`); await sleep(300);
console.log('FILTER "canvas":', await evaluate(`document.querySelector('#count').textContent`));
await evaluate(`document.querySelector('[data-action="detail"][data-id="canvas-2d"]').click()`); await sleep(800);
console.log('DETAIL sections:', await evaluate(`document.querySelectorAll('#detail-body .detail-section').length`));
await shot('detail-canvas');
await evaluate(`bootstrap.Offcanvas.getInstance('#detail').hide()`); await sleep(400);
await evaluate(`location.hash = '#/entities'`); await sleep(600);
await evaluate(`document.querySelector('[data-entity="tor-project"]').click()`); await sleep(500);
console.log('ENTITY detail rows:', await evaluate(`document.querySelectorAll('#entity-detail tbody tr').length`));
await evaluate(`location.hash = '#/signals'`); await sleep(900);
const d1 = await evaluate(`document.querySelector('main .mono').textContent`);
await evaluate(`document.querySelector('[data-sig]:checked').click()`); await sleep(900);
const d2 = await evaluate(`document.querySelector('main .mono').textContent`);
console.log('SIGNAL toggle changes digest:', d1 !== d2, d1.slice(0, 12), '→', d2.slice(0, 12));
await evaluate(`location.hash = '#/compare'`); await sleep(900);
await evaluate(`document.querySelector('[data-save]').click()`); await sleep(1200);
console.log('COMPARE classes:', await evaluate(`[...document.querySelectorAll('main tbody td.fw-semibold')].map(t => t.textContent).reduce((a,c)=>(a[c]=(a[c]||0)+1,a),{})`));
await shot('compare-after-save');
// Result code: create, paste back, compare. Same browser and session ⇒ no differences except self-changing checks.
await evaluate(`document.querySelector('[data-code="full"]').click()`); await sleep(1500);
const codeLen = await evaluate(`document.querySelector('#rc-out')?.value.length || 0`);
console.log('RESULT CODE length:', codeLen, '| starts with FPLAB1.:', await evaluate(`document.querySelector('#rc-out')?.value.startsWith('FPLAB1.')`));
await evaluate(`document.querySelector('#rc-in').value = document.querySelector('#rc-out').value; document.querySelector('[data-code="compare"]').click()`); await sleep(1800);
console.log('CODE COMPARE (same run):', await evaluate(`document.querySelector('#sbs-root .fs-4')?.textContent`));
await evaluate(`document.querySelector('#sbs-diff').click()`); await sleep(400);
console.log('CODE COMPARE rows with "Only differences" off:', await evaluate(`document.querySelectorAll('#sbs-table tbody tr').length`));
await shot('code-compare');
// Bad code is rejected with a message, not a crash.
await evaluate(`document.querySelector('#rc-in').value = 'not a code'; document.querySelector('[data-code="compare"]').click()`); await sleep(500);
console.log('BAD CODE message:', await evaluate(`document.querySelector('#pc-msg').textContent`));
// Explanation toggle in the test list.
await evaluate(`location.hash = '#/tests'`); await sleep(900);
await evaluate(`const d = document.querySelector('details[data-explain="canvas-2d"]'); d.open = true;`); await sleep(500);
console.log('EXPLAIN block sections:', await evaluate(`document.querySelectorAll('details[data-explain="canvas-2d"] .explain-body h4').length`), '|', await evaluate(`document.querySelector('details[data-explain="canvas-2d"] .explain-body p')?.textContent.slice(0, 70)`));
await evaluate(`location.hash = '#/settings'`); await sleep(500);
await evaluate(`document.querySelector('#th-dark').click()`); await sleep(300);
await evaluate(`location.hash = '#/overview'`); await sleep(700);
await shot('overview-dark');
// Viewport-only captures (top of page) for design review, in light theme.
const viewShot = async (name) => { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(outDir, `${name}.png`), Buffer.from(r.result.data, 'base64')); };
await evaluate(`location.hash = '#/settings'`); await sleep(400);
await evaluate(`document.querySelector('#th-light').click()`); await sleep(200);
for (const route of ['overview', 'tests', 'learn', 'entities']) { await evaluate(`location.hash = '#/${route}'`); await sleep(1200); await evaluate('window.scrollTo(0, 0)'); await viewShot(`light-${route}`); }
await evaluate(`location.hash = '#/tests'`); await sleep(800);
await evaluate(`document.querySelector('[data-action="detail"][data-id="canvas-2d"]').click()`); await sleep(900); await viewShot('light-detail');
await evaluate(`bootstrap.Offcanvas.getInstance('#detail').hide()`); await sleep(400);
await evaluate(`location.hash = '#/settings'`); await sleep(400); await evaluate(`document.querySelector('#th-dark').click()`); await sleep(200);
await evaluate(`location.hash = '#/overview'`); await sleep(1400); await evaluate('window.scrollTo(0, 0)'); await viewShot('dark-overview');
const foreign = await evaluate(`performance.getEntriesByType('resource').filter(e => new URL(e.name).origin !== location.origin).map(e => e.name)`);
console.log('UI cross-origin requests:', JSON.stringify(foreign));
console.log('UI console errors/exceptions:', logs.length ? `\n  ${logs.join('\n  ')}` : 'none');
failures += logs.filter((l) => l.startsWith('EXCEPTION')).length + (foreign.length ? 1 : 0) + (finished ? 0 : 1) + (d1 !== d2 ? 0 : 1);

ws.close(); proc.kill();
fs.rmSync(profile, { recursive: true, force: true });
console.log(failures ? `FAILURES: ${failures}` : 'ALL CHECKS PASSED');
process.exit(failures ? 1 : 0);
