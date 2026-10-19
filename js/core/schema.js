// Result object builder and validator (result schema 1.0). See docs/ARCHITECTURE.md.
import { RESULT_SCHEMA_VERSION, STATUSES, PROTECTION, CONFIDENCE } from './constants.js';

export const RESULT_FIELDS = ['schemaVersion', 'testId', 'testVersion', 'category', 'techniqueName', 'description', 'educationalExplanation',
  'technicalExplanation', 'purpose', 'dataCollected', 'rawResult', 'normalizedResult', 'executionStatus', 'executionTimestamp',
  'executionDuration', 'confidence', 'protectionIndicator', 'fingerprintingRelevance', 'potentialPrivacyImpact', 'limitations',
  'requiredPermissions', 'secureContextRequired', 'serverRequired', 'mitigationRecommendations', 'sourceReferences',
  'companyAssociations', 'errorDetails', 'notes'];

// Statuses for which a rawResult is allowed. Everything else must carry null, never a made-up value.
const VALUE_STATUSES = new Set(['measured', 'inferred']);

/**
 * Combine a test definition with the outcome of its run() into a full result object.
 * `outcome` = { status, raw, normalized, confidence, protection, notes, image, error }
 */
export function buildResult(def, outcome, { started, duration }, associations = []) {
  const status = STATUSES[outcome.status] ? outcome.status : 'error';
  const hasValue = VALUE_STATUSES.has(status);
  return {
    schemaVersion: RESULT_SCHEMA_VERSION,
    testId: def.id,
    testVersion: def.version,
    category: def.category,
    techniqueName: def.name,
    description: def.simple,
    educationalExplanation: def.how,
    technicalExplanation: def.technical,
    purpose: def.purpose,
    dataCollected: def.exposes,
    rawResult: hasValue ? (outcome.raw ?? null) : (status === 'blocked' ? (outcome.raw ?? null) : null),
    normalizedResult: hasValue ? (outcome.normalized !== undefined ? outcome.normalized : outcome.raw ?? null) : null,
    executionStatus: status,
    executionTimestamp: new Date(started).toISOString(),
    executionDuration: Math.round(duration * 10) / 10,
    confidence: hasValue ? (CONFIDENCE[outcome.confidence] ? outcome.confidence : 'high') : 'n/a',
    protectionIndicator: PROTECTION[outcome.protection] ? outcome.protection : (status === 'blocked' ? 'blocked' : 'unknown'),
    fingerprintingRelevance: { level: def.relevance, basis: def.relevanceBasis },
    potentialPrivacyImpact: def.privacyImpact,
    limitations: def.limitations,
    requiredPermissions: def.permissions,
    secureContextRequired: def.secureContext,
    serverRequired: def.serverRequired,
    mitigationRecommendations: def.mitigations,
    sourceReferences: def.sources,
    companyAssociations: associations,
    errorDetails: status === 'error' ? (outcome.error || 'Unknown error') : null,
    notes: outcome.notes || [],
    image: outcome.image || null, // display-only rendering preview; excluded from exports unless raw data is selected
  };
}

/** Validate any result object (including imported ones). Returns problems; empty when valid. */
export function validateResult(r) {
  const problems = [];
  if (!r || typeof r !== 'object') return ['result is not an object'];
  for (const f of RESULT_FIELDS) if (!(f in r)) problems.push(`missing "${f}"`);
  if (r.schemaVersion !== RESULT_SCHEMA_VERSION) problems.push(`unsupported schemaVersion "${r.schemaVersion}"`);
  if (!STATUSES[r.executionStatus]) problems.push(`invalid executionStatus "${r.executionStatus}"`);
  if (!VALUE_STATUSES.has(r.executionStatus) && r.executionStatus !== 'blocked' && r.rawResult !== null) problems.push(`status ${r.executionStatus} must not carry a rawResult`);
  if (typeof r.testId !== 'string' || !/^[a-z0-9-]+$/.test(r.testId)) problems.push('invalid testId');
  if (typeof r.executionDuration !== 'number') problems.push('executionDuration must be a number');
  if (r.executionTimestamp && Number.isNaN(Date.parse(r.executionTimestamp))) problems.push('invalid executionTimestamp');
  return problems;
}

// Helpers used by test modules to report outcomes consistently.
export const measured = (raw, extra = {}) => ({ status: 'measured', raw, confidence: 'high', protection: 'none-detected', ...extra });
export const inferred = (raw, extra = {}) => ({ status: 'inferred', raw, confidence: 'low', protection: 'unknown', ...extra });
export const blocked = (why, extra = {}) => ({ status: 'blocked', raw: null, protection: 'blocked', notes: [why], ...extra });
export const unsupported = (why) => ({ status: 'unsupported', raw: null, notes: [why] });
export const serverOnly = (why) => ({ status: 'server-only', raw: null, notes: [why] });
export const interactionRequired = (why) => ({ status: 'interaction-required', raw: null, notes: [why] });
