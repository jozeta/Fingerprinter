// Composable filtering, search and sorting shared by the test catalogue, signal explorer and entity explorer.

export const emptyFilter = () => ({
  q: '', categories: [], statuses: [], tier: '', relevance: '', dataType: '', api: '', entity: '', adversary: '', purpose: '',
  maxEvidence: '', availability: '', sort: 'catalogue',
});

/** Index entity associations by technique for quick lookups: techId → [{entity, association}] */
export function indexAssociations(entities) {
  const idx = {};
  for (const e of entities) for (const a of e.associations) (idx[a.techniqueId] ||= []).push({ entity: e, association: a });
  return idx;
}

/** Best (lowest number = strongest) evidence level among a technique's associations, or null. */
export const bestEvidence = (assocs = []) => (assocs.length ? Math.min(...assocs.map((x) => x.association.evidenceLevel)) : null);

const availabilityOf = (d) => (d.serverRequired ? 'server' : d.interaction ? 'interaction' : d.permissions.length ? 'permission' : d.secureContext ? 'secure' : 'auto');

export function matches(d, f, { results = {}, assocIndex = {} } = {}) {
  const r = results[d.id];
  const assocs = assocIndex[d.id] || [];
  if (f.q) {
    const hay = `${d.id} ${d.name} ${d.simple} ${d.exposes} ${d.apis.join(' ')}`.toLowerCase();
    if (!f.q.toLowerCase().split(/\s+/).every((w) => hay.includes(w))) return false;
  }
  if (f.categories.length && !f.categories.includes(d.category)) return false;
  if (f.statuses.length && !f.statuses.includes(r ? r.executionStatus : 'skipped')) return false;
  if (f.tier && d.tier !== f.tier) return false;
  if (f.relevance && d.relevance !== f.relevance) return false;
  if (f.dataType && d.dataType !== f.dataType) return false;
  if (f.api && !d.apis.some((a) => a.toLowerCase().includes(f.api.toLowerCase()))) return false;
  if (f.purpose && !d.purpose.includes(f.purpose)) return false;
  if (f.availability && availabilityOf(d) !== f.availability) return false;
  if (f.entity && !assocs.some((x) => x.entity.entityId === f.entity)) return false;
  if (f.adversary && !assocs.some((x) => x.entity.adversaryCategory === f.adversary)) return false;
  if (f.maxEvidence) { const b = bestEvidence(assocs); if (b === null || b > Number(f.maxEvidence)) return false; }
  return true;
}

const STATUS_ORDER = ['measured', 'inferred', 'blocked', 'unsupported', 'permission-required', 'interaction-required', 'server-only', 'error', 'skipped'];
const RELEVANCE_ORDER = { high: 0, medium: 1, low: 2 };

export function sortDefs(defs, sort, { results = {}, assocIndex = {}, catalogueOrder = [] } = {}) {
  const arr = defs.slice();
  const pos = (id) => catalogueOrder.indexOf(id);
  const cmp = {
    catalogue: (a, b) => pos(a.id) - pos(b.id),
    name: (a, b) => a.name.localeCompare(b.name),
    category: (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
    status: (a, b) => STATUS_ORDER.indexOf(results[a.id]?.executionStatus ?? 'skipped') - STATUS_ORDER.indexOf(results[b.id]?.executionStatus ?? 'skipped'),
    evidence: (a, b) => (bestEvidence(assocIndex[a.id]) ?? 9) - (bestEvidence(assocIndex[b.id]) ?? 9),
    relevance: (a, b) => RELEVANCE_ORDER[a.relevance] - RELEVANCE_ORDER[b.relevance] || a.name.localeCompare(b.name),
  }[sort] || (() => 0);
  return arr.sort(cmp);
}

export function filterAndSort(defs, f, ctx) {
  return sortDefs(defs.filter((d) => matches(d, f, ctx)), f.sort, ctx);
}

/** Entity explorer filtering. */
export function filterEntities(entities, f) {
  const now = Date.now();
  return entities.filter((e) => {
    if (f.q && !`${e.name} ${e.description}`.toLowerCase().includes(f.q.toLowerCase())) return false;
    if (f.type && e.entityType !== f.type) return false;
    if (f.purpose && !e.purpose.includes(f.purpose)) return false;
    if (f.technique && !e.associations.some((a) => a.techniqueId === f.technique)) return false;
    if (f.relation && !e.associations.some((a) => a.relation === f.relation)) return false;
    if (f.maxEvidence && !e.associations.some((a) => a.evidenceLevel <= Number(f.maxEvidence))) return false;
    if (f.recency === 'verified-12m' && !(e.lastVerified && now - Date.parse(e.lastVerified) < 365 * 864e5)) return false;
    if (f.recency === 'not-verified' && e.lastVerified) return false;
    return true;
  });
}
