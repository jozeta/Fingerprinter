// Registry integrity, result schema, engine behaviour (timeouts, exceptions, cancellation, missing APIs) and hashing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ALL_DEFINITIONS } from '../../js/tests/index.js';
import { validateDefinition, registerAll, clearRegistry, allTests, checkIntegrity } from '../../js/core/registry.js';
import { buildResult, validateResult, RESULT_FIELDS } from '../../js/core/schema.js';
import { runOne, runMany, orderByDependencies } from '../../js/core/engine.js';
import { canonicalize, digest, cyrb53Hex } from '../../js/core/hash.js';
import { STATUSES } from '../../js/core/constants.js';
import { defs as fxDefs } from './fixtures.mjs';

const sources = JSON.parse(fs.readFileSync(new URL('../../data/sources.json', import.meta.url))).sources;
const catalogue = JSON.parse(fs.readFileSync(new URL('../../data/entities.json', import.meta.url)));

test('registry: every definition is valid and ids are unique', () => {
  for (const d of ALL_DEFINITIONS) assert.deepEqual(validateDefinition(d), [], d.id);
  assert.equal(new Set(ALL_DEFINITIONS.map((d) => d.id)).size, ALL_DEFINITIONS.length);
  clearRegistry(); registerAll(ALL_DEFINITIONS);
  assert.equal(allTests().length, ALL_DEFINITIONS.length);
  assert.throws(() => registerAll([ALL_DEFINITIONS[0]]), /Duplicate/);
});

test('registry: all source, combination and dependency references resolve', () => {
  clearRegistry(); registerAll(ALL_DEFINITIONS);
  assert.deepEqual(checkIntegrity(sources), []);
});

test('registry: rejects invalid definitions', () => {
  assert.ok(validateDefinition({ id: 'Bad Id' }).length > 5);
  assert.ok(validateDefinition({ ...fxDefs[0], combinesWith: [{ id: 'x', basis: 'documented' }] }).some((p) => p.includes('need a source')));
  assert.ok(validateDefinition({ ...fxDefs[0], permissions: ['camera'] }).some((p) => p.includes('interaction-gated')));
});

test('registry: server-only tests are flagged and never auto-include in the profile', () => {
  for (const d of ALL_DEFINITIONS.filter((x) => x.category === 'server')) { assert.equal(d.serverRequired, true, d.id); assert.equal(d.includeByDefault, false, d.id); }
});

test('entity catalogue: references resolve and every association has an evidence level 1-5', () => {
  const ids = new Set(ALL_DEFINITIONS.map((d) => d.id));
  assert.match(catalogue.catalogueVersion, /^\d{4}\.\d{2}\.\d{2}$/);
  for (const e of catalogue.entities) {
    for (const k of ['entityId', 'name', 'entityType', 'organizationCategory', 'purpose', 'description', 'evidenceSummary', 'sourceReferences', 'lastVerified', 'confidence', 'limitations', 'associations']) assert.ok(k in e, `${e.entityId} missing ${k}`);
    for (const s of e.sourceReferences) assert.ok(sources[s], `${e.entityId}: source ${s}`);
    for (const a of e.associations) {
      assert.ok(ids.has(a.techniqueId), `${e.entityId}: technique ${a.techniqueId}`);
      assert.ok(Number.isInteger(a.evidenceLevel) && a.evidenceLevel >= 1 && a.evidenceLevel <= 5);
      assert.ok(a.sources.length > 0 && a.sources.every((s) => sources[s]), `${e.entityId}/${a.techniqueId} sources`);
    }
  }
});

test('schema: buildResult emits every field and never carries values for non-value statuses', () => {
  for (const status of Object.keys(STATUSES)) {
    const r = buildResult(fxDefs[0], { status, raw: { fabricated: true } }, { started: Date.now(), duration: 1 });
    for (const f of RESULT_FIELDS) assert.ok(f in r, `missing ${f}`);
    assert.deepEqual(validateResult(r), [], status);
    if (!['measured', 'inferred', 'blocked'].includes(status)) assert.equal(r.rawResult, null, status);
    if (!['measured', 'inferred'].includes(status)) { assert.equal(r.normalizedResult, null); assert.equal(r.confidence, 'n/a'); }
  }
});

test('schema: unknown status becomes error', () => {
  const r = buildResult(fxDefs[0], { status: 'made-up' }, { started: Date.now(), duration: 0 });
  assert.equal(r.executionStatus, 'error');
});

test('engine: exceptions and timeouts become error results', async () => {
  const boom = await runOne({ ...fxDefs[0], run: async () => { throw new TypeError('kaput'); } });
  assert.equal(boom.executionStatus, 'error'); assert.match(boom.errorDetails, /TypeError: kaput/);
  const slow = await runOne({ ...fxDefs[0], run: () => new Promise(() => {}) }, { timeoutMs: 50 });
  assert.equal(slow.executionStatus, 'error'); assert.match(slow.errorDetails, /Timed out/);
  const empty = await runOne({ ...fxDefs[0], run: async () => undefined });
  assert.equal(empty.executionStatus, 'error');
});

test('engine: cancellation skips remaining tests', async () => {
  const ac = new AbortController();
  const defs = [0, 1, 2].map((i) => ({ ...fxDefs[0], id: `c${i}`, run: async () => { if (i === 0) ac.abort(); return { status: 'measured', raw: i }; } }));
  const res = await runMany(defs, { signal: ac.signal });
  assert.equal(res.c0.executionStatus, 'measured');
  assert.equal(res.c1.executionStatus, 'skipped'); assert.equal(res.c2.executionStatus, 'skipped');
});

test('engine: dependencies run first and receive earlier results', async () => {
  const a = { ...fxDefs[0], id: 'dep-a', run: async () => ({ status: 'measured', raw: 'A' }) };
  const b = { ...fxDefs[0], id: 'dep-b', dependsOn: ['dep-a'], run: async ({ results }) => ({ status: 'measured', raw: results['dep-a'].rawResult + 'B' }) };
  assert.deepEqual(orderByDependencies([b, a]).map((d) => d.id), ['dep-a', 'dep-b']);
  const res = await runMany([b, a]);
  assert.equal(res['dep-b'].rawResult, 'AB');
});

test('engine: every real test completes without a DOM and never fabricates values', async () => {
  // Node has no document/window: DOM-dependent tests must report unsupported/blocked/error/server-only, not invented data.
  const res = await runMany(ALL_DEFINITIONS, { timeoutMs: 3000, repeat: 1 });
  for (const d of ALL_DEFINITIONS) {
    const r = res[d.id];
    assert.deepEqual(validateResult(r), [], d.id);
    if (d.serverRequired) assert.equal(r.executionStatus, 'server-only', d.id);
    if (d.interaction) assert.equal(r.executionStatus, 'interaction-required', d.id);
    if (['canvas-2d', 'webgl-info', 'webgl-render', 'fonts', 'audio-offline', 'storage-mechanisms'].includes(d.id)) assert.notEqual(r.executionStatus, 'measured', d.id);
  }
});

test('hash: canonical JSON is key-order independent; SHA-256 matches a known vector', async () => {
  assert.equal(canonicalize({ b: 1, a: [2, { d: 3, c: 4 }] }), canonicalize({ a: [2, { c: 4, d: 3 }], b: 1 }));
  assert.equal(canonicalize({ a: undefined, b: NaN }), '{"b":"NaN"}');
  const d = await digest('abc');
  assert.equal(d.algorithm, 'SHA-256');
  assert.equal(d.hex, 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(cyrb53Hex('abc'), cyrb53Hex('abc'));
});
