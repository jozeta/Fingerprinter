// Central test registry. Views, filters, docs and exports all read from here.
import { CATEGORIES, PURPOSES, RELEVANCE, STABILITY, MATURITY, DATA_TYPES } from './constants.js';

const tests = new Map();

const REQUIRED = ['id', 'version', 'category', 'tier', 'maturity', 'name', 'simple', 'how', 'technical', 'exposes', 'dataType',
  'apis', 'purpose', 'relevance', 'relevanceBasis', 'stability', 'combinesWith', 'privacyImpact', 'concern', 'limitations',
  'permissions', 'secureContext', 'serverRequired', 'interaction', 'defenses', 'mitigations', 'sources', 'includeByDefault', 'run'];

/** Returns a list of problems with a definition; empty when valid. */
export function validateDefinition(def) {
  const problems = [];
  for (const f of REQUIRED) if (def[f] === undefined) problems.push(`missing field "${f}"`);
  if (def.id && !/^[a-z0-9][a-z0-9-]*$/.test(def.id)) problems.push('id must be kebab-case');
  if (def.version && !/^\d+\.\d+\.\d+$/.test(def.version)) problems.push('version must be semver');
  if (def.category && !CATEGORIES[def.category]) problems.push(`unknown category "${def.category}"`);
  if (def.tier && !['basic', 'advanced'].includes(def.tier)) problems.push('tier must be basic|advanced');
  if (def.maturity && !MATURITY[def.maturity]) problems.push(`unknown maturity "${def.maturity}"`);
  if (def.relevance && !RELEVANCE[def.relevance]) problems.push(`unknown relevance "${def.relevance}"`);
  if (def.stability && !STABILITY[def.stability]) problems.push(`unknown stability "${def.stability}"`);
  if (def.dataType && !DATA_TYPES[def.dataType]) problems.push(`unknown dataType "${def.dataType}"`);
  if (def.concern && !['privacy', 'limitation', 'security'].includes(def.concern)) problems.push('concern must be privacy|limitation|security');
  for (const p of def.purpose || []) if (!PURPOSES[p]) problems.push(`unknown purpose "${p}"`);
  for (const c of def.combinesWith || []) if (!['documented', 'hypothetical'].includes(c.basis)) problems.push(`combinesWith ${c.id}: bad basis`);
  if (def.combinesWith?.some((c) => c.basis === 'documented' && !c.source)) problems.push('documented combinations need a source');
  if (typeof def.run !== 'function') problems.push('run must be a function');
  if (def.permissions?.length && !def.interaction) problems.push('tests needing permissions must be interaction-gated');
  return problems;
}

export function register(def) {
  const problems = validateDefinition(def);
  if (problems.length) throw new Error(`Invalid test "${def.id}": ${problems.join('; ')}`);
  if (tests.has(def.id)) throw new Error(`Duplicate test id "${def.id}"`);
  tests.set(def.id, Object.freeze({ dependsOn: [], repeatable: false, ...def }));
}

export const registerAll = (defs) => defs.forEach(register);
export const allTests = () => Array.from(tests.values());
export const getTest = (id) => tests.get(id);
export const clearRegistry = () => tests.clear(); // for unit tests only

/** Cross-check references against the source registry and the test set. Returns problems. */
export function checkIntegrity(sources) {
  const problems = [];
  for (const t of tests.values()) {
    for (const s of t.sources) if (!sources[s]) problems.push(`${t.id}: unknown source "${s}"`);
    for (const c of t.combinesWith) {
      if (!tests.has(c.id)) problems.push(`${t.id}: combinesWith unknown test "${c.id}"`);
      if (c.source && !sources[c.source]) problems.push(`${t.id}: combinesWith unknown source "${c.source}"`);
    }
    for (const d of t.dependsOn) if (!tests.has(d)) problems.push(`${t.id}: dependsOn unknown test "${d}"`);
  }
  return problems;
}
