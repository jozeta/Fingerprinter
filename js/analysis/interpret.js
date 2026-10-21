// Plain-language interpretation of actual results: "what your value means". One function per check id.
// Each receives the raw result and returns a short explanation; checks without an entry fall back to a generic sentence.

const list = (a, n = 4) => (a.length > n ? `${a.slice(0, n).join(', ')} and ${a.length - n} more` : a.join(', '));
const yes = (b) => (b ? 'yes' : 'no');

const I = {
  'user-agent': (r) => { const ua = r.userAgent || ''; const b = /Edg\//.test(ua) ? 'Microsoft Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome or a Chromium-based browser' : /Safari\//.test(ua) ? 'Safari' : 'an unusual browser';
    const os = /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'macOS' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Linux/.test(ua) ? 'Linux' : 'an unknown system';
    return `Your browser introduces itself as ${b} on ${os}. Every website receives this with every request. On its own it places you in a large group of people using the same browser version.`; },
  'client-hints': (r) => `Your browser reports brand(s) ${list(r.brands || [])} on ${r.platform || 'an unnamed platform'}${r.mobile ? ' as a mobile device' : ''}. These are coarse values most people with the same browser share.`,
  'client-hints-high': (r) => `Detailed hints reveal ${[r.platformVersion && `OS version ${r.platformVersion}`, r.architecture && `a ${r.architecture}${r.bitness ? `-${r.bitness}` : ''} processor`, r.model && `device model "${r.model}"`].filter(Boolean).join(', ') || 'little extra detail'}. This is more precise than the normal User-Agent.`,
  platform: (r) => `Your browser reports platform "${r.platform}"${r.vendor ? ` from vendor "${r.vendor}"` : ''}. These old values are frozen in many browsers (Apple Silicon Macs still say "MacIntel"), so they mostly help spot inconsistencies.`,
  languages: (r) => `Your preferred languages are ${list(r.languages || [r.language])}. ${(r.languages || []).length > 1 ? 'A list of several languages is less common than a single default and narrows down your likely country.' : 'A single common language keeps you in a large group.'}`,
  'intl-timezone': (r) => `Your time zone is ${r.timeZone} (UTC${r.offsetJanuaryMin >= 0 ? '+' : ''}${r.offsetJanuaryMin / 60} in winter). This reveals roughly where you are, even behind a VPN, and a mismatch with your IP location is a classic VPN giveaway.`,
  'browser-flags': (r) => `Cookies enabled: ${yes(r.cookieEnabled)}. Do Not Track: ${r.doNotTrack ?? 'not set'}. Global Privacy Control: ${r.globalPrivacyControl ? 'on' : 'off'}. Privacy signals are worth keeping on (GPC has legal weight in some places), even though few people use them.`,
  webdriver: (r) => (r.webdriver ? 'Your browser says it is controlled by automation software. Real visitors almost never show this.' : 'Your browser does not claim to be automated, like almost every human visitor.'),
  touch: (r) => (r.maxTouchPoints > 0 ? `Your device supports touch with up to ${r.maxTouchPoints} touch points, which suggests a phone, tablet or touch laptop.` : 'No touch support is reported, which suggests a desktop or a laptop without a touchscreen.'),
  screen: (r) => `Your screen is ${r.width}×${r.height} with ${r.width - r.availWidth}×${r.height - r.availHeight} px taken by the taskbar or dock, in ${r.colorDepth}-bit colour. Common resolutions are shared by many people; the taskbar size and scaling add detail.`,
  viewport: (r) => `Your window is ${r.innerWidth}×${r.innerHeight} at a pixel ratio of ${r.devicePixelRatio}. Toolbars take ${r.outerWidth - r.innerWidth}×${r.outerHeight - r.innerHeight} px. This changes when you resize or zoom, so it only links visits over a short time.`,
  orientation: (r) => `Screen orientation: ${r.type} (${r.angle}°).`,
  'display-media': (r) => `Your display reports ${r.colorGamut || 'standard'} colour, ${r.dynamicRange === 'high' ? 'HDR' : 'no HDR'}, and a ${r.pointer || 'unknown'} pointer${r.hover === 'hover' ? ' with hover' : ''}. Wide-gamut and HDR screens are less common, which makes you slightly easier to tell apart.`,
  'refresh-rate': (r) => `Your screen refreshes about ${r.nearestCommonHz} times per second. ${r.nearestCommonHz > 60 ? 'High refresh rates are less common than 60 Hz, so this narrows the crowd.' : '60 Hz is the most common value, so this reveals little.'}`,
  'canvas-2d': (r) => (r.differingBytesVsFirst?.some((n) => n > 0) ? 'Your browser adds random noise to canvas drawings, so this signal cannot be used to recognise you. That is a protection working.' : `Your browser drew the test image identically every time, producing fingerprint ${String(r.digest).slice(0, 12)}…. Devices with different fonts, graphics chips or systems produce different images, so this is one of the strongest tracking signals.`),
  'emoji-render': (r) => (r.rendersDifferingFromFirst ? 'Emoji rendering is randomised in your browser, which hides it.' : 'Your emoji artwork produced a stable fingerprint. It mainly reveals your operating system and its version.'),
  'webgl-info': (r) => `Your graphics is reported as "${r.unmaskedRenderer || r.renderer}"${r.unmaskedVendor ? ` by ${r.unmaskedVendor}` : ''}, with ${r.extensions?.length ?? 0} WebGL extensions. ${r.unmaskedRenderer ? 'An exact graphics-chip name is very identifying.' : 'Your browser hides the exact graphics-chip name, which is a protection.'}`,
  'webgl-render': (r) => (r.rendersDifferingFromFirst ? 'The 3D test image changes every time, so it cannot be used to track you.' : 'Your graphics chip drew the 3D test image identically every time. Different chips and drivers draw slightly differently, which helps identify hardware.'),
  webgpu: (r) => `WebGPU describes your graphics as ${[r.vendor, r.architecture].filter(Boolean).join(' / ') || 'hidden'}, with ${r.features?.length ?? 0} optional features.`,
  fonts: (r) => `Out of ${r.candidates} fonts tested, ${r.detected.length} appear to be installed${r.detected.length ? ` (for example ${list(r.detected, 5)})` : ''}. ${r.detected.length > 15 ? 'A long font list often reflects installed software like Office or design tools, and is quite identifying.' : 'A short list is typical of browsers that limit font visibility.'}`,
  'text-metrics': () => 'Text in the default fonts has specific widths on your system. They depend on which fonts your system uses by default, so they reveal your OS and font settings.',
  'audio-offline': (r) => (r.rendersDifferingFromFirst ? 'Your browser adds noise to audio processing, which hides this signal.' : `Silent audio processing produced the value ${r.sampleSum}. This mostly reveals your browser and system type rather than you personally.`),
  'audio-capabilities': (r) => `Your audio runs at ${r.sampleRate / 1000} kHz with ${r.maxChannelCount} output channel${r.maxChannelCount === 1 ? '' : 's'}${r.baseLatency ? ` and a base latency of ${(r.baseLatency * 1000).toFixed(1)} ms` : ''}. Surround setups and unusual sample rates stand out.`,
  'speech-voices': (r) => `Your system has ${r.count} text-to-speech voices in ${r.languages.length} language${r.languages.length === 1 ? '' : 's'}. Extra voice packs you installed can reveal languages you use.`,
  'media-codecs': (r) => `Video formats your browser can play: ${Object.entries(r).filter(([, v]) => v.canPlayType).map(([k]) => k).join(', ') || 'none reported'}. This mostly follows your browser and system.`,
  'media-capabilities': (r) => `Hardware video decoding: ${Object.entries(r).map(([k, v]) => `${k} ${v}`).join('; ')}. Power-efficient decoding of newer formats points to a recent graphics chip.`,
  'cpu-memory': (r) => `Your browser reports ${r.hardwareConcurrency ?? 'an unknown number of'} processor threads${r.deviceMemoryGB ? ` and roughly ${r.deviceMemoryGB} GB of memory (rounded, capped at 8)` : ''}. These are coarse but help separate phones, laptops and workstations.`,
  'cpu-architecture': (r) => `Your processor family looks like ${r.family}. This can reveal, for example, an Apple Silicon Mac even when the browser claims "Intel".`,
  'keyboard-layout': (r) => `Your keyboard layout reads as ${r.layoutGuess}. A non-US layout narrows down your country even if you change language and time zone.`,
  'timer-precision': (r) => `Your browser's clock ticks in steps of about ${r.minStepMicroseconds} µs. ${r.minStepMicroseconds >= 1000 ? 'Such a coarse clock usually means a privacy mode is active.' : 'This is the normal precision for your browser.'}`,
  benchmark: (r) => `A fixed calculation took ${r.medianMs} ms. Faster devices finish sooner, but this varies a lot between runs.`,
  'math-precision': () => 'The last digits of some maths results depend on your browser engine and processor. This mainly confirms which browser you really use.',
  'storage-quota': (r) => `This site may store up to ${r.quotaGB} GB. In some browsers this is based on your disk size, which reveals your disk size range.`,
  'permission-states': (r) => { const g = Object.entries(r).filter(([, v]) => v === 'granted').map(([k]) => k); return g.length ? `You have granted this site: ${g.join(', ')}. Your choices form part of your profile.` : 'No permissions are granted to this site. Everything is at its default, like most visitors.'; },
  'api-availability': (r) => `${Object.values(r).filter(Boolean).length} of ${Object.keys(r).length} capability APIs exist in your browser. Existing does not mean any site can use them without asking.`,
  'storage-mechanisms': (r) => `Storage that works here: ${Object.entries(r).filter(([, v]) => v === 'works').map(([k]) => k).join(', ') || 'none'}. Sites can use these to remember you until you clear site data.`,
  'storage-partitioning': (r) => (r.likelyPartitioned === 'probably' ? 'Your browser probably keeps third-party storage separate per site, which blocks classic cross-site cookie tracking.' : 'There is no sign that your browser separates third-party storage per site.'),
  'user-preferences': (r) => `Colour scheme: ${r.colorScheme}; reduced motion: ${r.reducedMotion}; contrast: ${r.contrast}. These are your own settings and are not a problem; enabled accessibility settings are less common, so they add a little detail.`,
  'system-colors': (r) => `Your scrollbars are ${r.computed?.scrollbarWidthPx ?? '?'} px wide and the default text size is ${r.computed?.defaultFontSize}. These follow your OS and browser settings.`,
  consistency: (r) => (r.contradictions.length ? `Some signals contradict each other: ${r.contradictions.join('; ')}. Contradictions are rare and make a browser stand out (they are common with spoofing tools, virtual machines and remote desktops).` : 'Your browser tells a consistent story: nothing contradicts anything else. That is normal and good for blending in.'),
  integrity: (r) => (r.patched.length ? `These built-in functions were changed by something on the page or an extension: ${r.patched.join(', ')}. Detectors treat this as unusual.` : 'No built-in functions were changed. Browser-level protections work without this, so they stay invisible here.'),
  automation: (r) => (r.count ? `${r.count} automation sign(s) were found. If you are a person, a virtual machine or remote desktop may explain it.` : 'No signs of automation. You look like a normal visitor.'),
  'protection-indicators': (r) => (r.active.length ? `Your browser shows these protections: ${r.active.join(', ')}.` : 'No active anti-fingerprinting protections were detected.'),
  'content-blockers': (r) => (r.cosmeticFilteringDetected ? 'A content blocker is active (it hid our bait elements). Keep it: it blocks many trackers, even though using one is itself a small signal.' : 'No content blocker was detected.'),
  'extension-indicators': (r) => (r.found.length ? `Visible extensions: ${r.found.join(', ')}. Any website can see these.` : 'None of the extensions we look for are visible to web pages.'),
  'webrtc-local': (r) => (r.mdnsObfuscated ? 'Your local network address is hidden behind a random name. This protection is working.' : 'WebRTC revealed your real local network address, which is unusual today and identifying.'),
  'webrtc-presence': (r) => `WebRTC is available with ${r.videoCodecs?.length ?? 0} video and ${r.audioCodecs?.length ?? 0} audio codec entries. No connection was made.`,
  'third-party-requests': (r) => (r.thirdPartyOrigins.length ? `This page contacted ${r.thirdPartyOrigins.length} other site(s): ${r.thirdPartyOrigins.join(', ')}.` : 'This page contacted no other websites. A typical commercial site contacts dozens, and trackers arrive that way.'),
  'js-heap': (r) => (r.performanceMemory ? `JavaScript may use up to ${r.jsHeapSizeLimitMB} MB here, which hints at your device class.` : 'Your browser does not expose memory details.'),
  'wasm-features': (r) => `${Object.values(r).filter((v) => v === true).length} WebAssembly features are supported, which matches your browser version.`,
  'intl-supported': (r) => `Your browser knows ${r.timeZone} time zones and ${r.currency} currencies. These counts change with browser versions.`,
  'vendor-flavors': (r) => (r.found.length ? `Browser-specific objects found: ${r.found.join(', ')}.` : 'No vendor-specific objects were found.'),
  battery: (r) => (r.getBatteryPresent ? 'Your browser exposes the Battery API (we did not read it). Chromium browsers keep it; Firefox and Safari removed it for privacy.' : 'Your browser does not expose the Battery API.'),
};

const GENERIC = 'This value describes your browser, device or settings. On its own it is usually shared by many people; combined with other checks it helps tell browsers apart.';

/** Plain-language meaning of a result. Never throws. */
export function interpret(def, result) {
  if (!result) return null;
  const st = result.executionStatus;
  if (st === 'blocked') return 'Your browser refused or neutralised this check. That hides the value from websites, although blocking itself can be noticed.';
  if (st === 'unsupported') return 'Your browser does not have this feature, so websites cannot use it to fingerprint you. (Missing features are a small clue about which browser you use.)';
  if (st === 'server-only') return 'Only a web server can see this. Every website you visit can, but this page cannot measure it.';
  if (st === 'interaction-required') return 'This check only runs when you start it yourself.';
  if (st === 'error' || st === 'skipped') return 'This check did not complete, so nothing is known about this value.';
  try { return (I[def.id] && result.rawResult !== null && I[def.id](result.rawResult, result)) || GENERIC; } catch { return GENERIC; }
}

export const hasInterpretation = (id) => !!I[id];
