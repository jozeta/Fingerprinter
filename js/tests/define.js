// Definition factory: fills safe defaults so modules only state what is specific to a technique.
// Defaults: no permissions, no secure context, client-side, auto-run, included in the profile when stable.
export const define = (d) => ({
  tier: 'basic', maturity: 'demonstrated', permissions: [], secureContext: false, serverRequired: false, interaction: false,
  combinesWith: [], dependsOn: [], limitations: [], mitigations: [], concern: 'privacy',
  includeByDefault: d.stability !== 'volatile', ...d,
});

/** Run fn n times and report whether all outputs were identical (used for randomization detection). */
export async function repeatCompare(n, fn) {
  const outs = [];
  for (let i = 0; i < n; i++) outs.push(await fn(i));
  const first = JSON.stringify(outs[0]);
  return { outputs: outs, stable: outs.every((o) => JSON.stringify(o) === first) };
}

export const g = globalThis;
