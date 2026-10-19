// The required test list (65 items, from the project's test specification) mapped to registry ids.
// Used by coverage.test.mjs and by scripts/generate-docs.mjs (docs/TEST-COVERAGE.md).
export const COVERAGE = [
  ['Browser identity', [
    [1, 'User-Agent string', ['user-agent']], [2, 'Platform and vendor clues', ['platform']], [3, 'Language and locale', ['languages']],
    [4, 'Timezone configuration', ['intl-timezone']], [5, 'Browser capability flags', ['browser-flags']], [6, 'User-Agent Client Hints', ['client-hints']],
    [7, 'High-entropy Client Hints (opt-in local read)', ['client-hints-high']], [8, 'Legacy plugins and MIME handlers', ['plugins-mime']],
    [9, 'PDF viewer and document support', ['pdf-support']]]],
  ['Screen and display', [
    [10, 'Screen dimensions and color depth', ['screen', 'viewport']], [11, 'Orientation and touch', ['orientation', 'touch']],
    [12, 'Display and color media features', ['display-media']], [13, 'Viewport and browser-chrome geometry', ['viewport']]]],
  ['Graphics', [
    [14, 'Canvas rendering fingerprint', ['canvas-2d']], [15, 'WebGL renderer and capabilities', ['webgl-info']], [16, 'WebGPU availability', ['webgpu']],
    [17, 'Canvas emoji and glyph rendering', ['emoji-render']], [18, 'WebGL shader precision and limits', ['webgl-precision']],
    [19, 'WebGL context attributes', ['webgl-context-attrs']]]],
  ['Audio', [[20, 'Offline audio rendering', ['audio-offline']], [21, 'Audio engine capability profile', ['audio-capabilities']]]],
  ['Fonts and text', [[22, 'Common font availability heuristic', ['fonts']], [23, 'Canvas text metrics', ['text-metrics']]]],
  ['CSS and rendering', [
    [24, 'CSS feature support', ['css-features']], [25, 'CSS media preferences', ['user-preferences']], [26, 'CSS system colors and computed styles', ['system-colors']],
    [27, 'SVG rendering and API support', ['svg-support']], [28, 'Extended media query matrix', ['media-query-matrix']]]],
  ['Hardware and runtime', [
    [29, 'Hardware hints', ['cpu-memory']], [30, 'Runtime timing sample', ['benchmark']], [31, 'Network connection hints', ['network-info']],
    [32, 'Runtime memory hints', ['js-heap']], [33, 'Timer precision and jitter sample', ['timer-precision']]]],
  ['Browser APIs', [
    [34, 'API availability matrix', ['api-availability']], [35, 'Permission state indicators', ['permission-states']], [36, 'WebRTC API presence', ['webrtc-presence']],
    [37, 'WebAssembly and shared memory', ['wasm-sab']], [38, 'Battery API exposure (presence only)', ['battery']], [39, 'Device and posture API exposure', ['device-posture']],
    [40, 'WebAuthn and credential capability', ['webauthn']], [41, 'Media device API surface (no enumeration)', ['media-devices']],
    [42, 'Event and observer support matrix', ['observer-support']], [43, 'DOM and HTML implementation features', ['dom-features']],
    [44, 'WebAssembly feature surface', ['wasm-features']], [45, 'Secure context and isolation posture', ['isolation-posture']], [46, 'Permission API surface', ['permission-api-surface']]]],
  ['Storage and persistence', [
    [47, 'Storage capabilities and quota', ['storage-quota']], [48, 'Temporary storage behavior', ['storage-mechanisms']], [49, 'Storage API availability matrix', ['storage-availability']],
    [50, 'Cookie and storage policy hints', ['storage-policy']], [51, 'Service worker and partitioning-relevant APIs', ['storage-partitioning']]]],
  ['Advanced inference', [
    [52, 'Canvas repeatability', ['canvas-repeatability']], [53, 'Cross-signal consistency', ['consistency']], [54, 'Floating-point and math behavior', ['math-precision']],
    [55, 'Date parsing and serialization behavior', ['date-behavior']], [56, 'Error stack format heuristic', ['error-stack']], [57, 'Native function stringification shape', ['native-tostring']],
    [58, 'Selected prototype surface', ['prototype-surface']], [59, 'Automation and webdriver hints', ['automation', 'webdriver']]]],
  ['Network and server-only', [
    [60, 'HTTP headers, IP and TLS', ['srv-http-headers', 'srv-ip', 'srv-tls']], [61, 'Third-party tracker activity', ['third-party-requests']],
    [62, 'TLS and transport fingerprint (server-only)', ['srv-tls', 'srv-http2-http3', 'srv-tcp']], [63, 'Source IP and network context (server-only)', ['srv-ip']],
    [64, 'HTTP header profile (server-only)', ['srv-http-headers', 'srv-client-hint-headers']], [65, 'Cross-visit and behavioral correlation (server-side)', ['srv-cross-visit']]]],
];
