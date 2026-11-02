// Checks that every source URL in data/sources.json still answers. Reports dead links; does not verify claims.
// Usage: node scripts/check-links.mjs [--strict]   (--strict exits 1 on any dead link)
import fs from 'node:fs';

const { sources } = JSON.parse(fs.readFileSync(new URL('../data/sources.json', import.meta.url)));
const strict = process.argv.includes('--strict');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140 Safari/537.36 fplab-link-check';

async function probe(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, { method, redirect: 'follow', headers: { 'user-agent': UA, accept: 'text/html,application/pdf,*/*' }, signal: AbortSignal.timeout(20000) });
      if (res.ok || (method === 'GET' && res.status < 500)) return { status: res.status, final: res.url };
      if (method === 'GET') return { status: res.status, final: res.url };
    } catch (e) { if (method === 'GET') return { status: 0, error: e.name }; }
  }
}

const rows = await Promise.all(Object.entries(sources).map(async ([id, s]) => ({ id, url: s.url, checked: s.dateChecked, ...(await probe(s.url)) })));
// 401/403/429 usually mean "bot blocked", not dead; they are reported separately.
const dead = rows.filter((r) => r.status === 0 || r.status === 404 || r.status === 410 || r.status >= 500);
const blocked = rows.filter((r) => [401, 403, 429].includes(r.status));
for (const r of rows.sort((a, b) => a.id.localeCompare(b.id))) console.log(`${String(r.status || 'ERR').padEnd(4)} ${r.id.padEnd(26)} ${r.url}${r.final && r.final !== r.url ? `  -> ${r.final}` : ''}`);
console.log(`\n${rows.length} sources: ${rows.length - dead.length - blocked.length} OK, ${blocked.length} refused automated requests (check by hand), ${dead.length} dead.`);
if (dead.length) console.log(`Dead: ${dead.map((r) => r.id).join(', ')}`);
process.exit(strict && dead.length ? 1 : 0);
