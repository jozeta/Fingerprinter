// Generates docs/TECHNIQUES.md from the test registry and catalogues, so documentation never drifts from code.
// Usage: node scripts/generate-docs.mjs
import fs from 'node:fs';
import { ALL_DEFINITIONS } from '../js/tests/index.js';
import { CATEGORIES, TEST_CATALOGUE_VERSION, MATURITY, EVIDENCE_LEVELS } from '../js/core/constants.js';

const sources = JSON.parse(fs.readFileSync(new URL('../data/sources.json', import.meta.url))).sources;
const { entities } = JSON.parse(fs.readFileSync(new URL('../data/entities.json', import.meta.url)));
const strip = (h) => h.replace(/<li>/g, '\n  - ').replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&times;/g, '×').trim();

let md = `# Technique Reference\n\nGenerated from the test registry (catalogue ${TEST_CATALOGUE_VERSION}, ${ALL_DEFINITIONS.length} techniques). Do not edit by hand: run \`node scripts/generate-docs.mjs\`.\n\n`;
for (const [key, cat] of Object.entries(CATEGORIES)) {
  const defs = ALL_DEFINITIONS.filter((d) => d.category === key);
  if (!defs.length) continue;
  md += `## ${cat.label}\n\n`;
  for (const d of defs) {
    const assocs = entities.flatMap((e) => e.associations.filter((a) => a.techniqueId === d.id).map((a) => `${e.name} (${a.relation}, ${EVIDENCE_LEVELS[a.evidenceLevel].short})`));
    md += `### ${d.name}\n\n\`${d.id}\` v${d.version} · ${d.tier} · ${MATURITY[d.maturity]} · relevance **${d.relevance}** · ${d.stability}${d.serverRequired ? ' · server-only' : ''}${d.interaction ? ' · user-initiated' : ''}${d.secureContext ? ' · secure context' : ''}\n\n`;
    md += `${strip(d.simple)}\n\n**How it works.** ${strip(d.how)}\n\n**Technical.** ${strip(d.technical)}\n\n**Exposes:** ${d.exposes} · **APIs:** ${d.apis.join(', ') || '—'}\n\n`;
    md += `**Limitations:**\n${d.limitations.map((l) => `- ${l}`).join('\n') || '- —'}\n\n**Defenses:** ${d.defenses}\n\n**Mitigations:**\n${d.mitigations.map((m) => `- ${m}`).join('\n')}\n\n`;
    md += `**Documented associations:** ${assocs.join('; ') || 'none'}\n\n**Sources:** ${d.sources.map((s) => `[${sources[s].title}](${sources[s].url})`).join(' · ')}\n\n`;
  }
}
fs.writeFileSync(new URL('../docs/TECHNIQUES.md', import.meta.url), md);
console.log(`docs/TECHNIQUES.md written (${ALL_DEFINITIONS.length} techniques)`);

// docs/TEST-COVERAGE.md: the required 65-test list mapped to implemented techniques (verified by tests/unit/coverage.test.mjs).
const { COVERAGE } = await import('../tests/unit/coverage-map.mjs');
const byId = Object.fromEntries(ALL_DEFINITIONS.map((d) => [d.id, d]));
let cov = `# Test coverage\n\nThe required test list mapped to implemented techniques. Each id is checked by \`tests/unit/coverage.test.mjs\`. ${ALL_DEFINITIONS.length} techniques are implemented in total; the extras beyond this list are noted at the end.\n\n`;
const mapped = new Set();
for (const [group, list] of COVERAGE) {
  cov += `## ${group}\n\n| # | Required test | Implemented as | Runs |\n|---|---|---|---|\n`;
  for (const [n, name, ids] of list) {
    ids.forEach((i) => mapped.add(i));
    const runs = ids.map((i) => (byId[i].serverRequired ? 'server-only (explained)' : byId[i].interaction ? 'when you start it' : 'automatically')).filter((v, k, a) => a.indexOf(v) === k).join(', ');
    cov += `| ${n} | ${name} | ${ids.map((i) => `\`${i}\` ${byId[i].name}`).join('<br>')} | ${runs} |\n`;
  }
  cov += '\n';
}
cov += `## Additional techniques\n\n${ALL_DEFINITIONS.filter((d) => !mapped.has(d.id)).map((d) => `- \`${d.id}\`: ${d.name}`).join('\n')}\n`;
fs.writeFileSync(new URL('../docs/TEST-COVERAGE.md', import.meta.url), cov);
console.log('docs/TEST-COVERAGE.md written');
