# Technique Reference

Generated from the test registry (catalogue 2026.10.19-2, 93 techniques). Do not edit by hand: run `node scripts/generate-docs.mjs`.

## Browser & environment

### User-Agent string

`user-agent` v1.0.0 · basic · Demonstrated technique · relevance **high** · semi-stable

The text your browser uses to introduce itself: browser name, version and operating system.

**How it works.** Every HTTP request carries a User-Agent header, and scripts can read navigator.userAgent. Different browsers, versions and OSes produce different strings, which splits users into groups.

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

A newer, structured way for Chromium browsers to describe themselves: brand, major version, platform and mobile flag.

**How it works.** Reads the low-entropy part of navigator.userAgentData: brands, mobile and platform. These are the same values Chromium sends by default as request headers. High-entropy values are a separate, opt-in test.

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

Extra Client Hints detail: exact OS version, CPU architecture, device model and full browser versions. Read only when you click Run.

**How it works.** Calls navigator.userAgentData.getHighEntropyValues() for platformVersion, architecture, bitness, model, fullVersionList, wow64 and formFactors. The values stay on this page.

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

The list of browser plugins and file types they handle. Historically a big fingerprint; today mostly a fixed PDF list.

**How it works.** Reads navigator.plugins (name, filename, description) and navigator.mimeTypes.

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

Whether the browser shows PDF files itself.

**How it works.** Reads navigator.pdfViewerEnabled, checks for the application/pdf MIME handler, and asks <object>/<embed> support for PDF via feature checks (no document is loaded).

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

Old navigator properties such as platform, vendor and productSub.

**How it works.** Reads navigator.platform, vendor, product, productSub, oscpu and buildID.

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

The languages you have chosen in your browser, in order of preference.

**How it works.** navigator.language and navigator.languages mirror the Accept-Language request header.

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

Your timezone and how your browser formats dates and numbers.

**How it works.** Intl.DateTimeFormat().resolvedOptions() returns the IANA timezone (e.g. Europe/Stockholm), locale, calendar and numbering system. Date.getTimezoneOffset() gives the UTC offset.

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

Simple on/off settings: cookies enabled, online status, PDF viewer, Do Not Track, Global Privacy Control.

**How it works.** Reads cookieEnabled, onLine, pdfViewerEnabled, doNotTrack and globalPrivacyControl.

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

A flag that is true when the browser is being remote-controlled by automation software.

**How it works.** The WebDriver standard requires navigator.webdriver to be true under automation (Selenium, Puppeteer, Playwright).

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

Whether your device has a touchscreen and how many touch points it supports.

**How it works.** Reads navigator.maxTouchPoints and checks for TouchEvent and ontouchstart.

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

A guess at your real browser engine based on how it behaves, not what it claims.

**How it works.** Combines feature probes (window.chrome, InstallTrigger, -moz- CSS, Error formats, productSub) into an engine guess and compares it with the User-Agent claim.

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

## Screen & display

### Screen resolution & color depth

`screen` v1.0.0 · basic · Demonstrated technique · relevance **medium** · stable

Your monitor size, the usable area and how many colors it shows.

**How it works.** Reads screen.width/height, availWidth/availHeight (excluding taskbar/dock), colorDepth and pixelDepth.

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

The size of the browser window and page area, and your zoom/pixel density.

**How it works.** Reads innerWidth/innerHeight, outerWidth/outerHeight, devicePixelRatio and visualViewport.

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

Whether your screen is in portrait or landscape and its natural orientation.

**How it works.** Reads screen.orientation.type and angle.

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

What your display can do: wide color, HDR, pointer type, hover.

**How it works.** Evaluates CSS media queries color-gamut, dynamic-range, pointer, any-pointer, hover and monochrome via matchMedia().

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

Your browser draws a small picture. Tiny differences in how it draws text and shapes can tell devices apart.

**How it works.** A deterministic scene (gradient, text in two fonts, emoji, blended circles, a curve) is drawn on an off-screen <canvas>. The pixels are read with getImageData() and hashed locally with SHA-256. The scene is drawn several times and compared pixel by pixel.

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

What your graphics card is and which WebGL features it supports.

**How it works.** Creates a WebGL context, reads version strings and the extension list. If WEBGL_debug_renderer_info is exposed, also reads the unmasked vendor and renderer strings. Shader precision and numeric limits are a separate test. The context is released afterwards.

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

How precise your GPU's shader math is and how large its internal limits are.

**How it works.** Reads getShaderPrecisionFormat() for vertex and fragment shaders at low, medium and high precision (float and int), plus about 15 numeric limits such as MAX_TEXTURE_SIZE and MAX_VARYING_VECTORS. The context is released afterwards.

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

The settings your browser actually grants when a page asks for a WebGL drawing surface.

**How it works.** Requests WebGL 1 and WebGL 2 contexts with default options and reads getContextAttributes() (antialias, alpha, depth, stencil, premultipliedAlpha, powerPreference, desynchronized). Also checks whether a context is refused with failIfMajorPerformanceCaveat, which indicates software rendering. Contexts are released afterwards.

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

Emoji and special characters are drawn and their pixels hashed. Emoji artwork differs by operating system and version.

**How it works.** Draws a fixed set of emoji and Unicode glyphs (including recent emoji that older systems lack) onto a small canvas, reads the pixels and hashes them locally. Rendered twice to detect randomization.

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

Your graphics card draws a small 3D test image; the result is hashed.

**How it works.** A shader draws a deterministic triangle with a math-heavy color function. readPixels() extracts the result, which is hashed locally. Repeated renders are compared to detect randomization. The context is released afterwards.

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

The newest graphics API can describe your GPU and its limits.

**How it works.** Calls navigator.gpu.requestAdapter() and reads adapter.info (vendor, architecture), the feature set and numeric limits. No GPU work is executed.

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

Which fonts seem to be installed, guessed by measuring how text looks.

**How it works.** For each candidate font, text is measured in "Candidate", fallback for three fallbacks (monospace, serif, sans-serif). If width or height differs from the fallback alone, the candidate is probably available. The candidate list is fixed and shown below.

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

How wide and tall text is drawn in the default fonts, which depends on your OS fonts and font settings.

**How it works.** Uses CanvasRenderingContext2D.measureText() on a fixed pangram in the generic families (serif, sans-serif, monospace, system-ui, cursive) and on a set of emoji/symbols, recording width and bounding-box values.

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

Whether SVG graphics features exist, and how your browser measures SVG text and shapes.

**How it works.** Checks SVG interfaces (SVGGeometryElement, SVGTextContentElement, filters, SVGAnimationElement), then lays out a hidden SVG with text and a path and reads getComputedTextLength(), getBBox() and getTotalLength().

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

Exact sizes of transformed text on the page, measured to many decimal places.

**How it works.** Lays out a rotated, skewed text element off-screen and reads getClientRects(). Values like 113.97727966308594 depend on the layout engine and font rasterizer.

**Technical.** Layout uses floating-point math influenced by fonts, zoom and engine version. Unlike canvas, these APIs are rarely noised, so it is a useful complementary signal.

**Exposes:** High-precision layout geometry. · **APIs:** Element.getClientRects, Element.getBoundingClientRect

**Limitations:**
- Changes with page zoom.

**Defenses:** Firefox RFP rounds some values.

**Mitigations:**
- No practical user action.

**Documented associations:** none

**Sources:** [Mitigating Browser Fingerprinting in Web Specifications](https://www.w3.org/TR/fingerprinting-guidance/)

## CSS & preferences

### Accessibility & appearance preferences

`user-preferences` v1.0.0 · basic · Demonstrated technique · relevance **low** · semi-stable

Dark mode, reduced motion, high contrast and similar settings you chose in your OS.

**How it works.** Evaluates prefers-color-scheme, prefers-reduced-motion, prefers-contrast, forced-colors, prefers-reduced-transparency and inverted-colors.

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

A wide sweep of CSS media queries: scripting, display mode, update rate, resolution and more.

**How it works.** Evaluates about 20 media features with matchMedia(), including scripting, update, overflow-block, display-mode, prefers-reduced-data, video-dynamic-range, grid, resolution buckets in dppx and aspect-ratio buckets.

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

Which modern CSS features your browser supports, which roughly reveals the browser and version.

**How it works.** Calls CSS.supports() for a fixed list of properties and selectors introduced at different times.

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

Special CSS color names that can take values from your OS theme (such as your accent color), plus default font and scrollbar styles.

**How it works.** Applies keywords such as AccentColor, Highlight, ButtonFace and Canvas to a hidden element and reads getComputedStyle().color. Also reads computed defaults: the default font family and size, a default <button> font, and the scrollbar width of an overflowing element.

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

Your browser silently processes a synthetic sound. Tiny numeric differences in the result can distinguish setups.

**How it works.** An OfflineAudioContext renders 5,000 samples of a 10 kHz triangle wave through a DynamicsCompressor, entirely in memory. No speakers or microphone are involved. A sum over part of the output and a digest of sample values are computed, and the render is repeated to detect randomization.

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

**How it works.** Reads speechSynthesis.getVoices() (name, language, local or network voice). No speech is played.

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

Which audio and video formats your browser says it can play.

**How it works.** Calls HTMLMediaElement.canPlayType() and MediaSource.isTypeSupported() for a fixed list of codecs.

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

Which camera/microphone/screen-capture APIs exist. No devices are listed or counted.

**How it works.** Checks for navigator.mediaDevices, getUserMedia, getDisplayMedia, enumerateDevices, selectAudioOutput and reads getSupportedConstraints(), which lists constraint names the browser understands. enumerateDevices() is never called, and no permission is requested.

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

What the browser's audio engine reports: sample rate, latency, channel count and available audio features.

**How it works.** Creates an AudioContext (which stays suspended because no user gesture is involved, so nothing plays), reads sampleRate, baseLatency, outputLatency, destination.maxChannelCount and state, checks for AudioWorklet and other audio interfaces, then closes the context.

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

Roughly how many processor threads and how much memory the browser reports.

**How it works.** Reads navigator.hardwareConcurrency and navigator.deviceMemory.

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

Your connection type and rough speed estimate.

**How it works.** Reads navigator.connection: effectiveType, downlink, rtt, saveData.

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

Whether advanced computation features are available.

**How it works.** Validates tiny WebAssembly modules for SIMD and threads support, and checks SharedArrayBuffer and crossOriginIsolated.

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

How precise the browser's clock is and how much it jitters. Privacy modes make it deliberately coarse.

**How it works.** Calls performance.now() in a bounded loop (max 20,000 iterations), records the smallest observed step and the distribution of step sizes (median and standard deviation = jitter).

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

A tiny, fixed calculation is timed. Faster devices finish sooner.

**How it works.** Runs exactly 300,000 iterations of simple math three times and reports the median time. Total work is a few milliseconds.

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

Some math functions give slightly different last digits on different browsers and systems.

**How it works.** Evaluates functions such as Math.tan(-1e300), Math.acosh(1e308) and Math.expm1(1).

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

Whether the browser exposes the Battery Status API. Your battery level is not read.

**How it works.** Checks only whether navigator.getBattery and BatteryManager exist. getBattery() is not called, so level and charging state are never read.

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

How much JavaScript memory the browser reports this page may use.

**How it works.** Reads the non-standard performance.memory (Chromium): jsHeapSizeLimit, totalJSHeapSize, usedJSHeapSize. Checks whether performance.measureUserAgentSpecificMemory() exists (it requires cross-origin isolation; it is not called).

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

Which WebAssembly language features the engine supports.

**How it works.** Builds seven tiny WebAssembly modules as plain byte arrays, one per feature (sign extension, saturating float-to-int, bulk memory, multi-value, reference types, tail calls, SIMD), and checks each with WebAssembly.validate(). Validation only parses; no code is compiled into a running instance or executed.

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

Your keyboard layout (e.g. Swedish, German, French) without you pressing any key.

**How it works.** navigator.keyboard.getLayoutMap() maps physical key codes to the characters your layout produces. We read a handful of keys that differ between layouts.

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

Which powerful browser features exist (location, notifications, clipboard, Bluetooth…). Existing is not the same as being exposed.

**How it works.** Checks only whether objects such as navigator.geolocation, Notification, navigator.clipboard, navigator.serviceWorker, RTCPeerConnection, navigator.gpu, navigator.bluetooth exist. Nothing is called.

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

Which permissions you have previously granted or denied for this site. Checking does not show any prompt.

**How it works.** Calls navigator.permissions.query() for common permission names. This API never prompts; it only reports granted, denied or prompt.

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

Which newer JavaScript features exist, which narrows the browser version.

**How it works.** Checks for ~20 globals introduced in different releases (e.g. scheduler, navigation, CompressionStream, EyeDropper, Sanitizer).

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

Whether WebRTC (real-time audio/video/data) is exposed, and which codecs it advertises. No connection is made and no network candidates are collected.

**How it works.** Checks for RTCPeerConnection, RTCDataChannel, RTCRtpTransceiver and insertable-streams interfaces, and reads RTCRtpSender.getCapabilities() codec lists. No peer connection is created.

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

Whether APIs for sensors, foldable-screen posture, multi-screen setups and on-screen keyboards exist. Nothing is read from sensors.

**How it works.** Checks presence of navigator.devicePosture, DeviceOrientationEvent, DeviceMotionEvent, Generic Sensor classes (Accelerometer, Gyroscope, AmbientLightSensor…), navigator.virtualKeyboard, getScreenDetails and viewport segments. No sensor is started and no event listener is attached.

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

Whether passkeys / Web Authentication are available, and whether a built-in authenticator (Touch ID, Windows Hello) is present. No credential is requested.

**How it works.** Checks PublicKeyCredential, navigator.credentials, PasswordCredential and IdentityCredential (FedCM), and calls the prompt-free capability queries isUserVerifyingPlatformAuthenticatorAvailable(), isConditionalMediationAvailable() and getClientCapabilities() where present.

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

Which observer and event APIs the browser implements, plus the performance entry types it records.

**How it works.** Checks for observer classes (ResizeObserver, IntersectionObserver, MutationObserver, ReportingObserver, PressureObserver…), event constructors and handler properties, and reads PerformanceObserver.supportedEntryTypes.

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

Which HTML elements, attributes and input types the browser supports.

**How it works.** Checks for features such as <dialog>, the popover and inert attributes, declarative shadow DOM, custom elements and document.fonts, and tests which <input type> values are kept (date, color, month, week, datetime-local, range) using detached elements.

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

Whether this page runs in a secure context and how strongly it is isolated from other sites.

**How it works.** Reads isSecureContext, crossOriginIsolated, originAgentCluster, the page protocol, and the features allowed by the Permissions Policy (document.featurePolicy / permissionsPolicy where exposed).

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

Which permission names and permission-related functions the browser recognizes. No permission is requested.

**How it works.** Calls navigator.permissions.query() with ~25 permission names and records only whether each name is recognized (a TypeError means unknown). Also checks for Permissions.request/revoke, Notification.requestPermission and the <permission> element.

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

Checks whether WebRTC would reveal your local network address. Runs only when you click it, and contacts no server.

**How it works.** Creates an RTCPeerConnection with no STUN/TURN servers, so no network request leaves your device. It gathers host ICE candidates and checks whether they are real IPs or obfuscated .local mDNS names. Addresses are not stored or exported unless you choose to export raw data.

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

## Storage & persistence

### Client-side storage mechanisms

`storage-mechanisms` v1.0.0 · basic · Demonstrated technique · relevance **low** · stable

Checks which ways of saving data in your browser work here. A temporary test value is written, read back and deleted.

**How it works.** For cookies, localStorage, sessionStorage, IndexedDB and the Cache API, the lab writes the value probe under the key fplab-probe, reads it back, then deletes it. Service Worker support is checked but no worker is registered.

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

Which storage technologies exist in this browser. Nothing is written by this test.

**How it works.** Checks presence (and access without exceptions) of localStorage, sessionStorage, indexedDB, caches, cookieStore, the Origin Private File System (navigator.storage.getDirectory), Storage Buckets, Shared Storage, and the legacy WebSQL openDatabase.

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

What the browser reveals about its cookie and storage policy for this page.

**How it works.** Reads navigator.cookieEnabled, asks document.hasStorageAccess() (no prompt), checks for requestStorageAccess, and reads navigator.storage.persisted(). In a first-party context like this page, storage access is normally granted.

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

How much space the browser would let this site use. It is often derived from your disk size.

**How it works.** Calls navigator.storage.estimate() and reports the quota and current usage. Nothing is written.

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

Service worker support plus hints about whether your browser keeps third-party storage separate per website. Indicators only, not proof.

**How it works.** Checks navigator.serviceWorker (and whether this page is controlled by one; none is registered), SharedWorker, BroadcastChannel, the Storage Access API (document.hasStorageAccess), cookieStore, and the ad-related Topics and Protected Audience APIs. Measuring partitioning reliably requires a cross-site test server, which this static app does not use.

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

Checks whether your browser tells a consistent story, e.g. a "Windows" browser with a Mac-only graphics chip would be suspicious.

**How it works.** Compares results already measured: the UA OS claim against navigator.platform, Client Hints platform, the WebGL renderer and detected fonts, and the inferred engine against the claimed one.

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

Draws the same canvas image five times and checks whether every copy is pixel-identical.

**How it works.** Renders a fixed scene (text, gradient, arcs) five times on fresh canvases, hashes each result locally with SHA-256, and compares them. Also counts how many bytes differ from the first render.

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

How the browser parses ambiguous date strings and prints dates. Engines disagree on several cases.

**How it works.** Parses a fixed list of ambiguous strings with Date.parse() (date-only vs date-time ISO, slashes, two-digit years, month names, invalid input) and records the results, plus the shape of Date.prototype.toString() and the long timezone name.

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

How the JavaScript engine formats error messages and stack traces. Each engine has its own style.

**How it works.** Triggers three harmless errors (reading a property of null, calling an undefined value, an invalid array length), records their messages, and classifies the stack-frame format. File paths are stripped. Also checks Error.captureStackTrace and Error.stackTraceLimit.

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

How built-in functions look when converted to text. Engines format them slightly differently.

**How it works.** Converts several functions to strings: a native method (Math.max), a native getter, a bound function, a class and an arrow function, and records the shape (whitespace, newlines, naming) with names masked.

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

How many properties key browser objects (Navigator, Document, HTMLElement…) have. Every browser version has its own count.

**How it works.** Counts Object.getOwnPropertyNames() on the prototypes of Navigator, Document, HTMLElement, Element, Screen, CanvasRenderingContext2D and Window, and hashes the sorted name lists. Global variables added by pages or extensions are not counted.

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

Lists every request this page made to other websites, which is how trackers usually arrive. This lab should show zero.

**How it works.** Reads the browser's Resource Timing entries (performance.getEntriesByType("resource")) for this page and groups them by origin. Third-party = any origin other than this site.

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

Checks whether built-in browser functions were replaced, as spoofing extensions and some automation tools do.

**How it works.** Inspects Function.prototype.toString output and property descriptors of getters like navigator.userAgent, HTMLCanvasElement.prototype.toDataURL and WebGLRenderingContext.prototype.getParameter.

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

Signs that the browser is driven by automation (Selenium, Puppeteer, Playwright) rather than a person.

**How it works.** Combines navigator.webdriver, "HeadlessChrome" in the UA, empty language lists, zero outer window size, software GPU renderers, known automation globals (cdc_*, __playwright*), and permission-state inconsistencies.

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

Summarizes signs that your browser actively protects against fingerprinting (noise, blocking, uniform values).

**How it works.** Reads the protection indicators of earlier tests: randomized canvas/WebGL/audio output, blocked read-backs, UTC timezone, coarse timers, a masked WebGL renderer and very short font lists.

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

Detects whether a content/ad blocker hides elements that look like ads.

**How it works.** Inserts invisible elements with ad-like class names (adsbox, ad-banner…) and checks whether they get hidden by cosmetic filter rules. They are removed immediately.

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

Some extensions (crypto wallets, developer tools, writing assistants) add objects to every page. Those can be seen.

**How it works.** Checks for well-known injected globals and DOM markers: window.ethereum, window.solana, React/Redux/Vue DevTools hooks, Grammarly and Dark Reader markers.

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

How you move your mouse (speed, smoothness, curvature) can tell a human from a script.

**How it works.** Only inside the Learning Center pad, and only after you press Start, the lab records pointer coordinates and timestamps in memory and computes speed, variability and direction change.

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

Your typing rhythm: how long you hold keys and the gaps between them.

**How it works.** Only in the Learning Center text box, after you press Start, the lab records key-down/key-up timestamps. It never records which keys were pressed, and the text is not read.

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

Information your browser sends with every request before any script runs.

**How it works.** Each request carries User-Agent, Accept, Accept-Language, Accept-Encoding and others. Their values and order differ between browsers.

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

Chromium browsers send extra "hint" headers about the device when a site asks.

**How it works.** Low-entropy Sec-CH-UA* headers are sent by default; a site can request more with Accept-CH (e.g. Sec-CH-UA-Platform-Version, Sec-CH-UA-Model).

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

Every server sees your IP address, which reveals your internet provider and approximate location.

**How it works.** The TCP connection carries your public IP. Commercial databases map it to ISP/ASN, country/city and flags such as VPN, Tor or hosting provider.

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

**How it works.** The TLS ClientHello lists cipher suites, extensions, groups and ALPN. Hashing them yields JA3 or the newer JA4.

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

Low-level details of how your browser speaks HTTP/2 or HTTP/3 identify its implementation.

**How it works.** HTTP/2 SETTINGS values, WINDOW_UPDATE increments, PRIORITY frames and pseudo-header order form a passive fingerprint. QUIC transport parameters play a similar role for HTTP/3.

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

Your operating system's network stack has recognizable habits.

**How it works.** Initial TTL, TCP window size, MSS and option order in the SYN packet indicate the OS (p0f-style passive fingerprinting).

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

Browser caches have been abused to store hidden identifiers that survive cookie clearing.

**How it works.** ETag: a server returns a unique validator and reads it back from If-None-Match. HSTS: bits stored as HTTPS-only flags on subdomains. Favicon cache: bits stored by which favicons are cached.

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

Servers link your visits over time by comparing fingerprints, IPs, cookies and behaviour stored in their logs.

**How it works.** A server keeps a history of observations per visitor (fingerprint components, IP/ASN, cookies, login events, interaction telemetry) and matches each new visit against it, usually with fuzzy matching that tolerates some changed signals.

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

Some scripts have contacted services on your own computer or phone to fingerprint or link you.

**How it works.** Pages can attempt WebSocket/HTTP/WebRTC connections to localhost ports. Responses (or timing) reveal locally running software, or deliver identifiers to native apps.

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

