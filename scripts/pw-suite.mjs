// Cross-browser suite (Playwright): Chromium, Firefox, WebKit, plus phone-sized WebKit and Chromium.
// For each: in-browser integration suite, app walkthrough (consent, run, every view, no console errors),
// no horizontal overflow on phones, tap-to-show hover boxes on phones, and an axe-core accessibility scan.
// Usage: node scripts/pw-suite.mjs [baseUrl] [outDir]   (serve the app first: python3 scripts/serve.py)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { chromium, firefox, webkit, devices } from 'playwright';

const base = process.argv[2] || 'http://localhost:8765';
const out = process.argv[3] || '.test-output/pw';
fs.mkdirSync(out, { recursive: true });
const axeSource = fs.readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const ROUTES = ['overview', 'tests', 'signals', 'entities', 'compare', 'assessment', 'learn', 'methodology', 'settings'];
const TARGETS = [
  { name: 'chromium', type: chromium, ctx: { viewport: { width: 1366, height: 900 } } },
  { name: 'firefox', type: firefox, ctx: { viewport: { width: 1366, height: 900 } } },
  { name: 'webkit', type: webkit, ctx: { viewport: { width: 1366, height: 900 } } },
  { name: 'iphone-webkit', type: webkit, ctx: devices['iPhone 15'], phone: true },
  { name: 'android-chromium', type: chromium, ctx: devices['Pixel 7'], phone: true },
];
const only = process.env.PW_ONLY ? process.env.PW_ONLY.split(',') : null;

const report = [];
let failed = 0;
const check = (target, name, ok, detail = '') => { report.push({ target, name, ok, detail }); if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'} [${target}] ${name}${detail ? ` (${detail})` : ''}`); };

for (const t of TARGETS.filter((x) => !only || only.includes(x.name))) {
  const browser = await t.type.launch();
  const errors = [];
  try {
    // 1) Integration suite page.
    const ctx = await browser.newContext(t.ctx);
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
    await page.goto(`${base}/tests/browser/index.html`);
    await page.waitForFunction(() => document.getElementById('summary')?.dataset.done === 'true', null, { timeout: 90000 });
    const summary = await page.textContent('#summary');
    const failedLines = await page.$$eval('#out li.fail', (els) => els.map((e) => e.textContent));
    check(t.name, 'integration suite', failedLines.length === 0, `${summary.split('·')[0].trim()}${failedLines.length ? `: ${failedLines.join(' | ')}` : ''}`);

    // 2) App walkthrough.
    await page.goto(`${base}/index.html#/overview`);
    await page.waitForSelector('main [data-action="run"]', { timeout: 20000 });
    check(t.name, 'nothing runs before consent', (await page.$$('.kpi')).length === 0);
    await page.click('main [data-action="run"]');
    await page.waitForFunction(() => document.querySelector('#run-box')?.textContent.includes('results in memory'), null, { timeout: 90000 });
    const statuses = await page.evaluate(() => document.querySelector('#run-box').textContent.trim());
    check(t.name, 'all checks finished', /\d+ results in memory/.test(statuses), statuses.split('·')[0].trim());
    await page.screenshot({ path: path.join(out, `${t.name}-overview.png`) });
    for (const r of ROUTES) {
      await page.evaluate((x) => { location.hash = `#/${x}`; }, r);
      await page.waitForTimeout(700);
      const h1 = await page.textContent('main h1').catch(() => null);
      if (!h1) check(t.name, `view ${r} renders`, false);
      if (t.phone) {
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        check(t.name, `no sideways scrolling on ${r}`, overflow <= 1, overflow > 1 ? `${overflow}px too wide` : '');
      }
    }
    await page.evaluate(() => { location.hash = '#/tests'; }); await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(out, `${t.name}-tests.png`) });

    // 3) Hover boxes: tap (phones) or hover (desktop) a fingerprint segment.
    await page.evaluate(() => { location.hash = '#/overview'; }); await page.waitForTimeout(900);
    const seg = page.locator('.ridge path[data-tip="ridge:screen"]');
    await seg.scrollIntoViewIfNeeded(); await page.waitForTimeout(700);
    const pt = await seg.evaluate((el) => { const p = el.getPointAtLength(el.getTotalLength() / 2).matrixTransform(el.getScreenCTM()); return { x: p.x, y: p.y }; });
    if (t.phone) await page.touchscreen.tap(pt.x, pt.y); else await page.mouse.move(pt.x, pt.y);
    await page.waitForTimeout(400);
    const tipShown = await page.evaluate(() => document.getElementById('tipbox')?.classList.contains('show'));
    const detailOpen = await page.evaluate(() => document.getElementById('detail')?.classList.contains('show'));
    check(t.name, `${t.phone ? 'tap' : 'hover'} shows the hover box`, !!tipShown);
    await page.screenshot({ path: path.join(out, `${t.name}-tooltip.png`) });
    if (t.phone) {
      check(t.name, 'first tap does not jump straight to details', !detailOpen);
      await page.touchscreen.tap(pt.x, pt.y); await page.waitForTimeout(700);
      check(t.name, 'second tap opens the details', await page.evaluate(() => document.getElementById('detail')?.classList.contains('show')));
      await page.evaluate(() => window.bootstrap?.Offcanvas.getInstance('#detail')?.hide()); await page.waitForTimeout(400);
    }
    check(t.name, 'no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
    await ctx.close();

    // 4) Accessibility scan (axe-core). bypassCSP lets the test inject axe; the app's own CSP is unchanged.
    if (!t.phone) {
      const actx = await browser.newContext({ ...t.ctx, bypassCSP: true, reducedMotion: 'reduce' });
      const ap = await actx.newPage();
      await ap.goto(`${base}/index.html#/overview`);
      await ap.waitForSelector('main [data-action="run"]');
      await ap.click('main [data-action="run"]');
      await ap.waitForFunction(() => document.querySelector('#run-box')?.textContent.includes('results in memory'), null, { timeout: 90000 });
      for (const theme of ['light', 'dark']) {
        await ap.evaluate((th) => { document.documentElement.dataset.bsTheme = th; }, theme);
        for (const r of ROUTES) {
          await ap.evaluate((x) => { location.hash = `#/${x}`; }, r);
          await ap.waitForTimeout(600);
          const res = await ap.evaluate(async (src) => {
            if (!window.axe) (0, eval)(src); // test-only injection; the app itself never uses eval
            const r = await window.axe.run(document, { resultTypes: ['violations'], runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] });
            return r.violations.filter((v) => ['serious', 'critical'].includes(v.impact)).map((v) => `${v.id} (${v.nodes.length}): ${v.nodes[0]?.target?.join(' ')}`);
          }, axeSource);
          check(t.name, `accessibility ${r} (${theme})`, res.length === 0, res.slice(0, 3).join(' | '));
        }
      }
      await actx.close();
    }
  } catch (e) {
    check(t.name, 'suite crashed', false, e.message.split('\n')[0]);
  } finally {
    await browser.close();
  }
}

fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
console.log(failed ? `\n${failed} FAILURE(S)` : '\nALL CROSS-BROWSER CHECKS PASSED');
process.exit(failed ? 1 : 0);
