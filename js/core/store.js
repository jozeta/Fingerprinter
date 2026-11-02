// Opt-in local persistence. Only settings (when "remember settings" is on) and result codes the user saves explicitly.
const NS = 'fplab:';
const KEYS = { settings: `${NS}settings`, codes: `${NS}codes` };
const MAX_CODES = 10;

export const DEFAULT_SETTINGS = {
  remember: false, theme: 'system', repeat: 3, timeoutMs: 5000, includeAdvanced: true, exportRaw: false,
};

function read(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}

export function loadSettings() {
  const saved = read(KEYS.settings, null);
  return saved?.remember ? { ...DEFAULT_SETTINGS, ...saved } : { ...DEFAULT_SETTINGS };
}

/** Persists only when the user enabled "remember settings"; otherwise removes any stored copy. */
export function saveSettings(settings) {
  if (settings.remember) return write(KEYS.settings, settings);
  try { localStorage.removeItem(KEYS.settings); } catch {}
  return false;
}

/** Saved result codes: [{ id, label, savedAt, code }]. Malformed entries are dropped on read; codes are decoded and validated when used. */
export const listCodes = () => {
  const list = read(KEYS.codes, []);
  return Array.isArray(list) ? list.filter((c) => c && typeof c.code === 'string' && typeof c.label === 'string' && typeof c.id === 'string').slice(-MAX_CODES) : [];
};
export function saveCode(label, code) {
  const list = listCodes();
  list.push({ id: `c${Date.now()}`, label: String(label).slice(0, 80) || 'Saved result', savedAt: new Date().toISOString(), code });
  return write(KEYS.codes, list.slice(-MAX_CODES));
}
export const deleteCode = (id) => write(KEYS.codes, listCodes().filter((c) => c.id !== id));

/** Remove every key this app ever wrote. */
export function clearAll() {
  try { Object.keys(localStorage).filter((k) => k.startsWith(NS)).forEach((k) => localStorage.removeItem(k)); } catch {}
}

export const STORAGE_NAMESPACE = NS;
