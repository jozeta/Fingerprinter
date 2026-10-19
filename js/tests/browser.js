// 5.1 Browser and environment.
import { define, g } from './define.js';
import { measured, inferred, unsupported, blocked, interactionRequired } from '../core/schema.js';
import { settleWithin } from '../core/util.js';

const nav = () => g.navigator || {};

export default [
  define({
    id: 'user-agent', version: '1.0.0', category: 'browser', name: 'User-Agent string',
    simple: 'The text your browser uses to introduce itself: browser name, version and operating system.',
    how: 'Every HTTP request carries a <code>User-Agent</code> header, and scripts can read <code>navigator.userAgent</code>. Different browsers, versions and OSes produce different strings, which splits users into groups.',
    technical: 'Chromium freezes much of the string under UA Reduction (fixed OS version / device model tokens), moving detail into Client Hints. Firefox and Safari also cap OS version detail. The string is freely writable by extensions and automation, so it is a <em>claim</em> rather than a measurement.',
    exposes: 'Browser family and major version, OS family, sometimes device class.', dataType: 'string', apis: ['navigator.userAgent', 'navigator.appVersion'],
    purpose: ['identification', 'bot-detection', 'analytics', 'compatibility'], relevance: 'high',
    relevanceBasis: 'Largest single entropy source in the EFF 2010 study; reduced since by UA freezing.', stability: 'semi-stable',
    combinesWith: [{ id: 'client-hints', basis: 'documented', source: 'chromium-ua-reduction', note: 'Client Hints carry the detail removed from the UA.' },
      { id: 'consistency', basis: 'hypothetical', note: 'Contradictions with other signals reveal spoofing.' }],
    privacyImpact: 'Moderate alone; mainly narrows the population that other signals must distinguish.',
    limitations: ['Spoofable; reflects what the browser claims.', 'Changes with every browser update.'],
    defenses: 'UA reduction (Chromium), frozen UA (Safari), uniform UA (Tor Browser, Firefox RFP).',
    mitigations: ['Keep the browser updated so you share the most common version string.', 'Avoid UA-spoofing extensions; inconsistent claims are more distinctive.'],
    sources: ['eckersley-2010', 'chromium-ua-reduction', 'eff-cyt-about'],
    run: async () => {
      const n = nav();
      if (!n.userAgent) return unsupported('navigator.userAgent unavailable');
      return measured({ userAgent: n.userAgent, appVersion: n.appVersion ?? null }, { normalized: n.userAgent });
    },
  }),

  define({
    id: 'client-hints', version: '2.0.0', category: 'browser', name: 'User-Agent Client Hints (low entropy)',
    simple: 'A newer, structured way for Chromium browsers to describe themselves: brand, major version, platform and mobile flag.',
    how: 'Reads the low-entropy part of <code>navigator.userAgentData</code>: <code>brands</code>, <code>mobile</code> and <code>platform</code>. These are the same values Chromium sends by default as request headers. High-entropy values are a separate, opt-in test.',
    technical: 'Low-entropy hints are always sent as <code>Sec-CH-UA</code>, <code>Sec-CH-UA-Mobile</code> and <code>Sec-CH-UA-Platform</code>. Brands include a deliberately randomized "GREASE" brand (e.g. "Not.A/Brand") to discourage brittle parsing. Only Chromium-based browsers implement the API.',
    exposes: 'Browser brand list with major versions, platform name, mobile flag.', dataType: 'object', apis: ['navigator.userAgentData'],
    purpose: ['identification', 'bot-detection', 'compatibility'], relevance: 'low', relevanceBasis: 'Coarse values, largely duplicating the reduced UA string.',
    stability: 'semi-stable', secureContext: true,
    combinesWith: [{ id: 'user-agent', basis: 'documented', source: 'mdn-uach', note: 'Complements the reduced UA string.' }],
    privacyImpact: 'Low: equivalent to what every request header already carries.',
    limitations: ['Chromium-only; absence is expected in Firefox and Safari.', 'Values can be overridden by DevTools or automation.'],
    defenses: 'Not implemented in Firefox/Safari.',
    mitigations: ['No action needed for low-entropy hints.'],
    sources: ['mdn-uach', 'mdn-client-hints', 'fpjs-sources'],
    run: async () => {
      const d = nav().userAgentData;
      if (!d) return unsupported('navigator.userAgentData is not implemented in this browser.');
      return measured({ brands: d.brands?.map((b) => `${b.brand} ${b.version}`), mobile: d.mobile, platform: d.platform });
    },
  }),

  define({
    id: 'client-hints-high', version: '1.0.0', category: 'browser', name: 'High-entropy Client Hints (opt-in local read)', tier: 'advanced', interaction: true,
    simple: 'Extra Client Hints detail: exact OS version, CPU architecture, device model and full browser versions. Read only when you click Run.',
    how: 'Calls <code>navigator.userAgentData.getHighEntropyValues()</code> for <code>platformVersion</code>, <code>architecture</code>, <code>bitness</code>, <code>model</code>, <code>fullVersionList</code>, <code>wow64</code> and <code>formFactors</code>. The values stay on this page.',
    technical: 'Any script can request these without a prompt; browsers may decline individual hints. As request headers they require server opt-in (<code>Accept-CH</code>). They restore detail that UA Reduction removed from the User-Agent string, which is why this lab treats reading them as opt-in.',
    exposes: 'Exact OS version, CPU architecture/bitness, device model, full browser version list.', dataType: 'object', apis: ['NavigatorUAData.getHighEntropyValues'],
    purpose: ['identification', 'bot-detection', 'fraud-prevention'], relevance: 'medium', relevanceBasis: 'Restores detail removed from the UA string (e.g. exact platform version).',
    stability: 'semi-stable', secureContext: true,
    combinesWith: [{ id: 'client-hints', basis: 'documented', source: 'mdn-uach', note: 'High-entropy extension of the same API.' }],
    privacyImpact: 'Moderate: platformVersion and model are more specific than the frozen UA string.',
    limitations: ['Chromium-only.', 'Browsers may return a subset of the requested hints.'],
    defenses: 'Brave reduces some values. Not implemented in Firefox/Safari.',
    mitigations: ['If you use a Chromium browser, prefer one that limits high-entropy hints (e.g. Brave).'],
    sources: ['mdn-uach', 'chromium-ua-reduction', 'fpjs-sources'],
    run: async ({ options }) => {
      if (!options?.userInitiated) return interactionRequired('Click "Run" on this test to read high-entropy Client Hints.');
      const d = nav().userAgentData;
      if (!d?.getHighEntropyValues) return unsupported('navigator.userAgentData is not implemented in this browser.');
      const hi = await settleWithin(d.getHighEntropyValues(['architecture', 'bitness', 'model', 'platformVersion', 'fullVersionList', 'wow64', 'formFactors']), 2000, null);
      if (!hi) return blocked('getHighEntropyValues() did not answer.', { protection: 'unknown' });
      const { brands, mobile, platform, ...rest } = hi;
      const raw = { ...rest, fullVersionList: hi.fullVersionList?.map((b) => `${b.brand} ${b.version}`) };
      return measured(raw, { protection: hi.platformVersion ? 'none-detected' : 'blocked' });
    },
  }),

  define({
    id: 'plugins-mime', version: '1.0.0', category: 'browser', name: 'Legacy plugins & MIME handlers',
    simple: 'The list of browser plugins and file types they handle. Historically a big fingerprint; today mostly a fixed PDF list.',
    how: 'Reads <code>navigator.plugins</code> (name, filename, description) and <code>navigator.mimeTypes</code>.',
    technical: 'In the Flash/Java era plugin lists with exact versions were among the most identifying attributes (EFF 2010). The HTML standard now requires browsers to expose a fixed list of five PDF viewer entries (or none), so the list mostly reveals whether a built-in PDF viewer is enabled. An empty list in a desktop browser is a classic headless/automation tell.',
    exposes: 'Plugin and MIME-type lists.', dataType: 'list', apis: ['navigator.plugins', 'navigator.mimeTypes'],
    purpose: ['identification', 'bot-detection'], relevance: 'low', relevanceBasis: 'Standardized to a fixed list in modern browsers; was high in the Flash era.', stability: 'stable',
    combinesWith: [{ id: 'automation', basis: 'hypothetical', note: 'Empty plugin list on desktop.' }, { id: 'pdf-support', basis: 'hypothetical', note: 'PDF entries.' }],
    privacyImpact: 'Low in current browsers.', limitations: ['Values are standardized; differences mostly reflect PDF viewer settings.'],
    defenses: 'Standardized by the HTML spec in all major browsers.', mitigations: ['No action needed.'],
    sources: ['fpjs-sources', 'eff-cyt-about', 'eckersley-2010'],
    run: async () => {
      const n = nav();
      if (!n.plugins) return unsupported('navigator.plugins unavailable');
      const plugins = Array.from(n.plugins).map((p) => ({ name: p.name, filename: p.filename }));
      const mimeTypes = Array.from(n.mimeTypes || []).map((m) => m.type);
      return measured({ pluginCount: plugins.length, plugins, mimeTypes }, { normalized: { plugins: plugins.map((p) => p.name), mimeTypes } });
    },
  }),

  define({
    id: 'pdf-support', version: '1.0.0', category: 'browser', name: 'PDF viewer & document support',
    simple: 'Whether the browser shows PDF files itself.',
    how: 'Reads <code>navigator.pdfViewerEnabled</code>, checks for the <code>application/pdf</code> MIME handler, and asks <code>&lt;object&gt;</code>/<code>&lt;embed&gt;</code> support for PDF via feature checks (no document is loaded).',
    technical: 'Disabled PDF viewers are typical of some enterprise policies, kiosk setups and headless browsers. Mostly a binary signal.',
    exposes: 'PDF viewer status.', dataType: 'object', apis: ['navigator.pdfViewerEnabled', 'navigator.mimeTypes'],
    purpose: ['compatibility', 'bot-detection'], relevance: 'low', relevanceBasis: 'Near-binary.', stability: 'stable',
    privacyImpact: 'Low.', concern: 'limitation', limitations: ['pdfViewerEnabled is not available in older browsers.'],
    defenses: 'None needed.', mitigations: ['No action needed.'], sources: ['fpjs-sources'],
    run: async () => {
      const n = nav();
      if (!('pdfViewerEnabled' in n) && !n.mimeTypes) return unsupported('No PDF-related navigator properties');
      return measured({ pdfViewerEnabled: n.pdfViewerEnabled ?? null, pdfMimeHandler: !!(n.mimeTypes && n.mimeTypes['application/pdf']),
        objectElement: typeof g.HTMLObjectElement === 'function', embedElement: typeof g.HTMLEmbedElement === 'function' });
    },
  }),

  define({
    id: 'platform', version: '1.0.0', category: 'browser', name: 'Platform & legacy navigator properties',
    simple: 'Old navigator properties such as platform, vendor and productSub.',
    how: 'Reads <code>navigator.platform</code>, <code>vendor</code>, <code>product</code>, <code>productSub</code>, <code>oscpu</code> and <code>buildID</code>.',
    technical: '<code>navigator.platform</code> is deprecated and frequently frozen (e.g. "MacIntel" on Apple Silicon, "Win32" on 64-bit Windows). <code>productSub</code> is "20030107" in Chromium/Safari and "20100101" in Firefox, so it reveals the engine family. <code>oscpu</code> and <code>buildID</code> exist only in Firefox.',
    exposes: 'Coarse OS/engine identifiers.', dataType: 'object', apis: ['navigator.platform', 'navigator.vendor', 'navigator.productSub', 'navigator.oscpu'],
    purpose: ['identification', 'bot-detection'], relevance: 'low', relevanceBasis: 'Coarse values shared by large populations; useful mainly for consistency checks.',
    stability: 'stable',
    combinesWith: [{ id: 'consistency', basis: 'hypothetical', note: 'A "Win32" platform with a macOS UA is contradictory.' }],
    privacyImpact: 'Low on its own.',
    limitations: ['navigator.platform is deprecated and often frozen; it does not reliably describe the actual OS or CPU.', 'Legacy properties may be removed in future versions.'],
    defenses: 'Tor Browser / Firefox RFP report uniform values.',
    mitigations: ['No action needed; values are coarse.'],
    sources: ['fpjs-sources'],
    run: async () => {
      const n = nav();
      return measured({ platform: n.platform ?? null, vendor: n.vendor ?? null, product: n.product ?? null, productSub: n.productSub ?? null,
        oscpu: n.oscpu ?? null, buildID: n.buildID ?? null });
    },
  }),

  define({
    id: 'languages', version: '1.0.0', category: 'browser', name: 'Preferred languages',
    simple: 'The languages you have chosen in your browser, in order of preference.',
    how: '<code>navigator.language</code> and <code>navigator.languages</code> mirror the <code>Accept-Language</code> request header.',
    technical: 'Ordered lists such as <code>["sv-SE","en-US","de"]</code> are far less common than a single default locale. They correlate with region and the Intl locale.',
    exposes: 'Language preference list (hints at nationality and multilingualism).', dataType: 'list', apis: ['navigator.language', 'navigator.languages'],
    purpose: ['identification', 'bot-detection', 'advertising'], relevance: 'medium', relevanceBasis: 'Uncommon combinations are distinctive; single default locales are common.',
    stability: 'stable',
    combinesWith: [{ id: 'intl-timezone', basis: 'hypothetical', note: 'Language and timezone together narrow region.' }],
    privacyImpact: 'Can reveal nationality or migration background.',
    limitations: ['Reflects browser settings, not necessarily the user\'s actual languages.'],
    defenses: 'Tor Browser requests en-US by default; Firefox RFP can spoof en-US.',
    mitigations: ['Keep the language list short and common if you do not need extra languages.'],
    sources: ['fpjs-sources', 'eff-cyt-about', 'tor-manual-fp'],
    run: async () => {
      const n = nav();
      if (!n.languages && !n.language) return unsupported('Language properties unavailable');
      return measured({ language: n.language ?? null, languages: Array.from(n.languages || []) }, { normalized: Array.from(n.languages || [n.language]) });
    },
  }),

  define({
    id: 'intl-timezone', version: '1.0.0', category: 'browser', name: 'Timezone & Intl locale',
    simple: 'Your timezone and how your browser formats dates and numbers.',
    how: '<code>Intl.DateTimeFormat().resolvedOptions()</code> returns the IANA timezone (e.g. <code>Europe/Stockholm</code>), locale, calendar and numbering system. <code>Date.getTimezoneOffset()</code> gives the UTC offset.',
    technical: 'The IANA zone is more specific than the offset (many zones share an offset). Comparing January and July offsets reveals DST rules. Servers can compare the zone with IP geolocation; a mismatch suggests VPN or proxy use.',
    exposes: 'Approximate region (timezone), locale formatting preferences.', dataType: 'object', apis: ['Intl.DateTimeFormat', 'Date.prototype.getTimezoneOffset'],
    purpose: ['identification', 'fraud-prevention', 'bot-detection'], relevance: 'medium', relevanceBasis: 'Timezone is part of most fingerprint datasets; few zones hold most users.',
    stability: 'stable',
    combinesWith: [{ id: 'languages', basis: 'hypothetical', note: 'Region consistency.' }, { id: 'srv-ip', basis: 'hypothetical', note: 'IP-vs-timezone mismatch indicates VPN/proxy.' }],
    privacyImpact: 'Reveals approximate geographic region even behind a VPN.',
    limitations: ['Travel or manual clock changes alter the value.'],
    defenses: 'Tor Browser and Firefox RFP report UTC.',
    mitigations: ['If you use a VPN for location privacy, be aware your timezone still reveals your region.'],
    sources: ['fpjs-sources', 'eff-cyt-about'],
    run: async () => {
      if (!g.Intl?.DateTimeFormat) return unsupported('Intl API unavailable');
      const ro = Intl.DateTimeFormat().resolvedOptions();
      const jan = new Date(2026, 0, 1).getTimezoneOffset(), jul = new Date(2026, 6, 1).getTimezoneOffset();
      const raw = { timeZone: ro.timeZone, locale: ro.locale, calendar: ro.calendar, numberingSystem: ro.numberingSystem,
        hourCycle: new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions().hourCycle ?? null,
        offsetJanuaryMin: -jan, offsetJulyMin: -jul, observesDST: jan !== jul };
      return measured(raw, { protection: ro.timeZone === 'UTC' || ro.timeZone === 'Etc/UTC' ? 'standardized' : 'none-detected',
        notes: ro.timeZone === 'UTC' ? ['UTC is the value Tor Browser and Firefox RFP report, but it is also a real timezone.'] : [] });
    },
  }),

  define({
    id: 'browser-flags', version: '1.0.0', category: 'browser', name: 'Cookie, online & privacy flags',
    simple: 'Simple on/off settings: cookies enabled, online status, PDF viewer, Do Not Track, Global Privacy Control.',
    how: 'Reads <code>cookieEnabled</code>, <code>onLine</code>, <code>pdfViewerEnabled</code>, <code>doNotTrack</code> and <code>globalPrivacyControl</code>.',
    technical: 'Each is close to binary, so it carries at most ~1 bit. A minority enable DNT/GPC, so enabling them slightly <em>reduces</em> the crowd you are in. GPC has legal effect in some jurisdictions (e.g. California CCPA opt-out), which is usually worth the trade-off.',
    exposes: 'Privacy preference flags and basic capability flags.', dataType: 'object', apis: ['navigator.cookieEnabled', 'navigator.onLine', 'navigator.pdfViewerEnabled', 'navigator.doNotTrack', 'navigator.globalPrivacyControl'],
    purpose: ['identification', 'analytics'], relevance: 'low', relevanceBasis: 'Near-binary values.',
    stability: 'semi-stable',
    privacyImpact: 'Low. Note: privacy preferences are not vulnerabilities.',
    limitations: ['onLine only indicates network connectivity of the device, not internet reachability.'],
    defenses: 'None needed.',
    mitigations: ['Keep GPC enabled where it carries legal weight; accept the small distinctiveness cost.'],
    sources: ['fpjs-sources', 'eff-cyt-about'],
    run: async () => {
      const n = nav();
      return measured({ cookieEnabled: n.cookieEnabled ?? null, onLine: n.onLine ?? null, pdfViewerEnabled: n.pdfViewerEnabled ?? null,
        doNotTrack: n.doNotTrack ?? g.doNotTrack ?? null, globalPrivacyControl: n.globalPrivacyControl ?? null },
      { normalized: { cookieEnabled: n.cookieEnabled ?? null, pdfViewerEnabled: n.pdfViewerEnabled ?? null, doNotTrack: n.doNotTrack ?? null, globalPrivacyControl: n.globalPrivacyControl ?? null } });
    },
  }),

  define({
    id: 'webdriver', version: '1.0.0', category: 'browser', name: 'navigator.webdriver',
    simple: 'A flag that is true when the browser is being remote-controlled by automation software.',
    how: 'The WebDriver standard requires <code>navigator.webdriver</code> to be <code>true</code> under automation (Selenium, Puppeteer, Playwright).',
    technical: 'Bot detection checks it first, but it is trivially hidden (e.g. Chromium flag <code>--disable-blink-features=AutomationControlled</code>), so vendors moved to deeper signals such as CDP side effects.',
    exposes: 'Whether the browser declares automation.', dataType: 'boolean', apis: ['navigator.webdriver'],
    purpose: ['bot-detection'], relevance: 'low', relevanceBasis: 'False for almost all humans.', stability: 'stable',
    combinesWith: [{ id: 'automation', basis: 'documented', source: 'datadome-cdp', note: 'One of several automation indicators.' }],
    privacyImpact: 'Minimal for humans.', concern: 'limitation',
    limitations: ['Easily hidden by bots; false does not prove a human.'],
    defenses: 'Not applicable.', mitigations: ['No action needed.'],
    sources: ['datadome-cdp'],
    run: async () => {
      const n = nav();
      if (!('webdriver' in n)) return unsupported('navigator.webdriver not exposed');
      return measured({ webdriver: n.webdriver });
    },
  }),

  define({
    id: 'touch', version: '1.0.0', category: 'browser', name: 'Touch support',
    simple: 'Whether your device has a touchscreen and how many touch points it supports.',
    how: 'Reads <code>navigator.maxTouchPoints</code> and checks for <code>TouchEvent</code> and <code>ontouchstart</code>.',
    technical: 'Separates phones, tablets, touch laptops and desktops. iPadOS reports a Mac UA but <code>maxTouchPoints &gt; 1</code>, a well-known disambiguation.',
    exposes: 'Touch capability and maximum touch points.', dataType: 'object', apis: ['navigator.maxTouchPoints', 'TouchEvent'],
    purpose: ['identification', 'compatibility'], relevance: 'low', relevanceBasis: 'Few distinct values.', stability: 'stable',
    combinesWith: [{ id: 'screen', basis: 'hypothetical', note: 'Device class.' }],
    privacyImpact: 'Low.', limitations: ['Touch-capable ≠ touch-used.'],
    defenses: 'Firefox RFP normalizes.', mitigations: ['No action needed.'],
    sources: ['fpjs-sources', 'eff-cyt-about'],
    run: async () => measured({ maxTouchPoints: nav().maxTouchPoints ?? null, touchEvent: 'TouchEvent' in g, ontouchstart: g.document ? 'ontouchstart' in g.document.documentElement : null }),
  }),

  define({
    id: 'engine-inference', version: '1.0.0', category: 'browser', name: 'Browser engine & version inference',
    tier: 'advanced', maturity: 'demonstrated',
    simple: 'A guess at your real browser engine based on how it behaves, not what it claims.',
    how: 'Combines feature probes (<code>window.chrome</code>, <code>InstallTrigger</code>, <code>-moz-</code> CSS, Error formats, <code>productSub</code>) into an engine guess and compares it with the User-Agent claim.',
    technical: 'Feature detection is harder to fake than strings because it requires reimplementing APIs. Error-message wording ("Cannot read properties of null" vs "null has no properties" vs "null is not an object") reliably separates V8, SpiderMonkey and JavaScriptCore.',
    exposes: 'Engine family; whether the UA claim is consistent.', dataType: 'object', apis: ['Error.prototype.message', 'CSS.supports', 'navigator.productSub'],
    purpose: ['bot-detection', 'fraud-prevention', 'compatibility'], relevance: 'low', relevanceBasis: 'Few engines exist; value is in contradiction detection.', stability: 'stable',
    combinesWith: [{ id: 'user-agent', basis: 'hypothetical', note: 'Claim vs behaviour.' }, { id: 'consistency', basis: 'hypothetical', note: 'Feeds cross-signal checks.' }],
    privacyImpact: 'Low; this is an inference.', limitations: ['Inference, not measurement; unusual or new browsers may be misclassified.'],
    defenses: 'None practical.', mitigations: ['No action needed.'],
    sources: ['iqbal-2021'],
    run: async () => {
      let msg = '';
      try { null.x; } catch (e) { msg = e.message; }
      const engine = /Cannot read propert/.test(msg) ? 'Blink/V8' : /null has no properties|is null/.test(msg) ? 'Gecko/SpiderMonkey' : /null is not an object/.test(msg) ? 'WebKit/JavaScriptCore' : 'unknown';
      const ua = nav().userAgent || '';
      const claimed = /Firefox\//.test(ua) ? 'Gecko/SpiderMonkey' : /Chrome\/|Chromium\//.test(ua) ? 'Blink/V8' : /Safari\//.test(ua) ? 'WebKit/JavaScriptCore' : 'unknown';
      const major = (ua.match(/(?:Firefox|Chrome|Version)\/(\d+)/) || [])[1] || null;
      return inferred({ errorMessage: msg, inferredEngine: engine, claimedEngine: claimed, claimedMajorVersion: major, consistent: engine === 'unknown' || claimed === 'unknown' ? null : engine === claimed },
        { confidence: engine === 'unknown' ? 'low' : 'medium', normalized: { inferredEngine: engine } });
    },
  }),
];
