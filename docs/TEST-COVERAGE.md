# Test coverage

The required test list mapped to implemented techniques. Each id is checked by `tests/unit/coverage.test.mjs`. 93 techniques are implemented in total; the extras beyond this list are noted at the end.

## Browser identity

| # | Required test | Implemented as | Runs |
|---|---|---|---|
| 1 | User-Agent string | `user-agent` User-Agent string | automatically |
| 2 | Platform and vendor clues | `platform` Platform & legacy navigator properties | automatically |
| 3 | Language and locale | `languages` Preferred languages | automatically |
| 4 | Timezone configuration | `intl-timezone` Timezone & Intl locale | automatically |
| 5 | Browser capability flags | `browser-flags` Cookie, online & privacy flags | automatically |
| 6 | User-Agent Client Hints | `client-hints` User-Agent Client Hints (low entropy) | automatically |
| 7 | High-entropy Client Hints (opt-in local read) | `client-hints-high` High-entropy Client Hints (opt-in local read) | when you start it |
| 8 | Legacy plugins and MIME handlers | `plugins-mime` Legacy plugins & MIME handlers | automatically |
| 9 | PDF viewer and document support | `pdf-support` PDF viewer & document support | automatically |

## Screen and display

| # | Required test | Implemented as | Runs |
|---|---|---|---|
| 10 | Screen dimensions and color depth | `screen` Screen resolution & color depth<br>`viewport` Viewport, window & pixel ratio | automatically |
| 11 | Orientation and touch | `orientation` Screen orientation<br>`touch` Touch support | automatically |
| 12 | Display and color media features | `display-media` Display media features | automatically |
| 13 | Viewport and browser-chrome geometry | `viewport` Viewport, window & pixel ratio | automatically |

## Graphics

| # | Required test | Implemented as | Runs |
|---|---|---|---|
| 14 | Canvas rendering fingerprint | `canvas-2d` Canvas 2D rendering | automatically |
| 15 | WebGL renderer and capabilities | `webgl-info` WebGL renderer & capabilities | automatically |
| 16 | WebGPU availability | `webgpu` WebGPU adapter information | automatically |
| 17 | Canvas emoji and glyph rendering | `emoji-render` Canvas emoji & glyph rendering | automatically |
| 18 | WebGL shader precision and limits | `webgl-precision` WebGL shader precision & limits | automatically |
| 19 | WebGL context attributes | `webgl-context-attrs` WebGL context attributes | automatically |

## Audio

| # | Required test | Implemented as | Runs |
|---|---|---|---|
| 20 | Offline audio rendering | `audio-offline` OfflineAudioContext processing | automatically |
| 21 | Audio engine capability profile | `audio-capabilities` Audio engine capability profile | automatically |

## Fonts and text

| # | Required test | Implemented as | Runs |
|---|---|---|---|
| 22 | Common font availability heuristic | `fonts` Font availability (inference) | automatically |
| 23 | Canvas text metrics | `text-metrics` Canvas text metrics | automatically |

## CSS and rendering

| # | Required test | Implemented as | Runs |
|---|---|---|---|
| 24 | CSS feature support | `css-features` CSS feature support | automatically |
| 25 | CSS media preferences | `user-preferences` Accessibility & appearance preferences | automatically |
| 26 | CSS system colors and computed styles | `system-colors` CSS system colors & computed styles | automatically |
| 27 | SVG rendering and API support | `svg-support` SVG rendering & API support | automatically |
| 28 | Extended media query matrix | `media-query-matrix` Extended media query matrix | automatically |

## Hardware and runtime

| # | Required test | Implemented as | Runs |
|---|---|---|---|
| 29 | Hardware hints | `cpu-memory` Logical processors & device memory (coarse) | automatically |
| 30 | Runtime timing sample | `benchmark` Bounded CPU timing | automatically |
| 31 | Network connection hints | `network-info` Network Information API | automatically |
| 32 | Runtime memory hints | `js-heap` Runtime memory hints (JS heap) | automatically |
| 33 | Timer precision and jitter sample | `timer-precision` Timer precision & jitter sample | automatically |

## Browser APIs

| # | Required test | Implemented as | Runs |
|---|---|---|---|
| 34 | API availability matrix | `api-availability` Capability API availability | automatically |
| 35 | Permission state indicators | `permission-states` Permission states (no prompts) | automatically |
| 36 | WebRTC API presence | `webrtc-presence` WebRTC API presence | automatically |
| 37 | WebAssembly and shared memory | `wasm-sab` WebAssembly & SharedArrayBuffer | automatically |
| 38 | Battery API exposure (presence only) | `battery` Battery API exposure (presence only) | automatically |
| 39 | Device and posture API exposure | `device-posture` Device & posture API exposure | automatically |
| 40 | WebAuthn and credential capability | `webauthn` WebAuthn & credential capability | automatically |
| 41 | Media device API surface (no enumeration) | `media-devices` Media device API surface (no enumeration) | automatically |
| 42 | Event and observer support matrix | `observer-support` Event & observer support matrix | automatically |
| 43 | DOM and HTML implementation features | `dom-features` DOM & HTML implementation features | automatically |
| 44 | WebAssembly feature surface | `wasm-features` WebAssembly feature surface | automatically |
| 45 | Secure context and isolation posture | `isolation-posture` Secure context & isolation posture | automatically |
| 46 | Permission API surface | `permission-api-surface` Permission API surface | automatically |

## Storage and persistence

| # | Required test | Implemented as | Runs |
|---|---|---|---|
| 47 | Storage capabilities and quota | `storage-quota` Storage quota estimate | automatically |
| 48 | Temporary storage behavior | `storage-mechanisms` Client-side storage mechanisms | automatically |
| 49 | Storage API availability matrix | `storage-availability` Storage API availability matrix | automatically |
| 50 | Cookie and storage policy hints | `storage-policy` Cookie & storage policy hints | automatically |
| 51 | Service worker and partitioning-relevant APIs | `storage-partitioning` Service worker & partitioning-relevant APIs | automatically |

## Advanced inference

| # | Required test | Implemented as | Runs |
|---|---|---|---|
| 52 | Canvas repeatability | `canvas-repeatability` Canvas repeatability | automatically |
| 53 | Cross-signal consistency | `consistency` Cross-signal consistency | automatically |
| 54 | Floating-point and math behavior | `math-precision` Math function precision | automatically |
| 55 | Date parsing and serialization behavior | `date-behavior` Date parsing & serialization behavior | automatically |
| 56 | Error stack format heuristic | `error-stack` Error stack format heuristic | automatically |
| 57 | Native function stringification shape | `native-tostring` Native function stringification shape | automatically |
| 58 | Selected prototype surface | `prototype-surface` Selected prototype surface | automatically |
| 59 | Automation and webdriver hints | `automation` Automation indicators<br>`webdriver` navigator.webdriver | automatically |

## Network and server-only

| # | Required test | Implemented as | Runs |
|---|---|---|---|
| 60 | HTTP headers, IP and TLS | `srv-http-headers` HTTP request headers (Accept, Accept-Language, User-Agent)<br>`srv-ip` IP address & network metadata<br>`srv-tls` TLS ClientHello fingerprint (JA3/JA4) | server-only (explained) |
| 61 | Third-party tracker activity | `third-party-requests` Third-party requests on this page | automatically |
| 62 | TLS and transport fingerprint (server-only) | `srv-tls` TLS ClientHello fingerprint (JA3/JA4)<br>`srv-http2-http3` HTTP/2 & HTTP/3 behaviour<br>`srv-tcp` TCP/IP stack characteristics | server-only (explained) |
| 63 | Source IP and network context (server-only) | `srv-ip` IP address & network metadata | server-only (explained) |
| 64 | HTTP header profile (server-only) | `srv-http-headers` HTTP request headers (Accept, Accept-Language, User-Agent)<br>`srv-client-hint-headers` Client Hint request headers | server-only (explained) |
| 65 | Cross-visit and behavioral correlation (server-side) | `srv-cross-visit` Cross-visit & behavioral correlation (server-side) | server-only (explained) |

## Additional techniques

- `engine-inference`: Browser engine & version inference
- `webgl-render`: WebGL rendering digest
- `dom-rect`: Sub-pixel layout (DOMRect)
- `speech-voices`: Speech synthesis voices
- `media-codecs`: Media codec support
- `keyboard-layout`: Keyboard layout map
- `api-surface`: JavaScript API surface
- `webrtc-local`: WebRTC local candidate exposure
- `integrity`: Native function integrity
- `protection-indicators`: Privacy protection indicators
- `content-blockers`: Content-blocker detection (bait elements)
- `extension-indicators`: Injected extension objects
- `pointer-dynamics`: Pointer movement dynamics
- `keystroke-timing`: Keystroke timing
- `srv-cache-tracking`: Cache-based identifiers (ETag, HSTS, favicon)
- `srv-localhost`: Localhost probing & web-to-app bridges
- `cpu-architecture`: CPU architecture (NaN sign bit)
- `vendor-flavors`: Browser vendor flavors
- `private-click-measurement`: Private Click Measurement support
- `intl-supported`: Intl supported values (ICU data)
- `media-capabilities`: Hardware video decoding (Media Capabilities)
- `webcodecs`: WebCodecs encoder support
- `refresh-rate`: Display refresh rate
- `css-scriptless`: Script-less CSS fingerprinting
