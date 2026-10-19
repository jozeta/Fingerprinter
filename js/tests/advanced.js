// 5.12 Advanced techniques: consistency, integrity, automation and protection indicators.
// These read earlier results via ctx.results (declared in dependsOn); they never re-collect data.
import { define, g } from './define.js';
import { measured, inferred, unsupported, blocked } from '../core/schema.js';
import { digest } from '../core/hash.js';

const val = (results, id) => (results[id] && ['measured', 'inferred'].includes(results[id].executionStatus) ? results[id].rawResult : null);

export default [
  define({
    id: 'consistency', version: '1.0.0', category: 'advanced', name: 'Cross-signal consistency', tier: 'advanced', maturity: 'demonstrated',
    dependsOn: ['user-agent', 'platform', 'client-hints', 'webgl-info', 'fonts', 'engine-inference'],
    simple: 'Checks whether your browser tells a consistent story, e.g. a "Windows" browser with a Mac-only graphics chip would be suspicious.',
    how: 'Compares results already measured: the UA OS claim against <code>navigator.platform</code>, Client Hints platform, the WebGL renderer and detected fonts, and the inferred engine against the claimed one.',
    technical: 'Bot-management and fraud systems score contradictions because spoofing tools rarely change every layer consistently. Each check here is a simple rule; real systems use many more. Contradictions can also be legitimate (remote desktops, VMs, enterprise builds).',
    exposes: 'A list of contradictions between signals.', dataType: 'list', apis: [],
    purpose: ['bot-detection', 'fraud-prevention'], relevance: 'medium', relevanceBasis: 'Contradictions are rare and therefore distinctive.', stability: 'stable',
    combinesWith: [{ id: 'user-agent', basis: 'hypothetical', note: 'Input.' }, { id: 'webgl-info', basis: 'hypothetical', note: 'Input.' }, { id: 'fonts', basis: 'hypothetical', note: 'Input.' }],
    privacyImpact: 'Contradictions make a browser stand out.', limitations: ['Rule-based; can misfire in VMs, remote desktops and new hardware.'],
    defenses: 'Using built-in, uniform protections avoids contradictions.', mitigations: ['Avoid partial spoofing (e.g. UA-only changes); prefer uniform browser-level protections.'],
    sources: ['datadome-cdp', 'cloak-2016'],
    run: async ({ results }) => {
      const ua = val(results, 'user-agent')?.userAgent || '';
      const plat = val(results, 'platform')?.platform || '';
      const ch = val(results, 'client-hints');
      const gl = val(results, 'webgl-info');
      const fonts = val(results, 'fonts')?.detected || [];
      const eng = val(results, 'engine-inference');
      if (!ua) return unsupported('User-Agent result missing; run browser tests first.');
      const issues = [];
      const uaOS = /Windows/.test(ua) ? 'Windows' : /Mac OS X|Macintosh/.test(ua) ? 'macOS' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Linux|CrOS/.test(ua) ? 'Linux' : 'unknown';
      if (uaOS === 'Windows' && plat && !/^Win/.test(plat)) issues.push(`UA says Windows, platform is "${plat}"`);
      if (uaOS === 'macOS' && plat && !/^Mac/.test(plat)) issues.push(`UA says macOS, platform is "${plat}"`);
      if (ch?.platform && uaOS !== 'unknown' && !(ch.platform === uaOS || (ch.platform === 'Chrome OS' && uaOS === 'Linux'))) issues.push(`Client Hints platform "${ch.platform}" vs UA "${uaOS}"`);
      const r = gl?.unmaskedRenderer || gl?.renderer || '';
      if (/Apple (M\d|GPU)/.test(r) && /Windows|Android/.test(uaOS)) issues.push('Apple GPU with a non-Apple OS claim');
      if (/Direct3D/.test(r) && uaOS !== 'Windows') issues.push('Direct3D renderer with a non-Windows OS claim');
      if (uaOS === 'macOS' && fonts.some((f) => ['Segoe UI', 'Calibri', 'Consolas'].includes(f)) && !fonts.includes('Helvetica Neue')) issues.push('Windows-only fonts without macOS fonts on a macOS claim');
      if (eng?.consistent === false) issues.push(`Engine behaves like ${eng.inferredEngine} but UA claims ${eng.claimedEngine}`);
      return inferred({ claimedOS: uaOS, checks: 6, contradictions: issues }, { confidence: 'medium', notes: issues.length ? [] : ['No contradictions found by these rules.'] });
    },
  }),

  define({
    id: 'canvas-repeatability', version: '1.0.0', category: 'advanced', name: 'Canvas repeatability', tier: 'advanced', maturity: 'demonstrated', stability: 'volatile', includeByDefault: false,
    simple: 'Draws the same canvas image five times and checks whether every copy is pixel-identical.',
    how: 'Renders a fixed scene (text, gradient, arcs) five times on fresh canvases, hashes each result locally with SHA-256, and compares them. Also counts how many bytes differ from the first render.',
    technical: 'Deterministic rendering gives identical digests, the precondition for canvas fingerprinting. Different digests within one page load indicate noise injection (Brave farbling, Safari Advanced Fingerprinting Protection, Firefox FPP, CanvasBlocker-type extensions). Noise that is <em>stable per site and session</em> (Brave) still looks identical here; this test detects per-read noise only.',
    exposes: 'Per-render digests and a stability verdict.', dataType: 'list', apis: ['CanvasRenderingContext2D.getImageData'],
    purpose: ['privacy-defense', 'bot-detection'], relevance: 'low', relevanceBasis: 'Describes a defense rather than identifying the user.',
    privacyImpact: 'Identical renders mean the canvas signal is usable for tracking; varying renders mean it is randomized.', concern: 'privacy',
    limitations: ['Cannot detect per-session noise that stays constant within a session.'],
    defenses: 'Canvas randomization.', mitigations: ['Use a browser with canvas protections if renders are identical.'], sources: ['brave-fp2', 'webkit-pb2', 'acar-2014'],
    run: async () => {
      if (!g.document) return unsupported('DOM unavailable');
      const render = () => {
        const c = document.createElement('canvas'); c.width = 160; c.height = 40;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        const gr = ctx.createLinearGradient(0, 0, 160, 0); gr.addColorStop(0, '#203a43'); gr.addColorStop(1, '#ee9b00');
        ctx.fillStyle = gr; ctx.fillRect(0, 0, 160, 40); ctx.fillStyle = '#fff'; ctx.font = '14px serif'; ctx.fillText('Repeat ✓ 😃 ∑', 6, 25);
        ctx.beginPath(); ctx.arc(135, 20, 14, 0, Math.PI * 1.7); ctx.strokeStyle = '#0ff'; ctx.stroke();
        return ctx.getImageData(0, 0, 160, 40).data;
      };
      let first;
      try { first = render(); } catch (e) { return blocked(`Pixel read-back refused: ${e.message}`); }
      const digests = [(await digest(Array.from(first).join(','))).hex.slice(0, 16)], diffs = [];
      for (let i = 1; i < 5; i++) {
        const d = render(); let n = 0; for (let j = 0; j < d.length; j++) if (d[j] !== first[j]) n++;
        diffs.push(n); digests.push((await digest(Array.from(d).join(','))).hex.slice(0, 16));
      }
      const distinct = new Set(digests).size;
      return measured({ renders: 5, distinctDigests: distinct, digests, differingBytesVsFirst: diffs, verdict: distinct === 1 ? 'stable' : 'randomized' },
        { protection: distinct === 1 ? 'none-detected' : 'randomized' });
    },
  }),

  define({
    id: 'date-behavior', version: '1.0.0', category: 'advanced', name: 'Date parsing & serialization behavior', tier: 'advanced', maturity: 'research',
    simple: 'How the browser parses ambiguous date strings and prints dates. Engines disagree on several cases.',
    how: 'Parses a fixed list of ambiguous strings with <code>Date.parse()</code> (date-only vs date-time ISO, slashes, two-digit years, month names, invalid input) and records the results, plus the shape of <code>Date.prototype.toString()</code> and the long timezone name.',
    technical: 'The ECMAScript spec defines only the ISO format; everything else is implementation-defined, so V8, SpiderMonkey and JavaScriptCore differ (e.g. for "2026-1-2" or "01/02/26"). The timezone name in <code>toString()</code> is localized and reveals both timezone and locale data.',
    exposes: 'Parsed timestamps (relative to UTC) and string formats.', dataType: 'object', apis: ['Date.parse', 'Date.prototype.toString', 'Intl.DateTimeFormat'],
    purpose: ['bot-detection', 'identification'], relevance: 'low', relevanceBasis: 'Mostly engine- and timezone-determined.', stability: 'stable',
    combinesWith: [{ id: 'engine-inference', basis: 'hypothetical', note: 'Engine family.' }, { id: 'intl-timezone', basis: 'hypothetical', note: 'Timezone naming.' }],
    privacyImpact: 'Low; duplicates engine and timezone.', limitations: ['Parsed local-time values shift with your timezone.'],
    defenses: 'Tor normalizes timezone to UTC.', mitigations: ['No practical user action.'], sources: ['iqbal-2021'],
    run: async () => {
      const inputs = ['2026-01-02', '2026-01-02T00:00', '2026-1-2', '2026/01/02', '01/02/2026', '01/02/26', 'Jan 2 2026', '2 January 2026 10:00 GMT+0100', '2026-01-02 00:00:00', 'not a date'];
      const offset = new Date(2026, 0, 2).getTimezoneOffset() * 60000;
      const parsed = {};
      for (const s of inputs) { const v = Date.parse(s); parsed[s] = Number.isNaN(v) ? 'NaN' : (v - Date.UTC(2026, 0, 2)) / 3600000; }
      const ts = new Date(Date.UTC(2026, 0, 2, 12)).toString();
      return measured({ parsedHoursFromUTCMidnight: parsed, localOffsetHours: -offset / 3600000,
        toStringShape: ts.replace(/\d/g, '9'), timeZoneLongName: new Intl.DateTimeFormat(undefined, { timeZoneName: 'long' }).formatToParts(new Date(2026, 0, 2)).find((p) => p.type === 'timeZoneName')?.value ?? null,
        toUTCString: new Date(Date.UTC(2026, 0, 2)).toUTCString() });
    },
  }),

  define({
    id: 'error-stack', version: '1.0.0', category: 'advanced', name: 'Error stack format heuristic', tier: 'advanced', maturity: 'demonstrated',
    simple: 'How the JavaScript engine formats error messages and stack traces. Each engine has its own style.',
    how: 'Triggers three harmless errors (reading a property of <code>null</code>, calling an undefined value, an invalid array length), records their messages, and classifies the stack-frame format. File paths are stripped. Also checks <code>Error.captureStackTrace</code> and <code>Error.stackTraceLimit</code>.',
    technical: 'V8 frames look like <code>    at fn (file:line:col)</code>; SpiderMonkey and JavaScriptCore use <code>fn@file:line:col</code>, with different column conventions and messages. Spoofed user agents rarely fake these, so bot detection compares them with the claimed browser.',
    exposes: 'Error messages and stack-format class.', dataType: 'object', apis: ['Error.prototype.stack', 'Error.captureStackTrace'],
    purpose: ['bot-detection', 'fraud-prevention'], relevance: 'low', relevanceBasis: 'Few engines; useful for contradiction checks.', stability: 'stable',
    combinesWith: [{ id: 'engine-inference', basis: 'hypothetical', note: 'Engine family.' }, { id: 'consistency', basis: 'hypothetical', note: 'Claimed vs actual engine.' }],
    privacyImpact: 'Low.', limitations: ['Message wording can change between versions.'],
    defenses: 'Not practical to alter.', mitigations: ['No action needed.'], sources: ['iqbal-2021', 'datadome-cdp'],
    run: async () => {
      const msgs = {};
      try { null.x; } catch (e) { msgs.nullProperty = e.message; }
      try { undefined(); } catch (e) { msgs.callUndefined = e.message; }
      try { new Array(-1); } catch (e) { msgs.invalidArrayLength = `${e.name}: ${e.message}`; }
      let stack = '';
      try { throw new Error('probe'); } catch (e) { stack = String(e.stack || ''); }
      const frame = stack.split('\n').find((l) => /:\d+:\d+/.test(l)) || '';
      const format = /^\s+at\s/.test(frame) ? 'V8 ("at fn (file:line:col)")' : /@.*:\d+:\d+/.test(frame) ? 'SpiderMonkey/JSC ("fn@file:line:col")' : 'unknown';
      return measured({ messages: msgs, stackFormat: format, firstLineIsMessage: stack.startsWith('Error: probe'),
        frameShape: frame.replace(/(https?|file):\/\/[^\s)]+/g, 'URL').replace(/\d+/g, 'N').trim(),
        captureStackTrace: typeof Error.captureStackTrace === 'function', stackTraceLimit: Error.stackTraceLimit ?? null,
        stackIsOwnProperty: Object.prototype.hasOwnProperty.call(new Error('x'), 'stack') });
    },
  }),

  define({
    id: 'native-tostring', version: '1.0.0', category: 'advanced', name: 'Native function stringification shape', tier: 'advanced', maturity: 'demonstrated',
    simple: 'How built-in functions look when converted to text. Engines format them slightly differently.',
    how: 'Converts several functions to strings: a native method (<code>Math.max</code>), a native getter, a bound function, a class and an arrow function, and records the <em>shape</em> (whitespace, newlines, naming) with names masked.',
    technical: 'V8 and JavaScriptCore print <code>function max() { [native code] }</code> on one line; SpiderMonkey prints it over three lines with indentation. Getters show as <code>function get userAgent()</code>. Spoofing tools that override functions often get this shape wrong, which is why integrity checks rely on it.',
    exposes: 'String shapes of native and user functions.', dataType: 'object', apis: ['Function.prototype.toString'],
    purpose: ['bot-detection', 'fraud-prevention'], relevance: 'low', relevanceBasis: 'Engine-determined.', stability: 'stable',
    combinesWith: [{ id: 'integrity', basis: 'hypothetical', note: 'Basis of override detection.' }],
    privacyImpact: 'Low.', limitations: ['Mostly redundant with engine family.'],
    defenses: 'Not applicable.', mitigations: ['No action needed.'], sources: ['datadome-cdp'],
    run: async () => {
      const shape = (f) => { try { return Function.prototype.toString.call(f).replace(/\n/g, '\\n').replace(/[A-Za-z_$][\w$]*(?=\s*\()/g, (m) => (m === 'function' || m === 'get' ? m : 'NAME')); } catch (e) { return `throws ${e.name}`; } };
      const getter = g.Navigator ? Object.getOwnPropertyDescriptor(Navigator.prototype, 'userAgent')?.get : null;
      return measured({ nativeMethod: shape(Math.max), nativeGetter: getter ? shape(getter) : null, bound: shape(function f() {}.bind(null)),
        classDecl: shape(class K {}).slice(0, 20), arrow: shape(() => 1), toStringItself: shape(Function.prototype.toString) });
    },
  }),

  define({
    id: 'prototype-surface', version: '1.0.0', category: 'advanced', name: 'Selected prototype surface', tier: 'advanced', maturity: 'demonstrated',
    simple: 'How many properties key browser objects (Navigator, Document, HTMLElement…) have. Every browser version has its own count.',
    how: 'Counts <code>Object.getOwnPropertyNames()</code> on the prototypes of <code>Navigator</code>, <code>Document</code>, <code>HTMLElement</code>, <code>Element</code>, <code>Screen</code>, <code>CanvasRenderingContext2D</code> and <code>Window</code>, and hashes the sorted name lists. Global variables added by pages or extensions are not counted.',
    technical: 'Property sets change with nearly every release and differ between engines, so counts plus a digest pin the browser version precisely. CreepJS-style tools use such surfaces to detect spoofed versions. Extensions that patch prototypes also change the result.',
    exposes: 'Property counts and name-list digests.', dataType: 'object', apis: ['Object.getOwnPropertyNames'],
    purpose: ['bot-detection', 'identification', 'compatibility'], relevance: 'low', relevanceBasis: 'Shared by all users of the same version.', stability: 'semi-stable',
    combinesWith: [{ id: 'api-surface', basis: 'hypothetical', note: 'Version range.' }, { id: 'integrity', basis: 'hypothetical', note: 'Patched prototypes.' }],
    privacyImpact: 'Low.', limitations: ['Changes with every browser update.'],
    defenses: 'Keep updated.', mitigations: ['Keep the browser updated.'], sources: ['iqbal-2021'],
    run: async () => {
      if (!g.document) return unsupported('DOM unavailable');
      const raw = {};
      for (const name of ['Navigator', 'Document', 'HTMLElement', 'Element', 'Screen', 'CanvasRenderingContext2D', 'Window']) {
        const proto = g[name]?.prototype; if (!proto) { raw[name] = null; continue; }
        const names = Object.getOwnPropertyNames(proto).sort();
        raw[name] = { count: names.length, digest: (await digest(names.join(','))).hex.slice(0, 16) };
      }
      return measured(raw);
    },
  }),

  define({
    id: 'third-party-requests', version: '1.0.0', category: 'advanced', name: 'Third-party requests on this page', tier: 'advanced', maturity: 'demonstrated', stability: 'volatile', includeByDefault: false,
    simple: 'Lists every request this page made to other websites, which is how trackers usually arrive. This lab should show zero.',
    how: 'Reads the browser\'s Resource Timing entries (<code>performance.getEntriesByType("resource")</code>) for this page and groups them by origin. Third-party = any origin other than this site.',
    technical: 'On a typical commercial site this list contains analytics, tag managers, ad networks and fraud/bot scripts. It is the client-side view of tracker activity. Requests blocked by an extension do not appear. Activity on <em>other</em> websites cannot be observed from here; that would require network inspection or a browser extension.',
    exposes: 'Origins this page contacted.', dataType: 'object', apis: ['PerformanceResourceTiming'],
    purpose: ['privacy-defense', 'research'], relevance: 'low', relevanceBasis: 'Describes the page, not the user.',
    privacyImpact: 'Explains where fingerprinting scripts come from.', concern: 'privacy',
    limitations: ['Covers only this page and this session.', 'Resource Timing buffer may be limited to 250 entries.'],
    defenses: 'Content blockers and tracking protection stop third-party requests.', mitigations: ['Use tracking protection or a reputable content blocker.'], sources: ['englehardt-2016', 'iqbal-2021'],
    run: async () => {
      const entries = g.performance?.getEntriesByType?.('resource');
      if (!entries) return unsupported('Resource Timing not available');
      const byOrigin = {};
      for (const e of entries) { try { const o = new URL(e.name).origin; byOrigin[o] = (byOrigin[o] || 0) + 1; } catch {} }
      const thirdParty = Object.keys(byOrigin).filter((o) => o !== g.location.origin);
      return measured({ totalRequests: entries.length, firstPartyRequests: byOrigin[g.location.origin] || 0, thirdPartyOrigins: thirdParty, thirdPartyRequests: thirdParty.reduce((s, o) => s + byOrigin[o], 0) });
    },
  }),

  define({
    id: 'integrity', version: '1.0.0', category: 'advanced', name: 'Native function integrity', tier: 'advanced', maturity: 'demonstrated',
    simple: 'Checks whether built-in browser functions were replaced, as spoofing extensions and some automation tools do.',
    how: 'Inspects <code>Function.prototype.toString</code> output and property descriptors of getters like <code>navigator.userAgent</code>, <code>HTMLCanvasElement.prototype.toDataURL</code> and <code>WebGLRenderingContext.prototype.getParameter</code>.',
    technical: 'Native functions stringify as <code>function x() { [native code] }</code>. JavaScript overrides usually do not, unless carefully disguised. Overrides on the instance (instead of the prototype) are another tell. Browser-native protections (Brave, Firefox, Safari) change values <em>inside</em> the engine and pass this check.',
    exposes: 'Whether common fingerprinting APIs were patched by page-level JavaScript.', dataType: 'list', apis: ['Function.prototype.toString', 'Object.getOwnPropertyDescriptor'],
    purpose: ['bot-detection', 'fraud-prevention'], relevance: 'low', relevanceBasis: 'Most users have no patched functions.', stability: 'stable',
    privacyImpact: 'Patched functions make a browser rare and detectable.', limitations: ['Well-disguised overrides can pass these checks.', 'Some legitimate extensions patch APIs.'],
    defenses: 'Not applicable.', mitigations: ['Prefer browser-level protections over extensions that patch APIs.'],
    sources: ['datadome-cdp'],
    run: async () => {
      if (!g.document) return unsupported('DOM unavailable');
      const native = (fn) => typeof fn === 'function' && /\{\s*\[native code\]\s*\}\s*$/.test(Function.prototype.toString.call(fn));
      const patched = [];
      for (const [proto, prop] of [[g.Navigator?.prototype, 'userAgent'], [g.Navigator?.prototype, 'platform'], [g.Navigator?.prototype, 'hardwareConcurrency'],
        [g.Navigator?.prototype, 'languages'], [g.Navigator?.prototype, 'webdriver'], [g.Screen?.prototype, 'width']]) {
        if (!proto) continue;
        const d = Object.getOwnPropertyDescriptor(proto, prop);
        if (d?.get && !native(d.get)) patched.push(`${prop} getter`);
        if (Object.getOwnPropertyDescriptor(navigator, prop)) patched.push(`${prop} overridden on instance`);
      }
      for (const [name, fn] of [['HTMLCanvasElement.toDataURL', g.HTMLCanvasElement?.prototype.toDataURL], ['CanvasRenderingContext2D.getImageData', g.CanvasRenderingContext2D?.prototype.getImageData],
        ['WebGLRenderingContext.getParameter', g.WebGLRenderingContext?.prototype.getParameter], ['Date.getTimezoneOffset', Date.prototype.getTimezoneOffset], ['Function.toString', Function.prototype.toString]]) {
        if (fn && !native(fn)) patched.push(name);
      }
      return measured({ patched }, { confidence: 'medium' });
    },
  }),

  define({
    id: 'automation', version: '1.0.0', category: 'advanced', name: 'Automation indicators', tier: 'advanced', maturity: 'demonstrated',
    dependsOn: ['webdriver', 'webgl-info', 'languages', 'permission-states'],
    simple: 'Signs that the browser is driven by automation (Selenium, Puppeteer, Playwright) rather than a person.',
    how: 'Combines <code>navigator.webdriver</code>, "HeadlessChrome" in the UA, empty language lists, zero outer window size, software GPU renderers, known automation globals (<code>cdc_*</code>, <code>__playwright*</code>), and permission-state inconsistencies.',
    technical: 'Bot-management vendors document moving beyond <code>navigator.webdriver</code> to protocol-level side effects (e.g. CDP). These indicators are a teaching subset. Absence does not prove a human; presence does not prove a bot (VMs and remote desktops use software GPUs).',
    exposes: 'Automation indicator hits.', dataType: 'object', apis: ['navigator.webdriver', 'window properties'],
    purpose: ['bot-detection'], relevance: 'low', relevanceBasis: 'Nearly all humans show no indicators.', stability: 'stable',
    combinesWith: [{ id: 'webdriver', basis: 'documented', source: 'datadome-cdp', note: 'Primary flag.' }],
    privacyImpact: 'Minimal for humans.', concern: 'limitation', limitations: ['Indicators, not proof.'],
    defenses: 'Not applicable.', mitigations: ['No action needed.'], sources: ['datadome-cdp', 'cf-turnstile'],
    run: async ({ results }) => {
      const gl = val(results, 'webgl-info'); const perms = val(results, 'permission-states');
      const hits = {
        webdriverTrue: val(results, 'webdriver')?.webdriver === true,
        headlessUA: /HeadlessChrome/.test(g.navigator?.userAgent || ''),
        emptyLanguages: (val(results, 'languages')?.languages || [1]).length === 0,
        zeroOuterWindow: g.outerWidth === 0 || g.outerHeight === 0,
        softwareRenderer: /swiftshader|llvmpipe/i.test(gl?.unmaskedRenderer || gl?.renderer || ''),
        automationGlobals: Object.keys(g).some((k) => /^cdc_|^\$cdc_|__webdriver|__selenium|__playwright|__pwInitScripts|callPhantom|_phantom/.test(k)),
        notificationMismatch: !!perms && perms['Notification.permission'] === 'denied' && perms.notifications === 'prompt',
      };
      return inferred({ indicators: hits, count: Object.values(hits).filter(Boolean).length }, { confidence: 'medium' });
    },
  }),

  define({
    id: 'protection-indicators', version: '1.0.0', category: 'advanced', name: 'Privacy protection indicators', tier: 'advanced', maturity: 'speculative',
    dependsOn: ['canvas-2d', 'webgl-render', 'audio-offline', 'intl-timezone', 'timer-precision', 'webgl-info', 'fonts', 'languages'],
    simple: 'Summarizes signs that your browser actively protects against fingerprinting (noise, blocking, uniform values).',
    how: 'Reads the protection indicators of earlier tests: randomized canvas/WebGL/audio output, blocked read-backs, UTC timezone, coarse timers, a masked WebGL renderer and very short font lists.',
    technical: 'Each indicator has innocent explanations (e.g. people really live in UTC; GPUs without the debug extension). The combination is suggestive, not conclusive. This lab does <strong>not</strong> claim to identify a specific browser or extension from these indicators.',
    exposes: 'Which defenses appear active.', dataType: 'object', apis: [],
    purpose: ['privacy-defense'], relevance: 'low', relevanceBasis: 'Describes defenses.', stability: 'semi-stable',
    privacyImpact: 'Protections reduce linkability; some (blocking) are themselves detectable.', concern: 'limitation',
    limitations: ['Speculative combination of indicators; not proof of any product.'],
    defenses: 'Not applicable.', mitigations: ['See the Privacy Assessment for recommendations.'], sources: ['brave-fp2', 'tor-manual-fp', 'mozilla-rfp', 'webkit-pb2'],
    run: async ({ results }) => {
      const p = (id) => results[id]?.protectionIndicator;
      const s = (id) => results[id]?.executionStatus;
      const ind = {
        canvasRandomized: p('canvas-2d') === 'randomized', canvasBlocked: s('canvas-2d') === 'blocked',
        webglRandomized: p('webgl-render') === 'randomized', webglBlocked: s('webgl-info') === 'blocked',
        rendererMasked: s('webgl-info') === 'measured' && !val(results, 'webgl-info')?.unmaskedRenderer,
        audioRandomized: p('audio-offline') === 'randomized', utcTimezone: p('intl-timezone') === 'standardized',
        coarseTimer: p('timer-precision') === 'standardized', fewFonts: (val(results, 'fonts')?.detected?.length ?? 99) <= 3,
        singleEnUS: JSON.stringify(val(results, 'languages')?.languages) === '["en-US"]',
      };
      const active = Object.entries(ind).filter(([, v]) => v).map(([k]) => k);
      return inferred({ indicators: ind, active }, { confidence: 'low' });
    },
  }),

  define({
    id: 'content-blockers', version: '1.0.0', category: 'advanced', name: 'Content-blocker detection (bait elements)', tier: 'advanced', maturity: 'demonstrated',
    simple: 'Detects whether a content/ad blocker hides elements that look like ads.',
    how: 'Inserts invisible elements with ad-like class names (<code>adsbox</code>, <code>ad-banner</code>…) and checks whether they get hidden by cosmetic filter rules. They are removed immediately.',
    technical: 'FingerprintJS\'s <code>dom_blockers</code> source uses lists of selectors from regional filter lists to infer which lists are active, and therefore hints at region. Blockers are common (a large minority of users), so presence alone is a modest signal.',
    exposes: 'Whether cosmetic filtering is active.', dataType: 'object', apis: ['DOM layout'],
    purpose: ['identification', 'advertising'], relevance: 'medium', relevanceBasis: 'Filter-list combinations can be distinctive.', stability: 'stable',
    privacyImpact: 'Modest. Using a blocker is still strongly recommended.', limitations: ['Only cosmetic filtering is tested; network blocking is not.'],
    defenses: 'uBlock Origin scriptlets can defeat bait detection.', mitigations: ['Keep using a reputable content blocker; its privacy benefit outweighs this signal.'],
    sources: ['fpjs-sources'],
    run: async () => {
      if (!g.document?.body) return unsupported('DOM unavailable');
      const names = ['adsbox', 'ad-banner', 'pub_300x250', 'textAd', 'sponsored-ad', 'ad-slot'];
      const els = names.map((cls) => { const d = document.createElement('div'); d.className = cls; d.setAttribute('aria-hidden', 'true'); d.textContent = ' '; d.style.cssText = 'position:absolute;left:-999px;width:10px;height:10px'; document.body.appendChild(d); return d; });
      await new Promise((r) => setTimeout(r, 120));
      const hidden = els.filter((e) => e.offsetHeight === 0 || getComputedStyle(e).display === 'none').map((e) => e.className);
      els.forEach((e) => e.remove());
      return measured({ cosmeticFilteringDetected: hidden.length > 0, hiddenBaits: hidden }, { confidence: 'medium' });
    },
  }),

  define({
    id: 'extension-indicators', version: '1.0.0', category: 'advanced', name: 'Injected extension objects', tier: 'advanced', maturity: 'demonstrated',
    simple: 'Some extensions (crypto wallets, developer tools, writing assistants) add objects to every page. Those can be seen.',
    how: 'Checks for well-known injected globals and DOM markers: <code>window.ethereum</code>, <code>window.solana</code>, React/Redux/Vue DevTools hooks, Grammarly and Dark Reader markers.',
    technical: 'Injected objects are visible to all page scripts. Malicious "drainer" pages target wallet users this way. Detection here is inference: other extensions can mimic these objects, and many extensions inject nothing. This lab cannot detect every extension.',
    exposes: 'Which of a small set of extensions appear present.', dataType: 'list', apis: ['window properties', 'DOM'],
    purpose: ['identification', 'malicious-targeting'], relevance: 'medium', relevanceBasis: 'Extension combinations are distinctive when visible.', stability: 'stable',
    privacyImpact: 'Can reveal crypto-wallet ownership or profession (developer tools).', limitations: ['Small probe list; cannot detect most extensions.', 'Objects can be mimicked.'],
    defenses: 'Firefox randomizes extension UUIDs (for resource probing); fewer extensions = fewer markers.',
    mitigations: ['Minimize extensions; use a separate browser profile for crypto wallets.'],
    sources: ['w3c-fp-guidance'],
    run: async () => {
      if (!g.document) return unsupported('DOM unavailable');
      const probes = {
        'EVM wallet (window.ethereum)': () => !!g.ethereum, 'Solana wallet (window.solana)': () => !!(g.solana || g.phantom),
        'React DevTools': () => !!g.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers, 'Redux DevTools': () => !!g.__REDUX_DEVTOOLS_EXTENSION__,
        'Vue DevTools': () => !!g.__VUE_DEVTOOLS_GLOBAL_HOOK__, 'Grammarly': () => document.body?.hasAttribute('data-gr-ext-installed'),
        'Dark Reader': () => !!document.querySelector('meta[name="darkreader"]'),
      };
      const found = Object.entries(probes).filter(([, f]) => { try { return f(); } catch { return false; } }).map(([k]) => k);
      return inferred({ probed: Object.keys(probes).length, found }, { confidence: 'medium' });
    },
  }),
];
