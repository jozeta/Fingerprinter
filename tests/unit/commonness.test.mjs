// "How common is your value" estimates and identifiability figures.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { commonness, identifiability, EFF_ENTROPY, LEVELS } from '../../js/analysis/commonness.js';
import { buildResult } from '../../js/core/schema.js';
import { ALL_DEFINITIONS } from '../../js/tests/index.js';

const byId = Object.fromEntries(ALL_DEFINITIONS.map((d) => [d.id, d]));
const res = (id, outcome) => buildResult(byId[id], outcome, { started: Date.now(), duration: 1 });
const sources = JSON.parse(fs.readFileSync(new URL('../../data/sources.json', import.meta.url))).sources;

test('commonness never throws, always returns a known level and states its basis', () => {
  for (const d of ALL_DEFINITIONS) for (const status of ['measured', 'blocked', 'unsupported', 'server-only']) {
    const c = commonness(d, buildResult(d, { status, raw: {} }, { started: Date.now(), duration: 0 }));
    assert.ok(LEVELS[c.level], `${d.id}/${status}`); assert.match(c.basis, /estimate/i); assert.ok(c.reason.length > 5);
  }
  assert.equal(commonness(byId.screen, null).level, 'unknown');
});

test('commonness rates obvious cases sensibly', () => {
  assert.equal(commonness(byId.screen, res('screen', { status: 'measured', raw: { width: 1920, height: 1080 } })).level, 'very-common');
  assert.equal(commonness(byId.languages, res('languages', { status: 'measured', raw: { languages: ['sv-SE', 'en-US', 'de-DE'] } })).level, 'rare');
  assert.equal(commonness(byId['canvas-2d'], res('canvas-2d', { status: 'measured', raw: { differingBytesVsFirst: [12] }, protection: 'randomized' })).level, 'protected');
  assert.equal(commonness(byId['intl-timezone'], res('intl-timezone', { status: 'measured', raw: { timeZone: 'UTC' } })).level, 'protected');
});

test('identifiability cites the verified EFF table and only for known checks', () => {
  assert.ok(sources['eckersley-2010']);
  for (const id of Object.keys(EFF_ENTROPY)) {
    assert.ok(byId[id], `unknown check ${id}`);
    const r = identifiability(byId[id]);
    assert.equal(r.source, 'eckersley-2010'); assert.match(r.study, /470,161/); assert.match(r.study, /upper bound/);
  }
  assert.equal(identifiability(byId['canvas-2d']).bits, undefined);
});
