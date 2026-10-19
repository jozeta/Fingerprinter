// Canonical serialisation and local digests. Nothing hashed here ever leaves the browser.

/** Deterministic JSON: object keys sorted recursively, undefined dropped, non-finite numbers stringified. */
export function canonicalize(value) {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'number') return Number.isFinite(value) ? JSON.stringify(value) : JSON.stringify(String(value));
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const keys = Object.keys(value).filter((k) => value[k] !== undefined).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(value[k])}`).join(',')}}`;
}

const subtle = () => globalThis.crypto?.subtle;

/** True when SHA-256 via Web Crypto is available (requires a secure context such as https or localhost). */
export const hasWebCrypto = () => !!subtle();

export async function sha256Hex(text) {
  const buf = await subtle().digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

// cyrb53: non-cryptographic fallback used only when Web Crypto is unavailable. Labeled as such in the UI.
export function cyrb53Hex(str) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0');
}

/** Digest of any value's canonical form. Returns { algorithm, hex }. */
export async function digest(value) {
  const text = typeof value === 'string' ? value : canonicalize(value);
  if (hasWebCrypto()) return { algorithm: 'SHA-256', hex: await sha256Hex(text) };
  return { algorithm: 'cyrb53 (non-cryptographic fallback)', hex: cyrb53Hex(text) };
}

/** Synchronous short digest for UI comparisons inside a single run (e.g. repeated canvas renders). */
export const quickHash = (value) => cyrb53Hex(typeof value === 'string' ? value : canonicalize(value));
