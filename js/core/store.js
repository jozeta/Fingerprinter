// Opt-in local persistence. Only settings (when "remember settings" is on) and snapshots the user saves explicitly.
const NS = 'fplab:';
const KEYS = { settings: `${NS}settings`, snapshots: `${NS}snapshots` };

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

export const listSnapshots = () => read(KEYS.snapshots, []);
export function saveSnapshot(snapshot) {
  const list = listSnapshots().filter((s) => s.id !== snapshot.id);
  list.push(snapshot);
  return write(KEYS.snapshots, list.slice(-20));
}
export const deleteSnapshot = (id) => write(KEYS.snapshots, listSnapshots().filter((s) => s.id !== id));

/** Remove every key this app ever wrote. */
export function clearAll() {
  try { Object.keys(localStorage).filter((k) => k.startsWith(NS)).forEach((k) => localStorage.removeItem(k)); } catch {}
}

export const STORAGE_NAMESPACE = NS;
