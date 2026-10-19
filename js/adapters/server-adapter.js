// Optional server adapter interface (spec §5.11). DISABLED by default; the static build ships only NullServerAdapter.
// A real adapter must be enabled explicitly by the deployer AND consented to by the visitor. See docs/SERVER-ADAPTER.md.
//
// interface ServerAdapter {
//   id: string; enabled: boolean;
//   disclosure: { endpoint: string, observes: string[], stores: string[], retention: string, logging: string };
//   observe(): Promise<{ [serverTestId]: object }>   // keys are server-category test ids, e.g. 'srv-http-headers'
// }

export class NullServerAdapter {
  id = 'none';
  enabled = false;
  disclosure = { endpoint: null, observes: [], stores: [], retention: 'n/a', logging: 'n/a' };
  async observe() { return {}; }
}

/** Validate an adapter's disclosure before it may be offered to the user. Returns problems. */
export function validateAdapter(adapter) {
  const p = [];
  if (typeof adapter?.observe !== 'function') p.push('observe() missing');
  const d = adapter?.disclosure;
  if (!d) p.push('disclosure missing');
  else for (const k of ['endpoint', 'observes', 'stores', 'retention', 'logging']) if (d[k] === undefined) p.push(`disclosure.${k} missing`);
  return p;
}

export const activeAdapter = new NullServerAdapter();
