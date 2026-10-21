// 5.3 Canvas, 5.4 WebGL, 5.6 Fonts, plus WebGPU and text metrics.
import { define, g } from './define.js';
import { measured, blocked, unsupported } from '../core/schema.js';
import { digest } from '../core/hash.js';
import { settleWithin } from '../core/util.js';

const W = 240, H = 60;

function drawScene() {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, '#1b4965'); grad.addColorStop(1, '#ca6702');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#f2f2f2'; ctx.font = '15px "Times New Roman", serif'; ctx.textBaseline = 'top';
  ctx.fillText('Fjordbank glyphs vext quiz ✓ 😃', 6, 6);
  ctx.font = 'italic 13px Arial, sans-serif'; ctx.fillStyle = 'rgba(255, 220, 90, 0.85)';
  ctx.fillText('Åäö ß Ω ≈ ∑ 1.234', 8, 30);
  ctx.globalCompositeOperation = 'multiply';
  [['#e63946', 180], ['#2a9d8f', 205]].forEach(([col, x]) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, 32, 18, 0, Math.PI * 2); ctx.fill(); });
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(4, 54); ctx.bezierCurveTo(60, 20, 140, 70, 236, 46); ctx.stroke();
  return { canvas: c, ctx };
}

function releaseGL(gl) { try { gl?.getExtension('WEBGL_lose_context')?.loseContext(); } catch {} }

const FONT_CANDIDATES = ['Arial', 'Arial Narrow', 'Calibri', 'Cambria', 'Comic Sans MS', 'Consolas', 'Courier New', 'Georgia', 'Impact',
  'Lucida Console', 'Segoe UI', 'Tahoma', 'Trebuchet MS', 'Verdana', 'MS Gothic', 'Yu Gothic', 'Malgun Gothic', 'SimSun', 'Helvetica',
  'Helvetica Neue', 'Menlo', 'Monaco', 'Avenir', 'Futura', 'Gill Sans', 'Optima', 'Ubuntu', 'DejaVu Sans', 'Liberation Sans', 'Noto Sans',
  'Cantarell', 'Roboto', 'Fira Code', 'JetBrains Mono', 'Source Code Pro', 'Open Sans', 'Century Gothic', 'Garamond', 'Myriad Pro', 'Minion Pro'];
export { FONT_CANDIDATES };

export default [
  define({
    id: 'canvas-2d', version: '1.0.0', category: 'rendering', name: 'Canvas 2D rendering', repeatable: true,
    simple: 'Your browser draws a small picture. Tiny differences in how it draws can tell devices apart.',
    how: 'The page secretly draws some text, shapes and an emoji, then reads back the exact pixels and turns them into a short code. The picture looks the same to you, but fonts, graphics chip and system settings change a few pixels. The lab draws it several times to see if your browser adds random noise as a protection.',
    technical: 'Output depends on font rasterization and hinting, sub-pixel anti-aliasing, GPU/driver compositing, color management and the emoji font. Identical outputs across repeated draws but different across devices make it a strong signal. Differing outputs <em>within</em> one page load indicate noise injection (e.g. Brave farbling, Safari Advanced Fingerprinting Protection).',
    exposes: 'A pixel buffer whose digest reflects your rendering stack.', dataType: 'hash', apis: ['HTMLCanvasElement', 'CanvasRenderingContext2D.getImageData'],
    purpose: ['identification', 'fraud-prevention', 'bot-detection', 'advertising'], relevance: 'high',
    relevanceBasis: 'Found on >5% of top-100k sites in 2014 (Acar et al.); "highly discriminating" in AmIUnique (Laperdrix et al. 2016).', stability: 'stable',
    combinesWith: [{ id: 'fonts', basis: 'documented', source: 'laperdrix-2016', note: 'Canvas output reflects installed fonts and OS.' },
      { id: 'webgl-info', basis: 'hypothetical', note: 'Both reflect the graphics stack.' }],
    privacyImpact: 'High: stable across sites, survives cookie clearing.',
    limitations: ['The same model of device with the same OS and browser may produce identical output.', 'Browser updates can change the output.'],
    defenses: 'Brave and Safari add noise; Tor Browser and Firefox RFP block or prompt for extraction; Firefox FPP adds noise in some modes.',
    mitigations: ['Use a browser that randomizes or blocks canvas read-back (Brave, Safari AFP, Firefox FPP/RFP, Tor/Mullvad Browser).'],
    sources: ['acar-2014', 'laperdrix-2016', 'imc-2025-canvas', 'mdn-canvas', 'fpjs-sources', 'brave-fp2', 'tor-manual-fp', 'webkit-pb2'],
    run: async ({ repeat }) => {
      if (!g.document) return unsupported('DOM unavailable');
      const first = drawScene();
      if (!first) return unsupported('2D canvas context unavailable');
      let img0;
      try { img0 = first.ctx.getImageData(0, 0, W, H).data; } catch (e) { return blocked(`Pixel read-back refused: ${e.message}`); }
      // Our scene is a gradient, so a uniform buffer means read-back was replaced (e.g. all-white placeholder).
      const blank = img0.every((v, i) => v === img0[i % 4]);
      if (blank) return blocked('Canvas read-back returned an empty image (extraction blocked).', { image: first.canvas.toDataURL() });
      const diffs = [];
      for (let i = 1; i < Math.max(2, repeat); i++) {
        const d = drawScene().ctx.getImageData(0, 0, W, H).data;
        let n = 0; for (let j = 0; j < d.length; j++) if (d[j] !== img0[j]) n++;
        diffs.push(n);
      }
      const randomized = diffs.some((n) => n > 0);
      const { hex, algorithm } = await digest(Array.from(img0).join(','));
      return measured({ digest: hex, algorithm, width: W, height: H, renders: diffs.length + 1, differingBytesVsFirst: diffs },
        { normalized: randomized ? null : hex, protection: randomized ? 'randomized' : 'none-detected', image: first.canvas.toDataURL(),
          notes: randomized ? ['Repeated renders differed: output appears randomized, so the digest is not a stable identifier.'] : [] });
    },
  }),

  define({
    id: 'webgl-info', version: '2.0.0', category: 'rendering', name: 'WebGL renderer & capabilities',
    simple: 'Which graphics chip you have and what it can do, as reported by the browser\'s 3D feature.',
    how: 'Pages can open the browser\'s 3D graphics feature (WebGL) and ask for its version, the list of extra features, and sometimes the exact name of your graphics chip. The lab closes it again right away.',
    technical: 'Unmasked renderer strings such as "ANGLE (NVIDIA, GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0)" are very specific. Limits and extensions vary with GPU, driver and browser. Software renderers (SwiftShader, llvmpipe) are typical of headless or virtualized environments. A missing renderer string does <em>not</em> identify a particular privacy product.',
    exposes: 'GPU vendor/model (if exposed), driver capabilities, extension list.', dataType: 'object', apis: ['WebGLRenderingContext', 'WEBGL_debug_renderer_info'],
    purpose: ['identification', 'fraud-prevention', 'bot-detection'], relevance: 'high', relevanceBasis: 'Renderer strings and parameters vary widely; included in FingerprintJS and Cover Your Tracks.',
    stability: 'stable',
    combinesWith: [{ id: 'webgl-render', basis: 'documented', source: 'cao-2017', note: 'Rendering tasks plus parameters identify hardware.' },
      { id: 'consistency', basis: 'hypothetical', note: 'GPU vs claimed OS.' }],
    privacyImpact: 'High when the unmasked renderer is exposed.',
    limitations: ['Values are shared by everyone with the same GPU + driver + browser.', 'Some browsers return generic strings by design.'],
    defenses: 'Safari reports generic "Apple GPU"; Firefox RFP and Tor Browser restrict values; Brave randomizes some.',
    mitigations: ['Use a browser that masks renderer details. Disabling WebGL is possible but breaks maps and 3D sites.'],
    sources: ['mdn-webgl-debug', 'fpjs-sources', 'eff-cyt-about', 'cao-2017'],
    run: async () => {
      if (!g.document) return unsupported('DOM unavailable');
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl2') || c.getContext('webgl');
      if (!gl) return blocked('WebGL context creation failed (disabled, blocklisted GPU, or blocked by a privacy setting).', { protection: 'unknown' });
      try {
        const dbg = gl.getExtension('WEBGL_debug_renderer_info');
        const raw = {
          context: typeof g.WebGL2RenderingContext !== 'undefined' && gl instanceof g.WebGL2RenderingContext ? 'webgl2' : 'webgl',
          version: gl.getParameter(gl.VERSION), shadingLanguage: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
          vendor: gl.getParameter(gl.VENDOR), renderer: gl.getParameter(gl.RENDERER),
          unmaskedVendor: dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : null, unmaskedRenderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : null,
          extensions: (gl.getSupportedExtensions() || []).slice().sort(),
        };
        const software = /swiftshader|llvmpipe|software/i.test(raw.unmaskedRenderer || raw.renderer || '');
        return measured(raw, { notes: [dbg ? 'Unmasked renderer exposed via WEBGL_debug_renderer_info.' : 'Unmasked renderer not exposed.', ...(software ? ['Software renderer detected (common in VMs, headless and remote desktops).'] : [])] });
      } finally { releaseGL(gl); }
    },
  }),

  define({
    id: 'webgl-precision', version: '1.0.0', category: 'rendering', name: 'WebGL shader precision & limits', tier: 'advanced',
    simple: 'How precise your graphics chip\'s maths is and how big its internal limits are.',
    how: 'The page asks the graphics chip about the precision of its calculations and the maximum sizes it supports. These come from the chip and its driver, and still work when the chip\'s name is hidden.',
    technical: 'Precision ranges and limits come from the GPU driver (often through ANGLE on Windows/macOS). They separate GPU families and driver generations, and still work when the renderer string itself is masked. Mobile GPUs often report reduced medium-precision ranges.',
    exposes: 'Shader precision formats and GPU limits.', dataType: 'object', apis: ['WebGLRenderingContext.getShaderPrecisionFormat', 'WebGLRenderingContext.getParameter'],
    purpose: ['identification', 'fraud-prevention'], relevance: 'medium', relevanceBasis: 'Varies by GPU/driver; available even when renderer strings are masked.', stability: 'stable',
    combinesWith: [{ id: 'webgl-info', basis: 'documented', source: 'cao-2017', note: 'Hardware-level WebGL features.' }],
    privacyImpact: 'Moderate.', limitations: ['Shared by everyone with the same GPU/driver/browser stack.'],
    defenses: 'Firefox RFP and Tor report standardized values.', mitigations: ['Use a browser with WebGL protections.'],
    sources: ['cao-2017', 'mdn-webgl-debug'],
    run: async () => {
      if (!g.document) return unsupported('DOM unavailable');
      const gl = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
      if (!gl) return blocked('WebGL context creation failed.', { protection: 'unknown' });
      try {
        const precision = {};
        for (const [sn, s] of [['vertex', gl.VERTEX_SHADER], ['fragment', gl.FRAGMENT_SHADER]]) {
          for (const p of ['LOW_FLOAT', 'MEDIUM_FLOAT', 'HIGH_FLOAT', 'LOW_INT', 'MEDIUM_INT', 'HIGH_INT']) {
            const f = gl.getShaderPrecisionFormat(s, gl[p]);
            precision[`${sn}.${p}`] = f ? [f.rangeMin, f.rangeMax, f.precision] : null;
          }
        }
        const limits = {};
        for (const p of ['MAX_TEXTURE_SIZE', 'MAX_CUBE_MAP_TEXTURE_SIZE', 'MAX_RENDERBUFFER_SIZE', 'MAX_VIEWPORT_DIMS', 'MAX_VERTEX_ATTRIBS',
          'MAX_VERTEX_UNIFORM_VECTORS', 'MAX_FRAGMENT_UNIFORM_VECTORS', 'MAX_VARYING_VECTORS', 'MAX_TEXTURE_IMAGE_UNITS', 'MAX_VERTEX_TEXTURE_IMAGE_UNITS',
          'MAX_COMBINED_TEXTURE_IMAGE_UNITS', 'ALIASED_LINE_WIDTH_RANGE', 'ALIASED_POINT_SIZE_RANGE', 'MAX_SAMPLES', 'MAX_3D_TEXTURE_SIZE', 'MAX_DRAW_BUFFERS']) {
          if (gl[p] === undefined) continue; // WebGL2-only constants on a WebGL1 context
          const v = gl.getParameter(gl[p]); limits[p] = v && typeof v === 'object' ? Array.from(v) : v;
        }
        return measured({ precision, limits });
      } finally { releaseGL(gl); }
    },
  }),

  define({
    id: 'webgl-context-attrs', version: '1.0.0', category: 'rendering', name: 'WebGL context attributes', tier: 'advanced',
    simple: 'The drawing settings your browser actually gives a page that asks for 3D graphics.',
    how: 'The page asks for a 3D drawing surface with default settings and reads back what it got. It also checks whether the browser refuses when only fast hardware would do, which happens with software-only graphics.',
    technical: 'Granted attributes depend on GPU, driver and browser policy. A refusal under <code>failIfMajorPerformanceCaveat: true</code> means the GPU is blocklisted or rendering falls back to software, common in VMs and headless servers.',
    exposes: 'Granted context attributes and WebGL versions.', dataType: 'object', apis: ['WebGLRenderingContext.getContextAttributes', 'WebGL2RenderingContext'],
    purpose: ['identification', 'bot-detection'], relevance: 'low', relevanceBasis: 'Few distinct combinations.', stability: 'stable',
    combinesWith: [{ id: 'webgl-info', basis: 'hypothetical', note: 'Same GPU stack.' }, { id: 'automation', basis: 'hypothetical', note: 'Software rendering hint.' }],
    privacyImpact: 'Low.', limitations: ['Few distinct values across common hardware.'],
    defenses: 'None common.', mitigations: ['No action needed.'], sources: ['mdn-webgl-debug'],
    run: async () => {
      if (!g.document) return unsupported('DOM unavailable');
      const out = {};
      for (const kind of ['webgl', 'webgl2']) {
        const gl = document.createElement('canvas').getContext(kind);
        out[kind] = gl ? gl.getContextAttributes() : null;
        releaseGL(gl);
      }
      if (!out.webgl && !out.webgl2) return blocked('No WebGL context could be created.', { protection: 'unknown' });
      const strict = document.createElement('canvas').getContext('webgl', { failIfMajorPerformanceCaveat: true });
      out.majorPerformanceCaveat = !strict; releaseGL(strict);
      return measured(out);
    },
  }),

  define({
    id: 'emoji-render', version: '1.0.0', category: 'rendering', name: 'Canvas emoji & glyph rendering', repeatable: true,
    simple: 'Emoji are drawn and their pixels turned into a code. Emoji artwork differs between systems and versions.',
    how: 'The page draws a row of emoji and special characters, reads back the pixels and makes a short code from them. Your system\'s emoji style and version decide what they look like.',
    technical: 'Emoji come from the OS font (Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji) and change with OS releases. Missing glyphs render as "tofu" boxes. Unlike width metrics, pixel output also captures color and artwork, so it distinguishes OS versions very well.',
    exposes: 'A digest of emoji/glyph pixels.', dataType: 'hash', apis: ['CanvasRenderingContext2D.fillText', 'CanvasRenderingContext2D.getImageData'],
    purpose: ['identification', 'bot-detection'], relevance: 'medium', relevanceBasis: 'Strongly tied to OS version; correlated with canvas output.', stability: 'stable',
    combinesWith: [{ id: 'canvas-2d', basis: 'hypothetical', note: 'Same rendering stack.' }, { id: 'text-metrics', basis: 'hypothetical', note: 'Glyph geometry.' }],
    privacyImpact: 'Moderate.', limitations: ['Largely redundant with OS version for common systems.'],
    defenses: 'Canvas noise (Brave, Safari AFP), extraction blocking (Tor, RFP).', mitigations: ['Use a browser with canvas protections.'],
    sources: ['mdn-canvas', 'laperdrix-2016'],
    run: async ({ repeat }) => {
      if (!g.document) return unsupported('DOM unavailable');
      const draw = () => {
        const c = document.createElement('canvas'); c.width = 260; c.height = 40;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.font = '24px sans-serif'; ctx.textBaseline = 'top';
        ctx.fillText('😀🫠🧑‍💻🏳️‍🌈🇸🇪🪿 ∑ж中ﷺ', 2, 6);
        return { c, data: ctx.getImageData(0, 0, c.width, c.height).data };
      };
      const first = draw();
      if (first.data.every((v) => v === 0)) return blocked('Canvas read-back returned an empty image.');
      let differing = 0;
      for (let i = 1; i < Math.max(2, repeat); i++) { const d = draw().data; if (d.some((v, j) => v !== first.data[j])) differing++; }
      const { hex, algorithm } = await digest(Array.from(first.data).join(','));
      return measured({ digest: hex, algorithm, rendersDifferingFromFirst: differing },
        { normalized: differing ? null : hex, protection: differing ? 'randomized' : 'none-detected', image: first.c.toDataURL() });
    },
  }),

  define({
    id: 'webgl-render', version: '1.0.0', category: 'rendering', name: 'WebGL rendering digest', repeatable: true, tier: 'advanced',
    simple: 'Your graphics chip draws a small 3D image, and the result is turned into a code.',
    how: 'The page asks the graphics chip to draw a coloured triangle with some maths in it and reads back the pixels. Different chips and drivers round the maths slightly differently, which changes the image.',
    technical: 'Floating-point precision in GPU shader cores, driver compilers and rasterization rules changes edge and gradient pixels. Cao et al. (NDSS 2017) used dozens of such rendering tasks for cross-browser device identification.',
    exposes: 'A digest of GPU-rendered pixels.', dataType: 'hash', apis: ['WebGLRenderingContext.readPixels'],
    purpose: ['identification', 'fraud-prevention'], relevance: 'medium', relevanceBasis: 'Research shows cross-browser identification; many devices with identical GPUs collide.',
    stability: 'stable',
    combinesWith: [{ id: 'webgl-info', basis: 'documented', source: 'cao-2017', note: 'Hardware features.' }],
    privacyImpact: 'Moderate to high, depending on GPU diversity.',
    limitations: ['Devices with the same GPU/driver/browser often collide.'],
    defenses: 'Same as WebGL information.', mitigations: ['Use a browser with WebGL protections.'],
    sources: ['cao-2017', 'drawnapart-2022'],
    run: async ({ repeat }) => {
      if (!g.document) return unsupported('DOM unavailable');
      const renderOnce = () => {
        const c = document.createElement('canvas'); c.width = 64; c.height = 64;
        const gl = c.getContext('webgl', { preserveDrawingBuffer: true, antialias: false });
        if (!gl) return null;
        try {
          const prog = gl.createProgram();
          const src = [[gl.VERTEX_SHADER, 'attribute vec2 p;varying vec2 v;void main(){v=p;gl_Position=vec4(p,0.,1.);}'],
            [gl.FRAGMENT_SHADER, 'precision highp float;varying vec2 v;void main(){float a=sin(v.x*43.17)*cos(v.y*31.7)+tan(v.x*v.y*2.3);gl_FragColor=vec4(fract(a*91.3),v.x*.5+.5,v.y*.5+.5,1.);}']];
          for (const [type, s] of src) { const sh = gl.createShader(type); gl.shaderSource(sh, s); gl.compileShader(sh); gl.attachShader(prog, sh); }
          gl.linkProgram(prog); gl.useProgram(prog);
          gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -0.6, -0.2, 1]), gl.STATIC_DRAW);
          const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
          gl.clearColor(0.05, 0.05, 0.1, 1); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 3);
          const px = new Uint8Array(64 * 64 * 4); gl.readPixels(0, 0, 64, 64, gl.RGBA, gl.UNSIGNED_BYTE, px);
          return { px, url: c.toDataURL() };
        } finally { releaseGL(gl); }
      };
      const first = renderOnce();
      if (!first) return blocked('WebGL context creation failed.', { protection: 'unknown' });
      if (first.px.every((v) => v === 0)) return blocked('readPixels returned an empty buffer.');
      let changed = 0;
      for (let i = 1; i < Math.max(2, repeat); i++) { const r = renderOnce(); if (!r || r.px.some((v, j) => v !== first.px[j])) changed++; }
      const { hex, algorithm } = await digest(Array.from(first.px).join(','));
      return measured({ digest: hex, algorithm, renders: Math.max(2, repeat), rendersDifferingFromFirst: changed },
        { normalized: changed ? null : hex, protection: changed ? 'randomized' : 'none-detected', image: first.url });
    },
  }),

  define({
    id: 'webgpu', version: '1.0.0', category: 'rendering', name: 'WebGPU adapter information', tier: 'advanced', maturity: 'research', secureContext: true,
    simple: 'What the newest graphics feature (WebGPU) says about your graphics chip.',
    how: 'WebGPU is the newest way for pages to use the graphics chip. When asked, it describes the chip\'s maker and family, which optional features it has, and its limits. The lab only asks; it does not run anything on the chip.',
    technical: 'Browsers bucket adapter info and limits to reduce entropy, but vendor/architecture plus feature sets still distinguish hardware classes. Research (DrawnApart, NDSS 2022) showed GPU timing can distinguish identical GPU models; WebGPU compute makes such timing easier. This lab does <em>not</em> run timing workloads.',
    exposes: 'GPU vendor/architecture (bucketed), supported features, limits.', dataType: 'object', apis: ['navigator.gpu', 'GPUAdapter.info'],
    purpose: ['identification'], relevance: 'medium', relevanceBasis: 'New surface; entropy depends on browser bucketing.', stability: 'stable',
    combinesWith: [{ id: 'webgl-info', basis: 'hypothetical', note: 'Same GPU described through two APIs.' }],
    privacyImpact: 'Moderate.', limitations: ['Availability varies by browser, OS and GPU blocklists.'],
    defenses: 'Browsers bucket limits; Brave restricts adapter info.', mitigations: ['No specific action; prefer browsers that bucket WebGPU info.'],
    sources: ['drawnapart-2022', 'w3c-fp-guidance'],
    run: async () => {
      if (!g.navigator?.gpu) return unsupported('navigator.gpu not available');
      const adapter = await settleWithin(navigator.gpu.requestAdapter(), 3000, null);
      if (!adapter) return blocked('No adapter returned (GPU blocklisted, disabled, or unavailable).', { protection: 'unknown' });
      const info = adapter.info || {};
      const limits = {}; for (const k in adapter.limits) limits[k] = adapter.limits[k];
      return measured({ vendor: info.vendor || null, architecture: info.architecture || null, device: info.device || null, description: info.description || null,
        features: Array.from(adapter.features || []).sort(), limits });
    },
  }),

  define({
    id: 'fonts', version: '1.0.0', category: 'rendering', name: 'Font availability (inference)',
    simple: 'Which fonts seem to be installed on your computer, guessed by measuring text.',
    how: 'Pages cannot list your fonts, so they measure them: text is written in a fallback font, then again with a font name in front. If the size changes, that font is probably installed. Office, design tools and language packs all add fonts.',
    technical: 'Classic offset-measurement technique. Installed software (Office, Adobe, IDEs) and language packs add fonts. A match is an <strong>inference</strong>: a web font or font alias can produce false positives, and identical metrics can produce false negatives. Safari restricts web content to OS-bundled fonts.',
    exposes: 'A list of probably available fonts from a 40-font candidate list.', dataType: 'list', apis: ['HTMLElement.offsetWidth', 'CSS font-family'],
    purpose: ['identification', 'fraud-prevention'], relevance: 'high', relevanceBasis: 'Font lists were among the most identifying attributes in EFF and AmIUnique studies.', stability: 'stable',
    combinesWith: [{ id: 'canvas-2d', basis: 'documented', source: 'laperdrix-2016', note: 'Canvas text rendering depends on fonts.' },
      { id: 'consistency', basis: 'hypothetical', note: 'Windows fonts on a "Mac" UA is contradictory.' }],
    privacyImpact: 'High for users with many non-default fonts.',
    limitations: ['Inference, not proof of installation.', 'Only a short candidate list is tested to keep the test light.'],
    defenses: 'Safari exposes only system fonts; Tor Browser bundles fonts; Firefox RFP restricts fonts; Brave randomizes.',
    mitigations: ['Avoid installing unusual fonts system-wide if anti-fingerprinting matters to you.', 'Use a browser that restricts font visibility.'],
    sources: ['fpjs-sources', 'eff-cyt-about', 'webkit-tp', 'tor-manual-fp', 'eckersley-2010'],
    run: async ({ options }) => {
      if (!g.document?.body) return unsupported('DOM unavailable');
      const list = Array.isArray(options?.fontList) && options.fontList.length ? options.fontList : FONT_CANDIDATES;
      const span = document.createElement('span');
      span.setAttribute('aria-hidden', 'true');
      span.style.cssText = 'position:absolute;left:-9999px;top:0;font-size:64px;line-height:normal;white-space:nowrap';
      span.textContent = 'mmmmmmmmmmlli1WQ@#';
      document.body.appendChild(span);
      try {
        const bases = ['monospace', 'serif', 'sans-serif'];
        const base = {}; for (const b of bases) { span.style.fontFamily = b; base[b] = [span.offsetWidth, span.offsetHeight]; }
        const measurements = {}, detected = [];
        for (const f of list) {
          const hits = bases.filter((b) => { span.style.fontFamily = `"${f}", ${b}`; return span.offsetWidth !== base[b][0] || span.offsetHeight !== base[b][1]; });
          measurements[f] = hits.length ? `differs vs ${hits.join(', ')}` : 'same as fallbacks';
          if (hits.length) detected.push(f);
        }
        return measured({ candidates: list.length, detected, baseline: base, measurements }, { confidence: 'medium', normalized: detected });
      } finally { span.remove(); }
    },
  }),

  define({
    id: 'text-metrics', version: '2.0.0', category: 'rendering', name: 'Canvas text metrics', tier: 'advanced',
    simple: 'How wide and tall text and emoji are drawn in your system\'s default fonts.',
    how: 'The page measures a sentence in the standard font styles (serif, sans-serif, monospace and so on) and a few emoji. The exact sizes depend on which fonts your system uses by default and which emoji version it has.',
    technical: 'Generic family names map to OS- and user-configured default fonts, so their metrics reveal font preferences (FingerprintJS\'s <code>font_preferences</code> source uses this idea). Emoji metrics reveal the emoji font version. This works even when the UA is altered.',
    exposes: 'Text metrics for default font families, emoji and symbols.', dataType: 'object', apis: ['CanvasRenderingContext2D.measureText'],
    purpose: ['identification', 'bot-detection'], relevance: 'medium', relevanceBasis: 'Correlates strongly with OS version.', stability: 'stable',
    combinesWith: [{ id: 'fonts', basis: 'hypothetical', note: 'Both reflect OS fonts.' }],
    privacyImpact: 'Moderate.', limitations: ['Largely redundant with OS version.'],
    defenses: 'Tor Browser bundles fonts.', mitigations: ['No practical user action.'],
    sources: ['fpjs-sources'],
    run: async () => {
      if (!g.document) return unsupported('DOM unavailable');
      const ctx = document.createElement('canvas').getContext('2d');
      if (!ctx) return unsupported('2D canvas unavailable');
      const m3 = (m) => ({ width: +m.width.toFixed(3), ascent: +(m.actualBoundingBoxAscent || 0).toFixed(3), descent: +(m.actualBoundingBoxDescent || 0).toFixed(3) });
      const families = {};
      for (const f of ['serif', 'sans-serif', 'monospace', 'system-ui', 'cursive']) { ctx.font = `20px ${f}`; families[f] = m3(ctx.measureText('Sphinx of black quartz, judge my vow 0123')); }
      ctx.font = '32px sans-serif';
      const glyphs = {};
      for (const e of ['😀', '🫠', '🧑‍💻', '🏳️‍🌈', '🇸🇪', '🪿', '∑', 'Ж']) glyphs[e] = m3(ctx.measureText(e));
      return measured({ families, glyphs });
    },
  }),

  define({
    id: 'svg-support', version: '1.0.0', category: 'rendering', name: 'SVG rendering & API support', tier: 'advanced',
    simple: 'Whether vector graphics features exist, and how your browser measures vector text and shapes.',
    how: 'The page checks for a few vector graphics (SVG) features and measures the length of a hidden line of text and a curve. The exact numbers depend on fonts and the browser.',
    technical: 'SVG text length depends on font rasterization like canvas text, and path length on the engine\'s curve approximation. Both are rarely noised by anti-fingerprinting defenses. The SVG element is removed immediately.',
    exposes: 'SVG API presence and geometry measurements.', dataType: 'object', apis: ['SVGTextContentElement.getComputedTextLength', 'SVGGraphicsElement.getBBox', 'SVGGeometryElement.getTotalLength'],
    purpose: ['identification', 'compatibility'], relevance: 'low', relevanceBasis: 'Correlates with fonts and engine; largely redundant with canvas text.', stability: 'semi-stable',
    combinesWith: [{ id: 'text-metrics', basis: 'hypothetical', note: 'Font-dependent text length.' }, { id: 'dom-rect', basis: 'hypothetical', note: 'Layout geometry.' }],
    privacyImpact: 'Low.', limitations: ['Changes with page zoom and font settings.'],
    defenses: 'Firefox RFP restricts fonts, which affects text length.', mitigations: ['No practical user action.'], sources: ['w3c-fp-guidance'],
    run: async () => {
      if (!g.document?.body) return unsupported('DOM unavailable');
      const NS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('width', '300'); svg.setAttribute('height', '60');
      svg.style.cssText = 'position:absolute;left:-9999px;top:0';
      const text = document.createElementNS(NS, 'text'); text.setAttribute('x', '2'); text.setAttribute('y', '30'); text.setAttribute('font-size', '17');
      text.textContent = 'Fjordbank glyphs vext quiz';
      const path = document.createElementNS(NS, 'path'); path.setAttribute('d', 'M10 50 C 60 0, 140 90, 290 40 S 200 10, 20 55');
      svg.append(text, path); document.body.appendChild(svg);
      try {
        const bb = text.getBBox();
        return measured({
          apis: { SVGGeometryElement: 'SVGGeometryElement' in g, SVGTextContentElement: 'SVGTextContentElement' in g, SVGFilterElement: 'SVGFilterElement' in g,
            SVGAnimationElement: 'SVGAnimationElement' in g, SVGForeignObjectElement: 'SVGForeignObjectElement' in g },
          textLength: text.getComputedTextLength(), textBBox: [bb.width, bb.height], pathLength: path.getTotalLength(),
        });
      } finally { svg.remove(); }
    },
  }),

  define({
    id: 'dom-rect', version: '1.0.0', category: 'rendering', name: 'Sub-pixel layout (DOMRect)', tier: 'advanced',
    simple: 'Exact sizes of tilted text on the page, measured to many decimal places.',
    how: 'The page places a hidden, slightly rotated piece of text and asks for its exact size. The tiny decimals depend on your browser version and how it renders fonts, and privacy tools rarely change them.',
    technical: 'Layout uses floating-point math influenced by fonts, zoom and engine version. Unlike canvas, these APIs are rarely noised, so it is a useful complementary signal.',
    exposes: 'High-precision layout geometry.', dataType: 'object', apis: ['Element.getClientRects', 'Element.getBoundingClientRect'],
    purpose: ['identification'], relevance: 'medium', relevanceBasis: 'Varies with fonts and engine; rarely protected.', stability: 'semi-stable',
    combinesWith: [{ id: 'fonts', basis: 'hypothetical', note: 'Font metrics drive layout.' }],
    privacyImpact: 'Moderate.', limitations: ['Changes with page zoom.'],
    defenses: 'Firefox RFP rounds some values.', mitigations: ['No practical user action.'],
    sources: ['w3c-fp-guidance'],
    run: async () => {
      if (!g.document?.body) return unsupported('DOM unavailable');
      const d = document.createElement('div');
      d.setAttribute('aria-hidden', 'true');
      d.style.cssText = 'position:absolute;left:-9999px;top:0;font:13.37px serif;transform:rotate(13.7deg) skewX(3.1deg) scale(1.0731);';
      d.textContent = 'Fingerprint ŧ‰ÆÐ wobble';
      document.body.appendChild(d);
      try {
        const rects = Array.from(d.getClientRects()).map((r) => [r.width, r.height]);
        const b = d.getBoundingClientRect();
        return measured({ clientRects: rects, bounding: [b.width, b.height] });
      } finally { d.remove(); }
    },
  }),
];
