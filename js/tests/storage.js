// 5.10 Storage and persistence. Uses a dedicated namespace; every temporary record is deleted before the test returns.
// No persistent identifier is created and nothing is "respawned".
import { define, g } from './define.js';
import { measured, inferred, unsupported } from '../core/schema.js';
import { settleWithin } from '../core/util.js';

export const TEMP_KEY = 'fplab-probe';
const TEMP_DB = 'fplab-probe-db';
const TEMP_CACHE = 'fplab-probe-cache';
const VALUE = 'probe';

async function probe(name, fn) {
  try { return await settleWithin(fn(), 1500, 'no-answer'); } catch (e) { return `error: ${e.name}`; }
}

const mechanisms = {
  cookie: async () => {
    document.cookie = `${TEMP_KEY}=${VALUE}; path=/; SameSite=Strict; max-age=60`;
    const ok = document.cookie.includes(`${TEMP_KEY}=${VALUE}`);
    document.cookie = `${TEMP_KEY}=; path=/; max-age=0`;
    return ok ? 'works' : 'blocked';
  },
  localStorage: async () => { localStorage.setItem(TEMP_KEY, VALUE); const ok = localStorage.getItem(TEMP_KEY) === VALUE; localStorage.removeItem(TEMP_KEY); return ok ? 'works' : 'blocked'; },
  sessionStorage: async () => { sessionStorage.setItem(TEMP_KEY, VALUE); const ok = sessionStorage.getItem(TEMP_KEY) === VALUE; sessionStorage.removeItem(TEMP_KEY); return ok ? 'works' : 'blocked'; },
  indexedDB: () => new Promise((resolve) => {
    if (!g.indexedDB) return resolve('unsupported');
    const req = indexedDB.open(TEMP_DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore('kv');
    req.onerror = () => resolve('blocked');
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction('kv', 'readwrite');
      tx.objectStore('kv').put(VALUE, 'k');
      tx.oncomplete = () => { db.close(); const del = indexedDB.deleteDatabase(TEMP_DB); del.onsuccess = del.onerror = del.onblocked = () => resolve('works'); };
      tx.onerror = () => { db.close(); resolve('blocked'); };
    };
  }),
  cacheAPI: async () => {
    if (!g.caches) return 'unsupported';
    const c = await caches.open(TEMP_CACHE);
    await c.put('/fplab-probe', new Response(VALUE));
    const ok = (await (await c.match('/fplab-probe'))?.text()) === VALUE;
    await caches.delete(TEMP_CACHE);
    return ok ? 'works' : 'blocked';
  },
};

export default [
  define({
    id: 'storage-mechanisms', version: '1.0.0', category: 'storage', name: 'Client-side storage mechanisms',
    simple: 'Checks which ways of saving data in your browser work here. A temporary test value is written, read back and deleted.',
    how: 'For cookies, localStorage, sessionStorage, IndexedDB and the Cache API, the lab writes the value <code>probe</code> under the key <code>fplab-probe</code>, reads it back, then deletes it. Service Worker support is checked but no worker is registered.',
    technical: '<ul class="mb-0"><li><strong>Cookies</strong>: sent to the server; partitioned for third parties in modern browsers.</li><li><strong>localStorage / IndexedDB / Cache</strong>: persist until cleared, per origin (and per top-level site when partitioned).</li><li><strong>sessionStorage</strong>: per tab, cleared when the tab closes.</li></ul>Trackers historically copied identifiers across all of them ("evercookie", Acar et al. 2014). This lab does <strong>not</strong> do that.',
    exposes: 'Which storage mechanisms are available and writable.', dataType: 'object', apis: ['document.cookie', 'localStorage', 'sessionStorage', 'indexedDB', 'CacheStorage', 'navigator.serviceWorker'],
    purpose: ['identification', 'analytics'], relevance: 'low', relevanceBasis: 'Availability flags; stateful tracking risk depends on how sites use them.', stability: 'stable',
    privacyImpact: 'Availability itself reveals little; it determines whether stateful tracking is possible.',
    limitations: ['Cache API requires a secure context.', 'Results inside private windows may differ.'],
    defenses: 'Browsers partition third-party storage (Firefox Total Cookie Protection, Safari ITP, Chromium storage partitioning).',
    mitigations: ['Clear site data regularly or use automatic deletion on browser close.', 'Prefer browsers that partition third-party storage.'],
    sources: ['acar-2014', 'webkit-tp', 'w3c-fp-guidance'],
    run: async () => {
      if (!g.document) return unsupported('DOM unavailable');
      const raw = {};
      for (const [name, fn] of Object.entries(mechanisms)) raw[name] = await probe(name, fn);
      raw.serviceWorker = 'serviceWorker' in (g.navigator || {}) ? 'available (not registered)' : 'unsupported';
      return measured(raw, { notes: ['All temporary probe records were deleted.'] });
    },
  }),

  define({
    id: 'storage-availability', version: '1.0.0', category: 'storage', name: 'Storage API availability matrix',
    simple: 'Which storage technologies exist in this browser. Nothing is written by this test.',
    how: 'Checks presence (and access without exceptions) of <code>localStorage</code>, <code>sessionStorage</code>, <code>indexedDB</code>, <code>caches</code>, <code>cookieStore</code>, the Origin Private File System (<code>navigator.storage.getDirectory</code>), Storage Buckets, Shared Storage, and the legacy WebSQL <code>openDatabase</code>.',
    technical: 'Access to <code>localStorage</code> can throw when storage is disabled, which is itself a signal. WebSQL\'s presence (removed from Chromium in 2022–23) distinguishes older builds; FingerprintJS checks <code>openDatabase</code> for this reason.',
    exposes: 'Presence/accessibility flags.', dataType: 'object', apis: ['localStorage', 'indexedDB', 'CacheStorage', 'StorageManager.getDirectory'],
    purpose: ['compatibility', 'identification'], relevance: 'low', relevanceBasis: 'Shared by users of the same browser and settings.', stability: 'stable',
    combinesWith: [{ id: 'storage-mechanisms', basis: 'hypothetical', note: 'Presence vs actual behaviour.' }],
    privacyImpact: 'Low.', concern: 'limitation', limitations: ['Presence does not mean writes succeed (see the temporary-storage test).'],
    defenses: 'None needed.', mitigations: ['No action needed.'], sources: ['fpjs-sources'],
    run: async () => {
      const accessible = (fn) => { try { return !!fn(); } catch { return 'throws'; } };
      return measured({ localStorage: accessible(() => g.localStorage), sessionStorage: accessible(() => g.sessionStorage), indexedDB: accessible(() => g.indexedDB),
        cacheStorage: 'caches' in g, cookieStore: 'cookieStore' in g, opfs: typeof g.navigator?.storage?.getDirectory === 'function',
        storageBuckets: 'storageBuckets' in (g.navigator || {}), sharedStorage: 'sharedStorage' in g, webSQL: typeof g.openDatabase === 'function' });
    },
  }),

  define({
    id: 'storage-policy', version: '1.0.0', category: 'storage', name: 'Cookie & storage policy hints', tier: 'advanced',
    simple: 'What the browser reveals about its cookie and storage policy for this page.',
    how: 'Reads <code>navigator.cookieEnabled</code>, asks <code>document.hasStorageAccess()</code> (no prompt), checks for <code>requestStorageAccess</code>, and reads <code>navigator.storage.persisted()</code>. In a first-party context like this page, storage access is normally granted.',
    technical: 'These answers mainly matter in third-party iframes, where browsers that partition or block third-party storage return <code>false</code> from <code>hasStorageAccess()</code>. As a top-level page, this lab can only show the first-party view, which is why the result is an indicator.',
    exposes: 'Cookie and storage-access policy indicators.', dataType: 'object', apis: ['Document.hasStorageAccess', 'StorageManager.persisted', 'navigator.cookieEnabled'],
    purpose: ['privacy-defense', 'compatibility'], relevance: 'low', relevanceBasis: 'Policy indicator rather than identifier.', stability: 'stable',
    combinesWith: [{ id: 'storage-partitioning', basis: 'hypothetical', note: 'Partitioning indicators.' }],
    privacyImpact: 'Low.', concern: 'limitation', limitations: ['First-party view only; third-party behaviour cannot be observed without a cross-site setup.'],
    defenses: 'Not applicable.', mitigations: ['Use a browser that blocks or partitions third-party cookies by default.'], sources: ['webkit-tp', 'w3c-fp-guidance'],
    run: async () => {
      const d = g.document || {};
      return measured({ cookieEnabled: g.navigator?.cookieEnabled ?? null,
        hasStorageAccess: d.hasStorageAccess ? await settleWithin(d.hasStorageAccess().catch(() => null), 1000, null) : null,
        requestStorageAccess: typeof d.requestStorageAccess === 'function',
        persisted: g.navigator?.storage?.persisted ? await settleWithin(navigator.storage.persisted().catch(() => null), 1000, null) : null });
    },
  }),

  define({
    id: 'storage-quota', version: '1.0.0', category: 'storage', name: 'Storage quota estimate',
    simple: 'How much space the browser would let this site use. It is often derived from your disk size.',
    how: 'Calls <code>navigator.storage.estimate()</code> and reports the quota and current usage. Nothing is written.',
    technical: 'Chromium derives the quota from total disk size (a share of it), which leaks a disk-size bucket. In private windows quotas are often much smaller, a known private-mode heuristic. Safari and Firefox bucket the value.',
    exposes: 'Quota (bytes), usage, persistence state.', dataType: 'object', apis: ['StorageManager.estimate', 'StorageManager.persisted'],
    purpose: ['identification'], relevance: 'medium', relevanceBasis: 'Disk-size bucket in Chromium; bucketed elsewhere.', stability: 'semi-stable', secureContext: true,
    privacyImpact: 'Moderate in Chromium; low elsewhere.', limitations: ['Varies with free disk space over time in some browsers.'],
    defenses: 'Bucketed quotas (Safari, Firefox).', mitigations: ['No practical action.'], sources: ['w3c-fp-guidance'],
    run: async () => {
      if (!g.navigator?.storage?.estimate) return unsupported('StorageManager.estimate not available (needs a secure context).');
      const e = await settleWithin(navigator.storage.estimate(), 1500, null);
      if (!e) return { status: 'error', error: 'estimate() did not answer' };
      const persisted = navigator.storage.persisted ? await settleWithin(navigator.storage.persisted(), 800, null) : null;
      return measured({ quotaBytes: e.quota, usageBytes: e.usage, quotaGB: +(e.quota / 1e9).toFixed(2), persisted },
        { normalized: Math.round(e.quota / 1e9) });
    },
  }),

  define({
    id: 'storage-partitioning', version: '2.0.0', category: 'storage', name: 'Service worker & partitioning-relevant APIs', tier: 'advanced', maturity: 'speculative',
    simple: 'Service worker support plus hints about whether your browser keeps third-party storage separate per website. Indicators only, not proof.',
    how: 'Checks <code>navigator.serviceWorker</code> (and whether this page is controlled by one; none is registered), <code>SharedWorker</code>, <code>BroadcastChannel</code>, the Storage Access API (<code>document.hasStorageAccess</code>), <code>cookieStore</code>, and the ad-related Topics and Protected Audience APIs. Measuring partitioning reliably requires a cross-site test server, which this static app does not use.',
    technical: 'Partitioning keys third-party storage by top-level site, defeating classic cross-site cookie/localStorage tracking. The Storage Access API usually exists <em>because</em> the browser partitions or blocks third-party storage. API presence is still only an indicator.',
    exposes: 'Presence of partitioning-related APIs.', dataType: 'object', apis: ['Document.hasStorageAccess', 'CookieStore', 'Document.browsingTopics'],
    purpose: ['privacy-defense', 'advertising'], relevance: 'low', relevanceBasis: 'Indicator of browser policy, not an identifier.', stability: 'stable',
    privacyImpact: 'Describes a defense rather than a leak.', concern: 'limitation',
    limitations: ['Inference only; actual partitioning behaviour cannot be verified without a cross-site setup.'],
    defenses: 'Not applicable.', mitigations: ['Use a browser with third-party storage partitioning (default in Firefox, Safari, Brave, and Chromium-based browsers).'],
    sources: ['webkit-tp', 'w3c-fp-guidance'],
    run: async () => {
      const d = g.document || {};
      const sw = g.navigator?.serviceWorker;
      return inferred({ serviceWorker: !!sw, controlledByServiceWorker: !!sw?.controller, sharedWorker: 'SharedWorker' in g, broadcastChannel: 'BroadcastChannel' in g,
        storageAccessAPI: 'hasStorageAccess' in d, cookieStore: 'cookieStore' in g, topicsAPI: 'browsingTopics' in d,
        protectedAudience: 'joinAdInterestGroup' in (g.navigator || {}), likelyPartitioned: 'hasStorageAccess' in d ? 'probably' : 'unknown' }, { confidence: 'low' });
    },
  }),
];
