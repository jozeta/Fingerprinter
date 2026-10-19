// Recommendation engine driven by measured results. Never promises anonymity; every item states benefit, compatibility cost and limits.

const raw = (results, id) => (results[id] && ['measured', 'inferred'].includes(results[id].executionStatus) ? results[id].rawResult : null);
const st = (results, id) => results[id]?.executionStatus;
const prot = (results, id) => results[id]?.protectionIndicator;

/** Coarse browser family from the engine-inference result plus Brave's marker. Labeled as inference in the UI. */
export function inferBrowser(results) {
  if (globalThis.navigator?.brave) return 'brave';
  const e = raw(results, 'engine-inference')?.inferredEngine;
  return e === 'Gecko/SpiderMonkey' ? 'firefox' : e === 'WebKit/JavaScriptCore' ? 'safari' : e === 'Blink/V8' ? 'chromium' : 'unknown';
}

const BY_BROWSER = {
  firefox: 'In Firefox: Settings → Privacy & Security → Enhanced Tracking Protection → Strict, which enables Fingerprinting Protection. resistFingerprinting is stricter but breaks more sites.',
  chromium: 'Chromium-based browsers (Chrome, Edge) have limited fingerprinting protection. Consider Brave, Firefox or Safari for everyday browsing, or Tor/Mullvad Browser for sensitive browsing.',
  brave: 'In Brave: Shields → Fingerprinting → keep "Block fingerprinting" (standard) enabled; strict mode increases breakage.',
  safari: 'In Safari: Settings → Advanced → "Use advanced tracking and fingerprinting protection" (all browsing, or Private Browsing only).',
  unknown: 'Check your browser\'s privacy settings for fingerprinting protection.',
};

export const RULES = [
  {
    id: 'rendering-protection', title: 'Use a browser that protects rendering fingerprints',
    when: (r) => (st(r, 'canvas-2d') === 'measured' && prot(r, 'canvas-2d') !== 'randomized') || (st(r, 'audio-offline') === 'measured' && prot(r, 'audio-offline') !== 'randomized'),
    why: 'Canvas and/or audio output was readable and stable across repeated renders.',
    benefit: 'Randomization or blocking makes these high-relevance signals useless for cross-site linking.',
    compatibility: 'Low for noise-based approaches; blocking (Tor, RFP) can break image editors and some CAPTCHAs.',
    limitations: 'Does not affect fonts, screen, IP or server-side signals.', browserAware: true, sources: ['brave-fp2', 'webkit-pb2', 'mozilla-rfp', 'tor-manual-fp'],
  },
  {
    id: 'tracking-protection', title: 'Enable strict tracking protection',
    when: () => true,
    why: 'Fingerprinting scripts are usually third-party; blocking known trackers prevents them from running at all.',
    benefit: 'Stops known fingerprinting scripts before collection happens.', compatibility: 'Occasional breakage of embedded content or logins.',
    limitations: 'Only blocks known scripts; first-party fingerprinting remains possible.', browserAware: true, sources: ['webkit-pb2', 'mozilla-rfp'],
  },
  {
    id: 'fonts', title: 'Reduce font exposure',
    when: (r) => (raw(r, 'fonts')?.detected?.length ?? 0) > 12,
    why: 'Many non-default fonts were inferred as available.',
    benefit: 'Fewer visible fonts shrinks one of the most identifying attributes.', compatibility: 'Uninstalling fonts may affect documents and design work.',
    limitations: 'Browsers that restrict fonts (Safari, Tor, Firefox RFP) are more effective than uninstalling.', browserAware: false, sources: ['webkit-tp', 'laperdrix-2016'],
  },
  {
    id: 'extensions', title: 'Minimize extensions',
    when: (r) => (raw(r, 'extension-indicators')?.found?.length ?? 0) > 0 || (raw(r, 'integrity')?.patched?.length ?? 0) > 0,
    why: 'Injected extension objects or patched native functions were detected.',
    benefit: 'Fewer page-visible modifications make your browser less distinctive.', compatibility: 'You lose the functionality of removed extensions.',
    limitations: 'Many extensions are invisible to pages; this only addresses visible ones.', browserAware: false, sources: ['w3c-fp-guidance'],
  },
  {
    id: 'no-spoofing', title: 'Avoid partial spoofing',
    when: (r) => (raw(r, 'consistency')?.contradictions?.length ?? 0) > 0,
    why: 'Signals contradicted each other (e.g. OS claim vs GPU or platform).',
    benefit: 'Consistent signals avoid standing out to bot/fraud systems.', compatibility: 'None.',
    limitations: 'VMs and remote desktops cause legitimate contradictions.', browserAware: false, sources: ['datadome-cdp'],
  },
  {
    id: 'permissions', title: 'Review permission grants',
    when: (r) => Object.values(raw(r, 'permission-states') || {}).includes('granted'),
    why: 'At least one permission is granted for this origin.',
    benefit: 'Revoking unneeded permissions reduces data available to sites.', compatibility: 'Sites will prompt again when needed.',
    limitations: 'Applies per site; review the browser\'s site settings list.', browserAware: false, sources: ['w3c-fp-guidance'],
  },
  {
    id: 'third-party-storage', title: 'Review third-party cookie and storage settings',
    when: (r) => raw(r, 'storage-partitioning')?.likelyPartitioned !== 'probably',
    why: 'No indicator of third-party storage partitioning was found.',
    benefit: 'Partitioning or blocking third-party storage defeats classic cross-site cookie tracking.', compatibility: 'Some embedded logins may need the Storage Access prompt.',
    limitations: 'Indicator-based; does not affect stateless fingerprinting.', browserAware: true, sources: ['webkit-tp'],
  },
  {
    id: 'update', title: 'Keep your browser updated',
    when: () => true, why: 'Blending in requires sharing the most common version and feature set.',
    benefit: 'Shares version-related signals with the largest group; also closes security holes.', compatibility: 'None.',
    limitations: 'Does not reduce hardware or rendering entropy.', browserAware: false, sources: ['chromium-ua-reduction'],
  },
  {
    id: 'high-risk', title: 'For high-risk browsing, use a uniformity browser',
    when: (r) => st(r, 'canvas-2d') === 'measured' && prot(r, 'canvas-2d') !== 'randomized',
    why: 'Your current browser exposes stable high-relevance signals.',
    benefit: 'Tor Browser and Mullvad Browser aim to make all users look the same.', compatibility: 'Slower (Tor network), letterboxed windows, some sites block Tor.',
    limitations: 'No tool guarantees anonymity; behaviour and logins can still identify you.', browserAware: false, sources: ['tor-manual-fp'],
  },
  {
    id: 'webrtc', title: 'Keep WebRTC IP protection enabled',
    when: (r) => raw(r, 'webrtc-local')?.mdnsObfuscated === false,
    why: 'WebRTC exposed a real local IP address.', benefit: 'mDNS obfuscation or WebRTC IP policies hide LAN addresses.',
    compatibility: 'Video calls may need extra permission.', limitations: 'Public-IP exposure via STUN is not tested here.', browserAware: false, sources: ['englehardt-2016'],
  },
];

export function recommend(results) {
  const browser = inferBrowser(results);
  return {
    browser,
    items: RULES.filter((rule) => { try { return rule.when(results); } catch { return false; } })
      .map((rule) => ({ ...rule, when: undefined, browserAdvice: rule.browserAware ? BY_BROWSER[browser] : null })),
  };
}
