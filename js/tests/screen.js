// 5.2 Screen and display.
import { define, g } from './define.js';
import { measured, unsupported } from '../core/schema.js';

export default [
  define({
    id: 'screen', version: '1.0.0', category: 'screen', name: 'Screen resolution & color depth',
    simple: 'Your monitor size, the usable area and how many colors it shows.',
    how: 'Reads <code>screen.width/height</code>, <code>availWidth/availHeight</code> (excluding taskbar/dock), <code>colorDepth</code> and <code>pixelDepth</code>.',
    technical: 'The resolution itself is common; the difference between total and available area depends on taskbar position, size and OS scaling, which adds detail. Multi-monitor users report the screen the window is on.',
    exposes: 'Display dimensions, taskbar/dock size, color depth.', dataType: 'object', apis: ['screen.width', 'screen.availWidth', 'screen.colorDepth', 'screen.pixelDepth'],
    purpose: ['identification', 'bot-detection', 'fraud-prevention'], relevance: 'medium', relevanceBasis: 'Included in every major fingerprint dataset; common resolutions dominate.',
    stability: 'stable',
    combinesWith: [{ id: 'viewport', basis: 'hypothetical', note: 'Screen minus window reveals browser UI size.' }, { id: 'touch', basis: 'hypothetical', note: 'Device class.' }],
    privacyImpact: 'Moderate in combination; low alone.',
    limitations: ['Changes when moving the window to another monitor or changing OS scaling.'],
    defenses: 'Tor Browser letterboxing and Firefox RFP report window-derived values.',
    mitigations: ['Use a browser with screen normalization if this matters to you; avoid unusual custom scaling.'],
    sources: ['fpjs-sources', 'eff-cyt-about', 'tor-manual-fp'],
    run: async () => {
      if (!g.screen) return unsupported('screen object unavailable');
      const s = g.screen;
      return measured({ width: s.width, height: s.height, availWidth: s.availWidth, availHeight: s.availHeight, colorDepth: s.colorDepth, pixelDepth: s.pixelDepth });
    },
  }),

  define({
    id: 'viewport', version: '1.0.0', category: 'screen', name: 'Viewport, window & pixel ratio',
    simple: 'The size of the browser window and page area, and your zoom/pixel density.',
    how: 'Reads <code>innerWidth/innerHeight</code>, <code>outerWidth/outerHeight</code>, <code>devicePixelRatio</code> and <code>visualViewport</code>.',
    technical: '<code>outer − inner</code> approximates toolbar, sidebar and bookmark-bar sizes. <code>devicePixelRatio</code> combines HiDPI scaling and page zoom. <code>visualViewport.scale</code> reflects pinch zoom. <strong>These values change whenever you resize the window or toggle browser UI</strong>, so they are excluded from the default profile.',
    exposes: 'Window and viewport size, browser chrome size, zoom/pixel ratio.', dataType: 'object', apis: ['window.innerWidth', 'window.outerWidth', 'window.devicePixelRatio', 'VisualViewport'],
    purpose: ['identification', 'bot-detection'], relevance: 'low', relevanceBasis: 'Highly variable between sessions; useful short-term only.',
    stability: 'volatile',
    combinesWith: [{ id: 'screen', basis: 'hypothetical', note: 'Relative to screen size.' }],
    privacyImpact: 'Short-lived correlation within a session.',
    limitations: ['Changes on resize, zoom, fullscreen, or showing/hiding toolbars.'],
    defenses: 'Tor Browser letterboxing rounds the viewport to 200×100 multiples.',
    mitigations: ['Not a practical concern for most users.'],
    sources: ['tor-manual-fp', 'fpjs-sources'],
    run: async () => {
      if (!g.window) return unsupported('window unavailable');
      const vv = g.visualViewport;
      return measured({ innerWidth: g.innerWidth, innerHeight: g.innerHeight, outerWidth: g.outerWidth, outerHeight: g.outerHeight,
        devicePixelRatio: g.devicePixelRatio, visualViewport: vv ? { width: Math.round(vv.width), height: Math.round(vv.height), scale: vv.scale } : null });
    },
  }),

  define({
    id: 'orientation', version: '1.0.0', category: 'screen', name: 'Screen orientation',
    simple: 'Whether your screen is in portrait or landscape and its natural orientation.',
    how: 'Reads <code>screen.orientation.type</code> and <code>angle</code>.',
    technical: 'Desktops report landscape-primary at angle 0. Rotated monitors and mobile devices differ. Mostly a device-class signal.',
    exposes: 'Orientation type and angle.', dataType: 'object', apis: ['ScreenOrientation'],
    purpose: ['compatibility', 'identification'], relevance: 'low', relevanceBasis: 'Few values.', stability: 'semi-stable',
    privacyImpact: 'Low.', limitations: ['Changes when the device rotates.'],
    defenses: 'None needed.', mitigations: ['No action needed.'], sources: ['w3c-fp-guidance'],
    run: async () => {
      const o = g.screen?.orientation;
      if (!o) return unsupported('screen.orientation not implemented');
      return measured({ type: o.type, angle: o.angle });
    },
  }),

  define({
    id: 'display-media', version: '1.0.0', category: 'screen', name: 'Display media features',
    simple: 'What your display can do: wide color, HDR, pointer type, hover.',
    how: 'Evaluates CSS media queries <code>color-gamut</code>, <code>dynamic-range</code>, <code>pointer</code>, <code>any-pointer</code>, <code>hover</code> and <code>monochrome</code> via <code>matchMedia()</code>.',
    technical: 'A P3/HDR display with fine pointer and hover is typical of recent Macs; coarse pointer without hover is typical of phones. These queries also work in pure CSS, so <strong>JavaScript is not required</strong>: a stylesheet can request different URLs per match.',
    exposes: 'Display gamut, HDR, input modality.', dataType: 'object', apis: ['window.matchMedia'],
    purpose: ['identification', 'compatibility'], relevance: 'low', relevanceBasis: 'Few distinct combinations; correlates with device class.', stability: 'stable',
    combinesWith: [{ id: 'screen', basis: 'hypothetical', note: 'Device class.' }],
    privacyImpact: 'Low.', limitations: ['External displays change gamut/HDR results.'],
    defenses: 'Firefox RFP normalizes some media features.', mitigations: ['No action needed.'],
    sources: ['fpjs-sources'],
    run: async () => {
      if (!g.matchMedia) return unsupported('matchMedia unavailable');
      const pick = (f, vals) => vals.find((v) => matchMedia(`(${f}: ${v})`).matches) ?? null;
      return measured({ colorGamut: pick('color-gamut', ['rec2020', 'p3', 'srgb']), dynamicRange: pick('dynamic-range', ['high', 'standard']),
        pointer: pick('pointer', ['fine', 'coarse', 'none']), anyPointer: pick('any-pointer', ['fine', 'coarse', 'none']),
        hover: pick('hover', ['hover', 'none']), monochrome: matchMedia('(monochrome)').matches });
    },
  }),
];
