// 5.9 Browser APIs and permissions. API availability is reported as capability, never as a vulnerability.
// No permission is ever requested; Permissions API queries do not prompt.
import { define, g } from './define.js';
import { measured, blocked, unsupported, interactionRequired } from '../core/schema.js';
import { settleWithin } from '../core/util.js';

export default [
  define({
    id: 'api-availability', version: '1.0.0', category: 'apis', name: 'Capability API availability',
    simple: 'Which powerful browser features exist (location, notifications, clipboard, Bluetooth…). Existing is not the same as being exposed.',
    how: 'Checks only whether objects such as <code>navigator.geolocation</code>, <code>Notification</code>, <code>navigator.clipboard</code>, <code>navigator.serviceWorker</code>, <code>RTCPeerConnection</code>, <code>navigator.gpu</code>, <code>navigator.bluetooth</code> exist. Nothing is called.',
    technical: 'The set of present APIs depends on browser, version, platform and enterprise policy. <strong>Presence does not mean the API can be used without permission</strong>, and it is not a vulnerability.',
    exposes: 'Presence flags for capability APIs.', dataType: 'object', apis: ['navigator.*'],
    purpose: ['compatibility', 'identification'], relevance: 'low', relevanceBasis: 'Shared by all users of a browser version/platform.', stability: 'stable',
    combinesWith: [{ id: 'api-surface', basis: 'hypothetical', note: 'Version/platform inference.' }],
    privacyImpact: 'Low.', concern: 'limitation', limitations: ['Presence ≠ usability; many APIs are permission-gated.'],
    defenses: 'Brave disables several device APIs by default.', mitigations: ['No action needed.'], sources: ['w3c-fp-guidance'],
    run: async () => {
      const n = g.navigator || {};
      return measured({ geolocation: 'geolocation' in n, notifications: 'Notification' in g, clipboard: !!n.clipboard, mediaDevices: !!n.mediaDevices,
        storageManager: !!n.storage, indexedDB: 'indexedDB' in g, serviceWorker: 'serviceWorker' in n, webRTC: 'RTCPeerConnection' in g,
        webGPU: 'gpu' in n, bluetooth: 'bluetooth' in n, usb: 'usb' in n, hid: 'hid' in n, serial: 'serial' in n, xr: 'xr' in n,
        midi: 'requestMIDIAccess' in n, gamepads: 'getGamepads' in n, wakeLock: 'wakeLock' in n, paymentRequest: 'PaymentRequest' in g });
    },
  }),

  define({
    id: 'permission-states', version: '1.0.0', category: 'apis', name: 'Permission states (no prompts)',
    simple: 'Which permissions you have previously granted or denied for this site. Checking does not show any prompt.',
    how: 'Calls <code>navigator.permissions.query()</code> for common permission names. This API never prompts; it only reports <code>granted</code>, <code>denied</code> or <code>prompt</code>.',
    technical: 'For a fresh origin almost everything is <code>prompt</code>. Unusual defaults (e.g. notifications globally blocked) and enterprise policies show up here. Inconsistencies between <code>Notification.permission</code> and the Permissions API were historically a headless-Chrome tell.',
    exposes: 'Per-permission state for this origin.', dataType: 'object', apis: ['Permissions.query', 'Notification.permission'],
    purpose: ['bot-detection', 'identification'], relevance: 'low', relevanceBasis: 'Mostly "prompt" on first visit.', stability: 'semi-stable',
    combinesWith: [{ id: 'automation', basis: 'hypothetical', note: 'Inconsistent permission states.' }],
    privacyImpact: 'Low; reflects your choices for this site only.', limitations: ['Permission names vary by browser; unsupported names are reported as such.'],
    defenses: 'None needed.', mitigations: ['Review and reset site permissions periodically in browser settings.'], sources: ['w3c-fp-guidance'],
    run: async () => {
      if (!g.navigator?.permissions?.query) return unsupported('Permissions API not available');
      const names = ['geolocation', 'notifications', 'camera', 'microphone', 'clipboard-read', 'clipboard-write', 'midi', 'persistent-storage',
        'accelerometer', 'gyroscope', 'screen-wake-lock', 'local-fonts', 'window-management', 'storage-access'];
      const raw = {};
      await Promise.all(names.map(async (name) => {
        try { const s = await settleWithin(navigator.permissions.query({ name }), 800, null); raw[name] = s ? s.state : 'no-answer'; } catch { raw[name] = 'unsupported-name'; }
      }));
      raw['Notification.permission'] = g.Notification ? Notification.permission : null;
      return measured(raw);
    },
  }),

  define({
    id: 'api-surface', version: '1.0.0', category: 'apis', name: 'JavaScript API surface', tier: 'advanced',
    simple: 'Which newer JavaScript features exist, which narrows the browser version.',
    how: 'Checks for ~20 globals introduced in different releases (e.g. <code>scheduler</code>, <code>navigation</code>, <code>CompressionStream</code>, <code>EyeDropper</code>, <code>Sanitizer</code>).',
    technical: 'A presence bitmask maps to a release range and engine. Bot detectors compare it with the claimed UA version to detect spoofing.',
    exposes: 'Presence bitmask.', dataType: 'object', apis: ['globalThis'],
    purpose: ['compatibility', 'bot-detection'], relevance: 'low', relevanceBasis: 'Shared by users of the same version.', stability: 'semi-stable',
    combinesWith: [{ id: 'css-features', basis: 'hypothetical', note: 'Version range.' }, { id: 'consistency', basis: 'hypothetical', note: 'Claimed vs actual version.' }],
    privacyImpact: 'Low.', concern: 'limitation', limitations: ['List needs maintenance as browsers evolve.'],
    defenses: 'Keep updated.', mitigations: ['Keep the browser updated.'], sources: ['iqbal-2021'],
    run: async () => {
      const names = ['scheduler', 'navigation', 'documentPictureInPicture', 'Sanitizer', 'CompressionStream', 'EyeDropper', 'IdleDetector', 'ViewTransition',
        'CloseWatcher', 'trustedTypes', 'cookieStore', 'sharedStorage', 'Iterator', 'structuredClone', 'showOpenFilePicker', 'queryLocalFonts',
        'getScreenDetails', 'SharedWorker', 'ApplePaySession', 'webkitSpeechRecognition'];
      const raw = {}; for (const k of names) raw[k] = k in g || (g.navigator && k in g.navigator);
      return measured(raw);
    },
  }),

  define({
    id: 'webrtc-presence', version: '1.0.0', category: 'apis', name: 'WebRTC API presence',
    simple: 'Whether WebRTC (real-time audio/video/data) is exposed, and which codecs it advertises. No connection is made and no network candidates are collected.',
    how: 'Checks for <code>RTCPeerConnection</code>, <code>RTCDataChannel</code>, <code>RTCRtpTransceiver</code> and insertable-streams interfaces, and reads <code>RTCRtpSender.getCapabilities()</code> codec lists. No peer connection is created.',
    technical: 'Codec capability lists (VP8/VP9/AV1/H.264 profiles, Opus, RED, hardware-accelerated codecs) differ by browser, OS and hardware encoders. Presence of WebRTC <em>does not</em> mean network candidates are gathered; that only happens in the separate, user-initiated candidate test.',
    exposes: 'WebRTC interface presence and advertised codecs.', dataType: 'object', apis: ['RTCPeerConnection', 'RTCRtpSender.getCapabilities'],
    purpose: ['compatibility', 'identification'], relevance: 'low', relevanceBasis: 'Codec lists vary modestly by platform.', stability: 'stable',
    combinesWith: [{ id: 'media-codecs', basis: 'hypothetical', note: 'Codec support overlaps.' }],
    privacyImpact: 'Low.', concern: 'limitation', limitations: ['Says nothing about IP exposure.'],
    defenses: 'Some privacy browsers disable WebRTC entirely.', mitigations: ['No action needed.'], sources: ['englehardt-2016'],
    run: async () => {
      if (!g.RTCPeerConnection) return unsupported('WebRTC is not exposed (disabled or unsupported)');
      const caps = (k) => { try { return (g.RTCRtpSender?.getCapabilities?.(k)?.codecs || []).map((c) => c.mimeType + (c.sdpFmtpLine ? `;${c.sdpFmtpLine}` : '')); } catch { return null; } };
      const video = caps('video'), audio = caps('audio');
      return measured({ RTCPeerConnection: true, RTCDataChannel: 'RTCDataChannel' in g, RTCRtpTransceiver: 'RTCRtpTransceiver' in g,
        RTCRtpScriptTransform: 'RTCRtpScriptTransform' in g, videoCodecs: video ? [...new Set(video)].sort() : null, audioCodecs: audio ? [...new Set(audio)].sort() : null },
      { notes: ['No peer connection was created and no ICE candidates were gathered.'] });
    },
  }),

  define({
    id: 'device-posture', version: '1.0.0', category: 'apis', name: 'Device & posture API exposure',
    simple: 'Whether APIs for sensors, foldable-screen posture, multi-screen setups and on-screen keyboards exist. Nothing is read from sensors.',
    how: 'Checks presence of <code>navigator.devicePosture</code>, <code>DeviceOrientationEvent</code>, <code>DeviceMotionEvent</code>, Generic Sensor classes (<code>Accelerometer</code>, <code>Gyroscope</code>, <code>AmbientLightSensor</code>…), <code>navigator.virtualKeyboard</code>, <code>getScreenDetails</code> and viewport segments. No sensor is started and no event listener is attached.',
    technical: 'Sensor readings have been shown to enable device fingerprinting (e.g. accelerometer calibration errors), which is why this lab only checks presence. Posture/segments APIs indicate foldables; multi-screen APIs indicate desktop Chromium.',
    exposes: 'Presence flags; posture type where exposed.', dataType: 'object', apis: ['navigator.devicePosture', 'DeviceOrientationEvent', 'Sensor'],
    purpose: ['compatibility', 'identification'], relevance: 'low', relevanceBasis: 'Mostly a device/browser-class signal.', stability: 'stable',
    privacyImpact: 'Low (presence only).', concern: 'limitation', limitations: ['Presence does not mean a sensor exists or is accessible.'],
    defenses: 'Firefox and Safari expose fewer device APIs; Brave disables several.', mitigations: ['No action needed.'], sources: ['w3c-fp-guidance'],
    run: async () => {
      const n = g.navigator || {};
      return measured({
        devicePosture: n.devicePosture ? n.devicePosture.type : null, deviceOrientationEvent: 'DeviceOrientationEvent' in g, deviceMotionEvent: 'DeviceMotionEvent' in g,
        sensors: ['Accelerometer', 'Gyroscope', 'Magnetometer', 'AbsoluteOrientationSensor', 'AmbientLightSensor', 'GravitySensor', 'LinearAccelerationSensor'].filter((k) => k in g),
        virtualKeyboard: 'virtualKeyboard' in n, getScreenDetails: 'getScreenDetails' in g, viewportSegments: 'viewport' in g && 'segments' in (g.viewport || {}),
        screenIsExtended: g.screen?.isExtended ?? null,
      });
    },
  }),

  define({
    id: 'webauthn', version: '1.0.0', category: 'apis', name: 'WebAuthn & credential capability',
    simple: 'Whether passkeys / Web Authentication are available, and whether a built-in authenticator (Touch ID, Windows Hello) is present. No credential is requested.',
    how: 'Checks <code>PublicKeyCredential</code>, <code>navigator.credentials</code>, <code>PasswordCredential</code> and <code>IdentityCredential</code> (FedCM), and calls the prompt-free capability queries <code>isUserVerifyingPlatformAuthenticatorAvailable()</code>, <code>isConditionalMediationAvailable()</code> and <code>getClientCapabilities()</code> where present.',
    technical: 'These queries never show UI. Whether a platform authenticator exists (Touch ID, Face ID, Windows Hello, Android biometrics) is a hardware/OS signal. Client capabilities (hybrid transport, related origins, passkey sync) vary with browser and OS versions.',
    exposes: 'Credential API presence and authenticator availability.', dataType: 'object', apis: ['PublicKeyCredential', 'navigator.credentials'],
    purpose: ['fraud-prevention', 'compatibility', 'identification'], relevance: 'low', relevanceBasis: 'Few distinct combinations; correlates with device class.', stability: 'stable',
    privacyImpact: 'Low.', concern: 'limitation', limitations: ['Requires a secure context; results vary with enterprise policy.'],
    defenses: 'None needed.', mitigations: ['No action needed.'], sources: ['w3c-fp-guidance'],
    run: async () => {
      const PKC = g.PublicKeyCredential;
      const raw = { publicKeyCredential: !!PKC, credentialsContainer: !!g.navigator?.credentials, passwordCredential: 'PasswordCredential' in g, identityCredential: 'IdentityCredential' in g };
      if (PKC) {
        raw.platformAuthenticator = PKC.isUserVerifyingPlatformAuthenticatorAvailable ? await settleWithin(PKC.isUserVerifyingPlatformAuthenticatorAvailable().catch(() => null), 1500, null) : null;
        raw.conditionalMediation = PKC.isConditionalMediationAvailable ? await settleWithin(PKC.isConditionalMediationAvailable().catch(() => null), 1500, null) : null;
        raw.clientCapabilities = PKC.getClientCapabilities ? await settleWithin(PKC.getClientCapabilities().catch(() => null), 1500, null) : null;
      }
      return measured(raw, { notes: ['Capability queries only; no credential was created or requested.'] });
    },
  }),

  define({
    id: 'observer-support', version: '1.0.0', category: 'apis', name: 'Event & observer support matrix', tier: 'advanced',
    simple: 'Which observer and event APIs the browser implements, plus the performance entry types it records.',
    how: 'Checks for observer classes (<code>ResizeObserver</code>, <code>IntersectionObserver</code>, <code>MutationObserver</code>, <code>ReportingObserver</code>, <code>PressureObserver</code>…), event constructors and handler properties, and reads <code>PerformanceObserver.supportedEntryTypes</code>.',
    technical: 'Supported performance entry types (e.g. <code>largest-contentful-paint</code>, <code>long-animation-frame</code>, <code>soft-navigation</code>) are added release by release and differ between engines, so the list narrows browser and version.',
    exposes: 'API presence and supported entry types.', dataType: 'object', apis: ['PerformanceObserver.supportedEntryTypes'],
    purpose: ['compatibility', 'bot-detection'], relevance: 'low', relevanceBasis: 'Shared by users of the same version.', stability: 'semi-stable',
    combinesWith: [{ id: 'api-surface', basis: 'hypothetical', note: 'Version range.' }],
    privacyImpact: 'Low.', concern: 'limitation', limitations: ['Changes with every browser update.'],
    defenses: 'Keep updated.', mitigations: ['Keep the browser updated.'], sources: ['iqbal-2021'],
    run: async () => measured({
      observers: ['ResizeObserver', 'IntersectionObserver', 'MutationObserver', 'PerformanceObserver', 'ReportingObserver', 'PressureObserver', 'ComputePressureObserver'].filter((k) => k in g),
      events: ['PointerEvent', 'TouchEvent', 'GamepadEvent', 'ClipboardEvent', 'ToggleEvent', 'CommandEvent', 'NavigateEvent', 'PageRevealEvent', 'PageSwapEvent'].filter((k) => k in g),
      handlers: ['onbeforematch', 'onscrollend', 'oncontentvisibilityautostatechange', 'onbeforetoggle', 'onpagereveal'].filter((k) => k in g || (g.document && k in g.document)),
      supportedEntryTypes: Array.from(g.PerformanceObserver?.supportedEntryTypes || []),
    }),
  }),

  define({
    id: 'dom-features', version: '1.0.0', category: 'apis', name: 'DOM & HTML implementation features', tier: 'advanced',
    simple: 'Which HTML elements, attributes and input types the browser supports.',
    how: 'Checks for features such as <code>&lt;dialog&gt;</code>, the <code>popover</code> and <code>inert</code> attributes, declarative shadow DOM, custom elements and <code>document.fonts</code>, and tests which <code>&lt;input type&gt;</code> values are kept (date, color, month, week, datetime-local, range) using detached elements.',
    technical: 'Unsupported input types silently fall back to <code>text</code>, so assigning a type and reading it back reveals support. Together with newer DOM APIs this maps to engine and release range.',
    exposes: 'HTML/DOM feature support.', dataType: 'object', apis: ['HTMLInputElement.type', 'HTMLElement.popover', 'HTMLDialogElement'],
    purpose: ['compatibility', 'bot-detection'], relevance: 'low', relevanceBasis: 'Shared by users of the same version.', stability: 'semi-stable',
    combinesWith: [{ id: 'css-features', basis: 'hypothetical', note: 'Version range.' }],
    privacyImpact: 'Low.', concern: 'limitation', limitations: ['Needs maintenance as features ship.'],
    defenses: 'Keep updated.', mitigations: ['Keep the browser updated.'], sources: ['w3c-fp-guidance'],
    run: async () => {
      if (!g.document) return unsupported('DOM unavailable');
      const inputTypes = {};
      for (const t of ['date', 'time', 'datetime-local', 'month', 'week', 'color', 'range', 'search', 'tel']) { const i = document.createElement('input'); i.setAttribute('type', t); inputTypes[t] = i.type === t; }
      const el = document.createElement('div');
      return measured({ inputTypes, dialog: typeof g.HTMLDialogElement === 'function', popover: 'popover' in el, inert: 'inert' in el,
        declarativeShadowDOM: 'shadowRootMode' in document.createElement('template'), customElements: !!g.customElements, documentFonts: !!document.fonts,
        hiddenUntilFound: 'onbeforematch' in el, selectedContent: 'HTMLSelectedContentElement' in g, moveBefore: 'moveBefore' in el });
    },
  }),

  define({
    id: 'isolation-posture', version: '1.0.0', category: 'apis', name: 'Secure context & isolation posture',
    simple: 'Whether this page runs in a secure context and how strongly it is isolated from other sites.',
    how: 'Reads <code>isSecureContext</code>, <code>crossOriginIsolated</code>, <code>originAgentCluster</code>, the page protocol, and the features allowed by the Permissions Policy (<code>document.featurePolicy</code> / <code>permissionsPolicy</code> where exposed).',
    technical: 'These values describe the <em>page and server configuration</em> more than the user. They matter because they gate other APIs (high-resolution timers, SharedArrayBuffer, Storage, Web Crypto). The allowed-features list also differs between browser versions.',
    exposes: 'Security context flags and allowed policy features.', dataType: 'object', apis: ['isSecureContext', 'crossOriginIsolated', 'Document.featurePolicy'],
    purpose: ['compatibility'], relevance: 'low', relevanceBasis: 'Determined by the site, not the user.', stability: 'stable',
    privacyImpact: 'Low; mainly explains why other tests behave as they do.', concern: 'limitation', limitations: ['Reflects this deployment (localhost vs HTTPS).'],
    defenses: 'Not applicable.', mitigations: ['No action needed.'], sources: ['w3c-fp-guidance'],
    run: async () => {
      const pol = g.document?.permissionsPolicy || g.document?.featurePolicy;
      return measured({ isSecureContext: g.isSecureContext ?? null, crossOriginIsolated: g.crossOriginIsolated ?? null, originAgentCluster: g.originAgentCluster ?? null,
        protocol: g.location?.protocol ?? null, allowedPolicyFeatures: pol?.allowedFeatures ? pol.allowedFeatures().slice().sort() : null },
      { normalized: { allowedPolicyFeatures: pol?.allowedFeatures ? pol.allowedFeatures().slice().sort() : null } });
    },
  }),

  define({
    id: 'permission-api-surface', version: '1.0.0', category: 'apis', name: 'Permission API surface', tier: 'advanced',
    simple: 'Which permission names and permission-related functions the browser recognizes. No permission is requested.',
    how: 'Calls <code>navigator.permissions.query()</code> with ~25 permission names and records only whether each name is <em>recognized</em> (a TypeError means unknown). Also checks for <code>Permissions.request/revoke</code>, <code>Notification.requestPermission</code> and the <code>&lt;permission&gt;</code> element.',
    technical: 'The set of recognized names differs by engine and version (e.g. "window-management", "local-fonts", "captured-surface-control" are Chromium-only). Querying never prompts. This is distinct from the permission <em>states</em> test.',
    exposes: 'Recognized permission names and API surface.', dataType: 'object', apis: ['Permissions.query'],
    purpose: ['compatibility', 'bot-detection'], relevance: 'low', relevanceBasis: 'Shared by users of the same version.', stability: 'stable',
    combinesWith: [{ id: 'permission-states', basis: 'hypothetical', note: 'Same API, different question.' }],
    privacyImpact: 'Low.', concern: 'limitation', limitations: ['Name lists need maintenance.'],
    defenses: 'None needed.', mitigations: ['No action needed.'], sources: ['w3c-fp-guidance'],
    run: async () => {
      const P = g.navigator?.permissions;
      if (!P?.query) return unsupported('Permissions API not available');
      const names = ['geolocation', 'notifications', 'push', 'camera', 'microphone', 'speaker-selection', 'display-capture', 'clipboard-read', 'clipboard-write',
        'midi', 'persistent-storage', 'background-sync', 'background-fetch', 'periodic-background-sync', 'accelerometer', 'gyroscope', 'magnetometer',
        'ambient-light-sensor', 'screen-wake-lock', 'local-fonts', 'window-management', 'storage-access', 'top-level-storage-access', 'idle-detection',
        'captured-surface-control', 'keyboard-lock', 'pointer-lock', 'nfc', 'payment-handler'];
      const recognized = [], unknown = [];
      await Promise.all(names.map(async (name) => { try { await settleWithin(P.query({ name }), 800, null); recognized.push(name); } catch { unknown.push(name); } }));
      return measured({ recognized: recognized.sort(), unknown: unknown.sort(), request: typeof P.request === 'function', revoke: typeof P.revoke === 'function',
        notificationRequestPermission: typeof g.Notification?.requestPermission === 'function', permissionElement: 'HTMLPermissionElement' in g });
    },
  }),

  define({
    id: 'webrtc-local', version: '1.0.0', category: 'apis', name: 'WebRTC local candidate exposure', tier: 'advanced', interaction: true,
    simple: 'Checks whether WebRTC would reveal your local network address. Runs only when you click it, and contacts no server.',
    how: 'Creates an <code>RTCPeerConnection</code> with <strong>no STUN/TURN servers</strong>, so no network request leaves your device. It gathers host ICE candidates and checks whether they are real IPs or obfuscated <code>.local</code> mDNS names. Addresses are not stored or exported unless you choose to export raw data.',
    technical: 'Since ~2019 browsers replace host IPs with random mDNS names unless media permission was granted. With a STUN server, a server-reflexive candidate would also expose the public IP; this lab deliberately does not do that. The 2025 "Local Mess" disclosure showed WebRTC being used to reach localhost apps.',
    exposes: 'Whether local IPs are exposed or mDNS-obfuscated.', dataType: 'object', apis: ['RTCPeerConnection'],
    purpose: ['identification', 'fraud-prevention'], relevance: 'medium', relevanceBasis: 'LAN IPs are distinctive when exposed; mDNS obfuscation removes most value.', stability: 'semi-stable',
    combinesWith: [{ id: 'srv-ip', basis: 'documented', source: 'englehardt-2016', note: 'WebRTC used to discover IPs in the wild.' }],
    privacyImpact: 'High if real LAN IPs are exposed; low when obfuscated.', limitations: ['Without STUN, the public-IP leak is not tested.'],
    defenses: 'mDNS candidate obfuscation (all major browsers); WebRTC IP handling policies; uBlock Origin setting.',
    mitigations: ['Keep mDNS obfuscation enabled (default).', 'Use a system-wide VPN rather than a browser-proxy extension.'],
    sources: ['englehardt-2016', 'localmess'],
    run: async ({ options }) => {
      if (!options?.userInitiated) return interactionRequired('Click "Run" on this card to start the WebRTC check.');
      if (!g.RTCPeerConnection) return unsupported('WebRTC not available');
      const pc = new RTCPeerConnection({ iceServers: [] });
      const cands = [];
      try {
        pc.createDataChannel('lab');
        const done = new Promise((resolve) => { pc.onicecandidate = (e) => (e.candidate ? cands.push(e.candidate.candidate) : resolve()); });
        await pc.setLocalDescription(await pc.createOffer());
        await settleWithin(done, 2500, null);
      } finally { pc.close(); }
      const hosts = cands.map((c) => c.split(' ')[4]).filter(Boolean);
      if (!hosts.length) return blocked('No ICE candidates were gathered (WebRTC restricted).');
      const exposed = hosts.filter((h) => !h.endsWith('.local'));
      return measured({ candidates: hosts.length, mdnsObfuscated: exposed.length === 0, exposedAddresses: exposed },
        { normalized: { mdnsObfuscated: exposed.length === 0 }, protection: exposed.length ? 'none-detected' : 'standardized' });
    },
  }),
];
