// 5.7 CSS and rendering capabilities.
import { define, g } from './define.js';
import { measured, unsupported } from '../core/schema.js';

const pick = (f, vals) => vals.find((v) => matchMedia(`(${f}: ${v})`).matches) ?? null;

export default [
  define({
    id: 'user-preferences', version: '1.0.0', category: 'css', name: 'Accessibility & appearance preferences',
    simple: 'Your appearance and accessibility choices: dark mode, reduced motion, high contrast and similar.',
    how: 'Your browser tells pages about settings like dark mode, reduced motion and higher contrast so they can adapt. These are good settings to keep if you need them; enabled accessibility settings are just less common.',
    technical: 'Each is low-entropy, but accessibility settings are used by minorities and are therefore more distinctive when enabled. <strong>These are legitimate user preferences, not vulnerabilities.</strong> Sites need them to render accessibly.',
    exposes: 'Appearance and accessibility preferences.', dataType: 'object', apis: ['window.matchMedia'],
    purpose: ['identification', 'compatibility'], relevance: 'low', relevanceBasis: 'Binary-ish values; minority settings add some distinctiveness.', stability: 'semi-stable',
    combinesWith: [{ id: 'system-colors', basis: 'hypothetical', note: 'Both reflect OS theme.' }],
    privacyImpact: 'Low; may indirectly hint at accessibility needs.',
    limitations: ['Color scheme may change automatically with time of day.'],
    defenses: 'Firefox RFP reports light scheme and no reduced motion.',
    mitigations: ['Keep accessibility settings you need. The privacy cost is small and the usability benefit is real.'],
    sources: ['fpjs-sources'],
    run: async () => {
      if (!g.matchMedia) return unsupported('matchMedia unavailable');
      return measured({
        colorScheme: pick('prefers-color-scheme', ['dark', 'light']), reducedMotion: pick('prefers-reduced-motion', ['reduce', 'no-preference']),
        contrast: pick('prefers-contrast', ['more', 'less', 'custom', 'no-preference']), forcedColors: pick('forced-colors', ['active', 'none']),
        reducedTransparency: pick('prefers-reduced-transparency', ['reduce', 'no-preference']), invertedColors: pick('inverted-colors', ['inverted', 'none']),
      });
    },
  }),

  define({
    id: 'media-query-matrix', version: '1.0.0', category: 'css', name: 'Extended media query matrix', tier: 'advanced',
    simple: 'A wide sweep of questions about your display and browser mode.',
    how: 'The page asks about twenty more questions about your display, such as how sharp it is, its shape, whether the page runs as an installed app, and whether you asked for reduced data use. Sites can ask these even without JavaScript.',
    technical: 'Every one of these can also be evaluated <strong>without JavaScript</strong> by CSS that loads a different URL per match, so a server can collect them from request logs. Unknown features never match, which itself reveals engine support.',
    exposes: 'Media-query match matrix.', dataType: 'object', apis: ['window.matchMedia'],
    purpose: ['identification', 'compatibility'], relevance: 'low', relevanceBasis: 'Mostly correlated with device class and browser.', stability: 'semi-stable',
    combinesWith: [{ id: 'display-media', basis: 'hypothetical', note: 'Overlapping display features.' }, { id: 'user-preferences', basis: 'hypothetical', note: 'Preference queries.' }],
    privacyImpact: 'Low individually; usable without JavaScript.', limitations: ['Resolution/aspect buckets change with window size and zoom.'],
    defenses: 'Firefox RFP normalizes some features.', mitigations: ['No practical user action.'], sources: ['w3c-fp-guidance', 'fpjs-sources'],
    run: async () => {
      if (!g.matchMedia) return unsupported('matchMedia unavailable');
      const m = (q) => matchMedia(q).matches;
      const raw = {
        scripting: pick('scripting', ['enabled', 'initial-only', 'none']), update: pick('update', ['fast', 'slow', 'none']),
        overflowBlock: pick('overflow-block', ['scroll', 'optional-paged', 'paged', 'none']), overflowInline: pick('overflow-inline', ['scroll', 'none']),
        displayMode: pick('display-mode', ['fullscreen', 'standalone', 'minimal-ui', 'picture-in-picture', 'browser']),
        reducedData: pick('prefers-reduced-data', ['reduce', 'no-preference']), videoDynamicRange: pick('video-dynamic-range', ['high', 'standard']),
        grid: m('(grid)'), anyHover: pick('any-hover', ['hover', 'none']), colorIndex: m('(color-index)'),
        colorBits: [10, 8, 6, 4].find((b) => m(`(min-color: ${b})`)) ?? null,
        resolutionDppx: [4, 3, 2.5, 2, 1.5, 1.25, 1].find((r) => m(`(min-resolution: ${r}dppx)`)) ?? null,
        aspectRatio: ['21/9', '16/9', '16/10', '3/2', '4/3', '1/1'].find((r) => m(`(min-aspect-ratio: ${r})`)) ?? 'portrait',
        orientation: pick('orientation', ['portrait', 'landscape']), invertedColors: pick('inverted-colors', ['inverted', 'none']),
        environmentBlending: pick('environment-blending', ['opaque', 'additive', 'subtractive']),
      };
      return measured(raw, { normalized: { ...raw, resolutionDppx: undefined, aspectRatio: undefined, orientation: undefined } });
    },
  }),

  define({
    id: 'css-features', version: '1.0.0', category: 'css', name: 'CSS feature support',
    simple: 'Which modern styling features your browser supports, which hints at its version.',
    how: 'The page asks your browser whether it understands a list of newer design features. Each browser version supports a slightly different set, so the answers point to your browser and version.',
    technical: 'Support bitmasks map to browser release ranges. Vendor-prefixed properties (<code>-moz-</code>, <code>-webkit-touch-callout</code>) reveal the engine. Outdated support patterns indicate old (potentially unpatched) browsers.',
    exposes: 'Supported/unsupported CSS features.', dataType: 'object', apis: ['CSS.supports'],
    purpose: ['compatibility', 'bot-detection', 'identification'], relevance: 'low', relevanceBasis: 'Shared by all users of the same browser version.', stability: 'semi-stable',
    combinesWith: [{ id: 'api-surface', basis: 'hypothetical', note: 'Together pin the version range.' }, { id: 'engine-inference', basis: 'hypothetical', note: 'Engine family.' }],
    privacyImpact: 'Low; mostly duplicates the browser version.', concern: 'limitation',
    limitations: ['Feature lists age quickly and need maintenance.'],
    defenses: 'None; keep updated to share the common version.', mitigations: ['Keep the browser updated.'],
    sources: ['w3c-fp-guidance'],
    run: async () => {
      if (!g.CSS?.supports) return unsupported('CSS.supports unavailable');
      const tests = ['display: grid', 'container-type: inline-size', 'anchor-name: --a', 'view-transition-name: a', 'text-wrap: balance',
        'field-sizing: content', 'interpolate-size: allow-keywords', 'color: oklch(0.5 0.1 100)', 'selector(:has(a))', 'animation-timeline: scroll()',
        'appearance: base-select', '-webkit-touch-callout: none', '-moz-appearance: none', 'math-depth: 1', 'reading-flow: normal'];
      const raw = {};
      for (const t of tests) {
        try { raw[t] = t.startsWith('selector') ? CSS.supports(t) : CSS.supports(...t.split(/:(.*)/s).slice(0, 2).map((x) => x.trim())); } catch { raw[t] = false; }
      }
      return measured(raw);
    },
  }),

  define({
    id: 'system-colors', version: '2.0.0', category: 'css', name: 'CSS system colors & computed styles',
    tier: 'advanced', maturity: 'research',
    simple: 'Colours your system uses for buttons and highlights, plus your default text size and scrollbar width.',
    how: 'Pages can ask for special colour names that may follow your system theme (such as your accent colour), and can measure your default text size and how wide scrollbars are. Many browsers now return fixed values here.',
    technical: 'CSS Color 4 system colors historically exposed OS theme colors; browsers increasingly hard-code them. Default font size reflects the user\'s browser font setting (16px unless changed). Scrollbar width differs between overlay scrollbars (0 px on macOS by default) and classic ones (~15–17 px on Windows), and with the OS "always show scrollbars" setting.',
    exposes: 'Resolved system colors, default font settings, scrollbar width.', dataType: 'object', apis: ['getComputedStyle', 'CSS system colors', 'Element.clientWidth'],
    purpose: ['identification'], relevance: 'low', relevanceBasis: 'Mostly standardized in current browsers.', stability: 'semi-stable',
    combinesWith: [{ id: 'user-preferences', basis: 'hypothetical', note: 'Theme correlation.' }],
    privacyImpact: 'Low in current browsers.', limitations: ['Many browsers return fixed values regardless of the OS.'],
    defenses: 'Browsers hard-code values; Firefox RFP returns fixed colors.', mitigations: ['No action needed.'],
    sources: ['w3c-fp-guidance'],
    run: async () => {
      if (!g.document?.body) return unsupported('DOM unavailable');
      const el = document.createElement('div');
      document.body.appendChild(el);
      const raw = {};
      try {
        for (const c of ['AccentColor', 'AccentColorText', 'Highlight', 'HighlightText', 'ButtonFace', 'ButtonText', 'Canvas', 'CanvasText', 'Field', 'LinkText', 'Mark']) {
          el.style.color = 'rgb(1, 2, 3)';
          el.style.color = c;
          const v = getComputedStyle(el).color;
          raw[c] = v === 'rgb(1, 2, 3)' ? null : v;
        }
      } finally { el.remove(); }
      const probe = document.createElement('div');
      probe.style.cssText = 'position:absolute;left:-9999px;top:0;width:100px;height:50px;overflow:scroll';
      const btn = document.createElement('button');
      probe.appendChild(btn); document.body.appendChild(probe);
      let computed;
      try {
        const root = getComputedStyle(document.documentElement), bs = getComputedStyle(btn);
        computed = { defaultFontSize: root.fontSize, bodyFontFamily: getComputedStyle(document.body).fontFamily, buttonFont: `${bs.fontSize} ${bs.fontFamily}`,
          scrollbarWidthPx: probe.offsetWidth - probe.clientWidth };
      } finally { probe.remove(); }
      return measured({ systemColors: raw, computed }, { notes: ['null = keyword not supported by this browser.', 'bodyFontFamily reflects this app\'s stylesheet; the other values reflect browser/OS defaults.'] });
    },
  }),
];
