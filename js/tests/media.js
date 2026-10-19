// 5.5 Audio fingerprinting and other media capabilities. No microphone access is ever requested.
import { define, g } from './define.js';
import { measured, blocked, unsupported } from '../core/schema.js';
import { digest } from '../core/hash.js';
import { settleWithin } from '../core/util.js';

const SAMPLES = 5000;

async function renderAudio() {
  const Ctx = g.OfflineAudioContext || g.webkitOfflineAudioContext;
  const ctx = new Ctx(1, SAMPLES, 44100);
  const osc = ctx.createOscillator(); osc.type = 'triangle'; osc.frequency.value = 10000;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -50; comp.knee.value = 40; comp.ratio.value = 12; comp.attack.value = 0; comp.release.value = 0.25;
  osc.connect(comp); comp.connect(ctx.destination); osc.start(0);
  const t0 = performance.now();
  const buf = await settleWithin(ctx.startRendering(), 2000, null);
  if (!buf) return null;
  const data = buf.getChannelData(0);
  let sum = 0; for (let i = 4500; i < SAMPLES; i++) sum += Math.abs(data[i]);
  return { sum, length: data.length, ms: performance.now() - t0, tail: Array.from(data.slice(4500, 4510)) };
}

export default [
  define({
    id: 'audio-offline', version: '1.0.0', category: 'media', name: 'OfflineAudioContext processing', repeatable: true,
    simple: 'Your browser silently processes a synthetic sound. Tiny numeric differences in the result can distinguish setups.',
    how: 'An <code>OfflineAudioContext</code> renders 5,000 samples of a 10 kHz triangle wave through a <code>DynamicsCompressor</code>, entirely in memory. No speakers or microphone are involved. A sum over part of the output and a digest of sample values are computed, and the render is repeated to detect randomization.',
    technical: 'Differences come from floating-point implementation details (SIMD paths, FMA, denormal handling) and audio engine versions, so they mostly separate browser/OS/CPU families rather than individuals. Englehardt & Narayanan (2016) first observed this in the wild.',
    exposes: 'A numeric signature of the audio processing stack.', dataType: 'hash', apis: ['OfflineAudioContext', 'DynamicsCompressorNode'],
    purpose: ['identification', 'fraud-prevention'], relevance: 'medium', relevanceBasis: 'Used by FingerprintJS; mostly reflects platform rather than individual device.', stability: 'stable',
    combinesWith: [{ id: 'math-precision', basis: 'hypothetical', note: 'Both reflect floating-point behaviour.' }],
    privacyImpact: 'Moderate.', limitations: ['Many users of the same browser/OS share the value.', 'Some browsers suspend audio contexts without a user gesture.'],
    defenses: 'Brave farbles Web Audio; Safari adds noise under Advanced Fingerprinting Protection; Firefox RFP normalizes.',
    mitigations: ['Use a browser with Web Audio randomization (Brave, Safari AFP).'],
    sources: ['englehardt-2016', 'mdn-audiocontext', 'fpjs-sources', 'brave-fp2'],
    run: async ({ repeat }) => {
      if (!g.OfflineAudioContext && !g.webkitOfflineAudioContext) return unsupported('OfflineAudioContext not available');
      const first = await renderAudio();
      if (!first) return blocked('Audio rendering did not complete (suspended or blocked).', { protection: 'unknown' });
      let differing = 0;
      for (let i = 1; i < Math.max(2, repeat); i++) { const r = await renderAudio(); if (!r || r.sum !== first.sum) differing++; }
      const { hex, algorithm } = await digest(first.tail);
      return measured({ sampleSum: first.sum, outputLength: first.length, renderMs: +first.ms.toFixed(1), digest: hex, algorithm, rendersDifferingFromFirst: differing },
        { normalized: differing ? null : { sum: first.sum, digest: hex }, protection: differing ? 'randomized' : 'none-detected' });
    },
  }),

  define({
    id: 'speech-voices', version: '1.0.0', category: 'media', name: 'Speech synthesis voices',
    simple: 'The text-to-speech voices installed on your system.',
    how: 'Reads <code>speechSynthesis.getVoices()</code> (name, language, local or network voice). No speech is played.',
    technical: 'Voice lists depend on OS, installed language packs and optional premium voices. macOS and Windows differ substantially; network voices reveal vendor services.',
    exposes: 'Installed TTS voices and languages.', dataType: 'list', apis: ['speechSynthesis.getVoices'],
    purpose: ['identification'], relevance: 'medium', relevanceBasis: 'Optional voice downloads vary between users.', stability: 'stable',
    combinesWith: [{ id: 'languages', basis: 'hypothetical', note: 'Installed language packs.' }],
    privacyImpact: 'Moderate; may reveal languages you use.', limitations: ['Voice lists load asynchronously and may be empty initially.'],
    defenses: 'Firefox RFP and Tor hide voices; Brave limits them.', mitigations: ['Remove unneeded voice packs if this concerns you.'],
    sources: ['w3c-fp-guidance'],
    run: async () => {
      if (!g.speechSynthesis) return unsupported('speechSynthesis not available');
      let voices = speechSynthesis.getVoices();
      if (!voices.length) voices = await settleWithin(new Promise((r) => speechSynthesis.addEventListener('voiceschanged', () => r(speechSynthesis.getVoices()), { once: true })), 1500, []);
      if (!voices.length) return blocked('No voices returned (none installed, still loading, or hidden).', { protection: 'unknown' });
      const list = voices.map((v) => ({ name: v.name, lang: v.lang, local: v.localService }));
      return measured({ count: list.length, languages: [...new Set(list.map((v) => v.lang))].sort(), voices: list }, { normalized: list.map((v) => v.name).sort() });
    },
  }),

  define({
    id: 'media-codecs', version: '1.0.0', category: 'media', name: 'Media codec support',
    simple: 'Which audio and video formats your browser says it can play.',
    how: 'Calls <code>HTMLMediaElement.canPlayType()</code> and <code>MediaSource.isTypeSupported()</code> for a fixed list of codecs.',
    technical: 'HEVC, AV1 and Dolby support depend on hardware decoders, OS codec licenses and browser builds.',
    exposes: 'Codec support answers ("probably", "maybe", "").', dataType: 'object', apis: ['HTMLMediaElement.canPlayType', 'MediaSource.isTypeSupported'],
    purpose: ['compatibility', 'identification'], relevance: 'low', relevanceBasis: 'Mostly determined by browser + OS.', stability: 'stable',
    privacyImpact: 'Low.', concern: 'limitation', limitations: ['"maybe" answers are not definitive.'],
    defenses: 'None common.', mitigations: ['No action needed.'], sources: ['w3c-fp-guidance'],
    run: async () => {
      if (!g.document) return unsupported('DOM unavailable');
      const v = document.createElement('video');
      const types = { h264: 'video/mp4; codecs="avc1.42E01E"', hevc: 'video/mp4; codecs="hvc1.1.6.L93.B0"', vp9: 'video/webm; codecs="vp9"',
        av1: 'video/mp4; codecs="av01.0.05M.08"', aac: 'audio/mp4; codecs="mp4a.40.2"', opus: 'audio/webm; codecs="opus"', flac: 'audio/flac',
        ac3: 'audio/mp4; codecs="ac-3"', eac3: 'audio/mp4; codecs="ec-3"', hlsNative: 'application/vnd.apple.mpegurl' };
      const raw = {};
      for (const [k, t] of Object.entries(types)) raw[k] = { canPlayType: v.canPlayType(t) || '', mse: g.MediaSource?.isTypeSupported ? MediaSource.isTypeSupported(t) : null };
      return measured(raw);
    },
  }),

  define({
    id: 'media-devices', version: '2.0.0', category: 'media', name: 'Media device API surface (no enumeration)',
    simple: 'Which camera/microphone/screen-capture APIs exist. No devices are listed or counted.',
    how: 'Checks for <code>navigator.mediaDevices</code>, <code>getUserMedia</code>, <code>getDisplayMedia</code>, <code>enumerateDevices</code>, <code>selectAudioOutput</code> and reads <code>getSupportedConstraints()</code>, which lists constraint <em>names</em> the browser understands. <strong><code>enumerateDevices()</code> is never called</strong>, and no permission is requested.',
    technical: 'Device enumeration can reveal device counts (and, after a granted permission, labels and persistent per-site IDs). This lab deliberately avoids it. The supported-constraints list differs between engines and versions, so it acts as a capability signal.',
    exposes: 'Media API presence and supported constraint names.', dataType: 'object', apis: ['navigator.mediaDevices', 'MediaDevices.getSupportedConstraints'],
    purpose: ['compatibility', 'identification'], relevance: 'low', relevanceBasis: 'Shared by all users of the same browser version.', stability: 'stable',
    privacyImpact: 'Low. API presence is not a vulnerability.', concern: 'limitation', limitations: ['Says nothing about which devices are attached; by design.'],
    defenses: 'Browsers restrict enumeration before permission.', mitigations: ['Only grant camera/microphone permissions to sites that need them, and revoke them afterwards.'],
    sources: ['w3c-fp-guidance'],
    run: async () => {
      const md = g.navigator?.mediaDevices;
      if (!md) return unsupported('navigator.mediaDevices not available (often requires a secure context)');
      return measured({ getUserMedia: typeof md.getUserMedia === 'function', getDisplayMedia: typeof md.getDisplayMedia === 'function',
        enumerateDevicesPresent: typeof md.enumerateDevices === 'function', selectAudioOutput: typeof md.selectAudioOutput === 'function',
        supportedConstraints: Object.keys(md.getSupportedConstraints?.() || {}).sort() }, { notes: ['enumerateDevices() was not called.'] });
    },
  }),

  define({
    id: 'audio-capabilities', version: '1.0.0', category: 'media', name: 'Audio engine capability profile',
    simple: 'What the browser\'s audio engine reports: sample rate, latency, channel count and available audio features.',
    how: 'Creates an <code>AudioContext</code> (which stays suspended because no user gesture is involved, so nothing plays), reads <code>sampleRate</code>, <code>baseLatency</code>, <code>outputLatency</code>, <code>destination.maxChannelCount</code> and <code>state</code>, checks for <code>AudioWorklet</code> and other audio interfaces, then closes the context.',
    technical: 'The sample rate follows the OS audio device (44.1/48/96 kHz). <code>baseLatency</code> depends on OS audio stack and buffer sizes (FingerprintJS\'s <code>audio_base_latency</code> source). <code>maxChannelCount</code> reveals surround/multichannel outputs. No microphone is involved.',
    exposes: 'Audio hardware/stack characteristics.', dataType: 'object', apis: ['AudioContext', 'AudioDestinationNode.maxChannelCount', 'AudioWorklet'],
    purpose: ['identification'], relevance: 'medium', relevanceBasis: 'Sample rate and latency vary with audio hardware and OS.', stability: 'semi-stable',
    combinesWith: [{ id: 'audio-offline', basis: 'hypothetical', note: 'Same audio stack.' }],
    privacyImpact: 'Moderate in combination.', limitations: ['Changes when you switch audio output devices.', 'Some browsers report latency only after the context runs.'],
    defenses: 'Firefox RFP standardizes some values.', mitigations: ['No practical user action.'], sources: ['fpjs-sources', 'mdn-audiocontext'],
    run: async () => {
      const AC = g.AudioContext || g.webkitAudioContext;
      if (!AC) return unsupported('AudioContext not available');
      const ctx = new AC();
      try {
        return measured({ sampleRate: ctx.sampleRate, baseLatency: ctx.baseLatency ?? null, outputLatency: ctx.outputLatency ?? null,
          maxChannelCount: ctx.destination.maxChannelCount, state: ctx.state, audioWorklet: !!ctx.audioWorklet,
          interfaces: ['AudioWorkletNode', 'MediaStreamAudioSourceNode', 'IIRFilterNode', 'StereoPannerNode', 'ConstantSourceNode', 'AudioDecoder'].filter((k) => k in g) },
        { normalized: { sampleRate: ctx.sampleRate, baseLatency: ctx.baseLatency ?? null, maxChannelCount: ctx.destination.maxChannelCount } });
      } finally { ctx.close?.().catch(() => {}); }
    },
  }),
];
