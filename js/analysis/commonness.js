// "How common is your value?" and "How identifying is this check?"
// Commonness = a rule-of-thumb ESTIMATE from widely known usage patterns, labeled as such. It is not measured against a
// dataset (this lab has none, see docs/METHODOLOGY.md). Identifiability = published mean entropy per attribute where a
// verified source exists (EFF Panopticlick 2010, Table 2), otherwise the literature-based relevance tier.

export const LEVELS = {
  'very-common': { label: 'Very common', rank: 0 },
  common: { label: 'Common', rank: 1 },
  uncommon: { label: 'Uncommon', rank: 2 },
  rare: { label: 'Rare', rank: 3 },
  protected: { label: 'Hidden or randomised', rank: -1 },
  unknown: { label: 'Not estimated', rank: -2 },
};

/** Mean surprisal per variable in isolation (Eckersley, PETS 2010, Table 2; 470,161 self-selected browsers). */
export const EFF_ENTROPY = {
  'user-agent': { bits: 10.0, attr: 'User agent' },
  'plugins-mime': { bits: 15.4, attr: 'Browser plugins (Flash/Java era; much lower today)' },
  fonts: { bits: 13.9, attr: 'System fonts (via Flash/Java in 2010)' },
  screen: { bits: 4.83, attr: 'Screen size and colour depth' },
  'srv-http-headers': { bits: 6.09, attr: 'HTTP Accept headers' },
  'intl-timezone': { bits: 3.04, attr: 'Time zone' },
  'browser-flags': { bits: 0.353, attr: 'Cookies enabled' },
};

const RELEVANCE_TEXT = {
  high: 'High: research ranks this among the most identifying signals.',
  medium: 'Medium: helps tell browsers apart, especially combined with others.',
  low: 'Low: shared by large groups; mostly useful for consistency checks.',
};

/** How identifying a check is in general (not your specific value). */
export function identifiability(def) {
  const eff = EFF_ENTROPY[def.id];
  const r = { relevance: def.relevance, text: RELEVANCE_TEXT[def.relevance] };
  if (eff) {
    const oneIn = Math.round(2 ** eff.bits);
    r.bits = eff.bits;
    r.study = `In the EFF Panopticlick study (2010, 470,161 browsers), "${eff.attr}" carried ${eff.bits} bits on average: on its own it split browsers into groups where roughly 1 in ${oneIn.toLocaleString()} shared the same value. Today's browsers expose less, and that sample was self-selected, so treat it as an upper bound.`;
    r.source = 'eckersley-2010';
  }
  return r;
}

const COMMON_RES = ['1920x1080', '1366x768', '1536x864', '1440x900', '1280x720', '2560x1440', '1600x900', '1280x800', '390x844', '393x873', '412x915', '414x896', '375x812', '360x800', '1512x982', '1470x956', '1728x1117'];
const VERY_COMMON_RES = ['1920x1080', '1366x768', '1536x864', '390x844', '393x873', '412x915'];
const BIG_ZONES = ['America/New_York', 'America/Chicago', 'America/Los_Angeles', 'America/Sao_Paulo', 'America/Mexico_City', 'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Europe/Madrid', 'Europe/Rome', 'Europe/Moscow', 'Europe/Istanbul', 'Asia/Kolkata', 'Asia/Calcutta', 'Asia/Shanghai', 'Asia/Tokyo', 'Asia/Jakarta', 'Asia/Manila', 'Asia/Seoul', 'Asia/Dhaka', 'Asia/Karachi', 'Africa/Lagos', 'Africa/Cairo', 'Australia/Sydney', 'UTC', 'Etc/UTC'];
const BIG_LANGS = ['en-US', 'en', 'en-GB', 'es', 'es-ES', 'pt-BR', 'zh-CN', 'de-DE', 'fr-FR', 'ja', 'ja-JP', 'ru', 'ru-RU', 'hi-IN', 'id', 'it-IT', 'ko-KR', 'tr-TR'];

const est = (level, reason) => ({ level, label: LEVELS[level].label, reason });

const RULES = {
  'user-agent': (r) => (/Chrome\/\d+/.test(r.userAgent) && /Windows NT 10|Mac OS X 10_15_7|Android 10; K/.test(r.userAgent) ? est('common', 'A current Chrome-family browser on a frozen, widely shared OS token; millions send the same string.') : /Firefox|Safari/.test(r.userAgent) ? est('common', 'A mainstream browser; the exact version is shared by many users until the next update.') : est('uncommon', 'This browser/OS combination is less widespread.')),
  screen: (r) => { const k = `${r.width}x${r.height}`; return VERY_COMMON_RES.includes(k) ? est('very-common', `${k} is one of the most widely used screen sizes.`) : COMMON_RES.includes(k) ? est('common', `${k} is a popular screen size.`) : est('uncommon', `${k} is not among the most common screen sizes.`); },
  viewport: (r) => est('uncommon', 'Exact window sizes vary from person to person, but they also change whenever you resize, so they are only useful for a short time.'),
  'intl-timezone': (r) => (r.timeZone === 'UTC' || r.timeZone === 'Etc/UTC' ? est('protected', 'UTC is what privacy browsers report to everyone.') : BIG_ZONES.includes(r.timeZone) ? est('common', `${r.timeZone} covers tens of millions of people.`) : est('uncommon', `${r.timeZone} covers a smaller population, which narrows down where you are.`)),
  languages: (r) => { const l = r.languages || []; return l.length === 1 && BIG_LANGS.includes(l[0]) ? est('very-common', `A single ${l[0]} setting is extremely common.`) : l.length <= 2 && BIG_LANGS.includes(l[0]) ? est('common', 'A short list starting with a widely used language.') : l.length >= 3 ? est('rare', `A list of ${l.length} languages in this order is unusual and quite identifying.`) : est('uncommon', 'This language setting is used by a smaller group.'); },
  fonts: (r) => (r.detected.length <= 3 ? est('protected', 'Very few fonts are visible, typical of browsers that restrict fonts.') : r.detected.length <= 12 ? est('common', 'A typical default set of fonts for your operating system.') : r.detected.length <= 22 ? est('uncommon', 'More fonts than a default install; extra software or language packs add them.') : est('rare', 'Many extra fonts make this list quite distinctive.')),
  'webgl-info': (r) => (!r.unmaskedRenderer ? est('protected', 'The exact graphics chip is hidden.') : /Apple GPU|Mali|Adreno|Intel\(R\) (UHD|Iris)|Apple M[1-4]/.test(r.unmaskedRenderer) ? est('common', 'A mass-market graphics chip shared by many devices.') : /SwiftShader|llvmpipe/.test(r.unmaskedRenderer) ? est('rare', 'Software rendering is unusual for a real person.') : est('uncommon', 'A specific graphics card model narrows the crowd considerably.')),
  'canvas-2d': (r) => (r.differingBytesVsFirst?.some((n) => n > 0) ? est('protected', 'Randomised on purpose: it changes every time, so it cannot single you out.') : est('uncommon', 'The exact image is shared mostly by people with the same device, system and browser version.')),
  'audio-offline': (r) => (r.rendersDifferingFromFirst ? est('protected', 'Randomised on purpose.') : est('common', 'Usually shared by everyone with the same browser and system type.')),
  'refresh-rate': (r) => (r.nearestCommonHz === 60 ? est('very-common', '60 Hz is the standard for most screens.') : r.nearestCommonHz <= 120 ? est('common', `${r.nearestCommonHz} Hz is common on recent phones and laptops.`) : est('uncommon', `${r.nearestCommonHz} Hz is typical of gaming monitors.`)),
  'cpu-memory': (r) => ([4, 8, 12].includes(r.hardwareConcurrency) ? est('common', `${r.hardwareConcurrency} processor threads is a very typical value.`) : r.hardwareConcurrency >= 16 ? est('uncommon', 'Many processor threads point to a high-end machine.') : est('common', 'A common processor configuration.')),
  'keyboard-layout': (r) => (/QWERTY-like/.test(r.layoutGuess) ? est('very-common', 'US/UK-style layouts are the most common.') : est('uncommon', `${r.layoutGuess} is regional and points to a smaller set of countries.`)),
  'timer-precision': (r) => (r.minStepMicroseconds >= 1000 ? est('rare', 'Such a coarse clock is used by privacy modes and is uncommon.') : est('very-common', 'The normal precision for your browser.')),
  'display-media': (r) => (r.dynamicRange === 'high' || r.colorGamut === 'rec2020' ? est('uncommon', 'HDR or very wide-gamut screens are less common.') : r.colorGamut === 'p3' ? est('common', 'Wide-gamut P3 screens are common on recent Apple devices and phones.') : est('very-common', 'A standard display.')),
  'user-preferences': (r) => (r.forcedColors === 'active' || r.contrast === 'more' || r.reducedMotion === 'reduce' ? est('uncommon', 'Accessibility settings are used by a smaller group (they are still worth keeping if you need them).') : est('common', 'Default appearance settings.')),
  'content-blockers': (r) => (r.cosmeticFilteringDetected ? est('common', 'A large minority of people use a content blocker.') : est('common', 'Most people browse without one.')),
  'extension-indicators': (r) => (r.found.length ? est('uncommon', 'Visible extensions narrow the crowd; combinations of them even more.') : est('very-common', 'Nothing visible, like most visitors.')),
  consistency: (r) => (r.contradictions.length ? est('rare', 'Contradicting signals are unusual.') : est('very-common', 'A consistent browser, like almost everyone.')),
  integrity: (r) => (r.patched.length ? est('rare', 'Patched built-in functions are unusual.') : est('very-common', 'Untouched, like most browsers.')),
  automation: (r) => (r.count ? est('rare', 'Real visitors rarely show automation signs.') : est('very-common', 'Normal for a person.')),
  webdriver: (r) => (r.webdriver ? est('rare', 'Almost no human visitor reports this.') : est('very-common', 'Normal for a person.')),
  touch: (r) => (r.maxTouchPoints ? est('common', 'Touch devices are very widespread.') : est('common', 'Desktops without touch are very widespread.')),
  'browser-flags': (r) => (r.globalPrivacyControl ? est('uncommon', 'Global Privacy Control is enabled by a minority (worth keeping for its legal effect).') : est('very-common', 'Default settings.')),
  'storage-quota': () => est('common', 'Quota values follow disk-size ranges that many devices share.'),
  'speech-voices': (r) => (r.count <= 30 ? est('common', 'A typical default voice set.') : est('uncommon', 'A larger-than-default voice list.')),
  'cpu-architecture': (r) => est('common', `${r.family} processors are widespread.`),
  'permission-states': (r) => (Object.values(r).includes('granted') ? est('uncommon', 'Granted permissions differ from the default most visitors have.') : est('very-common', 'All defaults.')),
  'validation-message': () => est('common', 'Shared by everyone using the same browser in the same interface language.'),
  'font-smoothing': (r) => (r.subpixel ? est('common', 'Coloured (subpixel) smoothing is typical on Windows.') : est('common', 'Greyscale smoothing is typical on macOS, phones and high-resolution screens.')),
  'locale-details': () => est('common', 'Regional formats are shared by everyone with the same region settings.'),
};

/** Estimate how common the user's value is. Always returns { level, label, reason, basis }. */
export function commonness(def, result) {
  const basis = 'Rule-of-thumb estimate from widely known usage patterns, not a measurement against a database.';
  if (!result) return { ...est('unknown', 'Not run yet.'), basis };
  const st = result.executionStatus;
  if (st === 'blocked') return { ...est('protected', 'Your browser withheld this value.'), basis };
  if (result.protectionIndicator === 'randomized') return { ...est('protected', 'The value changes on purpose, so it cannot be matched across sites.'), basis };
  if (!['measured', 'inferred'].includes(st) || result.rawResult === null) return { ...est('unknown', 'No value to compare.'), basis };
  try { const r = RULES[def.id]?.(result.rawResult); if (r) return { ...r, basis }; } catch { /* fall through */ }
  return { ...est('unknown', `No reliable rule for this check. ${def.relevance === 'low' ? 'Values of this kind are usually shared by large groups.' : 'Values of this kind can differ quite a lot between devices.'}`), basis };
}
