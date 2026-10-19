// SYNTHETIC FIXTURE DATA: not real browser measurements. Used only for deterministic logic tests.
import { buildResult } from '../../js/core/schema.js';

export const FIXTURE_LABEL = 'synthetic-fixture';

const base = (id, extra = {}) => ({
  id, version: '1.0.0', category: 'browser', tier: 'basic', maturity: 'demonstrated', name: `Fixture ${id}`, simple: 's', how: 'h', technical: 't',
  exposes: 'e', dataType: 'object', apis: ['navigator.fixture'], purpose: ['identification'], relevance: 'high', relevanceBasis: 'fixture', stability: 'stable',
  combinesWith: [], privacyImpact: 'p', concern: 'privacy', limitations: [], permissions: [], secureContext: false, serverRequired: false, interaction: false,
  defenses: 'd', mitigations: [], sources: [], includeByDefault: true, dependsOn: [], run: async () => ({ status: 'measured', raw: 1 }), ...extra,
});

export const defs = [
  base('fx-a'), base('fx-b', { relevance: 'medium' }), base('fx-c', { stability: 'volatile', includeByDefault: false }),
  base('fx-d', { relevance: 'high' }), base('fx-srv', { serverRequired: true, includeByDefault: false, category: 'server' }),
];

const t = { started: Date.UTC(2026, 0, 1), duration: 1.23 };
export const results = {
  'fx-a': buildResult(defs[0], { status: 'measured', raw: { b: 2, a: 1 }, protection: 'none-detected' }, t),
  'fx-b': buildResult(defs[1], { status: 'measured', raw: 'value-b', protection: 'none-detected' }, t),
  'fx-c': buildResult(defs[2], { status: 'measured', raw: 42, protection: 'none-detected' }, t),
  'fx-d': buildResult(defs[3], { status: 'measured', raw: 'noisy', normalized: null, protection: 'randomized' }, t),
  'fx-srv': buildResult(defs[4], { status: 'server-only', raw: 'MUST-BE-DROPPED' }, t),
};
