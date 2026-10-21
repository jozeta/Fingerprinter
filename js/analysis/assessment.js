// Qualitative privacy-exposure assessment. Deliberately NOT a numeric score and NOT a security-vulnerability rating.
// The rules below are documented verbatim on the Methodology page (ASSESSMENT_RULES).

const VALUE = new Set(['measured', 'inferred']);

export const ASSESSMENT_RULES = [
  'Coverage = definitive client-side results (revealed, estimated, blocked) ÷ client-side tests that ran. If coverage < 60%, the level is "indeterminate".',
  'Exposed high-relevance signals (H) = high-relevance tests whose value was revealed or estimated, with no randomization or standardization detected.',
  'Protected high-relevance signals (P) = high-relevance tests that were blocked, randomized or standardized.',
  'Elevated: H ≥ 4 and P ≤ 1 (most strongly identifying surfaces are readable and stable).',
  'Low: H ≤ 1, or P ≥ 3 (most strongly identifying surfaces are protected).',
  'Moderate: everything else.',
  'Confidence: high when coverage ≥ 85% and repeated-render checks ran (repeat ≥ 2); medium when coverage ≥ 60%; otherwise low.',
  'Signals only servers can see (IP, TLS, headers) are never counted: this page cannot observe them, but every server you visit can.',
];

export function assess(defs, results, { repeat = 1 } = {}) {
  const ran = defs.filter((d) => results[d.id] && !d.serverRequired && !d.interaction);
  const definitive = ran.filter((d) => VALUE.has(results[d.id].executionStatus) || results[d.id].executionStatus === 'blocked');
  const coverage = ran.length ? definitive.length / ran.length : 0;
  const high = ran.filter((d) => d.relevance === 'high');
  const exposedHigh = high.filter((d) => VALUE.has(results[d.id].executionStatus) && ['none-detected', 'unknown'].includes(results[d.id].protectionIndicator));
  const protectedHigh = high.filter((d) => results[d.id].executionStatus === 'blocked' || ['randomized', 'standardized', 'blocked'].includes(results[d.id].protectionIndicator));
  const H = exposedHigh.length, P = protectedHigh.length;

  let level;
  if (coverage < 0.6) level = 'indeterminate';
  else if (H >= 4 && P <= 1) level = 'elevated';
  else if (H <= 1 || P >= 3) level = 'low';
  else level = 'moderate';

  const confidence = coverage >= 0.85 && repeat >= 2 ? 'high' : coverage >= 0.6 ? 'medium' : 'low';
  const unknown = ran.filter((d) => !VALUE.has(results[d.id].executionStatus) && results[d.id].executionStatus !== 'blocked').map((d) => d.id);

  return {
    level, confidence, coverage, exposedHigh: exposedHigh.map((d) => d.id), protectedHigh: protectedHigh.map((d) => d.id),
    measuredCount: ran.filter((d) => VALUE.has(results[d.id].executionStatus)).length, ranCount: ran.length, unknown,
    serverOnlyCount: defs.filter((d) => d.serverRequired).length,
  };
}
