// Result codes: the whole test result as one copyable text string, for comparing setups or computers.
// Format: "FPLAB1." + base64url(deflate-raw(JSON))  (or "FPLAB1U." + base64url(JSON) when CompressionStream is missing).
// The payload is parsed as data only (JSON.parse), size-limited, and schema-validated. It is never executed.
import { canonicalize, sha256Hex, cyrb53Hex, hasWebCrypto } from '../core/hash.js';
import { STATUSES, PROTECTION, APP_VERSION, TEST_CATALOGUE_VERSION } from '../core/constants.js';

export const CODE_PREFIX = 'FPLAB1.';
export const CODE_PREFIX_PLAIN = 'FPLAB1U.';
const MAX_CODE_CHARS = 1_500_000;     // pasted text limit
const MAX_JSON_BYTES = 4_000_000;     // decompressed limit (guards against "zip bombs")
const VALUE_STATUSES = new Set(['measured', 'inferred']);

// Values that must never leave the browser inside a code, even in a full code.
const REDACT = { 'webrtc-local': (raw) => (raw ? { candidates: raw.candidates, mdnsObfuscated: raw.mdnsObfuscated, exposedAddresses: raw.exposedAddresses?.length ?? 0 } : raw) };

const b64url = {
  encode(bytes) { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); },
  decode(str) { const s = atob(str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4)); const out = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i); return out; },
};

const hasCompression = () => typeof globalThis.CompressionStream === 'function' && typeof globalThis.DecompressionStream === 'function';

async function deflate(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Inflate with a hard output limit, so a tiny malicious code cannot expand to gigabytes. */
async function inflateLimited(bytes, limit) {
  const reader = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
  const chunks = []; let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > limit) { await reader.cancel(); throw new Error('Decoded result is too large'); }
    chunks.push(value);
  }
  const out = new Uint8Array(total); let off = 0; for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
}

export async function valueDigest(value) {
  const text = canonicalize(value);
  return hasWebCrypto() ? (await sha256Hex(text)).slice(0, 20) : cyrb53Hex(text);
}

/**
 * Build the payload. includeValues=false produces a compact code with digests only (no readable data).
 * Entry: [status, protection, testVersion, digest|null, value|undefined]
 */
export async function buildPayload(results, { includeValues = true } = {}) {
  const r = {};
  for (const [id, res] of Object.entries(results)) {
    const hasValue = VALUE_STATUSES.has(res.executionStatus) && res.rawResult !== null;
    const value = hasValue ? (REDACT[id] ? REDACT[id](res.rawResult) : res.rawResult) : null;
    const digest = hasValue && res.normalizedResult !== null ? await valueDigest(res.normalizedResult) : null;
    r[id] = includeValues && hasValue ? [res.executionStatus, res.protectionIndicator, res.testVersion, digest, value] : [res.executionStatus, res.protectionIndicator, res.testVersion, digest];
  }
  return {
    v: 1, app: APP_VERSION, cat: TEST_CATALOGUE_VERSION, at: new Date().toISOString(), full: includeValues,
    ua: globalThis.navigator?.userAgent?.slice(0, 300) ?? null, r,
  };
}

export async function encodeResultCode(results, opts = {}) {
  const json = new TextEncoder().encode(JSON.stringify(await buildPayload(results, opts)));
  if (hasCompression()) return CODE_PREFIX + b64url.encode(await deflate(json));
  return CODE_PREFIX_PLAIN + b64url.encode(json);
}

/** Validate a decoded payload. Returns problems (empty = valid). */
export function validatePayload(p) {
  const problems = [];
  if (!p || typeof p !== 'object' || Array.isArray(p)) return ['Not a result object'];
  if (p.v !== 1) problems.push(`Unsupported code version "${String(p.v).slice(0, 10)}"`);
  if (!p.r || typeof p.r !== 'object' || Array.isArray(p.r)) return [...problems, 'Missing results'];
  const ids = Object.keys(p.r);
  if (ids.length > 500) problems.push('Too many results');
  for (const id of ids) {
    const e = p.r[id];
    if (!/^[a-z0-9-]{1,64}$/.test(id)) { problems.push(`Invalid check id "${id.slice(0, 30)}"`); continue; }
    if (!Array.isArray(e) || e.length < 4 || e.length > 5) { problems.push(`${id}: malformed entry`); continue; }
    if (!STATUSES[e[0]]) problems.push(`${id}: invalid status`);
    if (!PROTECTION[e[1]]) problems.push(`${id}: invalid protection value`);
    if (typeof e[2] !== 'string' || !/^\d+\.\d+\.\d+$/.test(e[2])) problems.push(`${id}: invalid test version`);
    if (e[3] !== null && !(typeof e[3] === 'string' && /^[0-9a-f]{8,64}$/.test(e[3]))) problems.push(`${id}: invalid digest`);
  }
  return problems;
}

/** Decode a pasted code. Returns { ok, problems, data }. data.r is the results map. */
export async function decodeResultCode(text) {
  const code = String(text ?? '').trim().replace(/\s+/g, '');
  if (!code) return { ok: false, problems: ['Paste a result code first.'] };
  if (code.length > MAX_CODE_CHARS) return { ok: false, problems: ['This code is too long to be a result code.'] };
  const compressed = code.startsWith(CODE_PREFIX), plain = code.startsWith(CODE_PREFIX_PLAIN);
  if (!compressed && !plain) return { ok: false, problems: ['This is not a Fingerprinting Lab result code (it should start with "FPLAB1.").'] };
  const body = code.slice(compressed ? CODE_PREFIX.length : CODE_PREFIX_PLAIN.length);
  if (!/^[A-Za-z0-9_-]+$/.test(body)) return { ok: false, problems: ['The code contains invalid characters. Copy it again in full.'] };
  let json;
  try {
    let bytes = b64url.decode(body);
    if (compressed) {
      if (!hasCompression()) return { ok: false, problems: ['This browser cannot decompress result codes. Try a recent Chrome, Edge, Firefox or Safari.'] };
      bytes = await inflateLimited(bytes, MAX_JSON_BYTES);
    } else if (bytes.length > MAX_JSON_BYTES) throw new Error('Decoded result is too large');
    json = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch (e) {
    return { ok: false, problems: [`The code could not be decoded (${e.message}). It may be cut off; copy it again in full.`] };
  }
  let data;
  try { data = JSON.parse(json); } catch { return { ok: false, problems: ['The code is damaged (invalid content).'] }; }
  const problems = validatePayload(data);
  return problems.length ? { ok: false, problems } : { ok: true, problems: [], data };
}
