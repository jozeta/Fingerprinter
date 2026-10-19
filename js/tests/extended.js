// Additional techniques from current research and shipping libraries (added in catalogue 2026.10.19-2).
import { define, g } from './define.js';
import { measured, blocked, unsupported, serverOnly } from '../core/schema.js';
import { settleWithin } from '../core/util.js';

export default [
  define({
    id: 'cpu-architecture', version: '1.0.0', category: 'hardware', name: 'CPU architecture (NaN sign bit)', tier: 'advanced',
    simple: 'Tells Intel/AMD (x86) processors apart from ARM ones (Apple M-series, phones) with one tiny calculation.',
    how: 'Computes <code>Infinity − Infinity</code> in a 32-bit float and looks at the raw bytes of the result (a "not a number" value). x86 processors set the sign bit of that value; ARM processors do not.',
    technical: 'IEEE 754 leaves the sign of a generated NaN implementation-defined. x86/x86-64 produce the "default NaN" with the sign bit set (top byte 255), while ARM produces it unset (127). FingerprintJS uses exactly this check in its <code>architecture</code> source. It reveals the CPU family even when the User-Agent claims otherwise (e.g. Apple Silicon reporting "MacIntel").',
    exposes: 'CPU architecture family (x86 vs other).', dataType: 'enum', apis: ['Float32Array', 'Uint8Array'],
    purpose: ['identification', 'bot-detection', 'fraud-prevention'], relevance: 'low', relevanceBasis: 'Two common values; strong for consistency checks.', stability: 'stable',
    combinesWith: [{ id: 'platform', basis: 'documented', source: 'fpjs-architecture', note: 'Real CPU family vs reported platform.' }, { id: 'consistency', basis: 'hypothetical', note: 'Contradiction detection.' }],
    privacyImpact: 'Low on its own; exposes Apple Silicon behind "MacIntel".', limitations: ['Emulation (Rosetta, VMs) may report the emulated architecture.'],
    defenses: 'None known in mainstream browsers.', mitigations: ['No practical user action.'], sources: ['fpjs-architecture', 'fpjs-sources'],
    run: async () => {
      const f = new Float32Array(1), u8 = new Uint8Array(f.buffer);
      f[0] = Infinity; f[0] = f[0] - f[0];
      const top = u8[3];
      return measured({ nanTopByte: top, family: top === 255 ? 'x86 / x86-64' : top === 127 ? 'ARM or other' : 'unknown' }, { normalized: top, confidence: 'medium' });
    },
  }),

  define({
    id: 'vendor-flavors', version: '1.0.0', category: 'browser', name: 'Browser vendor flavors', tier: 'advanced',
    simple: 'Looks for small objects that specific browsers and in-app browsers add to every page.',
    how: 'Checks whether well-known vendor globals exist, for example <code>window.chrome</code>, <code>safari</code>, Yandex (<code>yandex</code>, <code>__yb</code>), Samsung Internet, UC Browser, Puffin and Chrome-on-iOS (<code>__gCrWeb</code>, <code>__crWeb</code>).',
    technical: 'Rebranded Chromium browsers share a User-Agent with Chrome but often inject their own globals, and in-app browsers (social apps) inject bridges. FingerprintJS\'s <code>vendor_flavors</code> source works the same way. The probe list here is a subset.',
    exposes: 'Which vendor-specific globals exist.', dataType: 'list', apis: ['window properties'],
    purpose: ['identification', 'bot-detection'], relevance: 'low', relevanceBasis: 'Separates rebranded browsers that share a UA.', stability: 'stable',
    combinesWith: [{ id: 'user-agent', basis: 'hypothetical', note: 'Real vendor vs claimed browser.' }],
    privacyImpact: 'Low.', limitations: ['Probe list is incomplete; globals can be spoofed.'],
    defenses: 'None needed.', mitigations: ['No action needed.'], sources: ['fpjs-sources'],
    run: async () => {
      const keys = ['chrome', 'safari', '__crWeb', '__gCrWeb', 'yandex', '__yb', '__ybro', '__firefox__', '__edgeTrackingPreventionStatistics', 'webkit', 'oprt', 'samsungAr', 'ucweb', 'UCShellJava', 'puffinDevice', 'opr', 'brave'];
      const found = keys.filter((k) => { try { return g[k] !== undefined || (k === 'brave' && g.navigator?.brave); } catch { return false; } });
      return measured({ found, probed: keys.length });
    },
  }),

  define({
    id: 'private-click-measurement', version: '1.0.0', category: 'browser', name: 'Private Click Measurement support', tier: 'advanced',
    simple: 'Checks for a Safari-only advertising-measurement feature. Its presence reveals Safari even when the browser claims to be something else.',
    how: 'Creates a detached link element and checks for the <code>attributionSourceId</code> property used by Private Click Measurement.',
    technical: 'Private Click Measurement is WebKit\'s privacy-preserving ad-click attribution API. FingerprintJS includes a <code>private_click_measurement</code> source because the property and its value distinguish Safari/WebKit versions.',
    exposes: 'PCM attribute support.', dataType: 'object', apis: ['HTMLAnchorElement.attributionSourceId'],
    purpose: ['identification', 'advertising'], relevance: 'low', relevanceBasis: 'Engine/version signal.', stability: 'stable',
    privacyImpact: 'Low.', concern: 'limitation', limitations: ['Only meaningful in WebKit browsers.'],
    defenses: 'None needed.', mitigations: ['No action needed.'], sources: ['fpjs-sources'],
    run: async () => {
      if (!g.document) return unsupported('DOM unavailable');
      const a = document.createElement('a');
      const id = a.attributionSourceId ?? a.attributionsourceid;
      return measured({ supported: id !== undefined, value: id === undefined ? null : String(id) });
    },
  }),

  define({
    id: 'intl-supported', version: '1.0.0', category: 'browser', name: 'Intl supported values (ICU data)', tier: 'advanced',
    simple: 'Counts how many calendars, currencies, time zones and units the browser knows. The numbers depend on the built-in locale data version.',
    how: 'Calls <code>Intl.supportedValuesOf()</code> for calendars, collations, currencies, numbering systems, time zones and units, and records the count of each and a short digest of the time-zone list.',
    technical: 'Browsers ship ICU/CLDR locale data that is updated with releases; some builds include reduced data. Counts therefore map to engine versions and build flavors, and complement feature detection.',
    exposes: 'Counts of supported Intl values.', dataType: 'object', apis: ['Intl.supportedValuesOf'],
    purpose: ['compatibility', 'bot-detection'], relevance: 'low', relevanceBasis: 'Shared by users of the same browser build.', stability: 'stable',
    combinesWith: [{ id: 'intl-timezone', basis: 'hypothetical', note: 'Locale data.' }, { id: 'api-surface', basis: 'hypothetical', note: 'Version range.' }],
    privacyImpact: 'Low.', concern: 'limitation', limitations: ['Changes with browser updates.'],
    defenses: 'None needed.', mitigations: ['Keep the browser updated.'], sources: ['w3c-fp-guidance'],
    run: async () => {
      if (typeof g.Intl?.supportedValuesOf !== 'function') return unsupported('Intl.supportedValuesOf not available');
      const raw = {};
      for (const k of ['calendar', 'collation', 'currency', 'numberingSystem', 'timeZone', 'unit']) { try { raw[k] = Intl.supportedValuesOf(k).length; } catch { raw[k] = null; } }
      return measured(raw);
    },
  }),

  define({
    id: 'media-capabilities', version: '1.0.0', category: 'media', name: 'Hardware video decoding (Media Capabilities)', tier: 'advanced', secureContext: false,
    simple: 'Asks whether videos in various formats would play smoothly and power-efficiently. "Power efficient" usually means a hardware decoder in your graphics chip.',
    how: 'Calls <code>navigator.mediaCapabilities.decodingInfo()</code> for a fixed set of video configurations (H.264, HEVC, VP9, AV1 at 1080p and 4K) and records <code>supported</code>, <code>smooth</code> and <code>powerEfficient</code>. Nothing is downloaded or played.',
    technical: 'Unlike <code>canPlayType()</code>, Media Capabilities reflects hardware acceleration and performance, which depends on GPU generation (AV1 hardware decode only exists on recent GPUs), drivers and OS codec licenses.',
    exposes: 'Decode support / smoothness / power efficiency per format.', dataType: 'object', apis: ['MediaCapabilities.decodingInfo'],
    purpose: ['identification', 'compatibility'], relevance: 'medium', relevanceBasis: 'Hardware-codec support varies with GPU generation.', stability: 'stable',
    combinesWith: [{ id: 'media-codecs', basis: 'hypothetical', note: 'Support vs acceleration.' }, { id: 'webgl-info', basis: 'hypothetical', note: 'GPU generation.' }],
    privacyImpact: 'Moderate in combination.', limitations: ['Answers can depend on battery/power mode.'],
    defenses: 'Firefox RFP restricts some answers.', mitigations: ['No practical user action.'], sources: ['w3c-fp-guidance'],
    run: async () => {
      const mc = g.navigator?.mediaCapabilities;
      if (!mc?.decodingInfo) return unsupported('Media Capabilities API not available');
      const configs = { 'h264-1080p': ['video/mp4; codecs="avc1.640028"', 1920, 1080], 'hevc-4k': ['video/mp4; codecs="hvc1.2.4.L153.B0"', 3840, 2160],
        'vp9-4k': ['video/webm; codecs="vp09.00.51.08"', 3840, 2160], 'av1-4k': ['video/mp4; codecs="av01.0.12M.08"', 3840, 2160] };
      const raw = {};
      for (const [k, [contentType, width, height]] of Object.entries(configs)) {
        const r = await settleWithin(mc.decodingInfo({ type: 'media-source', video: { contentType, width, height, bitrate: 8e6, framerate: 30 } }).catch(() => null), 1500, null);
        raw[k] = r ? [r.supported, r.smooth, r.powerEfficient].map((b) => (b ? '✓' : '✗')).join(' ') : 'no answer';
      }
      return measured(raw, { notes: ['Values are supported / smooth / power-efficient.'] });
    },
  }),

  define({
    id: 'webcodecs', version: '1.0.0', category: 'media', name: 'WebCodecs encoder support', tier: 'advanced', secureContext: true,
    simple: 'Checks which video formats the browser can encode itself, which often depends on the hardware encoder in your graphics chip.',
    how: 'Calls <code>VideoEncoder.isConfigSupported()</code> for H.264, VP9, AV1 and HEVC at 1080p, asking specifically for hardware acceleration. No encoder is created and nothing is encoded.',
    technical: 'Hardware encoders (Intel Quick Sync, NVIDIA NVENC, AMD VCE, Apple VideoToolbox) support different codec sets by generation. Asking with <code>hardwareAcceleration: "prefer-hardware"</code> separates GPU generations and software-only environments such as VMs.',
    exposes: 'Hardware-encoder support per codec.', dataType: 'object', apis: ['VideoEncoder.isConfigSupported'],
    purpose: ['identification', 'bot-detection'], relevance: 'medium', relevanceBasis: 'Hardware encoder sets vary by GPU generation.', stability: 'stable',
    combinesWith: [{ id: 'media-capabilities', basis: 'hypothetical', note: 'Decode vs encode hardware.' }],
    privacyImpact: 'Moderate in combination.', limitations: ['Chromium and Safari only; answers may depend on power state.'],
    defenses: 'None common.', mitigations: ['No practical user action.'], sources: ['w3c-fp-guidance'],
    run: async () => {
      if (typeof g.VideoEncoder?.isConfigSupported !== 'function') return unsupported('WebCodecs VideoEncoder not available');
      const codecs = { h264: 'avc1.42001f', vp9: 'vp09.00.10.08', av1: 'av01.0.04M.08', hevc: 'hvc1.1.6.L93.B0' };
      const raw = {};
      for (const [k, codec] of Object.entries(codecs)) {
        const r = await settleWithin(VideoEncoder.isConfigSupported({ codec, width: 1920, height: 1080, bitrate: 4e6, framerate: 30, hardwareAcceleration: 'prefer-hardware' }).catch(() => null), 1500, null);
        raw[k] = r ? r.supported : null;
      }
      return measured({ hardwareEncoding: raw });
    },
  }),

  define({
    id: 'refresh-rate', version: '1.0.0', category: 'screen', name: 'Display refresh rate', tier: 'advanced', stability: 'semi-stable',
    simple: 'Estimates how many times per second your screen refreshes (60, 90, 120, 144 Hz…), which hints at the type of monitor or phone.',
    how: 'Times 30 consecutive animation frames with <code>requestAnimationFrame</code> (about half a second) and reports the median frame interval as a rate in Hz, rounded to the nearest common value.',
    technical: 'High-refresh displays (ProMotion 120 Hz, gaming 144/165/240 Hz) are less common than 60 Hz. Background tabs, power saving and variable-refresh displays affect the estimate, so it is marked semi-stable. If the tab is hidden, browsers pause animation frames and the test reports blocked.',
    exposes: 'Approximate display refresh rate.', dataType: 'number', apis: ['requestAnimationFrame'],
    purpose: ['identification', 'bot-detection'], relevance: 'low', relevanceBasis: 'Few common values; high-refresh screens are less common.',
    combinesWith: [{ id: 'screen', basis: 'hypothetical', note: 'Monitor/device class.' }],
    privacyImpact: 'Low.', limitations: ['Noisy under load; throttled in background tabs and power-saving modes.'],
    defenses: 'Tor Browser and Firefox RFP coarsen timing.', mitigations: ['No practical user action.'], sources: ['w3c-fp-guidance'],
    run: async () => {
      if (typeof g.requestAnimationFrame !== 'function') return unsupported('requestAnimationFrame unavailable');
      const times = await settleWithin(new Promise((resolve) => { const t = []; const tick = (ts) => { t.push(ts); if (t.length < 31) requestAnimationFrame(tick); else resolve(t); }; requestAnimationFrame(tick); }), 2000, null);
      if (!times) return blocked('Animation frames did not run (tab hidden or throttled).', { protection: 'unknown' });
      const deltas = times.slice(1).map((v, i) => v - times[i]).sort((a, b) => a - b);
      const hz = 1000 / deltas[deltas.length >> 1];
      const common = [30, 48, 50, 60, 75, 90, 100, 120, 144, 165, 240].reduce((a, b) => (Math.abs(b - hz) < Math.abs(a - hz) ? b : a));
      return measured({ estimatedHz: +hz.toFixed(1), nearestCommonHz: common }, { normalized: common, confidence: 'medium' });
    },
  }),

  define({
    id: 'css-scriptless', version: '1.0.0', category: 'server', name: 'Script-less CSS fingerprinting', tier: 'advanced', serverRequired: true, includeByDefault: false, stability: 'stable',
    simple: 'Turning off JavaScript does not stop fingerprinting: a stylesheet alone can make your browser reveal its traits to a server.',
    how: 'A stylesheet contains rules like <code>@media (min-width: 1920px)</code>, <code>@supports (…)</code> and font fallbacks that each load a different background image URL. Which URLs the browser requests (visible in the server\'s logs) reveals screen size, supported features, fonts and settings. This works in pages with JavaScript disabled and even in some e-mail clients.',
    technical: 'Trampert et al. (NDSS 2025, "Cascading Spy Sheets") distinguished 1152 of 1176 (97.95%) tested browser/OS combinations without JavaScript. The measurement happens in the server logs, so this static lab can explain it but not observe it. The client-side counterpart is the Extended media query matrix test.',
    exposes: 'Feature and setting matches, via server request logs.', dataType: 'object', apis: ['CSS @media', 'CSS @supports', 'CSS @font-face'],
    purpose: ['identification', 'advertising', 'research'], relevance: 'high', relevanceBasis: 'Research shows near-complete separation of browser/OS combinations without JavaScript.',
    combinesWith: [{ id: 'media-query-matrix', basis: 'documented', source: 'cascading-spy-sheets-2025', note: 'Same media/feature queries, observed server-side.' }],
    privacyImpact: 'High: defeats "disable JavaScript" as a defense.', concern: 'privacy', limitations: ['Requires server-side logging of resource requests.'],
    defenses: 'Tor Browser "Safest" mode; e-mail clients that proxy or block remote content.', mitigations: ['Block remote content in e-mail.', 'Use Tor Browser\'s Safest mode for high-risk browsing.'],
    sources: ['cascading-spy-sheets-2025'],
    run: async ({ options }) => {
      const obs = options?.serverObservations?.['css-scriptless'];
      return obs ? measured(obs) : serverOnly('Observable only in server request logs. This static deployment has no server component.');
    },
  }),
];
