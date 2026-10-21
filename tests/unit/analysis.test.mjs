// Fingerprint generation, comparison, filters/sorting, export/import, assessment, recommendations, evidence rendering.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { defs, results, FIXTURE_LABEL } from './fixtures.mjs';
import { buildProfile, defaultSelection, ineligibleReason, leaveOneOut } from '../../js/analysis/profile.js';
import { classify, compareSnapshots, snapshotFromResults, stabilityAcross } from '../../js/analysis/compare.js';
import { matches, filterAndSort, emptyFilter, indexAssociations, bestEvidence, filterEntities } from '../../js/analysis/filters.js';
import { exportResults, exportSnapshot, validateImport } from '../../js/analysis/report.js';
import { assess } from '../../js/analysis/assessment.js';
import { recommend } from '../../js/analysis/recommendations.js';
import { evidenceChip, statusChip } from '../../js/ui/components.js';
import { EVIDENCE_LEVELS } from '../../js/core/constants.js';
import { ALL_DEFINITIONS } from '../../js/tests/index.js';

const catalogue = JSON.parse(fs.readFileSync(new URL('../../data/entities.json', import.meta.url)));
assert.equal(FIXTURE_LABEL, 'synthetic-fixture');

test('fingerprint: default selection excludes volatile, randomized and server-only signals', () => {
  const sel = defaultSelection(defs, results);
  assert.deepEqual([...sel].sort(), ['fx-a', 'fx-b']);
  assert.equal(ineligibleReason(results['fx-d']), 'randomized output');
  assert.match(ineligibleReason(results['fx-srv']), /server-only/);
});

test('fingerprint: digest is deterministic, excludes timestamps, and changes when a signal is removed', async () => {
  const sel = new Set(['fx-a', 'fx-b']);
  const p1 = await buildProfile(defs, results, sel);
  const later = structuredClone(results); later['fx-a'].executionTimestamp = '2030-01-01T00:00:00.000Z'; later['fx-a'].executionDuration = 999;
  const p2 = await buildProfile(defs, later, sel);
  assert.equal(p1.digest.hex, p2.digest.hex);
  assert.ok(!p1.canonical.includes('2026') && !p1.canonical.includes('1.23'));
  const loo = await leaveOneOut(defs, results, sel);
  assert.ok(loo.variants.every((v) => v.digest !== loo.base));
  assert.deepEqual(p1.excluded.find((e) => e.testId === 'fx-c'), { testId: 'fx-c', reason: 'excluded by you' });
});

test('compare: classification covers all classes', () => {
  const m = (status, digest, protection = 'none-detected', testVersion = '1.0.0') => ({ status, digest, protection, testVersion });
  assert.equal(classify(undefined, m('measured', 'aa')), 'added');
  assert.equal(classify(m('measured', 'aa'), undefined), 'removed');
  assert.equal(classify(m('measured', 'aa'), m('measured', 'aa')), 'unchanged');
  assert.equal(classify(m('measured', 'aa'), m('measured', 'bb')), 'changed');
  assert.equal(classify(m('measured', 'aa'), m('measured', 'bb', 'randomized')), 'randomized');
  assert.equal(classify(m('measured', 'aa'), m('blocked', null, 'blocked')), 'newly-blocked');
  assert.equal(classify(m('blocked', null), m('measured', 'aa')), 'newly-available');
  assert.equal(classify(m('error', null), m('measured', 'aa')), 'inconclusive');
  assert.equal(classify(m('measured', 'aa', 'none-detected', '1.0.0'), m('measured', 'aa', 'none-detected', '2.0.0')), 'inconclusive');
});

test('compare: snapshots from results contain digests only, and stability counts distinct values', async () => {
  const s = await snapshotFromResults(results);
  assert.equal(s['fx-srv'].digest, null);
  assert.ok(!JSON.stringify(s).includes('value-b'));
  const s2 = structuredClone(s); s2['fx-b'].digest = 'ff'.repeat(32);
  const cmp = compareSnapshots(s, s2);
  assert.equal(cmp.counts.changed, 1);
  assert.equal(stabilityAcross([s, s2]).find((x) => x.testId === 'fx-b').distinct, 2);
});

test('filters: compose (AND) and sort', () => {
  const idx = indexAssociations(catalogue.entities);
  const ctx = { results: {}, assocIndex: idx, catalogueOrder: ALL_DEFINITIONS.map((d) => d.id) };
  const f = { ...emptyFilter(), categories: ['rendering'], tier: 'basic' };
  const out = filterAndSort(ALL_DEFINITIONS, f, ctx);
  assert.ok(out.length > 0 && out.every((d) => d.category === 'rendering' && d.tier === 'basic'));
  const byEntity = filterAndSort(ALL_DEFINITIONS, { ...emptyFilter(), entity: 'tor-project' }, ctx);
  assert.ok(byEntity.some((d) => d.id === 'canvas-2d') && byEntity.every((d) => idx[d.id].some((x) => x.entity.entityId === 'tor-project')));
  const l1 = filterAndSort(ALL_DEFINITIONS, { ...emptyFilter(), maxEvidence: '1' }, ctx);
  assert.ok(l1.every((d) => bestEvidence(idx[d.id]) === 1));
  const both = filterAndSort(ALL_DEFINITIONS, { ...emptyFilter(), q: 'canvas', relevance: 'high' }, ctx);
  assert.deepEqual(both.map((d) => d.id), ['canvas-2d']);
  const names = filterAndSort(ALL_DEFINITIONS, { ...emptyFilter(), sort: 'name' }, ctx).map((d) => d.name);
  assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b)));
  assert.equal(matches(ALL_DEFINITIONS[0], { ...emptyFilter(), statuses: ['measured'] }, ctx), false);
  assert.ok(filterEntities(catalogue.entities, { type: 'Adversary category' }).every((e) => e.adversaryCategory));
});

test('export: raw data excluded by default; snapshot round-trips through import validation', async () => {
  const ex = exportResults(results, { entityCatalogueVersion: 'x' });
  assert.equal(ex.includesRawData, false);
  assert.ok(!JSON.stringify(ex).includes('value-b'));
  assert.ok(JSON.stringify(exportResults(results, { includeRaw: true, entityCatalogueVersion: 'x' })).includes('value-b'));
  for (const k of ['appVersion', 'testCatalogueVersion', 'entityCatalogueVersion', 'generatedAt', 'browserContext']) assert.ok(k in ex);
  const snap = exportSnapshot('t', await snapshotFromResults(results), 'ab'.repeat(32), 'x');
  const v = validateImport(JSON.stringify(snap));
  assert.equal(v.ok, true, v.problems.join(', '));
  assert.equal(Object.keys(v.snapshot.entries).length, Object.keys(results).length);
});

test('import: rejects malformed, oversized and hostile input', () => {
  assert.equal(validateImport('not json').ok, false);
  assert.equal(validateImport('[]').ok, false);
  assert.equal(validateImport('x'.repeat(2_000_001)).ok, false);
  const bad = { format: 'fp-lab-export', kind: 'snapshot', resultSchemaVersion: '1.0', entries: { '<img src=x>': { status: 'measured', digest: null } } };
  assert.equal(validateImport(JSON.stringify(bad)).ok, false);
  const badStatus = { ...bad, entries: { ok: { status: 'pwned', digest: null } } };
  assert.equal(validateImport(JSON.stringify(badStatus)).ok, false);
  const proto = '{"format":"fp-lab-export","kind":"snapshot","resultSchemaVersion":"1.0","entries":{"__proto__":{"status":"measured","digest":null}}}';
  assert.equal(validateImport(proto).ok, false);
});

test('assessment: qualitative levels follow documented rules; indeterminate when coverage is low', () => {
  const a = assess(defs, results, { repeat: 3 });
  assert.ok(['low', 'moderate', 'elevated', 'indeterminate'].includes(a.level));
  assert.equal(a.serverOnlyCount, 1);
  assert.ok(a.protectedHigh.includes('fx-d'));
  const none = assess(defs, { 'fx-a': { ...results['fx-a'], executionStatus: 'error' } });
  assert.equal(none.level, 'indeterminate');
});

test('recommendations: never promise anonymity; every item has benefit, compatibility and limitations', () => {
  const rec = recommend({});
  assert.ok(rec.items.length >= 2);
  for (const i of rec.items) { assert.ok(i.benefit && i.compatibility && i.limitations && i.sources.length); assert.doesNotMatch(`${i.title} ${i.benefit}`, /guarantee|complete anonymity|100%/i); }
});

test('evidence-level and status rendering include text labels (not color alone)', () => {
  for (const k of Object.keys(EVIDENCE_LEVELS)) assert.ok(evidenceChip(k).includes(EVIDENCE_LEVELS[k].short));
  assert.match(statusChip('blocked'), /Hidden by browser/);
  assert.match(statusChip('<script>'), /Not run/);
  assert.doesNotMatch(statusChip('<script>'), /<script>/);
});
