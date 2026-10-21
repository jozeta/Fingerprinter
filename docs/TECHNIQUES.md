# Technique Reference

Generated from the test registry (catalogue 2026.10.21, 98 techniques). Do not edit by hand: run `node scripts/generate-docs.mjs`.

## Browser & environment

### User-Agent string

`user-agent` v1.0.0 · basic · Demonstrated technique · relevance **high** · semi-stable

The name tag your browser sends to every website: browser, version and operating system.

**How it works.** Every time your browser loads a page it sends a short line of text saying which browser and system it is. Scripts can read the same text. Many people share yours, but it is the first piece of the puzzle.

**Technical.** Chromium freezes much of the string under UA Reduction (fixed OS version / device model tokens), moving detail into Client Hints. Firefox and Safari also cap OS version detail. The string is freely writable by extensions and automation, so it is a claim rather than a measurement.

**Exposes:** Browser family and major version, OS family, sometimes device class. · **APIs:** navigator.userAgent, navigator.appVersion

**Limitations:**
- Spoofable; reflects what the browser claims.
- Changes with every browser update.

**Defenses:** UA reduction (Chromium), frozen UA (Safari), uniform UA (Tor Browser, Firefox RFP).

**Mitigations:**
- Keep the browser updated so you share the most common version string.
- Avoid UA-spoofing extensions; inconsistent claims are more distinctive.

**Documented associations:** Google (mitigates, L2 Documented); Electronic Frontier Foundation (Cover Your Tracks) (measures, L1 Confirmed); The Tor Project (Tor Browser) (mitigates, L1 Confirmed); Apple (Safari / WebKit) (mitigates, L1 Confirmed); Cloaking services & malicious redirectors (uses, L3 Research)

**Sources:** [How Unique Is Your Web Browser? (Eckersley, PETS 2010)](https://coveryourtracks.eff.org/static/browser-uniqueness.pdf) · [User-Agent Reduction](https://www.chromium.org/updates/ua-reduction/) · [About Cover Your Tracks](https://coveryourtracks.eff.org/about)

### User-Agent Client Hints (low entropy)

`client-hints` v2.0.0 · basic · Demonstrated technique · relevance **low** · semi-stable · secure context

A short, structured name tag from Chrome-family browsers: brand, main version, system and whether it is a phone.

**How it works.** Chrome, Edge and similar browsers share a few basic facts in a tidy format. Everyone with the same browser version shares the same answers.

**Technical.** Low-entropy hints are always sent as Sec-CH-UA, Sec-CH-UA-Mobile and Sec-CH-UA-Platform. Brands include a deliberately randomized "GREASE" brand (e.g. "Not.A/Brand") to discourage brittle parsing. Only Chromium-based browsers implement the API.

**Exposes:** Browser brand list with major versions, platform name, mobile flag. · **APIs:** navigator.userAgentData

**Limitations:**
- Chromium-only; absence is expected in Firefox and Safari.
- Values can be overridden by DevTools or automation.

**Defenses:** Not implemented in Firefox/Safari.

**Mitigations:**
- No action needed for low-entropy hints.

**Documented associations:** Fingerprint (FingerprintJS) (uses, L1 Confirmed); Google (mitigates, L2 Documented)

**Sources:** [User-Agent Client Hints API](https://developer.mozilla.org/en-US/docs/Web/API/User-Agent_Client_Hints_API) · [HTTP Client hints](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Client_hints) · [FingerprintJS open-source entropy sources (src/sources)](https://github.com/fingerprintjs/fingerprintjs/tree/master/src/sources)

### High-entropy Client Hints (opt-in local read)

`client-hints-high` v1.0.0 · advanced · Demonstrated technique · relevance **medium** · semi-stable · user-initiated · secure context

Extra detail from Chrome-family browsers: exact system version, processor type, device model. Read only when you click Run.

**How it works.** When asked, Chrome-family browsers can share more precise facts than their normal name tag. The lab only asks when you start this check, and the values stay on the page.

**Technical.** Any script can request these without a prompt; browsers may decline individual hints. As request headers they require server opt-in (Accept-CH). They restore detail that UA Reduction removed from the User-Agent string, which is why this lab treats reading them as opt-in.

**Exposes:** Exact OS version, CPU architecture/bitness, device model, full browser version list. · **APIs:** NavigatorUAData.getHighEntropyValues

**Limitations:**
- Chromium-only.
- Browsers may return a subset of the requested hints.

**Defenses:** Brave reduces some values. Not implemented in Firefox/Safari.

**Mitigations:**
- If you use a Chromium browser, prefer one that limits high-entropy hints (e.g. Brave).

**Documented associations:** none

**Sources:** [User-Agent Client Hints API](https://developer.mozilla.org/en-US/docs/Web/API/User-Agent_Client_Hints_API) · [User-Agent Reduction](https://www.chromium.org/updates/ua-reduction/) · [FingerprintJS open-source entropy sources (src/sources)](https://github.com/fingerprintjs/fingerprintjs/tree/master/src/sources)

### Legacy plugins & MIME handlers

`plugins-mime` v1.0.0 · basic · Demonstrated technique · relevance **low** · stable

The list of browser add-ons for file types. It used to identify people very well; today it is mostly a fixed PDF list.

**How it works.** Pages can read the list of plugins and the file types they handle. Years ago this list was long and very personal; modern browsers show the same short PDF list to everyone, or nothing.

**Technical.** In the Flash/Java era plugin lists with exact versions were among the most identifying attributes (EFF 2010). The HTML standard now requires browsers to expose a fixed list of five PDF viewer entries (or none), so the list mostly reveals whether a built-in PDF viewer is enabled. An empty list in a desktop browser is a classic headless/automation tell.

**Exposes:** Plugin and MIME-type lists. · **APIs:** navigator.plugins, navigator.mimeTypes

**Limitations:**
- Values are standardized; differences mostly reflect PDF viewer settings.

**Defenses:** Standardized by the HTML spec in all major browsers.

**Mitigations:**
- No action needed.

**Documented associations:** Fingerprint (FingerprintJS) (uses, L1 Confirmed); Electronic Frontier Foundation (Cover Your Tracks) (measures, L1 Confirmed)

**Sources:** [FingerprintJS open-source entropy sources (src/sources)](https://github.com/fingerprintjs/fingerprintjs/tree/master/src/sources) · [About Cover Your Tracks](https://coveryourtracks.eff.org/about) · [How Unique Is Your Web Browser? (Eckersley, PETS 2010)](https://coveryourtracks.eff.org/static/browser-uniqueness.pdf)

### PDF viewer & document support

`pdf-support` v1.0.0 · basic · Demonstrated technique · relevance **low** · stable

Whether your browser opens PDF files itself.

**How it works.** The page reads whether a built-in PDF viewer is turned on and whether the PDF file type is handled.

**Technical.** Disabled PDF viewers are typical of some enterprise policies, kiosk setups and headless browsers. Mostly a binary signal.

**Exposes:** PDF viewer status. · **APIs:** navigator.pdfViewerEnabled, navigator.mimeTypes

**Limitations:**
- pdfViewerEnabled is not available in older browsers.

**Defenses:** None needed.

**Mitigations:**
- No action needed.

**Documented associations:** Fingerprint (FingerprintJS) (uses, L1 Confirmed)

**Sources:** [FingerprintJS open-source entropy sources (src/sources)](https://github.com/fingerprintjs/fingerprintjs/tree/master/src/sources)

### Platform & legacy navigator properties

`platform` v1.0.0 · basic · Demonstrated technique · relevance **low** · stable

Older name tags for your system, like "Win32" or "MacIntel".

**How it works.** Browsers still answer a few old questions about the system they run on and who made them. The answers are often frozen or out of date, so they are most useful for catching browsers that pretend to be something else.

**Technical.** navigator.platform is deprecated and frequently frozen (e.g. "MacIntel" on Apple Silicon, "Win32" on 64-bit Windows). productSub is "20030107" in Chromium/Safari and "20100101" in Firefox, so it reveals the engine family. oscpu and buildID exist only in Firefox.

**Exposes:** Coarse OS/engine identifiers. · **APIs:** navigator.platform, navigator.vendor, navigator.productSub, navigator.oscpu

**Limitations:**
- navigator.platform is deprecated and often frozen; it does not reliably describe the actual OS or CPU.
- Legacy properties may be removed in future versions.

**Defenses:** Tor Browser / Firefox RFP report uniform values.

**Mitigations:**
- No action needed; values are coarse.

**Documented associations:** Fingerprint (FingerprintJS) (uses, L1 Confirmed)

**Sources:** [FingerprintJS open-source entropy sources (src/sources)](https://github.com/fingerprintjs/fingerprintjs/tree/master/src/sources)

### Preferred languages

`languages` v1.0.0 · basic · Demonstrated technique · relevance **medium** · stable

The languages you picked in your browser, in order of preference.

**How it works.** Your browser tells websites which languages you prefer so they can show the right one. A single common language is shared by millions; several languages in a particular order narrow down where you might be from.

**Technical.** Ordered lists such as ["sv-SE","en-US","de"] are far less common than a single default locale. They correlate with region and the Intl locale.

**Exposes:** Language preference list (hints at nationality and multilingualism). · **APIs:** navigator.language, navigator.languages

**Limitations:**
- Reflects browser settings, not necessarily the user's actual languages.

**Defenses:** Tor Browser requests en-US by default; Firefox RFP can spoof en-US.

**Mitigations:**
- Keep the language list short and common if you do not need extra languages.

**Documented associations:** Fingerprint (FingerprintJS) (uses, L1 Confirmed); Electronic Frontier Foundation (Cover Your Tracks) (measures, L1 Confirmed); The Tor Project (Tor Browser) (mitigates, L1 Confirmed)

**Sources:** [FingerprintJS open-source entropy sources (src/sources)](https://github.com/fingerprintjs/fingerprintjs/tree/master/src/sources) · [About Cover Your Tracks](https://coveryourtracks.eff.org/about) · [Understanding browser fingerprinting (Tor Browser manual)](https://tb-manual.torproject.org/anti-fingerprinting/)

### Timezone & Intl locale

`intl-timezone` v1.0.0 · basic · Demonstrated technique · relevance **medium** · stable

Your time zone and how dates and numbers are written where you live.

**How it works.** Your browser knows your time zone (for example Europe/Stockholm) and your local formats for dates and numbers, and shares them with any page that asks. This works even if you use a VPN.

**Technical.** The IANA zone is more specific than the offset (many zones share an offset). Comparing January and July offsets reveals DST rules. Servers can compare the zone with IP geolocation; a mismatch suggests VPN or proxy use.

**Exposes:** Approximate region (timezone), locale formatting preferences. · **APIs:** Intl.DateTimeFormat, Date.prototype.getTimezoneOffset

**Limitations:**
- Travel or manual clock changes alter the value.

**Defenses:** Tor Browser and Firefox RFP report UTC.

**Mitigations:**
- If you use a VPN for location privacy, be aware your timezone still reveals your region.

**Documented associations:** Fingerprint (FingerprintJS) (uses, L1 Confirmed); Electronic Frontier Foundation (Cover Your Tracks) (measures, L1 Confirmed); Mozilla (Firefox) (mitigates, L4 Category)

**Sources:** [FingerprintJS open-source entropy sources (src/sources)](https://github.com/fingerprintjs/fingerprintjs/tree/master/src/sources) · [About Cover Your Tracks](https://coveryourtracks.eff.org/about)

### Cookie, online & privacy flags

`browser-flags` v1.0.0 · basic · Demonstrated technique · relevance **low** · semi-stable

Simple on/off settings: are cookies allowed, are you online, and have you asked sites not to track you?

**How it works.** Pages can read a few yes/no settings: whether cookies are on, whether you appear to be online, whether there is a built-in PDF viewer, and whether you turned on "Do Not Track" or "Global Privacy Control".

**Technical.** Each is close to binary, so it carries at most ~1 bit. A minority enable DNT/GPC, so enabling them slightly reduces the crowd you are in. GPC has legal effect in some jurisdictions (e.g. California CCPA opt-out), which is usually worth the trade-off.

**Exposes:** Privacy preference flags and basic capability flags. · **APIs:** navigator.cookieEnabled, navigator.onLine, navigator.pdfViewerEnabled, navigator.doNotTrack, navigator.globalPrivacyControl

**Limitations:**
- onLine only indicates network connectivity of the device, not internet reachability.

**Defenses:** None needed.

**Mitigations:**
- Keep GPC enabled where it carries legal weight; accept the small distinctiveness cost.

**Documented associations:** Fingerprint (FingerprintJS) (uses, L1 Confirmed); Electronic Frontier Foundation (Cover Your Tracks) (measures, L1 Confirmed)

**Sources:** [FingerprintJS open-source entropy sources (src/sources)](https://github.com/fingerprintjs/fingerprintjs/tree/master/src/sources) · [About Cover Your Tracks](https://coveryourtracks.eff.org/about)

### navigator.webdriver

`webdriver` v1.0.0 · basic · Demonstrated technique · relevance **low** · stable

A flag that says whether software, not a person, is controlling the browser.

**How it works.** When a browser is driven by test or scraping software, it is supposed to raise a flag that pages can read. For real people the flag is off.

**Technical.** Bot detection checks it first, but it is trivially hidden (e.g. Chromium flag --disable-blink-features=AutomationControlled), so vendors moved to deeper signals such as CDP side effects.

**Exposes:** Whether the browser declares automation. · **APIs:** navigator.webdriver

**Limitations:**
- Easily hidden by bots; false does not prove a human.

**Defenses:** Not applicable.

**Mitigations:**
- No action needed.

**Documented associations:** DataDome (uses, L2 Documented)

**Sources:** [How New Headless Chrome & the CDP Signal Are Impacting Bot Detection](https://datadome.co/threat-research/how-new-headless-chrome-the-cdp-signal-are-impacting-bot-detection/)

### Touch support

`touch` v1.0.0 · basic · Demonstrated technique · relevance **low** · stable

Whether your screen is a touchscreen, and how many fingers it can track.

**How it works.** Pages can ask whether touch is supported and how many touch points the screen handles. That quickly separates phones and tablets from desktop computers.

**Technical.** Separates phones, tablets, touch laptops and desktops. iPadOS reports a Mac UA but maxTouchPoints > 1, a well-known disambiguation.

**Exposes:** Touch capability and maximum touch points. · **APIs:** navigator.maxTouchPoints, TouchEvent

**Limitations:**
- Touch-capable ≠ touch-used.

**Defenses:** Firefox RFP normalizes.

**Mitigations:**
- No action needed.

**Documented associations:** Fingerprint (FingerprintJS) (uses, L1 Confirmed); Electronic Frontier Foundation (Cover Your Tracks) (measures, L1 Confirmed)

**Sources:** [FingerprintJS open-source entropy sources (src/sources)](https://github.com/fingerprintjs/fingerprintjs/tree/master/src/sources) · [About Cover Your Tracks](https://coveryourtracks.eff.org/about)

### Browser engine & version inference

`engine-inference` v1.0.0 · advanced · Demonstrated technique · relevance **low** · stable

A guess at which browser you really use, based on how it behaves rather than what it says.

**How it works.** Browsers can claim to be anything, but each one words its error messages and handles small details in its own way. Comparing those habits with the browser's claim reveals the real engine behind it.

**Technical.** Feature detection is harder to fake than strings because it requires reimplementing APIs. Error-message wording ("Cannot read properties of null" vs "null has no properties" vs "null is not an object") reliably separates V8, SpiderMonkey and JavaScriptCore.

**Exposes:** Engine family; whether the UA claim is consistent. · **APIs:** Error.prototype.message, CSS.supports, navigator.productSub

**Limitations:**
- Inference, not measurement; unusual or new browsers may be misclassified.

**Defenses:** None practical.

**Mitigations:**
- No action needed.

**Documented associations:** none

**Sources:** [Fingerprinting the Fingerprinters: Learning to Detect Browser Fingerprinting Behaviors (IEEE S&P 2021)](https://arxiv.org/pdf/2008.04480)

### Browser vendor flavors

`vendor-flavors` v1.0.0 · advanced · Demonstrated technique · relevance **low** · stable

Looks for small objects that specific browsers and in-app browsers add to every page.

**How it works.** Checks whether well-known vendor globals exist, for example window.chrome, safari, Yandex (yandex, __yb), Samsung Internet, UC Browser, Puffin and Chrome-on-iOS (__gCrWeb, __crWeb).

**Technical.** Rebranded Chromium browsers share a User-Agent with Chrome but often inject their own globals, and in-app browsers (social apps) inject bridges. FingerprintJS's vendor_flavors source works the same way. The probe list here is a subset.

**Exposes:** Which vendor-specific globals exist. · **APIs:** window properties

**Limitations:**
- Probe list is incomplete; globals can be spoofed.

**Defenses:** None needed.

**Mitigations:**
- No action needed.

**Documented associations:** none

**Sources:** [FingerprintJS open-source entropy sources (src/sources)](https://github.com/fingerprintjs/fingerprintjs/tree/master/src/sources)

### Private Click Measurement support

`private-click-measurement` v1.0.0 · advanced · Demonstrated technique · relevance **low** · stable

Checks for a Safari-only advertising-measurement feature. Its presence reveals Safari even when the browser claims to be something else.

**How it works.** Creates a detached link element and checks for the attributionSourceId property used by Private Click Measurement.

**Technical.** Private Click Measurement is WebKit's privacy-preserving ad-click attribution API. FingerprintJS includes a private_click_measurement source because the property and its value distinguish Safari/WebKit versions.

**Exposes:** PCM attribute support. · **APIs:** HTMLAnchorElement.attributionSourceId

**Limitations:**
- Only meaningful in WebKit browsers.

**Defenses:** None needed.

**Mitigations:**
- No action needed.

**Documented associations:** none

**Sources:** [FingerprintJS open-source entropy sources (src/sources)](https://github.com/fingerprintjs/fingerprintjs/tree/master/src/sources)

### Intl supported values (ICU data)

`intl-supported` v1.0.0 · advanced · Demonstrated technique · relevance **low** · stable

Counts how many calendars, currencies, time zones and units the browser knows. The numbers depend on the built-in locale data version.

**How it works.** Calls Intl.supportedValuesOf() for calendars, collations, currencies, numbering systems, time zones and units, and records the count of each and a short digest of the time-zone list.

**Technical.** Browsers ship ICU/CLDR locale data that is updated with releases; some builds include reduced data. Counts therefore map to engine versions and build flavors, and complement feature detection.

**Exposes:** Counts of supported Intl values. · **APIs:** Intl.supportedValuesOf

**Limitations:**
- Changes with browser updates.

**Defenses:** None needed.

**Mitigations:**
- Keep the browser updated.

**Documented associations:** none

**Sources:** [Mitigating Browser Fingerprinting in Web Specifications](https://www.w3.org/TR/fingerprinting-guidance/)

### Browser interface language (form messages)

`validation-message` v1.0.0 · advanced · Demonstrated technique · relevance **medium** · stable

Every browser has built-in messages like "Please fill out this field." Their wording reveals which browser you use and the language its menus are in.

**How it works.** Creates two invisible form fields (one required and empty, one with an invalid e-mail address) that are never shown or sent, and reads the message the browser would display.

**Technical.** Reads HTMLInputElement.validationMessage. The text comes from the browser's own interface translations, so it reflects the UI language even when navigator.languages or Accept-Language were changed, and its wording differs between Chrome, Firefox and Safari.

**Exposes:** Built-in validation message texts. · **APIs:** HTMLInputElement.validationMessage

**Limitations:**
- Some browsers follow the OS language rather than the browser setting.

**Defenses:** Tor Browser uses English messages for everyone when it spoofs English.

**Mitigations:**
- If you hide your language, also use the browser in the same language you report.

**Documented associations:** none

**Sources:** [Mitigating Browser Fingerprinting in Web Specifications](https://www.w3.org/TR/fingerprinting-guidance/)

### Regional formats

`locale-details` v1.0.0 · advanced · Demonstrated technique · relevance **low** · stable

How your browser formats lists, plurals, currencies and which day starts the week. These follow your region settings.

**How it works.** Uses the built-in internationalisation API to format a short list, a price and a country name in your language, and reads the first day of the week for your locale.

**Technical.** Reads Intl.Locale.prototype.getWeekInfo() (or weekInfo), Intl.ListFormat, Intl.PluralRules, Intl.NumberFormat with currency, and Intl.DisplayNames. Results depend on the locale and on the browser's CLDR data version.

**Exposes:** Locale-dependent formats. · **APIs:** Intl.Locale, Intl.ListFormat, Intl.DisplayNames

**Limitations:**
- Redundant with language for most people.

**Defenses:** Tor Browser normalises the locale to English.

**Mitigations:**
- No practical action besides language settings.

**Documented associations:** none

**Sources:** [Mitigating Browser Fingerprinting in Web Specifications](https://www.w3.org/TR/fingerprinting-guidance/)

## Screen & display

### Screen resolution & color depth

`screen` v1.0.0 · basic · Demonstrated technique · relevance **medium** · stable

Your screen size, the space left after the taskbar or dock, and how many colours it shows.

**How it works.** Pages can read your screen's width and height, how much of it is free from taskbars and docks, and its colour depth. Popular sizes are shared by many people; the taskbar size and scaling add detail.

**Technical.** The resolution itself is common; the difference between total and available area depends on taskbar position, size and OS scaling, which adds detail. Multi-monitor users report the screen the window is on.

**Exposes:** Display dimensions, taskbar/dock size, color depth. · **APIs:** screen.width, screen.availWidth, screen.colorDepth, screen.pixelDepth

**Limitations:**
- Changes when moving the window to another monitor or changing OS scaling.

**Defenses:** Tor Browser letterboxing and Firefox RFP report window-derived values.

**Mitigations:**
- Use a browser with screen normalization if this matters to you; avoid unusual custom scaling.

**Documented associations:** Fingerprint (FingerprintJS) (uses, L1 Confirmed); Electronic Frontier Foundation (Cover Your Tracks) (measures, L1 Confirmed); The Tor Project (Tor Browser) (mitigates, L1 Confirmed)

**Sources:** [FingerprintJS open-source entropy sources (src/sources)](https://github.com/fingerprintjs/fingerprintjs/tree/master/src/sources) · [About Cover Your Tracks](https://coveryourtracks.eff.org/about) · [Understanding browser fingerprinting (Tor Browser manual)](https://tb-manual.torproject.org/anti-fingerprinting/)

### Viewport, window & pixel ratio

`viewport` v1.0.0 · basic · Demonstrated technique · relevance **low** · volatile

The size of your browser window and how much it is zoomed.

**How it works.** Pages see the size of the window, how much space the toolbars take, and your zoom level. These change whenever you resize the window, so they only link visits that happen close together.

**Technical.** outer − inner approximates toolbar, sidebar and bookmark-bar sizes. devicePixelRatio combines HiDPI scaling and page zoom. visualViewport.scale reflects pinch zoom. These values change whenever you resize the window or toggle browser UI, so they are excluded from the default profile.

**Exposes:** Window and viewport size, browser chrome size, zoom/pixel ratio. · **APIs:** window.innerWidth, window.outerWidth, window.devicePixelRatio, VisualViewport

**Limitations:**
- Changes on resize, zoom, fullscreen, or showing/hiding toolbars.

**Defenses:** Tor Browser letterboxing rounds the viewport to 200×100 multiples.

**Mitigations:**
- Not a practical concern for most users.

**Documented associations:** The Tor Project (Tor Browser) (mitigates, L1 Confirmed)

**Sources:** [Understanding browser fingerprinting (Tor Browser manual)](https://tb-manual.torproject.org/anti-fingerprinting/) · [FingerprintJS open-source entropy sources (src/sources)](https://github.com/fingerprintjs/fingerprintjs/tree/master/src/sources)

### Screen orientation

`orientation` v1.0.0 · basic · Demonstrated technique · relevance **low** · semi-stable

Whether your screen is held upright (portrait) or sideways (landscape).

**How it works.** Pages can read the screen orientation and its angle. Desktops report landscape; phones and rotated monitors differ.

**Technical.** Desktops report landscape-primary at angle 0. Rotated monitors and mobile devices differ. Mostly a device-class signal.

**Exposes:** Orientation type and angle. · **APIs:** ScreenOrientation

**Limitations:**
- Changes when the device rotates.

**Defenses:** None needed.

**Mitigations:**
- No action needed.

**Documented associations:** none

**Sources:** [Mitigating Browser Fingerprinting in Web Specifications](https://www.w3.org/TR/fingerprinting-guidance/)

### Display media features

`display-media` v1.0.0 · basic · Demonstrated technique · relevance **low** · stable

What your screen can do: extra-vivid colours, HDR, and what kind of pointer you use.

**How it works.** Pages can ask your screen a few questions: does it show a wider range of colours, does it support HDR, is the main pointer a mouse or a finger, can it hover? Websites can even ask these without JavaScript.

**Technical.** A P3/HDR display with fine pointer and hover is typical of recent Macs; coarse pointer without hover is typical of phones. These queries also work in pure CSS, so JavaScript is not required: a stylesheet can request different URLs per match.

**Exposes:** Display gamut, HDR, input modality. · **APIs:** window.matchMedia

**Limitations:**
- External displays change gamut/HDR results.

**Defenses:** Firefox RFP normalizes some media features.

**Mitigations:**
- No action needed.

**Documented associations:** Fingerprint (FingerprintJS) (uses, L1 Confirmed)

**Sources:** [FingerprintJS open-source entropy sources (src/sources)](https://github.com/fingerprintjs/fingerprintjs/tree/master/src/sources)

### Display refresh rate

`refresh-rate` v1.0.0 · advanced · Demonstrated technique · relevance **low** · semi-stable

Estimates how many times per second your screen refreshes (60, 90, 120, 144 Hz…), which hints at the type of monitor or phone.

**How it works.** Times 30 consecutive animation frames with requestAnimationFrame (about half a second) and reports the median frame interval as a rate in Hz, rounded to the nearest common value.

**Technical.** High-refresh displays (ProMotion 120 Hz, gaming 144/165/240 Hz) are less common than 60 Hz. Background tabs, power saving and variable-refresh displays affect the estimate, so it is marked semi-stable. If the tab is hidden, browsers pause animation frames and the test reports blocked.

**Exposes:** Approximate display refresh rate. · **APIs:** requestAnimationFrame

**Limitations:**
- Noisy under load; throttled in background tabs and power-saving modes.

**Defenses:** Tor Browser and Firefox RFP coarsen timing.

**Mitigations:**
- No practical user action.

**Documented associations:** none

**Sources:** [Mitigating Browser Fingerprinting in Web Specifications](https://www.w3.org/TR/fingerprinting-guidance/)

## Canvas, WebGL & fonts

### Canvas 2D rendering

`canvas-2d` v1.0.0 · basic · Demonstrated technique · relevance **high** · stable

Your browser draws a small picture. Tiny differences in how it draws can tell devices apart.

**How it works.** The page secretly draws some text, shapes and an emoji, then reads back the exact pixels and turns them into a short code. The picture looks the same to you, but fonts, graphics chip and system settings change a few pixels. The lab draws it several times to see if your browser adds random noise as a protection.

**Technical.** Output depends on font rasterization and hinting, sub-pixel anti-aliasing, GPU/driver compositing, color management and the emoji font. Identical outputs across repeated draws but different across devices make it a strong signal. Differing outputs within one page load indicate noise injection (e.g. Brave farbling, Safari Advanced Fingerprinting Protection).

**Exposes:** A pixel buffer whose digest reflects your rendering stack. · **APIs:** HTMLCanvasElement, CanvasRenderingContext2D.getImageData

**Limitations:**
- The same model of device with the same OS and browser may produce identical output.
- Browser updates can change the output.

**Defenses:** Brave and Safari add noise; Tor Browser and Firefox RFP block or prompt for extraction; Firefox FPP adds noise in some modes.

**Mitigations:**
- Use a browser that randomizes or blocks canvas read-back (Brave, Safari AFP, Firefox FPP/RFP, Tor/Mullvad Browser).

**Documented associations:** Fingerprint (FingerprintJS) (uses, L1 Confirmed); AddThis (Oracle, discontinued) (uses, L3 Research); Electronic Frontier Foundation (Cover Your Tracks) (measures, L1 Confirmed); The Tor Project (Tor Browser) (mitigates, L1 Confirmed); Brave (mitigates, L1 Confirmed); Mozilla (Firefox) (mitigates, L4 Category); Apple (Safari / WebKit) (mitigates, L2 Documented); AmIUnique (Inria / University of Lille) (researched, L3 Research); Princeton WebTAP / OpenWPM (researched, L3 Research)

**Sources:** [The Web Never Forgets: Persistent Tracking Mechanisms in the Wild (ACM CCS 2014)](https://securehomes.esat.kuleuven.be/~gacar/persistent/the_web_never_forgets.pdf) · [Beauty and the Beast: Diverting modern web browsers to build unique browser fingerprints (IEEE S&P 2016)](https://hal.archives-ouvertes.fr/hal-01285470) · [Characterizing Canvas Fingerprinting Use Across the Web (IMC 2025)](https://cseweb.ucsd.edu/~savage/papers/IMC25Canvas.pdf) · [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) · [FingerprintJS open-source entropy sources (src/sources)](https://github.com/fingerprintjs/fingerprintjs/tree/master/src/sources) · [Fingerprinting defenses 2.0](https://brave.com/privacy-updates/4-fingerprinting-defenses-2.0/) · [Understanding browser fingerprinting (Tor Browser manual)](https://tb-manual.torproject.org/anti-fingerprinting/) · [Private Browsing 2.0](https://webkit.org/?p=15697)

### WebGL renderer & capabilities

`webgl-info` v2.0.0 · basic · Demonstrated technique · relevance **high** · stable

Which graphics chip you have and what it can do, as reported by the browser's 3D feature.

**How it works.** Pages can open the browser's 3D graphics feature (WebGL) and ask for its version, the list of extra features, and sometimes the exact name of your graphics chip. The lab closes it again right away.

**Technical.** Unmasked renderer strings such as "ANGLE (NVIDIA, GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0)" are very specific. Limits and extensions vary with GPU, driver and browser. Software renderers (SwiftShader, llvmpipe) are typical of headless or virtualized environments. A missing renderer string does not identify a particular privacy product.

**Exposes:** GPU vendor/model (if exposed), driver capabilities, extension list. · **APIs:** WebGLRenderingContext, WEBGL_debug_renderer_info

**Limitations:**
- Values are shared by everyone with the same GPU + driver + browser.
- Some browsers return generic strings by design.

**Defenses:** Safari reports generic "Apple GPU"; Firefox RFP and Tor Browser restrict values; Brave randomizes some.

**Mitigations:**
- Use a browser that masks renderer details. Disabling WebGL is possible but breaks maps and 3D sites.

**Documented associations:** Fingerprint (FingerprintJS) (uses, L1 Confirmed); Electronic Frontier Foundation (Cover Your Tracks) (measures, L1 Confirmed)

**Sources:** [WEBGL_debug_renderer_info extension](https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_debug_renderer_info) · [FingerprintJS open-source entropy sources (src/sources)](https://github.com/fingerprintjs/fingerprintjs/tree/master/src/sources) · [About Cover Your Tracks](https://coveryourtracks.eff.org/about) · [(Cross-)Browser Fingerprinting via OS and Hardware Level Features (NDSS 2017)](https://www.ndss-symposium.org/ndss2017/ndss-2017-programme/cross-browser-fingerprinting-os-and-hardware-level-features/)

### WebGL shader precision & limits

`webgl-precision` v1.0.0 · advanced · Demonstrated technique · relevance **medium** · stable

How precise your graphics chip's maths is and how big its internal limits are.

**How it works.** The page asks the graphics chip about the precision of its calculations and the maximum sizes it supports. These come from the chip and its driver, and still work when the chip's name is hidden.

**Technical.** Precision ranges and limits come from the GPU driver (often through ANGLE on Windows/macOS). They separate GPU families and driver generations, and still work when the renderer string itself is masked. Mobile GPUs often report reduced medium-precision ranges.

**Exposes:** Shader precision formats and GPU limits. · **APIs:** WebGLRenderingContext.getShaderPrecisionFormat, WebGLRenderingContext.getParameter

**Limitations:**
- Shared by everyone with the same GPU/driver/browser stack.

**Defenses:** Firefox RFP and Tor report standardized values.

**Mitigations:**
- Use a browser with WebGL protections.

**Documented associations:** none

**Sources:** [(Cross-)Browser Fingerprinting via OS and Hardware Level Features (NDSS 2017)](https://www.ndss-symposium.org/ndss2017/ndss-2017-programme/cross-browser-fingerprinting-os-and-hardware-level-features/) · [WEBGL_debug_renderer_info extension](https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_debug_renderer_info)

### WebGL context attributes

`webgl-context-attrs` v1.0.0 · advanced · Demonstrated technique · relevance **low** · stable

The drawing settings your browser actually gives a page that asks for 3D graphics.

**How it works.** The page asks for a 3D drawing surface with default settings and reads back what it got. It also checks whether the browser refuses when only fast hardware would do, which happens with software-only graphics.

**Technical.** Granted attributes depend on GPU, driver and browser policy. A refusal under failIfMajorPerformanceCaveat: true means the GPU is blocklisted or rendering falls back to software, common in VMs and headless servers.

**Exposes:** Granted context attributes and WebGL versions. · **APIs:** WebGLRenderingContext.getContextAttributes, WebGL2RenderingContext

**Limitations:**
- Few distinct values across common hardware.

**Defenses:** None common.

**Mitigations:**
- No action needed.

**Documented associations:** none

**Sources:** [WEBGL_debug_renderer_info extension](https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_debug_renderer_info)

### Canvas emoji & glyph rendering

`emoji-render` v1.0.0 · basic · Demonstrated technique · relevance **medium** · stable

Emoji are drawn and their pixels turned into a code. Emoji artwork differs between systems and versions.

**How it works.** The page draws a row of emoji and special characters, reads back the pixels and makes a short code from them. Your system's emoji style and version decide what they look like.

**Technical.** Emoji come from the OS font (Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji) and change with OS releases. Missing glyphs render as "tofu" boxes. Unlike width metrics, pixel output also captures color and artwork, so it distinguishes OS versions very well.

**Exposes:** A digest of emoji/glyph pixels. · **APIs:** CanvasRenderingContext2D.fillText, CanvasRenderingContext2D.getImageData

**Limitations:**
- Largely redundant with OS version for common systems.

**Defenses:** Canvas noise (Brave, Safari AFP), extraction blocking (Tor, RFP).

**Mitigations:**
- Use a browser with canvas protections.

**Documented associations:** none

**Sources:** [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) · [Beauty and the Beast: Diverting modern web browsers to build unique browser fingerprints (IEEE S&P 2016)](https://hal.archives-ouvertes.fr/hal-01285470)

### WebGL rendering digest

`webgl-render` v1.0.0 · advanced · Demonstrated technique · relevance **medium** · stable

Your graphics chip draws a small 3D image, and the result is turned into a code.

**How it works.** The page asks the graphics chip to draw a coloured triangle with some maths in it and reads back the pixels. Different chips and drivers round the maths slightly differently, which changes the image.

**Technical.** Floating-point precision in GPU shader cores, driver compilers and rasterization rules changes edge and gradient pixels. Cao et al. (NDSS 2017) used dozens of such rendering tasks for cross-browser device identification.

**Exposes:** A digest of GPU-rendered pixels. · **APIs:** WebGLRenderingContext.readPixels

**Limitations:**
- Devices with the same GPU/driver/browser often collide.

**Defenses:** Same as WebGL information.

**Mitigations:**
- Use a browser with WebGL protections.

**Documented associations:** none

**Sources:** [(Cross-)Browser Fingerprinting via OS and Hardware Level Features (NDSS 2017)](https://www.ndss-symposium.org/ndss2017/ndss-2017-programme/cross-browser-fingerprinting-os-and-hardware-level-features/) · [DRAWNAPART: A Device Identification Technique based on Remote GPU Fingerprinting (NDSS 2022)](https://arxiv.org/abs/2201.09956)

### WebGPU adapter information

`webgpu` v1.0.0 · advanced · Research concept · relevance **medium** · stable · secure context

What the newest graphics feature (WebGPU) says about your graphics chip.

**How it works.** WebGPU is the newest way for pages to use the graphics chip. When asked, it describes the chip's maker and family, which optional features it has, and its limits. The lab only asks; it does not run anything on the chip.

**Technical.** Browsers bucket adapter info and limits to reduce entropy, but vendor/architecture plus feature sets still distinguish hardware classes. Research (DrawnApart, NDSS 2022) showed GPU timing can distinguish identical GPU models; WebGPU compute makes such timing easier. This lab does not run timing workloads.

**Exposes:** GPU vendor/architecture (bucketed), supported features, limits. · **APIs:** navigator.gpu, GPUAdapter.info

**Limitations:**
- Availability varies by browser, OS and GPU blocklists.

**Defenses:** Browsers bucket limits; Brave restricts adapter info.

**Mitigations:**
- No specific action; prefer browsers that bucket WebGPU info.

**Documented associations:** none

**Sources:** [DRAWNAPART: A Device Identification Technique based on Remote GPU Fingerprinting (NDSS 2022)](https://arxiv.org/abs/2201.09956) · [Mitigating Browser Fingerprinting in Web Specifications](https://www.w3.org/TR/fingerprinting-guidance/)

### Font availability (inference)

`fonts` v1.0.0 · basic · Demonstrated technique · relevance **high** · stable

Which fonts seem to be installed on your computer, guessed by measuring text.

**How it works.** Pages cannot list your fonts, so they measure them: text is written in a fallback font, then again with a font name in front. If the size changes, that font is probably installed. Office, design tools and language packs all add fonts.

**Technical.** Classic offset-measurement technique. Installed software (Office, Adobe, IDEs) and language packs add fonts. A match is an inference: a web font or font alias can produce false positives, and identical metrics can produce false negatives. Safari restricts web content to OS-bundled fonts.

**Exposes:** A list of probably available fonts from a 40-font candidate list. · **APIs:** HTMLElement.offsetWidth, CSS font-family

**Limitations:**
- Inference, not proof of installation.
- Only a short candidate list is tested to keep the test light.

**Defenses:** Safari exposes only system fonts; Tor Browser bundles fonts; Firefox RFP restricts fonts; Brave randomizes.

**Mitigations:**
- Avoid installing unusual fonts system-wide if anti-fingerprinting matters to you.
- Use a browser that restricts font visibility.

**Documented associations:** Fingerprint (FingerprintJS) (uses, L1 Confirmed); Electronic Frontier Foundation (Cover Your Tracks) (measures, L1 Confirmed); The Tor Project (Tor Browser) (mitigates, L1 Confirmed); Apple (Safari / WebKit) (mitigates, L1 Confirmed); AmIUnique (Inria / University of Lille) (researched, L3 Research)

**Sources:** [FingerprintJS open-source entropy sources (src/sources)](https://github.com/fingerprintjs/fingerprintjs/tree/master/src/sources) · [About Cover Your Tracks](https://coveryourtracks.eff.org/about) · [Tracking Prevention in WebKit](https://webkit.org/tracking-prevention/) · [Understanding browser fingerprinting (Tor Browser manual)](https://tb-manual.torproject.org/anti-fingerprinting/) · [How Unique Is Your Web Browser? (Eckersley, PETS 2010)](https://coveryourtracks.eff.org/static/browser-uniqueness.pdf)

### Canvas text metrics

`text-metrics` v2.0.0 · advanced · Demonstrated technique · relevance **medium** · stable

How wide and tall text and emoji are drawn in your system's default fonts.

**How it works.** The page measures a sentence in the standard font styles (serif, sans-serif, monospace and so on) and a few emoji. The exact sizes depend on which fonts your system uses by default and which emoji version it has.

**Technical.** Generic family names map to OS- and user-configured default fonts, so their metrics reveal font preferences (FingerprintJS's font_preferences source uses this idea). Emoji metrics reveal the emoji font version. This works even when the UA is altered.

**Exposes:** Text metrics for default font families, emoji and symbols. · **APIs:** CanvasRenderingContext2D.measureText

**Limitations:**
- Largely redundant with OS version.

**Defenses:** Tor Browser bundles fonts.

**Mitigations:**
- No practical user action.

**Documented associations:** Fingerprint (FingerprintJS) (uses, L1 Confirmed)

**Sources:** [FingerprintJS open-source entropy sources (src/sources)](https://github.com/fingerprintjs/fingerprintjs/tree/master/src/sources)

### SVG rendering & API support

`svg-support` v1.0.0 · advanced · Demonstrated technique · relevance **low** · semi-stable

Whether vector graphics features exist, and how your browser measures vector text and shapes.

**How it works.** The page checks for a few vector graphics (SVG) features and measures the length of a hidden line of text and a curve. The exact numbers depend on fonts and the browser.

**Technical.** SVG text length depends on font rasterization like canvas text, and path length on the engine's curve approximation. Both are rarely noised by anti-fingerprinting defenses. The SVG element is removed immediately.

**Exposes:** SVG API presence and geometry measurements. · **APIs:** SVGTextContentElement.getComputedTextLength, SVGGraphicsElement.getBBox, SVGGeometryElement.getTotalLength

**Limitations:**
- Changes with page zoom and font settings.

**Defenses:** Firefox RFP restricts fonts, which affects text length.

**Mitigations:**
- No practical user action.

**Documented associations:** none

**Sources:** [Mitigating Browser Fingerprinting in Web Specifications](https://www.w3.org/TR/fingerprinting-guidance/)

### Sub-pixel layout (DOMRect)

`dom-rect` v1.0.0 · advanced · Demonstrated technique · relevance **medium** · semi-stable

Exact sizes of tilted text on the page, measured to many decimal places.

**How it works.** The page places a hidden, slightly rotated piece of text and asks for its exact size. The tiny decimals depend on your browser version and how it renders fonts, and privacy tools rarely change them.

**Technical.** Layout uses floating-point math influenced by fonts, zoom and engine version. Unlike canvas, these APIs are rarely noised, so it is a useful complementary signal.

**Exposes:** High-precision layout geometry. · **APIs:** Element.getClientRects, Element.getBoundingClientRect

**Limitations:**
- Changes with page zoom.

**Defenses:** Firefox RFP rounds some values.

**Mitigations:**
- No practical user action.

**Documented associations:** none

**Sources:** [Mitigating Browser Fingerprinting in Web Specifications](https://www.w3.org/TR/fingerprinting-guidance/)

### Font smoothing (text edge colours)

`font-smoothing` v1.0.0 · advanced · Demonstrated technique · relevance **low** · stable

Checks whether your system smooths text with coloured edges (typical on Windows) or grey edges (typical on Macs and phones).

**How it works.** Draws black text on a white, non-transparent canvas and looks at the edge pixels. Coloured fringes mean subpixel smoothing (ClearType-style); pure grey means greyscale smoothing.

**Technical.** Subpixel anti-aliasing depends on OS, display (HiDPI screens usually disable it), user settings (ClearType tuning) and browser policy. Only drawn on an opaque canvas, because browsers disable subpixel AA on transparent backgrounds.

**Exposes:** Subpixel vs greyscale anti-aliasing. · **APIs:** CanvasRenderingContext2D.fillText, CanvasRenderingContext2D.getImageData

**Limitations:**
- Canvas may not use subpixel smoothing even where web pages do.

**Defenses:** Canvas noise also affects this check.

**Mitigations:**
- No practical action.

**Documented associations:** none

**Sources:** [Mitigating Browser Fingerprinting in Web Specifications](https://www.w3.org/TR/fingerprinting-guidance/)

## CSS & preferences

### Accessibility & appearance preferences

`user-preferences` v1.0.0 · basic · Demonstrated technique · relevance **low** · semi-stable

Your appearance and accessibility choices: dark mode, reduced motion, high contrast and similar.

**How it works.** Your browser tells pages about settings like dark mode, reduced motion and higher contrast so they can adapt. These are good settings to keep if you need them; enabled accessibility settings are just less common.

**Technical.** Each is low-entropy, but accessibility settings are used by minorities and are therefore more distinctive when enabled. These are legitimate user preferences, not vulnerabilities. Sites need them to render accessibly.

**Exposes:** Appearance and accessibility preferences. · **APIs:** window.matchMedia

**Limitations:**
- Color scheme may change automatically with time of day.

**Defenses:** Firefox RFP reports light scheme and no reduced motion.

**Mitigations:**
- Keep accessibility settings you need. The privacy cost is small and the usability benefit is real.

**Documented associations:** Fingerprint (FingerprintJS) (uses, L1 Confirmed)

**Sources:** [FingerprintJS open-source entropy sources (src/sources)](https://github.com/fingerprintjs/fingerprintjs/tree/master/src/sources)

### Extended media query matrix

`media-query-matrix` v1.0.0 · advanced · Demonstrated technique · relevance **low** · semi-stable

A wide sweep of questions about your display and browser mode.

**How it works.** The page asks about twenty more questions about your display, such as how sharp it is, its shape, whether the page runs as an installed app, and whether you asked for reduced data use. Sites can ask these even without JavaScript.

**Technical.** Every one of these can also be evaluated without JavaScript by CSS that loads a different URL per match, so a server can collect them from request logs. Unknown features never match, which itself reveals engine support.

**Exposes:** Media-query match matrix. · **APIs:** window.matchMedia

**Limitations:**
- Resolution/aspect buckets change with window size and zoom.

**Defenses:** Firefox RFP normalizes some features.

**Mitigations:**
- No practical user action.

**Documented associations:** none

**Sources:** [Mitigating Browser Fingerprinting in Web Specifications](https://www.w3.org/TR/fingerprinting-guidance/) · [FingerprintJS open-source entropy sources (src/sources)](https://github.com/fingerprintjs/fingerprintjs/tree/master/src/sources)

### CSS feature support

`css-features` v1.0.0 · basic · Demonstrated technique · relevance **low** · semi-stable

Which modern styling features your browser supports, which hints at its version.

**How it works.** The page asks your browser whether it understands a list of newer design features. Each browser version supports a slightly different set, so the answers point to your browser and version.

**Technical.** Support bitmasks map to browser release ranges. Vendor-prefixed properties (-moz-, -webkit-touch-callout) reveal the engine. Outdated support patterns indicate old (potentially unpatched) browsers.

**Exposes:** Supported/unsupported CSS features. · **APIs:** CSS.supports

**Limitations:**
- Feature lists age quickly and need maintenance.

**Defenses:** None; keep updated to share the common version.

**Mitigations:**
- Keep the browser updated.

**Documented associations:** none

**Sources:** [Mitigating Browser Fingerprinting in Web Specifications](https://www.w3.org/TR/fingerprinting-guidance/)

### CSS system colors & computed styles

`system-colors` v2.0.0 · advanced · Research concept · relevance **low** · semi-stable

Colours your system uses for buttons and highlights, plus your default text size and scrollbar width.

**How it works.** Pages can ask for special colour names that may follow your system theme (such as your accent colour), and can measure your default text size and how wide scrollbars are. Many browsers now return fixed values here.

**Technical.** CSS Color 4 system colors historically exposed OS theme colors; browsers increasingly hard-code them. Default font size reflects the user's browser font setting (16px unless changed). Scrollbar width differs between overlay scrollbars (0 px on macOS by default) and classic ones (~15–17 px on Windows), and with the OS "always show scrollbars" setting.

**Exposes:** Resolved system colors, default font settings, scrollbar width. · **APIs:** getComputedStyle, CSS system colors, Element.clientWidth

**Limitations:**
- Many browsers return fixed values regardless of the OS.

**Defenses:** Browsers hard-code values; Firefox RFP returns fixed colors.

**Mitigations:**
- No action needed.

**Documented associations:** none

**Sources:** [Mitigating Browser Fingerprinting in Web Specifications](https://www.w3.org/TR/fingerprinting-guidance/)

## Audio & media

### OfflineAudioContext processing

`audio-offline` v1.0.0 · basic · Demonstrated technique · relevance **medium** · stable

Your browser processes a silent sound. Tiny number differences in the result can tell setups apart.

**How it works.** The page creates a tone and runs it through a sound effect entirely in memory. Nothing plays and no microphone is used. The resulting numbers differ slightly between browsers, systems and processors.

**Technical.** Differences come from floating-point implementation details (SIMD paths, FMA, denormal handling) and audio engine versions, so they mostly separate browser/OS/CPU families rather than individuals. Englehardt & Narayanan (2016) first observed this in the wild.

**Exposes:** A numeric signature of the audio processing stack. · **APIs:** OfflineAudioContext, DynamicsCompressorNode

**Limitations:**
- Many users of the same browser/OS share the value.
- Some browsers suspend audio contexts without a user gesture.

**Defenses:** Brave farbles Web Audio; Safari adds noise under Advanced Fingerprinting Protection; Firefox RFP normalizes.

**Mitigations:**
- Use a browser with Web Audio randomization (Brave, Safari AFP).

**Documented associations:** Fingerprint (FingerprintJS) (uses, L1 Confirmed); Brave (mitigates, L1 Confirmed); Princeton WebTAP / OpenWPM (researched, L3 Research)

**Sources:** [Online Tracking: A 1-million-site Measurement and Analysis (ACM CCS 2016)](https://www.cs.princeton.edu/~arvindn/publications/OpenWPM_1_million_site_tracking_measurement.pdf) · [AudioContext](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext) · [FingerprintJS open-source entropy sources (src/sources)](https://github.com/fingerprintjs/fingerprintjs/tree/master/src/sources) · [Fingerprinting defenses 2.0](https://brave.com/privacy-updates/4-fingerprinting-defenses-2.0/)

### Speech synthesis voices

`speech-voices` v1.0.0 · basic · Demonstrated technique · relevance **medium** · stable

The text-to-speech voices installed on your system.

**How it works.** Pages can list the voices your system can read text aloud with, including their language. Extra voice packs you have downloaded show up here. Nothing is spoken.

**Technical.** Voice lists depend on OS, installed language packs and optional premium voices. macOS and Windows differ substantially; network voices reveal vendor services.

**Exposes:** Installed TTS voices and languages. · **APIs:** speechSynthesis.getVoices

**Limitations:**
- Voice lists load asynchronously and may be empty initially.

**Defenses:** Firefox RFP and Tor hide voices; Brave limits them.

**Mitigations:**
- Remove unneeded voice packs if this concerns you.

**Documented associations:** none

**Sources:** [Mitigating Browser Fingerprinting in Web Specifications](https://www.w3.org/TR/fingerprinting-guidance/)

### Media codec support

`media-codecs` v1.0.0 · basic · Demonstrated technique · relevance **low** · stable

Which video and audio formats your browser can play.

**How it works.** The page asks whether your browser could play a list of video and audio formats. The answers depend on your browser, system and graphics hardware. Nothing is downloaded or played.

**Technical.** HEVC, AV1 and Dolby support depend on hardware decoders, OS codec licenses and browser builds.

**Exposes:** Codec support answers ("probably", "maybe", ""). · **APIs:** HTMLMediaElement.canPlayType, MediaSource.isTypeSupported

**Limitations:**
- "maybe" answers are not definitive.

**Defenses:** None common.

**Mitigations:**
- No action needed.

**Documented associations:** none

**Sources:** [Mitigating Browser Fingerprinting in Web Specifications](https://www.w3.org/TR/fingerprinting-guidance/)

### Media device API surface (no enumeration)

`media-devices` v2.0.0 · basic · Demonstrated technique · relevance **low** · stable

Which camera, microphone and screen-sharing features exist. No devices are listed or counted.

**How it works.** The page checks whether these features exist and which settings names the browser understands. It never lists your cameras or microphones and never asks for permission.

**Technical.** Device enumeration can reveal device counts (and, after a granted permission, labels and persistent per-site IDs). This lab deliberately avoids it. The supported-constraints list differs between engines and versions, so it acts as a capability signal.

**Exposes:** Media API presence and supported constraint names. · **APIs:** navigator.mediaDevices, MediaDevices.getSupportedConstraints

**Limitations:**
- Says nothing about which devices are attached; by design.

**Defenses:** Browsers restrict enumeration before permission.

**Mitigations:**
- Only grant camera/microphone permissions to sites that need them, and revoke them afterwards.

**Documented associations:** none

**Sources:** [Mitigating Browser Fingerprinting in Web Specifications](https://www.w3.org/TR/fingerprinting-guidance/)

### Audio engine capability profile

`audio-capabilities` v1.0.0 · basic · Demonstrated technique · relevance **medium** · semi-stable

What your sound system reports: sample rate, delay and number of speaker channels.

**How it works.** The page creates a sound object that stays silent, reads its settings (sample rate, delay, channel count) and closes it. These follow your sound hardware and system.

**Technical.** The sample rate follows the OS audio device (44.1/48/96 kHz). baseLatency depends on OS audio stack and buffer sizes (FingerprintJS's audio_base_latency source). maxChannelCount reveals surround/multichannel outputs. No microphone is involved.

**Exposes:** Audio hardware/stack characteristics. · **APIs:** AudioContext, AudioDestinationNode.maxChannelCount, AudioWorklet

**Limitations:**
- Changes when you switch audio output devices.
- Some browsers report latency only after the context runs.

**Defenses:** Firefox RFP standardizes some values.

**Mitigations:**
- No practical user action.

**Documented associations:** Fingerprint (FingerprintJS) (uses, L1 Confirmed)

**Sources:** [FingerprintJS open-source entropy sources (src/sources)](https://github.com/fingerprintjs/fingerprintjs/tree/master/src/sources) · [AudioContext](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext)

### Hardware video decoding (Media Capabilities)

`media-capabilities` v1.0.0 · advanced · Demonstrated technique · relevance **medium** · stable

Asks whether videos in various formats would play smoothly and power-efficiently. "Power efficient" usually means a hardware decoder in your graphics chip.

**How it works.** Calls navigator.mediaCapabilities.decodingInfo() for a fixed set of video configurations (H.264, HEVC, VP9, AV1 at 1080p and 4K) and records supported, smooth and powerEfficient. Nothing is downloaded or played.

**Technical.** Unlike canPlayType(), Media Capabilities reflects hardware acceleration and performance, which depends on GPU generation (AV1 hardware decode only exists on recent GPUs), drivers and OS codec licenses.

**Exposes:** Decode support / smoothness / power efficiency per format. · **APIs:** MediaCapabilities.decodingInfo

**Limitations:**
- Answers can depend on battery/power mode.

**Defenses:** Firefox RFP restricts some answers.

**Mitigations:**
- No practical user action.

**Documented associations:** none

**Sources:** [Mitigating Browser Fingerprinting in Web Specifications](https://www.w3.org/TR/fingerprinting-guidance/)

### WebCodecs encoder support

`webcodecs` v1.0.0 · advanced · Demonstrated technique · relevance **medium** · stable · secure context

Checks which video formats the browser can encode itself, which often depends on the hardware encoder in your graphics chip.

**How it works.** Calls VideoEncoder.isConfigSupported() for H.264, VP9, AV1 and HEVC at 1080p, asking specifically for hardware acceleration. No encoder is created and nothing is encoded.

**Technical.** Hardware encoders (Intel Quick Sync, NVIDIA NVENC, AMD VCE, Apple VideoToolbox) support different codec sets by generation. Asking with hardwareAcceleration: "prefer-hardware" separates GPU generations and software-only environments such as VMs.

**Exposes:** Hardware-encoder support per codec. · **APIs:** VideoEncoder.isConfigSupported

**Limitations:**
- Chromium and Safari only; answers may depend on power state.

**Defenses:** None common.

**Mitigations:**
- No practical user action.

**Documented associations:** none

**Sources:** [Mitigating Browser Fingerprinting in Web Specifications](https://www.w3.org/TR/fingerprinting-guidance/)

## Hardware & runtime

### Logical processors & device memory (coarse)

`cpu-memory` v1.0.0 · basic · Demonstrated technique · relevance **medium** · stable

Roughly how many processor threads and how much memory your device reports.

**How it works.** Browsers tell pages an approximate number of processor threads and, in some browsers, a rounded memory size (capped at 8 GB). These are coarse, but separate phones, laptops and workstations.

**Technical.** hardwareConcurrency is the number of logical processors the browser chooses to report. It is not the number of physical cores, and browsers may cap or round it. deviceMemory (Chromium only) is rounded to a power of two and capped at 8 GB, so it is not your installed RAM.

**Exposes:** Coarse compute and memory class. · **APIs:** navigator.hardwareConcurrency, navigator.deviceMemory

**Limitations:**
- Coarse and capped by design.
- Safari caps hardwareConcurrency.

**Defenses:** Tor/Firefox RFP report fixed values; Brave randomizes.

**Mitigations:**
- No action needed.

**Documented associations:** Fingerprint (FingerprintJS) (uses, L1 Confirmed)

**Sources:** [FingerprintJS open-source entropy sources (src/sources)](https://github.com/fingerprintjs/fingerprintjs/tree/master/src/sources)

### Network Information API

`network-info` v1.0.0 · basic · Demonstrated technique · relevance **low** · volatile

Your connection type and a rough speed estimate.

**How it works.** Some browsers tell pages whether you are on a fast or slow connection and estimate its speed and delay. The values are rounded and change as your network changes.

**Technical.** Values are rounded (rtt to 25 ms, downlink to 25 kbps) and change with network conditions, so they are volatile. Chromium-only.

**Exposes:** Connection quality class. · **APIs:** navigator.connection

**Limitations:**
- Changes with network conditions.

**Defenses:** Not implemented in Firefox/Safari.

**Mitigations:**
- No action needed.

**Documented associations:** none

**Sources:** [Mitigating Browser Fingerprinting in Web Specifications](https://www.w3.org/TR/fingerprinting-guidance/)

### WebAssembly & SharedArrayBuffer

`wasm-sab` v1.0.0 · basic · Demonstrated technique · relevance **low** · stable

Whether your browser supports high-performance code features.

**How it works.** The page checks for WebAssembly (fast compiled code in the browser) and a few related features. Support follows your browser version and the site's security settings.

**Technical.** SharedArrayBuffer requires cross-origin isolation (COOP/COEP headers) since Spectre. WebAssembly feature support maps to browser versions and CPU capabilities. Validating a module does not execute code.

**Exposes:** Feature flags. · **APIs:** WebAssembly.validate, SharedArrayBuffer, crossOriginIsolated

**Limitations:**
- Depends on page headers as well as the browser.

**Defenses:** None needed.

**Mitigations:**
- No action needed.

**Documented associations:** none

**Sources:** [Mitigating Browser Fingerprinting in Web Specifications](https://www.w3.org/TR/fingerprinting-guidance/)

### Timer precision & jitter sample

`timer-precision` v2.0.0 · advanced · Demonstrated technique · relevance **low** · semi-stable

How precise your browser's clock is, and how much it jitters. Privacy modes make it deliberately blurry.

**How it works.** The page reads the browser's high-precision clock many times in a row and notes the smallest step and how much the steps vary. Privacy-focused browsers make the clock deliberately coarse, which shows up here.

**Technical.** After Spectre, browsers coarsened timers (Chromium ~100 µs, ~5 µs when cross-origin isolated; Firefox 1 ms under RFP; Tor 100 ms). The step size can indicate privacy modes. Timing results are noisy: background load affects them.

**Exposes:** Timer granularity. · **APIs:** performance.now

**Limitations:**
- Noisy; repeat for confidence.

**Defenses:** Coarse timers are themselves a defense.

**Mitigations:**
- No action needed.

**Documented associations:** Mozilla (Firefox) (mitigates, L4 Category)

**Sources:** [Mitigating Browser Fingerprinting in Web Specifications](https://www.w3.org/TR/fingerprinting-guidance/)

### Bounded CPU timing

`benchmark` v1.0.0 · advanced · Research concept · relevance **low** · volatile

How long a tiny, fixed calculation takes. Faster devices finish sooner.

**How it works.** The page runs the same short calculation three times and notes the middle time. It takes a few milliseconds and varies with what else your device is doing.

**Technical.** Relative speed separates phones from desktops and can expose overloaded cloud VMs. It is noisy (thermal state, background tabs, power saving) and therefore excluded from the default fingerprint profile.

**Exposes:** Approximate CPU speed class. · **APIs:** performance.now

**Limitations:**
- Highly noisy; not a stable identifier.
- Coarse timers reduce precision.

**Defenses:** Coarse timers.

**Mitigations:**
- No action needed.

**Documented associations:** none

**Sources:** [DRAWNAPART: A Device Identification Technique based on Remote GPU Fingerprinting (NDSS 2022)](https://arxiv.org/abs/2201.09956)

### Math function precision

`math-precision` v1.0.0 · advanced · Demonstrated technique · relevance **low** · stable

The last digits of some maths results, which differ between browsers and processors.

**How it works.** The page calculates a handful of maths functions. Browsers use slightly different methods, so the last digits of the answers reveal which browser engine you really use.

**Technical.** Engines use different libm ports and CPU intrinsics for transcendental functions; the last bits differ between V8, SpiderMonkey and JavaScriptCore and sometimes between OS/CPU. Primarily an engine/platform signal.

**Exposes:** Results of a fixed set of math evaluations. · **APIs:** Math

**Limitations:**
- Redundant with browser/OS for most users.

**Defenses:** Tor Browser normalizes some functions.

**Mitigations:**
- No action needed.

**Documented associations:** Fingerprint (FingerprintJS) (uses, L1 Confirmed)

**Sources:** [FingerprintJS open-source entropy sources (src/sources)](https://github.com/fingerprintjs/fingerprintjs/tree/master/src/sources)

### Battery API exposure (presence only)

`battery` v2.0.0 · basic · Demonstrated technique · relevance **low** · stable

Whether your browser offers battery information. Your battery level is not read.

**How it works.** The lab only checks whether the battery feature exists. It does not ask for your battery level.

**Technical.** Olejnik et al. (2015) showed battery level plus discharge time can link visits across sites over short periods, which led Firefox and Safari to remove the API. Chromium still exposes it. Presence mostly reveals the engine family.

**Exposes:** API presence only. · **APIs:** navigator.getBattery, BatteryManager

**Limitations:**
- Presence does not mean values would be exposed (desktops report fixed values).

**Defenses:** Removed from Firefox and Safari.

**Mitigations:**
- No action needed for most users.

**Documented associations:** Princeton WebTAP / OpenWPM (researched, L3 Research)

**Sources:** [The leaking battery: A privacy analysis of the HTML5 Battery Status API](https://eprint.iacr.org/2015/616) · [Online Tracking: A 1-million-site Measurement and Analysis (ACM CCS 2016)](https://www.cs.princeton.edu/~arvindn/publications/OpenWPM_1_million_site_tracking_measurement.pdf)

### Runtime memory hints (JS heap)

`js-heap` v1.0.0 · advanced · Demonstrated technique · relevance **low** · semi-stable

How much memory your browser lets scripts use on this page.

**How it works.** Chrome-family browsers report a rounded memory limit for scripts and how much is in use. The limit hints at your device type. The other browsers do not share this.

**Technical.** Chromium buckets these values to limit precision. jsHeapSizeLimit tends to reflect the device memory class and 32/64-bit builds (e.g. ~4 GB on 64-bit desktop). Used/total heap are volatile and describe this page, not your system.

**Exposes:** Heap limit and coarse usage. · **APIs:** performance.memory

**Limitations:**
- Chromium-only and deliberately imprecise.
- Used/total values change constantly.

**Defenses:** Values are bucketed by Chromium; absent elsewhere.

**Mitigations:**
- No action needed.

**Documented associations:** none

**Sources:** [Mitigating Browser Fingerprinting in Web Specifications](https://www.w3.org/TR/fingerprinting-guidance/)

### WebAssembly feature surface

`wasm-features` v1.0.0 · advanced · Demonstrated technique · relevance **low** · stable

Which features of the browser's fast-code engine are supported.

**How it works.** The page builds seven tiny test programs as data and asks the browser whether it understands each one. Nothing runs. Support changes with browser versions.

**Technical.** Feature support moved through engines at different releases (e.g. tail calls shipped in V8 well before JavaScriptCore). The resulting bitmask maps to engine and version ranges. Each probe module was verified against V8 when written.

**Exposes:** WebAssembly feature bitmask. · **APIs:** WebAssembly.validate

**Limitations:**
- Validation can be disabled by policy (e.g. JIT-less or "Lockdown" modes), which shows as all false.

**Defenses:** None needed.

**Mitigations:**
- No action needed.

**Documented associations:** none

**Sources:** [Mitigating Browser Fingerprinting in Web Specifications](https://www.w3.org/TR/fingerprinting-guidance/)

### Keyboard layout map

`keyboard-layout` v1.0.0 · advanced · Demonstrated technique · relevance **medium** · stable · secure context

Your keyboard layout (for example Swedish, German or French), without you pressing a key.

**How it works.** Some browsers let pages ask which character each physical key produces. Where the Q, Y or Ö keys sit reveals your layout and hints at your country.

**Technical.** KeyQ→a indicates AZERTY, KeyY→z QWERTZ, Semicolon→ö Swedish/Finnish. Chromium-only; requires a top-level, focused, secure context.

**Exposes:** Keyboard layout family (hints at country). · **APIs:** Keyboard.getLayoutMap

**Limitations:**
- Chromium-only.
- Layout guess is a simple heuristic.

**Defenses:** Not implemented in Firefox/Safari; Brave restricts.

**Mitigations:**
- No practical action besides browser choice.

**Documented associations:** none

**Sources:** [Keyboard Map](https://wicg.github.io/keyboard-map/)

### CPU architecture (NaN sign bit)

`cpu-architecture` v1.0.0 · advanced · Demonstrated technique · relevance **low** · stable

Tells Intel/AMD (x86) processors apart from ARM ones (Apple M-series, phones) with one tiny calculation.

**How it works.** Computes Infinity − Infinity in a 32-bit float and looks at the raw bytes of the result (a "not a number" value). x86 processors set the sign bit of that value; ARM processors do not.

**Technical.** IEEE 754 leaves the sign of a generated NaN implementation-defined. x86/x86-64 produce the "default NaN" with the sign bit set (top byte 255), while ARM produces it unset (127). FingerprintJS uses exactly this check in its architecture source. It reveals the CPU family even when the User-Agent claims otherwise (e.g. Apple Silicon reporting "MacIntel").

**Exposes:** CPU architecture family (x86 vs other). · **APIs:** Float32Array, Uint8Array

**Limitations:**
- Emulation (Rosetta, VMs) may report the emulated architecture.

**Defenses:** None known in mainstream browsers.

**Mitigations:**
- No practical user action.

**Documented associations:** none

**Sources:** [FingerprintJS architecture source (src/sources/architecture.ts)](https://github.com/fingerprintjs/fingerprintjs/blob/master/src/sources/architecture.ts) · [FingerprintJS open-source entropy sources (src/sources)](https://github.com/fingerprintjs/fingerprintjs/tree/master/src/sources)

## APIs & permissions

### Capability API availability

`api-availability` v1.0.0 · basic · Demonstrated technique · relevance **low** · stable

Which powerful browser features exist, like location, notifications or Bluetooth. Existing is not the same as being allowed.

**How it works.** The page only checks whether these features exist in your browser; it does not use them or ask for permission. The set differs between browsers, versions and devices.

**Technical.** The set of present APIs depends on browser, version, platform and enterprise policy. Presence does not mean the API can be used without permission, and it is not a vulnerability.

**Exposes:** Presence flags for capability APIs. · **APIs:** navigator.*

**Limitations:**
- Presence ≠ usability; many APIs are permission-gated.

**Defenses:** Brave disables several device APIs by default.

**Mitigations:**
- No action needed.

**Documented associations:** none

**Sources:** [Mitigating Browser Fingerprinting in Web Specifications](https://www.w3.org/TR/fingerprinting-guidance/)

### Permission states (no prompts)

`permission-states` v1.0.0 · basic · Demonstrated technique · relevance **low** · semi-stable

Which permissions you have already allowed or blocked for this site. Checking shows no pop-up.

**How it works.** Pages can quietly check whether you have previously allowed, blocked or never been asked about things like camera or notifications for this site. Asking this never shows a prompt.

**Technical.** For a fresh origin almost everything is prompt. Unusual defaults (e.g. notifications globally blocked) and enterprise policies show up here. Inconsistencies between Notification.permission and the Permissions API were historically a headless-Chrome tell.

**Exposes:** Per-permission state for this origin. · **APIs:** Permissions.query, Notification.permission

**Limitations:**
- Permission names vary by browser; unsupported names are reported as such.

**Defenses:** None needed.

**Mitigations:**
- Review and reset site permissions periodically in browser settings.

**Documented associations:** none

**Sources:** [Mitigating Browser Fingerprinting in Web Specifications](https://www.w3.org/TR/fingerprinting-guidance/)

### JavaScript API surface

`api-surface` v1.0.0 · advanced · Demonstrated technique · relevance **low** · semi-stable

Which newer browser features exist, which narrows down your browser version.

**How it works.** The page checks for about twenty features that browsers added at different times. Which ones exist points to your browser and roughly which version you run.

**Technical.** A presence bitmask maps to a release range and engine. Bot detectors compare it with the claimed UA version to detect spoofing.

**Exposes:** Presence bitmask. · **APIs:** globalThis

**Limitations:**
- List needs maintenance as browsers evolve.

**Defenses:** Keep updated.

**Mitigations:**
- Keep the browser updated.

**Documented associations:** none

**Sources:** [Fingerprinting the Fingerprinters: Learning to Detect Browser Fingerprinting Behaviors (IEEE S&P 2021)](https://arxiv.org/pdf/2008.04480)

### WebRTC API presence

`webrtc-presence` v1.0.0 · basic · Demonstrated technique · relevance **low** · stable

Whether video-call technology is available and which video and audio formats it offers. No connection is made.

**How it works.** The page checks whether the browser's video-call feature exists and lists the formats it supports. It does not start a call or collect network addresses.

**Technical.** Codec capability lists (VP8/VP9/AV1/H.264 profiles, Opus, RED, hardware-accelerated codecs) differ by browser, OS and hardware encoders. Presence of WebRTC does not mean network candidates are gathered; that only happens in the separate, user-initiated candidate test.

**Exposes:** WebRTC interface presence and advertised codecs. · **APIs:** RTCPeerConnection, RTCRtpSender.getCapabilities

**Limitations:**
- Says nothing about IP exposure.

**Defenses:** Some privacy browsers disable WebRTC entirely.

**Mitigations:**
- No action needed.

**Documented associations:** none

**Sources:** [Online Tracking: A 1-million-site Measurement and Analysis (ACM CCS 2016)](https://www.cs.princeton.edu/~arvindn/publications/OpenWPM_1_million_site_tracking_measurement.pdf)

### Device & posture API exposure

`device-posture` v1.0.0 · basic · Demonstrated technique · relevance **low** · stable

Whether features for motion sensors, foldable screens, multiple monitors and on-screen keyboards exist. No sensor is read.

**How it works.** The page only checks whether these features exist. It never starts a sensor or listens to movement.

**Technical.** Sensor readings have been shown to enable device fingerprinting (e.g. accelerometer calibration errors), which is why this lab only checks presence. Posture/segments APIs indicate foldables; multi-screen APIs indicate desktop Chromium.

**Exposes:** Presence flags; posture type where exposed. · **APIs:** navigator.devicePosture, DeviceOrientationEvent, Sensor

**Limitations:**
- Presence does not mean a sensor exists or is accessible.

**Defenses:** Firefox and Safari expose fewer device APIs; Brave disables several.

**Mitigations:**
- No action needed.

**Documented associations:** none

**Sources:** [Mitigating Browser Fingerprinting in Web Specifications](https://www.w3.org/TR/fingerprinting-guidance/)

### WebAuthn & credential capability

`webauthn` v1.0.0 · basic · Demonstrated technique · relevance **low** · stable

Whether passkeys work here, and whether your device has a built-in fingerprint or face unlock. No login is started.

**How it works.** The page asks your browser, without showing anything, whether passkeys are supported and whether a built-in unlock method (Touch ID, Face ID, Windows Hello) exists.

**Technical.** These queries never show UI. Whether a platform authenticator exists (Touch ID, Face ID, Windows Hello, Android biometrics) is a hardware/OS signal. Client capabilities (hybrid transport, related origins, passkey sync) vary with browser and OS versions.

**Exposes:** Credential API presence and authenticator availability. · **APIs:** PublicKeyCredential, navigator.credentials

**Limitations:**
- Requires a secure context; results vary with enterprise policy.

**Defenses:** None needed.

**Mitigations:**
- No action needed.

**Documented associations:** none

**Sources:** [Mitigating Browser Fingerprinting in Web Specifications](https://www.w3.org/TR/fingerprinting-guidance/)

### Event & observer support matrix

`observer-support` v1.0.0 · advanced · Demonstrated technique · relevance **low** · semi-stable

Which page-watching and event features your browser has, which narrows down its version.

**How it works.** The page checks for features that let sites watch for changes on the page, and lists the kinds of performance measurements the browser supports. Browsers add these release by release.

**Technical.** Supported performance entry types (e.g. largest-contentful-paint, long-animation-frame, soft-navigation) are added release by release and differ between engines, so the list narrows browser and version.

**Exposes:** API presence and supported entry types. · **APIs:** PerformanceObserver.supportedEntryTypes

**Limitations:**
- Changes with every browser update.

**Defenses:** Keep updated.

**Mitigations:**
- Keep the browser updated.

**Documented associations:** none

**Sources:** [Fingerprinting the Fingerprinters: Learning to Detect Browser Fingerprinting Behaviors (IEEE S&P 2021)](https://arxiv.org/pdf/2008.04480)

### DOM & HTML implementation features

`dom-features` v1.0.0 · advanced · Demonstrated technique · relevance **low** · semi-stable

Which page-building features your browser supports, like pop-up dialogs and date pickers.

**How it works.** The page checks a list of newer page elements and asks whether special input types, such as date or colour pickers, are supported. Unsupported ones silently fall back to plain text boxes.

**Technical.** Unsupported input types silently fall back to text, so assigning a type and reading it back reveals support. Together with newer DOM APIs this maps to engine and release range.

**Exposes:** HTML/DOM feature support. · **APIs:** HTMLInputElement.type, HTMLElement.popover, HTMLDialogElement

**Limitations:**
- Needs maintenance as features ship.

**Defenses:** Keep updated.

**Mitigations:**
- Keep the browser updated.

**Documented associations:** none

**Sources:** [Mitigating Browser Fingerprinting in Web Specifications](https://www.w3.org/TR/fingerprinting-guidance/)

### Secure context & isolation posture

`isolation-posture` v1.0.0 · basic · Demonstrated technique · relevance **low** · stable

Whether this page runs in a secure mode, and how well it is walled off from other sites.

**How it works.** The page reads whether it was loaded securely and which protective settings are active. These depend mostly on how the site is set up, not on you, but they decide which other checks can run.

**Technical.** These values describe the page and server configuration more than the user. They matter because they gate other APIs (high-resolution timers, SharedArrayBuffer, Storage, Web Crypto). The allowed-features list also differs between browser versions.

**Exposes:** Security context flags and allowed policy features. · **APIs:** isSecureContext, crossOriginIsolated, Document.featurePolicy

**Limitations:**
- Reflects this deployment (localhost vs HTTPS).

**Defenses:** Not applicable.

**Mitigations:**
- No action needed.

**Documented associations:** none

**Sources:** [Mitigating Browser Fingerprinting in Web Specifications](https://www.w3.org/TR/fingerprinting-guidance/)

### Permission API surface

`permission-api-surface` v1.0.0 · advanced · Demonstrated technique · relevance **low** · stable

Which permission types your browser knows about. Nothing is requested.

**How it works.** The page asks about a list of permission names and only records which ones your browser recognises. Different browsers know different names. No prompt is shown.

**Technical.** The set of recognized names differs by engine and version (e.g. "window-management", "local-fonts", "captured-surface-control" are Chromium-only). Querying never prompts. This is distinct from the permission states test.

**Exposes:** Recognized permission names and API surface. · **APIs:** Permissions.query

**Limitations:**
- Name lists need maintenance.

**Defenses:** None needed.

**Mitigations:**
- No action needed.

**Documented associations:** none

**Sources:** [Mitigating Browser Fingerprinting in Web Specifications](https://www.w3.org/TR/fingerprinting-guidance/)

### WebRTC local candidate exposure

`webrtc-local` v1.0.0 · advanced · Demonstrated technique · relevance **medium** · semi-stable · user-initiated

Checks whether video-call technology would reveal your home network address. Runs only when you click it, and contacts no server.

**How it works.** Browsers' video-call feature (WebRTC) collects network addresses to connect people. The lab starts it without any outside server and checks whether your local address is shown or hidden behind a random name. Nothing is stored.

**Technical.** Since ~2019 browsers replace host IPs with random mDNS names unless media permission was granted. With a STUN server, a server-reflexive candidate would also expose the public IP; this lab deliberately does not do that. The 2025 "Local Mess" disclosure showed WebRTC being used to reach localhost apps.

**Exposes:** Whether local IPs are exposed or mDNS-obfuscated. · **APIs:** RTCPeerConnection

**Limitations:**
- Without STUN, the public-IP leak is not tested.

**Defenses:** mDNS candidate obfuscation (all major browsers); WebRTC IP handling policies; uBlock Origin setting.

**Mitigations:**
- Keep mDNS obfuscation enabled (default).
- Use a system-wide VPN rather than a browser-proxy extension.

**Documented associations:** Meta (Meta Pixel) (uses, L3 Research); Princeton WebTAP / OpenWPM (researched, L3 Research)

**Sources:** [Online Tracking: A 1-million-site Measurement and Analysis (ACM CCS 2016)](https://www.cs.princeton.edu/~arvindn/publications/OpenWPM_1_million_site_tracking_measurement.pdf) · [Local Mess: covert web-to-app tracking via localhost on Android](https://localmess.github.io/)

### Apple Pay availability

`apple-pay` v1.0.0 · advanced · Demonstrated technique · relevance **low** · stable

Checks whether Apple Pay can be used in this browser. That reveals Safari on an Apple device, and sometimes whether a card is set up.

**How it works.** Checks for the ApplePaySession object and, if present, asks whether payments are possible. No payment sheet is opened and nothing is charged.

**Technical.** ApplePaySession.canMakePayments() returns whether the device supports Apple Pay (it does not reveal cards). FingerprintJS includes an apple_pay source; the API also throws in some contexts (e.g. inside cross-origin frames), and that state is recorded too.

**Exposes:** Apple Pay support state. · **APIs:** ApplePaySession.canMakePayments

**Limitations:**
- Only present in Safari and some WebKit browsers.

**Defenses:** None needed.

**Mitigations:**
- No action needed.

**Documented associations:** none

**Sources:** [FingerprintJS open-source entropy sources (src/sources)](https://github.com/fingerprintjs/fingerprintjs/tree/master/src/sources)

### Game controller API

`gamepads` v1.0.0 · basic · Demonstrated technique · relevance **low** · semi-stable

Checks whether the browser supports game controllers and whether one is already connected.

**How it works.** Calls navigator.getGamepads(). Browsers only reveal a controller after you have pressed one of its buttons on this page, so most people see none.

**Technical.** Gamepad IDs include vendor and product codes (e.g. "Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)"), which are distinctive once exposed. The user-gesture requirement limits this.

**Exposes:** Gamepad API presence and connected controller count. · **APIs:** navigator.getGamepads

**Limitations:**
- Requires a button press before controllers appear.

**Defenses:** User-gesture gating in all browsers.

**Mitigations:**
- Disconnect controllers you are not using.

**Documented associations:** none

**Sources:** [Mitigating Browser Fingerprinting in Web Specifications](https://www.w3.org/TR/fingerprinting-guidance/)

## Storage & persistence

### Client-side storage mechanisms

`storage-mechanisms` v1.0.0 · basic · Demonstrated technique · relevance **low** · stable

Which ways of saving data in your browser work here. A test value is saved, read back and deleted.

**How it works.** For each way websites can store data (cookies, local storage, a small database and a cache), the lab saves the word "probe", reads it back and deletes it immediately. No identifier is created.

**Technical.** - Cookies: sent to the server; partitioned for third parties in modern browsers.
  - localStorage / IndexedDB / Cache: persist until cleared, per origin (and per top-level site when partitioned).
  - sessionStorage: per tab, cleared when the tab closes.Trackers historically copied identifiers across all of them ("evercookie", Acar et al. 2014). This lab does not do that.

**Exposes:** Which storage mechanisms are available and writable. · **APIs:** document.cookie, localStorage, sessionStorage, indexedDB, CacheStorage, navigator.serviceWorker

**Limitations:**
- Cache API requires a secure context.
- Results inside private windows may differ.

**Defenses:** Browsers partition third-party storage (Firefox Total Cookie Protection, Safari ITP, Chromium storage partitioning).

**Mitigations:**
- Clear site data regularly or use automatic deletion on browser close.
- Prefer browsers that partition third-party storage.

**Documented associations:** Fingerprint (FingerprintJS) (uses, L1 Confirmed); State-level surveillance (uses, L3 Research)

**Sources:** [The Web Never Forgets: Persistent Tracking Mechanisms in the Wild (ACM CCS 2014)](https://securehomes.esat.kuleuven.be/~gacar/persistent/the_web_never_forgets.pdf) · [Tracking Prevention in WebKit](https://webkit.org/tracking-prevention/) · [Mitigating Browser Fingerprinting in Web Specifications](https://www.w3.org/TR/fingerprinting-guidance/)

### Storage API availability matrix

`storage-availability` v1.0.0 · basic · Demonstrated technique · relevance **low** · stable

Which ways of storing data exist in your browser. Nothing is saved by this check.

**How it works.** The page checks whether each storage feature exists and can be accessed, including an old database feature that only some browsers still have.

**Technical.** Access to localStorage can throw when storage is disabled, which is itself a signal. WebSQL's presence (removed from Chromium in 2022–23) distinguishes older builds; FingerprintJS checks openDatabase for this reason.

**Exposes:** Presence/accessibility flags. · **APIs:** localStorage, indexedDB, CacheStorage, StorageManager.getDirectory

**Limitations:**
- Presence does not mean writes succeed (see the temporary-storage test).

**Defenses:** None needed.

**Mitigations:**
- No action needed.

**Documented associations:** Fingerprint (FingerprintJS) (uses, L1 Confirmed)

**Sources:** [FingerprintJS open-source entropy sources (src/sources)](https://github.com/fingerprintjs/fingerprintjs/tree/master/src/sources)

### Cookie & storage policy hints

`storage-policy` v1.0.0 · advanced · Demonstrated technique · relevance **low** · stable

What your browser says about its cookie and storage rules for this page.

**How it works.** The page asks whether cookies are on, whether it has access to its own storage, and whether its data is kept permanently. These answers matter most for embedded trackers; as a normal page the lab only sees its own view.

**Technical.** These answers mainly matter in third-party iframes, where browsers that partition or block third-party storage return false from hasStorageAccess(). As a top-level page, this lab can only show the first-party view, which is why the result is an indicator.

**Exposes:** Cookie and storage-access policy indicators. · **APIs:** Document.hasStorageAccess, StorageManager.persisted, navigator.cookieEnabled

**Limitations:**
- First-party view only; third-party behaviour cannot be observed without a cross-site setup.

**Defenses:** Not applicable.

**Mitigations:**
- Use a browser that blocks or partitions third-party cookies by default.

**Documented associations:** none

**Sources:** [Tracking Prevention in WebKit](https://webkit.org/tracking-prevention/) · [Mitigating Browser Fingerprinting in Web Specifications](https://www.w3.org/TR/fingerprinting-guidance/)

### Storage quota estimate

`storage-quota` v1.0.0 · basic · Demonstrated technique · relevance **medium** · semi-stable · secure context

How much space your browser would let this site use. It often depends on your disk size.

**How it works.** The page asks how much storage it may use. Some browsers base this on your total disk size, which reveals roughly how big your disk is. Nothing is written.

**Technical.** Chromium derives the quota from total disk size (a share of it), which leaks a disk-size bucket. In private windows quotas are often much smaller, a known private-mode heuristic. Safari and Firefox bucket the value.

**Exposes:** Quota (bytes), usage, persistence state. · **APIs:** StorageManager.estimate, StorageManager.persisted

**Limitations:**
- Varies with free disk space over time in some browsers.

**Defenses:** Bucketed quotas (Safari, Firefox).

**Mitigations:**
- No practical action.

**Documented associations:** none

**Sources:** [Mitigating Browser Fingerprinting in Web Specifications](https://www.w3.org/TR/fingerprinting-guidance/)

### Service worker & partitioning-relevant APIs

`storage-partitioning` v2.0.0 · advanced · Speculative inference · relevance **low** · stable

Whether your browser keeps third-party data separate for each website, plus service-worker support. Hints only.

**How it works.** The page checks for features that browsers add when they keep embedded trackers from sharing data across sites. It cannot fully test this without a second website, so the result is an indication, not proof.

**Technical.** Partitioning keys third-party storage by top-level site, defeating classic cross-site cookie/localStorage tracking. The Storage Access API usually exists because the browser partitions or blocks third-party storage. API presence is still only an indicator.

**Exposes:** Presence of partitioning-related APIs. · **APIs:** Document.hasStorageAccess, CookieStore, Document.browsingTopics

**Limitations:**
- Inference only; actual partitioning behaviour cannot be verified without a cross-site setup.

**Defenses:** Not applicable.

**Mitigations:**
- Use a browser with third-party storage partitioning (default in Firefox, Safari, Brave, and Chromium-based browsers).

**Documented associations:** none

**Sources:** [Tracking Prevention in WebKit](https://webkit.org/tracking-prevention/) · [Mitigating Browser Fingerprinting in Web Specifications](https://www.w3.org/TR/fingerprinting-guidance/)

## Advanced & consistency

### Cross-signal consistency

`consistency` v1.0.0 · advanced · Demonstrated technique · relevance **medium** · stable

Checks whether your browser tells a consistent story. A "Windows" browser with a Mac-only graphics chip would be suspicious.

**How it works.** The lab compares answers it already collected: does the system named in the name tag match the platform, the graphics chip and the fonts? Spoofing tools often get some of these wrong.

**Technical.** Bot-management and fraud systems score contradictions because spoofing tools rarely change every layer consistently. Each check here is a simple rule; real systems use many more. Contradictions can also be legitimate (remote desktops, VMs, enterprise builds).

**Exposes:** A list of contradictions between signals. · **APIs:** —

**Limitations:**
- Rule-based; can misfire in VMs, remote desktops and new hardware.

**Defenses:** Using built-in, uniform protections avoids contradictions.

**Mitigations:**
- Avoid partial spoofing (e.g. UA-only changes); prefer uniform browser-level protections.

**Documented associations:** Google (researched, L3 Research); DataDome (uses, L4 Category)

**Sources:** [How New Headless Chrome & the CDP Signal Are Impacting Bot Detection](https://datadome.co/threat-research/how-new-headless-chrome-the-cdp-signal-are-impacting-bot-detection/) · [Cloak of Visibility: Detecting When Machines Browse a Different Web (IEEE S&P 2016)](https://research.google/pubs/cloak-of-visibility-detecting-when-machines-browse-a-different-web/)

### Canvas repeatability

`canvas-repeatability` v1.0.0 · advanced · Demonstrated technique · relevance **low** · volatile

Draws the same picture five times and checks whether every copy is identical.

**How it works.** If every copy is identical, the picture can be used to recognise you. If the copies differ, your browser is adding random noise on purpose to protect you.

**Technical.** Deterministic rendering gives identical digests, the precondition for canvas fingerprinting. Different digests within one page load indicate noise injection (Brave farbling, Safari Advanced Fingerprinting Protection, Firefox FPP, CanvasBlocker-type extensions). Noise that is stable per site and session (Brave) still looks identical here; this test detects per-read noise only.

**Exposes:** Per-render digests and a stability verdict. · **APIs:** CanvasRenderingContext2D.getImageData

**Limitations:**
- Cannot detect per-session noise that stays constant within a session.

**Defenses:** Canvas randomization.

**Mitigations:**
- Use a browser with canvas protections if renders are identical.

**Documented associations:** none

**Sources:** [Fingerprinting defenses 2.0](https://brave.com/privacy-updates/4-fingerprinting-defenses-2.0/) · [Private Browsing 2.0](https://webkit.org/?p=15697) · [The Web Never Forgets: Persistent Tracking Mechanisms in the Wild (ACM CCS 2014)](https://securehomes.esat.kuleuven.be/~gacar/persistent/the_web_never_forgets.pdf)

### Date parsing & serialization behavior

`date-behavior` v1.0.0 · advanced · Research concept · relevance **low** · stable

How your browser reads unclear dates and writes dates out. Browsers disagree on some cases.

**How it works.** The page gives the browser a list of dates written in unusual ways and records how it understands them, plus how it writes a date and your time zone's name.

**Technical.** The ECMAScript spec defines only the ISO format; everything else is implementation-defined, so V8, SpiderMonkey and JavaScriptCore differ (e.g. for "2026-1-2" or "01/02/26"). The timezone name in toString() is localized and reveals both timezone and locale data.

**Exposes:** Parsed timestamps (relative to UTC) and string formats. · **APIs:** Date.parse, Date.prototype.toString, Intl.DateTimeFormat

**Limitations:**
- Parsed local-time values shift with your timezone.

**Defenses:** Tor normalizes timezone to UTC.

**Mitigations:**
- No practical user action.

**Documented associations:** none

**Sources:** [Fingerprinting the Fingerprinters: Learning to Detect Browser Fingerprinting Behaviors (IEEE S&P 2021)](https://arxiv.org/pdf/2008.04480)

### Error stack format heuristic

`error-stack` v1.0.0 · advanced · Demonstrated technique · relevance **low** · stable

How your browser words error messages. Each browser has its own style.

**How it works.** The page triggers three harmless errors and records how the browser words them and how it lists where the error happened. File paths are removed.

**Technical.** V8 frames look like     at fn (file:line:col); SpiderMonkey and JavaScriptCore use fn@file:line:col, with different column conventions and messages. Spoofed user agents rarely fake these, so bot detection compares them with the claimed browser.

**Exposes:** Error messages and stack-format class. · **APIs:** Error.prototype.stack, Error.captureStackTrace

**Limitations:**
- Message wording can change between versions.

**Defenses:** Not practical to alter.

**Mitigations:**
- No action needed.

**Documented associations:** none

**Sources:** [Fingerprinting the Fingerprinters: Learning to Detect Browser Fingerprinting Behaviors (IEEE S&P 2021)](https://arxiv.org/pdf/2008.04480) · [How New Headless Chrome & the CDP Signal Are Impacting Bot Detection](https://datadome.co/threat-research/how-new-headless-chrome-the-cdp-signal-are-impacting-bot-detection/)

### Native function stringification shape

`native-tostring` v1.0.0 · advanced · Demonstrated technique · relevance **low** · stable

How built-in functions look when written out as text. Browsers format them slightly differently.

**How it works.** The page turns a few built-in functions into text and records their shape, such as line breaks and spacing, with names hidden.

**Technical.** V8 and JavaScriptCore print function max() { [native code] } on one line; SpiderMonkey prints it over three lines with indentation. Getters show as function get userAgent(). Spoofing tools that override functions often get this shape wrong, which is why integrity checks rely on it.

**Exposes:** String shapes of native and user functions. · **APIs:** Function.prototype.toString

**Limitations:**
- Mostly redundant with engine family.

**Defenses:** Not applicable.

**Mitigations:**
- No action needed.

**Documented associations:** none

**Sources:** [How New Headless Chrome & the CDP Signal Are Impacting Bot Detection](https://datadome.co/threat-research/how-new-headless-chrome-the-cdp-signal-are-impacting-bot-detection/)

### Selected prototype surface

`prototype-surface` v1.0.0 · advanced · Demonstrated technique · relevance **low** · semi-stable

How many properties some core browser objects have. Each browser version has its own count.

**How it works.** The page counts the properties of a few core browser objects and makes a short code from their names. The counts change with nearly every browser release.

**Technical.** Property sets change with nearly every release and differ between engines, so counts plus a digest pin the browser version precisely. CreepJS-style tools use such surfaces to detect spoofed versions. Extensions that patch prototypes also change the result.

**Exposes:** Property counts and name-list digests. · **APIs:** Object.getOwnPropertyNames

**Limitations:**
- Changes with every browser update.

**Defenses:** Keep updated.

**Mitigations:**
- Keep the browser updated.

**Documented associations:** none

**Sources:** [Fingerprinting the Fingerprinters: Learning to Detect Browser Fingerprinting Behaviors (IEEE S&P 2021)](https://arxiv.org/pdf/2008.04480)

### Third-party requests on this page

`third-party-requests` v1.0.0 · advanced · Demonstrated technique · relevance **low** · volatile

Lists every other website this page contacted. Trackers usually arrive this way. This lab should show none.

**How it works.** The browser keeps a list of everything a page loaded. The lab reads it and groups it by website. On a typical commercial site this list includes analytics, ads and bot-detection services.

**Technical.** On a typical commercial site this list contains analytics, tag managers, ad networks and fraud/bot scripts. It is the client-side view of tracker activity. Requests blocked by an extension do not appear. Activity on other websites cannot be observed from here; that would require network inspection or a browser extension.

**Exposes:** Origins this page contacted. · **APIs:** PerformanceResourceTiming

**Limitations:**
- Covers only this page and this session.
- Resource Timing buffer may be limited to 250 entries.

**Defenses:** Content blockers and tracking protection stop third-party requests.

**Mitigations:**
- Use tracking protection or a reputable content blocker.

**Documented associations:** none

**Sources:** [Online Tracking: A 1-million-site Measurement and Analysis (ACM CCS 2016)](https://www.cs.princeton.edu/~arvindn/publications/OpenWPM_1_million_site_tracking_measurement.pdf) · [Fingerprinting the Fingerprinters: Learning to Detect Browser Fingerprinting Behaviors (IEEE S&P 2021)](https://arxiv.org/pdf/2008.04480)

### Native function integrity

`integrity` v1.0.0 · advanced · Demonstrated technique · relevance **low** · stable

Checks whether built-in browser functions were replaced, as spoofing extensions and some bots do.

**How it works.** Built-in functions describe themselves in a standard way. If an extension or script has replaced one, its description usually changes. Real browser-level protections work differently and stay invisible here.

**Technical.** Native functions stringify as function x() { [native code] }. JavaScript overrides usually do not, unless carefully disguised. Overrides on the instance (instead of the prototype) are another tell. Browser-native protections (Brave, Firefox, Safari) change values inside the engine and pass this check.

**Exposes:** Whether common fingerprinting APIs were patched by page-level JavaScript. · **APIs:** Function.prototype.toString, Object.getOwnPropertyDescriptor

**Limitations:**
- Well-disguised overrides can pass these checks.
- Some legitimate extensions patch APIs.

**Defenses:** Not applicable.

**Mitigations:**
- Prefer browser-level protections over extensions that patch APIs.

**Documented associations:** none

**Sources:** [How New Headless Chrome & the CDP Signal Are Impacting Bot Detection](https://datadome.co/threat-research/how-new-headless-chrome-the-cdp-signal-are-impacting-bot-detection/)

### Automation indicators

`automation` v1.0.0 · advanced · Demonstrated technique · relevance **low** · stable

Signs that software, not a person, is driving the browser.

**How it works.** The lab looks for traces that automation tools leave behind, such as a raised automation flag, a missing browser object, an empty language list or a software-only graphics chip. A virtual machine can trigger some of these for real people.

**Technical.** Bot-management vendors document moving beyond navigator.webdriver to protocol-level side effects (e.g. CDP). These indicators are a teaching subset. Absence does not prove a human; presence does not prove a bot (VMs and remote desktops use software GPUs).

**Exposes:** Automation indicator hits. · **APIs:** navigator.webdriver, window properties

**Limitations:**
- Indicators, not proof.

**Defenses:** Not applicable.

**Mitigations:**
- No action needed.

**Documented associations:** Cloudflare (Bot Management, Turnstile) (uses, L4 Category); DataDome (uses, L2 Documented); Cloaking services & malicious redirectors (uses, L4 Category)

**Sources:** [How New Headless Chrome & the CDP Signal Are Impacting Bot Detection](https://datadome.co/threat-research/how-new-headless-chrome-the-cdp-signal-are-impacting-bot-detection/) · [Turnstile widget modes](https://developers.cloudflare.com/turnstile/concepts/widget/)

### Privacy protection indicators

`protection-indicators` v1.0.0 · advanced · Speculative inference · relevance **low** · semi-stable

A summary of signs that your browser actively protects you (noise, blocking, uniform values).

**How it works.** The lab collects the protection signs from other checks: randomised images or audio, blocked read-backs, a UTC time zone, a blurry clock, a hidden graphics chip name and very few visible fonts. Each sign alone has innocent explanations.

**Technical.** Each indicator has innocent explanations (e.g. people really live in UTC; GPUs without the debug extension). The combination is suggestive, not conclusive. This lab does not claim to identify a specific browser or extension from these indicators.

**Exposes:** Which defenses appear active. · **APIs:** —

**Limitations:**
- Speculative combination of indicators; not proof of any product.

**Defenses:** Not applicable.

**Mitigations:**
- See the Privacy Assessment for recommendations.

**Documented associations:** none

**Sources:** [Fingerprinting defenses 2.0](https://brave.com/privacy-updates/4-fingerprinting-defenses-2.0/) · [Understanding browser fingerprinting (Tor Browser manual)](https://tb-manual.torproject.org/anti-fingerprinting/) · [Resist Fingerprinting](https://support.mozilla.org/en-US/kb/resist-fingerprinting) · [Private Browsing 2.0](https://webkit.org/?p=15697)

### Content-blocker detection (bait elements)

`content-blockers` v1.0.0 · advanced · Demonstrated technique · relevance **medium** · stable

Detects whether an ad or content blocker is hiding things on the page.

**How it works.** The page adds invisible boxes with ad-like names and checks whether something hides them. Blockers hide such boxes, which gives them away. The boxes are removed straight after.

**Technical.** FingerprintJS's dom_blockers source uses lists of selectors from regional filter lists to infer which lists are active, and therefore hints at region. Blockers are common (a large minority of users), so presence alone is a modest signal.

**Exposes:** Whether cosmetic filtering is active. · **APIs:** DOM layout

**Limitations:**
- Only cosmetic filtering is tested; network blocking is not.

**Defenses:** uBlock Origin scriptlets can defeat bait detection.

**Mitigations:**
- Keep using a reputable content blocker; its privacy benefit outweighs this signal.

**Documented associations:** Fingerprint (FingerprintJS) (uses, L1 Confirmed)

**Sources:** [FingerprintJS open-source entropy sources (src/sources)](https://github.com/fingerprintjs/fingerprintjs/tree/master/src/sources)

### Injected extension objects

`extension-indicators` v1.0.0 · advanced · Demonstrated technique · relevance **medium** · stable

Some extensions (crypto wallets, developer tools, writing helpers) add things to every page that sites can see.

**How it works.** The page looks for a short list of objects and markers that popular extensions add to every website, such as a crypto wallet connector. Most extensions add nothing visible.

**Technical.** Injected objects are visible to all page scripts. Malicious "drainer" pages target wallet users this way. Detection here is inference: other extensions can mimic these objects, and many extensions inject nothing. This lab cannot detect every extension.

**Exposes:** Which of a small set of extensions appear present. · **APIs:** window properties, DOM

**Limitations:**
- Small probe list; cannot detect most extensions.
- Objects can be mimicked.

**Defenses:** Firefox randomizes extension UUIDs (for resource probing); fewer extensions = fewer markers.

**Mitigations:**
- Minimize extensions; use a separate browser profile for crypto wallets.

**Documented associations:** none

**Sources:** [Mitigating Browser Fingerprinting in Web Specifications](https://www.w3.org/TR/fingerprinting-guidance/)

## Interaction (opt-in)

### Pointer movement dynamics

`pointer-dynamics` v1.0.0 · advanced · Demonstrated technique · relevance **low** · volatile · user-initiated

How you move your mouse (speed, smoothness, curves) can tell a person from a script.

**How it works.** Only on the pad in the Learning center, and only after you press Start, the lab records where your pointer moves and how fast. The data stays on the page until you reset it.

**Technical.** Bot-defense products score pointer telemetry: humans produce curved, accelerating, jittery paths, while naive bots produce straight or replayed ones. Research on behavioral biometrics shows partial re-identification is possible, but it is noisy and context-dependent.

**Exposes:** Movement statistics from the lab pad only. · **APIs:** PointerEvent

**Limitations:**
- Highly variable between sessions and devices.

**Defenses:** None practical.

**Mitigations:**
- Be aware that checkout and login pages may collect such telemetry.

**Documented associations:** Cloudflare (Bot Management, Turnstile) (uses, L4 Category)

**Sources:** [Turnstile widget modes](https://developers.cloudflare.com/turnstile/concepts/widget/) · [How New Headless Chrome & the CDP Signal Are Impacting Bot Detection](https://datadome.co/threat-research/how-new-headless-chrome-the-cdp-signal-are-impacting-bot-detection/) · [Rethinking Fingerprinting: An Assessment of Behavior-based Methods (PoPETs 2025)](https://petsymposium.org/popets/2025/popets-2025-0158.pdf)

### Keystroke timing

`keystroke-timing` v1.0.0 · advanced · Demonstrated technique · relevance **low** · volatile · user-initiated

Your typing rhythm: how long you hold keys and the pauses between them.

**How it works.** Only in the Learning center text box, after you press Start, the lab records when keys go down and up. It never records which keys you pressed.

**Technical.** "Dwell" (press→release) and "flight" (release→next press) times form a rhythm used in continuous-authentication and fraud products. Rhythm varies with keyboard, fatigue and language.

**Exposes:** Timing statistics only. · **APIs:** KeyboardEvent

**Limitations:**
- Requires enough keystrokes; noisy.

**Defenses:** Password managers avoid typing on login forms.

**Mitigations:**
- Use a password manager for logins.

**Documented associations:** none

**Sources:** [Turnstile widget modes](https://developers.cloudflare.com/turnstile/concepts/widget/)

## Network & server-only

### HTTP request headers (Accept, Accept-Language, User-Agent)

`srv-http-headers` v1.0.0 · basic · Demonstrated technique · relevance **medium** · semi-stable · server-only

Details your browser sends with every request, before any script runs.

**How it works.** With every page and image it loads, your browser sends small labels: its name, the languages and file types it accepts, and more. Their wording and order differ between browsers. Only the server sees them.

**Technical.** Header order and casing are passive fingerprints usable on the very first request. EFF Cover Your Tracks includes HTTP Accept headers in its measurements.

**Exposes:** Header values and ordering. · **APIs:** —

**Limitations:**
- Not visible to client-side JavaScript.

**Defenses:** Tor Browser normalizes headers.

**Mitigations:**
- Use browsers that normalize headers (Tor/Mullvad Browser).

**Documented associations:** Electronic Frontier Foundation (Cover Your Tracks) (measures, L1 Confirmed)

**Sources:** [About Cover Your Tracks](https://coveryourtracks.eff.org/about) · [HTTP Client hints](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Client_hints)

### Client Hint request headers

`srv-client-hint-headers` v1.0.0 · basic · Demonstrated technique · relevance **medium** · semi-stable · server-only

Extra device details some browsers send when a site asks.

**How it works.** Chrome-family browsers can send extra labels with each request, like platform and browser version, and more when a site asks for them. Only the server sees these.

**Technical.** Unlike the JS API, header hints are observable by servers that never run scripts, including on navigation requests after opt-in.

**Exposes:** Client Hint header values. · **APIs:** —

**Limitations:**
- Chromium-only.

**Defenses:** Not implemented in Firefox/Safari.

**Mitigations:**
- No direct user control.

**Documented associations:** none

**Sources:** [HTTP Client hints](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Client_hints) · [User-Agent Client Hints API](https://developer.mozilla.org/en-US/docs/Web/API/User-Agent_Client_Hints_API)

### IP address & network metadata

`srv-ip` v1.0.0 · basic · Demonstrated technique · relevance **high** · semi-stable · server-only

Your internet address, which reveals your provider and rough location to every server you visit.

**How it works.** Every connection carries your public IP address. Databases map it to your internet provider, country and city, and flag VPNs and data centres. Combined with your time zone it can reveal a VPN.

**Technical.** IP is not a browser fingerprint but is combined with one in nearly every identification system. Comparing IP geolocation with browser timezone/language is a common VPN/proxy indicator.

**Exposes:** Public IP, ISP/ASN, approximate location. · **APIs:** —

**Limitations:**
- Not available to client-side JavaScript without contacting a server; this lab does not.

**Defenses:** VPN, Tor, iCloud Private Relay.

**Mitigations:**
- Use a reputable VPN or Tor when IP privacy matters; remember timezone and language may still reveal region.

**Documented associations:** Google (permits, L3 Research); Cloaking services & malicious redirectors (uses, L3 Research)

**Sources:** [Cloak of Visibility: Detecting When Machines Browse a Different Web (IEEE S&P 2016)](https://research.google/pubs/cloak-of-visibility-detecting-when-machines-browse-a-different-web/) · [Biggest privacy erosion in 10 years? On Google's policy change towards fingerprinting](https://blog.lukaszolejnik.com/biggest-privacy-erosion-in-10-years-on-googles-policy-change-towards-fingerprinting/)

### TLS ClientHello fingerprint (JA3/JA4)

`srv-tls` v1.0.0 · advanced · Demonstrated technique · relevance **medium** · semi-stable · server-only

How your browser starts an encrypted connection identifies its software, before any page loads.

**How it works.** Before anything else, your browser and the server agree on encryption. The list of options your browser offers, and their order, forms a pattern (called JA3 or JA4) that identifies the browser or tool.

**Technical.** Separates browsers from scripts (curl, Python, Go) and detects UA spoofing. Chrome randomizes extension order, which motivated JA4's sorted format.

**Exposes:** TLS client implementation fingerprint. · **APIs:** —

**Limitations:**
- Requires a TLS-terminating server.

**Defenses:** Not user-controllable.

**Mitigations:**
- No user action.

**Documented associations:** Cloudflare (Bot Management, Turnstile) (uses, L2 Documented)

**Sources:** [JA3/JA4 fingerprint](https://developers.cloudflare.com/bots/additional-configurations/ja3-ja4-fingerprint/) · [JA4+ network fingerprinting](https://github.com/FoxIO-LLC/ja4)

### HTTP/2 & HTTP/3 behaviour

`srv-http2-http3` v1.0.0 · advanced · Demonstrated technique · relevance **low** · semi-stable · server-only

Low-level habits of how your browser talks to servers.

**How it works.** Modern connections use HTTP/2 or HTTP/3, and each browser sets them up with slightly different settings and ordering. Servers can recognise the browser family from that pattern.

**Technical.** Akamai researchers published an HTTP/2 fingerprint format based on more than 10 million connections (Black Hat EU 2017).

**Exposes:** Protocol implementation fingerprint. · **APIs:** —

**Limitations:**
- Requires server-side protocol access.

**Defenses:** Not user-controllable.

**Mitigations:**
- No user action.

**Documented associations:** Akamai (researched, L2 Documented)

**Sources:** [Passive Fingerprinting of HTTP/2 Clients (Black Hat Europe 2017)](https://www.blackhat.com/docs/eu-17/materials/eu-17-Shuster-Passive-Fingerprinting-Of-HTTP2-Clients.pdf)

### TCP/IP stack characteristics

`srv-tcp` v1.0.0 · advanced · Demonstrated technique · relevance **low** · semi-stable · server-only

Your operating system's network habits.

**How it works.** The very first network packet from your device carries settings chosen by your operating system. Servers can guess the system from them, and spot when it does not match what the browser claims.

**Technical.** A Windows UA arriving with a Linux TCP signature suggests a proxy, VPN endpoint or bot infrastructure.

**Exposes:** OS network-stack signature. · **APIs:** —

**Limitations:**
- Requires packet-level access.

**Defenses:** VPNs replace it with the VPN server's stack.

**Mitigations:**
- No user action.

**Documented associations:** none

**Sources:** [p0f v3 passive OS fingerprinting](https://lcamtuf.coredump.cx/p0f3/)

### Cache-based identifiers (ETag, HSTS, favicon)

`srv-cache-tracking` v1.0.0 · advanced · Demonstrated technique · relevance **high** · semi-stable · server-only

Browser caches have been misused to hide identifiers that survive deleting cookies.

**How it works.** A server can tuck a unique tag into data your browser caches (images, security settings or site icons) and read it back on your next visit. Modern browsers keep these caches separate per site, which blocks most of it.

**Technical.** ETag respawning was documented in 2011 (Ayenson et al.). Favicon-cache tracking surviving incognito was shown at NDSS 2021. Browsers have since partitioned HTTP, HSTS and favicon caches by top-level site. These require a cooperating server; this lab does not implement them.

**Exposes:** Server-planted identifiers in caches. · **APIs:** —

**Limitations:**
- Largely mitigated by cache partitioning.

**Defenses:** Cache partitioning in modern browsers.

**Mitigations:**
- Clear cache together with cookies; keep browser updated.

**Documented associations:** KISSmetrics (uses, L3 Research)

**Sources:** [Flash Cookies and Privacy II: Now with HTML5 and ETag Respawning](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=1898390) · [Tales of Favicons and Caches: Persistent Tracking in Modern Browsers (NDSS 2021)](https://www.ndss-symposium.org/ndss-paper/tales-of-favicons-and-caches-persistent-tracking-in-modern-browsers/) · [The Web Never Forgets: Persistent Tracking Mechanisms in the Wild (ACM CCS 2014)](https://securehomes.esat.kuleuven.be/~gacar/persistent/the_web_never_forgets.pdf)

### Cross-visit & behavioral correlation (server-side)

`srv-cross-visit` v1.0.0 · advanced · Demonstrated technique · relevance **high** · semi-stable · server-only

Servers link your visits over time by comparing what they saw before.

**How it works.** A site can keep a history of what it observed about you (fingerprint, address, cookies, behaviour) and match each new visit against it, even when a few details have changed. That turns single visits into a profile.

**Technical.** Fingerprints drift (browser updates, new fonts, a new monitor), so production systems link a new fingerprint to an old profile when most components match or when another identifier (cookie, account, IP) bridges the gap. Research on fingerprint evolution (e.g. Vastel et al.) studies exactly this. It requires server-side storage and event history; this lab stores nothing. The Comparison page lets you do the same comparison locally and explicitly.

**Exposes:** Visit history and linkage, on the server. · **APIs:** —

**Limitations:**
- Requires server-side history; not observable from the browser.

**Defenses:** Randomization (Brave), uniformity (Tor), clearing cookies together with changing IP, separate browser profiles.

**Mitigations:**
- Use separate browser profiles or containers for unrelated activities.
- Combine tracking protection with storage clearing.

**Documented associations:** none

**Sources:** [The Web Never Forgets: Persistent Tracking Mechanisms in the Wild (ACM CCS 2014)](https://securehomes.esat.kuleuven.be/~gacar/persistent/the_web_never_forgets.pdf) · [Fingerprinting the Fingerprinters: Learning to Detect Browser Fingerprinting Behaviors (IEEE S&P 2021)](https://arxiv.org/pdf/2008.04480) · [Hiding in the Crowd: an Analysis of the Effectiveness of Browser Fingerprinting at Large Scale (WWW 2018)](https://hal.inria.fr/hal-01718234) · [Beyond the Crawl: Unmasking Browser Fingerprinting in Real User Interactions](https://arxiv.org/html/2502.01608v1)

### Localhost probing & web-to-app bridges

`srv-localhost` v1.0.0 · advanced · Demonstrated technique · relevance **medium** · semi-stable · server-only

Some scripts have contacted programs on your own computer or phone to recognise or link you.

**How it works.** A page can try to reach programs running on your own device. In 2020 a fraud script checked for remote-control software this way, and in 2025 a social media tracker passed IDs to its phone apps. This lab does not do this.

**Technical.** In 2020, a ThreatMetrix script on eBay probed remote-desktop ports. In 2025 the "Local Mess" disclosure showed Meta Pixel passing identifiers to Android apps through localhost via WebRTC. Browsers are rolling out Local Network Access restrictions. This lab does not probe localhost.

**Exposes:** Locally running software / cross-context identifiers. · **APIs:** —

**Limitations:**
- Deliberately not implemented here.

**Defenses:** Local Network Access permission (Chromium), Brave localhost blocking, uBlock Origin.

**Mitigations:**
- Keep the browser updated; consider blockers that prevent localhost requests.

**Documented associations:** Meta (Meta Pixel) (uses, L3 Research); LexisNexis ThreatMetrix (uses, L3 Research)

**Sources:** [Why is This Website Port Scanning me?](https://nullsweep.com/why-is-this-website-port-scanning-me/) · [eBay port scans your PC](https://www.theregister.com/2020/05/26/ebay_port_scans_your_pc/) · [Local Mess: covert web-to-app tracking via localhost on Android](https://localmess.github.io/)

### Script-less CSS fingerprinting

`css-scriptless` v1.0.0 · advanced · Demonstrated technique · relevance **high** · stable · server-only

Turning off JavaScript does not stop fingerprinting: a stylesheet alone can make your browser reveal its traits to a server.

**How it works.** A stylesheet contains rules like @media (min-width: 1920px), @supports (…) and font fallbacks that each load a different background image URL. Which URLs the browser requests (visible in the server's logs) reveals screen size, supported features, fonts and settings. This works in pages with JavaScript disabled and even in some e-mail clients.

**Technical.** Trampert et al. (NDSS 2025, "Cascading Spy Sheets") distinguished 1152 of 1176 (97.95%) tested browser/OS combinations without JavaScript. The measurement happens in the server logs, so this static lab can explain it but not observe it. The client-side counterpart is the Extended media query matrix test.

**Exposes:** Feature and setting matches, via server request logs. · **APIs:** CSS @media, CSS @supports, CSS @font-face

**Limitations:**
- Requires server-side logging of resource requests.

**Defenses:** Tor Browser "Safest" mode; e-mail clients that proxy or block remote content.

**Mitigations:**
- Block remote content in e-mail.
- Use Tor Browser's Safest mode for high-risk browsing.

**Documented associations:** none

**Sources:** [Cascading Spy Sheets: Exploiting the Complexity of Modern CSS for Email and Browser Fingerprinting (NDSS 2025)](https://www.ndss-symposium.org/wp-content/uploads/2025-s238-paper.pdf)

