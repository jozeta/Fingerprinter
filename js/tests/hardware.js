// 5.8 Hardware and runtime characteristics. All workloads are small and bounded.
import { define, g } from './define.js';
import { measured, blocked, unsupported } from '../core/schema.js';
import { settleWithin } from '../core/util.js';

export default [
  define({
    id: 'cpu-memory', version: '1.0.0', category: 'hardware', name: 'Logical processors & device memory (coarse)',
    simple: 'Roughly how many processor threads and how much memory the browser reports.',
    how: 'Reads <code>navigator.hardwareConcurrency</code> and <code>navigator.deviceMemory</code>.',
    technical: '<code>hardwareConcurrency</code> is the number of <em>logical</em> processors the browser chooses to report. It is not the number of physical cores, and browsers may cap or round it. <code>deviceMemory</code> (Chromium only) is rounded to a power of two and capped at 8 GB, so it is <em>not</em> your installed RAM.',
    exposes: 'Coarse compute and memory class.', dataType: 'object', apis: ['navigator.hardwareConcurrency', 'navigator.deviceMemory'],
    purpose: ['identification', 'bot-detection', 'fraud-prevention'], relevance: 'medium', relevanceBasis: 'A handful of common values; separates device classes.', stability: 'stable',
    combinesWith: [{ id: 'benchmark', basis: 'hypothetical', note: 'Reported vs measured performance.' }],
    privacyImpact: 'Low to moderate.', limitations: ['Coarse and capped by design.', 'Safari caps hardwareConcurrency.'],
    defenses: 'Tor/Firefox RFP report fixed values; Brave randomizes.', mitigations: ['No action needed.'],
    sources: ['fpjs-sources'],
    run: async () => measured({ hardwareConcurrency: g.navigator?.hardwareConcurrency ?? null, deviceMemoryGB: g.navigator?.deviceMemory ?? null }),
  }),

  define({
    id: 'network-info', version: '1.0.0', category: 'hardware', name: 'Network Information API',
    simple: 'Your connection type and rough speed estimate.',
    how: 'Reads <code>navigator.connection</code>: <code>effectiveType</code>, <code>downlink</code>, <code>rtt</code>, <code>saveData</code>.',
    technical: 'Values are rounded (rtt to 25 ms, downlink to 25 kbps) and change with network conditions, so they are volatile. Chromium-only.',
    exposes: 'Connection quality class.', dataType: 'object', apis: ['navigator.connection'],
    purpose: ['analytics', 'bot-detection'], relevance: 'low', relevanceBasis: 'Volatile and coarse.', stability: 'volatile',
    privacyImpact: 'Low.', limitations: ['Changes with network conditions.'],
    defenses: 'Not implemented in Firefox/Safari.', mitigations: ['No action needed.'], sources: ['w3c-fp-guidance'],
    run: async () => {
      const c = g.navigator?.connection;
      if (!c) return unsupported('navigator.connection not implemented');
      return measured({ effectiveType: c.effectiveType ?? null, downlinkMbps: c.downlink ?? null, rttMs: c.rtt ?? null, saveData: c.saveData ?? null });
    },
  }),

  define({
    id: 'wasm-sab', version: '1.0.0', category: 'hardware', name: 'WebAssembly & SharedArrayBuffer',
    simple: 'Whether advanced computation features are available.',
    how: 'Validates tiny WebAssembly modules for SIMD and threads support, and checks <code>SharedArrayBuffer</code> and <code>crossOriginIsolated</code>.',
    technical: 'SharedArrayBuffer requires cross-origin isolation (COOP/COEP headers) since Spectre. WebAssembly feature support maps to browser versions and CPU capabilities. Validating a module does not execute code.',
    exposes: 'Feature flags.', dataType: 'object', apis: ['WebAssembly.validate', 'SharedArrayBuffer', 'crossOriginIsolated'],
    purpose: ['compatibility'], relevance: 'low', relevanceBasis: 'Shared by all users of a browser version.', stability: 'stable',
    privacyImpact: 'Low.', concern: 'limitation', limitations: ['Depends on page headers as well as the browser.'],
    defenses: 'None needed.', mitigations: ['No action needed.'], sources: ['w3c-fp-guidance'],
    run: async () => {
      const W = g.WebAssembly;
      const simd = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11]);
      const threads = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 5, 4, 1, 3, 1, 1, 10, 11, 1, 9, 0, 65, 0, 254, 16, 2, 0, 26, 11]);
      return measured({ webAssembly: !!W, simd: W ? W.validate(simd) : null, threads: W ? W.validate(threads) : null,
        sharedArrayBuffer: typeof g.SharedArrayBuffer === 'function', crossOriginIsolated: g.crossOriginIsolated ?? null });
    },
  }),

  define({
    id: 'timer-precision', version: '2.0.0', category: 'hardware', name: 'Timer precision & jitter sample', tier: 'advanced',
    simple: 'How precise the browser\'s clock is and how much it jitters. Privacy modes make it deliberately coarse.',
    how: 'Calls <code>performance.now()</code> in a bounded loop (max 20,000 iterations), records the smallest observed step and the distribution of step sizes (median and standard deviation = jitter).',
    technical: 'After Spectre, browsers coarsened timers (Chromium ~100 µs, ~5 µs when cross-origin isolated; Firefox 1 ms under RFP; Tor 100 ms). The step size can indicate privacy modes. <strong>Timing results are noisy</strong>: background load affects them.',
    exposes: 'Timer granularity.', dataType: 'number', apis: ['performance.now'],
    purpose: ['bot-detection', 'privacy-defense'], relevance: 'low', relevanceBasis: 'Few distinct values per browser.', stability: 'semi-stable',
    privacyImpact: 'Low; mainly reveals privacy-mode use.', limitations: ['Noisy; repeat for confidence.'],
    defenses: 'Coarse timers are themselves a defense.', mitigations: ['No action needed.'], sources: ['w3c-fp-guidance'],
    run: async () => {
      if (!g.performance?.now) return unsupported('performance.now unavailable');
      const deltas = []; let last = performance.now();
      for (let i = 0; i < 20000 && deltas.length < 200; i++) { const n = performance.now(); if (n !== last) { deltas.push(n - last); last = n; } }
      const minStepMs = deltas.length ? Math.min(...deltas) : null;
      const sorted = deltas.slice().sort((a, b) => a - b), us = (v) => +(v * 1000).toFixed(1);
      const meanD = deltas.reduce((s, x) => s + x, 0) / (deltas.length || 1);
      const jitter = Math.sqrt(deltas.reduce((s, x) => s + (x - meanD) ** 2, 0) / (deltas.length || 1));
      return measured({ minStepMicroseconds: minStepMs === null ? null : us(minStepMs), medianStepMicroseconds: deltas.length ? us(sorted[sorted.length >> 1]) : null,
        jitterStdMicroseconds: us(jitter), distinctSteps: new Set(deltas.map((d) => d.toFixed(4))).size, samples: deltas.length },
        { confidence: 'medium', protection: minStepMs !== null && minStepMs >= 1 ? 'standardized' : 'none-detected', normalized: minStepMs === null ? null : Math.round(minStepMs * 1000) });
    },
  }),

  define({
    id: 'benchmark', version: '1.0.0', category: 'hardware', name: 'Bounded CPU timing', tier: 'advanced', maturity: 'research',
    simple: 'A tiny, fixed calculation is timed. Faster devices finish sooner.',
    how: 'Runs exactly 300,000 iterations of simple math three times and reports the median time. Total work is a few milliseconds.',
    technical: 'Relative speed separates phones from desktops and can expose overloaded cloud VMs. It is <strong>noisy</strong> (thermal state, background tabs, power saving) and therefore excluded from the default fingerprint profile.',
    exposes: 'Approximate CPU speed class.', dataType: 'number', apis: ['performance.now'],
    purpose: ['bot-detection', 'fraud-prevention'], relevance: 'low', relevanceBasis: 'High variance between runs.', stability: 'volatile',
    combinesWith: [{ id: 'cpu-memory', basis: 'hypothetical', note: 'Reported vs measured capability.' }],
    privacyImpact: 'Low.', limitations: ['Highly noisy; not a stable identifier.', 'Coarse timers reduce precision.'],
    defenses: 'Coarse timers.', mitigations: ['No action needed.'], sources: ['drawnapart-2022'],
    run: async () => {
      if (!g.performance?.now) return unsupported('performance.now unavailable');
      const times = [];
      for (let r = 0; r < 3; r++) { const t0 = performance.now(); let x = 0; for (let i = 0; i < 300000; i++) x += Math.sqrt(i) * 1.0001; times.push(performance.now() - t0 + (x < 0 ? 1 : 0)); }
      times.sort((a, b) => a - b);
      return measured({ medianMs: +times[1].toFixed(2), runsMs: times.map((t) => +t.toFixed(2)) }, { confidence: 'low' });
    },
  }),

  define({
    id: 'math-precision', version: '1.0.0', category: 'hardware', name: 'Math function precision', tier: 'advanced',
    simple: 'Some math functions give slightly different last digits on different browsers and systems.',
    how: 'Evaluates functions such as <code>Math.tan(-1e300)</code>, <code>Math.acosh(1e308)</code> and <code>Math.expm1(1)</code>.',
    technical: 'Engines use different libm ports and CPU intrinsics for transcendental functions; the last bits differ between V8, SpiderMonkey and JavaScriptCore and sometimes between OS/CPU. Primarily an engine/platform signal.',
    exposes: 'Results of a fixed set of math evaluations.', dataType: 'object', apis: ['Math'],
    purpose: ['identification', 'bot-detection'], relevance: 'low', relevanceBasis: 'Mostly redundant with engine and OS.', stability: 'stable',
    combinesWith: [{ id: 'engine-inference', basis: 'hypothetical', note: 'Engine family.' }],
    privacyImpact: 'Low.', limitations: ['Redundant with browser/OS for most users.'],
    defenses: 'Tor Browser normalizes some functions.', mitigations: ['No action needed.'], sources: ['fpjs-sources'],
    run: async () => {
      const M = Math;
      return measured({ tan: M.tan(-1e300), acosh: M.acosh(1e308), asinh: M.asinh(1), atanh: M.atanh(0.5), expm1: M.expm1(1), sinh: M.sinh(1),
        cosh: M.cosh(10), cbrt: M.cbrt(100), log1p: M.log1p(10), exp: M.exp(10), powPi: M.pow(M.PI, -100), sinBig: M.sin(1e37) });
    },
  }),

  define({
    id: 'battery', version: '2.0.0', category: 'hardware', name: 'Battery API exposure (presence only)',
    simple: 'Whether the browser exposes the Battery Status API. Your battery level is not read.',
    how: 'Checks only whether <code>navigator.getBattery</code> and <code>BatteryManager</code> exist. <code>getBattery()</code> is <strong>not called</strong>, so level and charging state are never read.',
    technical: 'Olejnik et al. (2015) showed battery level plus discharge time can link visits across sites over short periods, which led Firefox and Safari to remove the API. Chromium still exposes it. Presence mostly reveals the engine family.',
    exposes: 'API presence only.', dataType: 'boolean', apis: ['navigator.getBattery', 'BatteryManager'],
    purpose: ['identification', 'compatibility'], relevance: 'low', relevanceBasis: 'Presence correlates with the engine; state is not read.', stability: 'stable',
    privacyImpact: 'Low (presence only). The underlying API allows short-term linkage.', concern: 'limitation',
    limitations: ['Presence does not mean values would be exposed (desktops report fixed values).'],
    defenses: 'Removed from Firefox and Safari.', mitigations: ['No action needed for most users.'], sources: ['olejnik-2015', 'englehardt-2016'],
    run: async () => {
      const n = g.navigator || {};
      return measured({ getBatteryPresent: typeof n.getBattery === 'function', BatteryManager: 'BatteryManager' in g }, { notes: ['getBattery() was not called; no battery state was read.'] });
    },
  }),

  define({
    id: 'js-heap', version: '1.0.0', category: 'hardware', name: 'Runtime memory hints (JS heap)', tier: 'advanced',
    simple: 'How much JavaScript memory the browser reports this page may use.',
    how: 'Reads the non-standard <code>performance.memory</code> (Chromium): <code>jsHeapSizeLimit</code>, <code>totalJSHeapSize</code>, <code>usedJSHeapSize</code>. Checks whether <code>performance.measureUserAgentSpecificMemory()</code> exists (it requires cross-origin isolation; it is not called).',
    technical: 'Chromium buckets these values to limit precision. <code>jsHeapSizeLimit</code> tends to reflect the device memory class and 32/64-bit builds (e.g. ~4 GB on 64-bit desktop). Used/total heap are volatile and describe this page, not your system.',
    exposes: 'Heap limit and coarse usage.', dataType: 'object', apis: ['performance.memory'],
    purpose: ['identification', 'bot-detection'], relevance: 'low', relevanceBasis: 'Bucketed; mostly a device-class signal.', stability: 'semi-stable',
    combinesWith: [{ id: 'cpu-memory', basis: 'hypothetical', note: 'Memory class.' }],
    privacyImpact: 'Low.', limitations: ['Chromium-only and deliberately imprecise.', 'Used/total values change constantly.'],
    defenses: 'Values are bucketed by Chromium; absent elsewhere.', mitigations: ['No action needed.'], sources: ['w3c-fp-guidance'],
    run: async () => {
      const m = g.performance?.memory;
      const uasm = typeof g.performance?.measureUserAgentSpecificMemory === 'function';
      if (!m) return measured({ performanceMemory: false, measureUserAgentSpecificMemory: uasm }, { notes: ['performance.memory is Chromium-only.'] });
      return measured({ performanceMemory: true, jsHeapSizeLimitMB: Math.round(m.jsHeapSizeLimit / 1048576), totalJSHeapSizeMB: Math.round(m.totalJSHeapSize / 1048576),
        usedJSHeapSizeMB: Math.round(m.usedJSHeapSize / 1048576), measureUserAgentSpecificMemory: uasm },
      { normalized: { jsHeapSizeLimitMB: Math.round(m.jsHeapSizeLimit / 1048576), measureUserAgentSpecificMemory: uasm } });
    },
  }),

  define({
    id: 'wasm-features', version: '1.0.0', category: 'hardware', name: 'WebAssembly feature surface', tier: 'advanced',
    simple: 'Which WebAssembly language features the engine supports.',
    how: 'Builds seven tiny WebAssembly modules as plain byte arrays, one per feature (sign extension, saturating float-to-int, bulk memory, multi-value, reference types, tail calls, SIMD), and checks each with <code>WebAssembly.validate()</code>. Validation only parses; <strong>no code is compiled into a running instance or executed</strong>.',
    technical: 'Feature support moved through engines at different releases (e.g. tail calls shipped in V8 well before JavaScriptCore). The resulting bitmask maps to engine and version ranges. Each probe module was verified against V8 when written.',
    exposes: 'WebAssembly feature bitmask.', dataType: 'object', apis: ['WebAssembly.validate'],
    purpose: ['compatibility', 'bot-detection'], relevance: 'low', relevanceBasis: 'Shared by all users of the same engine version.', stability: 'stable',
    combinesWith: [{ id: 'wasm-sab', basis: 'hypothetical', note: 'WebAssembly capability.' }, { id: 'engine-inference', basis: 'hypothetical', note: 'Engine version range.' }],
    privacyImpact: 'Low.', concern: 'limitation', limitations: ['Validation can be disabled by policy (e.g. JIT-less or "Lockdown" modes), which shows as all false.'],
    defenses: 'None needed.', mitigations: ['No action needed.'], sources: ['w3c-fp-guidance'],
    run: async () => {
      const W = g.WebAssembly;
      if (!W?.validate) return unsupported('WebAssembly not available (disabled or JIT-less mode)');
      // Minimal module: header + type, function, optional memory, and code section with one function body.
      const sec = (id, b) => [id, b.length, ...b];
      const mod = (type, body, mem = false) => new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, ...sec(1, [1, ...type]), ...sec(3, [1, 0]),
        ...(mem ? sec(5, [1, 0, 1]) : []), ...sec(10, [1, body.length + 2, 0, ...body, 0x0b])]);
      const V = [0x60, 0, 0], I32 = [0x60, 0, 1, 0x7f];
      const probes = {
        signExtension: mod(I32, [0x41, 0, 0xc0]), saturatedFloatToInt: mod(I32, [0x43, 0, 0, 0, 0, 0xfc, 0x00]),
        bulkMemory: mod(V, [0x41, 0, 0x41, 0, 0x41, 0, 0xfc, 0x0b, 0x00], true), multiValue: mod([0x60, 0, 2, 0x7f, 0x7f], [0x41, 0, 0x41, 0]),
        referenceTypes: mod(V, [0xd0, 0x6f, 0x1a]), tailCall: mod(V, [0x12, 0x00]), simd: mod([0x60, 0, 1, 0x7b], [0x41, 0, 0xfd, 0x0f]),
      };
      const raw = {}; for (const [k, b] of Object.entries(probes)) { try { raw[k] = W.validate(b); } catch { raw[k] = false; } }
      raw.jspi = typeof W.Suspending === 'function'; raw.exceptionsJSAPI = typeof W.Tag === 'function';
      return measured(raw);
    },
  }),

  define({
    id: 'keyboard-layout', version: '1.0.0', category: 'hardware', name: 'Keyboard layout map', tier: 'advanced', secureContext: true,
    simple: 'Your keyboard layout (e.g. Swedish, German, French) without you pressing any key.',
    how: '<code>navigator.keyboard.getLayoutMap()</code> maps physical key codes to the characters your layout produces. We read a handful of keys that differ between layouts.',
    technical: '<code>KeyQ→a</code> indicates AZERTY, <code>KeyY→z</code> QWERTZ, <code>Semicolon→ö</code> Swedish/Finnish. Chromium-only; requires a top-level, focused, secure context.',
    exposes: 'Keyboard layout family (hints at country).', dataType: 'object', apis: ['Keyboard.getLayoutMap'],
    purpose: ['identification'], relevance: 'medium', relevanceBasis: 'Non-US layouts narrow region strongly.', stability: 'stable',
    combinesWith: [{ id: 'languages', basis: 'hypothetical', note: 'Region consistency.' }],
    privacyImpact: 'Can reveal country even when language and timezone are changed.', limitations: ['Chromium-only.', 'Layout guess is a simple heuristic.'],
    defenses: 'Not implemented in Firefox/Safari; Brave restricts.', mitigations: ['No practical action besides browser choice.'], sources: ['wicg-keyboard-map'],
    run: async () => {
      if (!g.navigator?.keyboard?.getLayoutMap) return unsupported('Keyboard Map API not implemented.');
      const map = await settleWithin(navigator.keyboard.getLayoutMap().catch(() => null), 1500, null);
      if (!map) return blocked('Layout map not provided (needs a focused top-level frame, or blocked).', { protection: 'unknown' });
      const keys = {}; for (const k of ['KeyQ', 'KeyW', 'KeyY', 'KeyZ', 'KeyM', 'Semicolon', 'Quote', 'BracketLeft', 'Minus', 'Backquote']) keys[k] = map.get(k) ?? null;
      const guess = keys.KeyQ === 'a' ? 'AZERTY' : keys.KeyY === 'z' ? 'QWERTZ' : keys.KeyQ === "'" ? 'Dvorak'
        : keys.Semicolon === 'ö' ? 'Nordic (sv/fi)' : keys.Semicolon === 'ø' ? 'Norwegian' : keys.Semicolon === 'æ' ? 'Danish' : keys.Semicolon === 'ñ' ? 'Spanish' : 'QWERTY-like';
      return measured({ keys, layoutGuess: guess }, { normalized: keys, notes: ['The layout name is an inference from a few keys.'] });
    },
  }),
];
