// 5.1 Browser and environment.
import { define, g } from './define.js';
import { measured, inferred, unsupported, blocked, interactionRequired } from '../core/schema.js';
import { settleWithin } from '../core/util.js';

const nav = () => g.navigator || {};

export default [
  define({
    id: 'user-agent', version: '1.0.0', category: 'browser', name: 'User-Agent string',
    simple: 'The name tag your browser sends to every website: browser, version and operating system.',
    how: 'Every time your browser loads a page it sends a short line of text saying which browser and system it is. Scripts can read the same text. Many people share yours, but it is the first piece of the puzzle.',
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
    simple: 'A short, structured name tag from Chrome-family browsers: brand, main version, system and whether it is a phone.',
    how: 'Chrome, Edge and similar browsers share a few basic facts in a tidy format. Everyone with the same browser version shares the same answers.',
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
    simple: 'Extra detail from Chrome-family browsers: exact system version, processor type, device model. Read only when you click Run.',
    how: 'When asked, Chrome-family browsers can share more precise facts than their normal name tag. The lab only asks when you start this check, and the values stay on the page.',
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
    simple: 'The list of browser add-ons for file types. It used to identify people very well; today it is mostly a fixed PDF list.',
    how: 'Pages can read the list of plugins and the file types they handle. Years ago this list was long and very personal; modern browsers show the same short PDF list to everyone, or nothing.',
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
    simple: 'Whether your browser opens PDF files itself.',
    how: 'The page reads whether a built-in PDF viewer is turned on and whether the PDF file type is handled.',
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
    simple: 'Older name tags for your system, like "Win32" or "MacIntel".',
    how: 'Browsers still answer a few old questions about the system they run on and who made them. The answers are often frozen or out of date, so they are most useful for catching browsers that pretend to be something else.',
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
    simple: 'The languages you picked in your browser, in order of preference.',
    how: 'Your browser tells websites which languages you prefer so they can show the right one. A single common language is shared by millions; several languages in a particular order narrow down where you might be from.',
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
    simple: 'Your time zone and how dates and numbers are written where you live.',
    how: 'Your browser knows your time zone (for example Europe/Stockholm) and your local formats for dates and numbers, and shares them with any page that asks. This works even if you use a VPN.',
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
    simple: 'Simple on/off settings: are cookies allowed, are you online, and have you asked sites not to track you?',
    how: 'Pages can read a few yes/no settings: whether cookies are on, whether you appear to be online, whether there is a built-in PDF viewer, and whether you turned on "Do Not Track" or "Global Privacy Control".',
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
    simple: 'A flag that says whether software, not a person, is controlling the browser.',
    how: 'When a browser is driven by test or scraping software, it is supposed to raise a flag that pages can read. For real people the flag is off.',
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
    simple: 'Whether your screen is a touchscreen, and how many fingers it can track.',
    how: 'Pages can ask whether touch is supported and how many touch points the screen handles. That quickly separates phones and tablets from desktop computers.',
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
    simple: 'A guess at which browser you really use, based on how it behaves rather than what it says.',
    how: 'Browsers can claim to be anything, but each one words its error messages and handles small details in its own way. Comparing those habits with the browser\'s claim reveals the real engine behind it.',
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
