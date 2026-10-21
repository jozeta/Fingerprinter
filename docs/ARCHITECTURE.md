# Architecture & Data Model

Browser Fingerprinting & Privacy Lab is a static single-page application written in vanilla JavaScript ES modules and Bootstrap 5. It has no build step and no backend. Every asset is self-hosted, so the app makes **no network requests** other than loading its own files.

## Module map

```
index.html                 SPA shell, CSP, sidebar navigation, view containers
css/app.css                Nordic theme (light/dark/system), print styles, reduced-motion
data/entities.json         Versioned company / technology / adversary intelligence catalogue
data/sources.json          Versioned source registry (URL, type, date checked, claims supported)
js/main.js                 Bootstrapping, catalogue loading, hash router, global state
js/core/
  constants.js             App/schema/catalogue versions, statuses, evidence levels, enums
  util.js                  Escaping, DOM helpers, timeouts, yielding
  hash.js                  Canonical JSON + SHA-256 (Web Crypto) with labeled fallback
  registry.js              Central test registry and definition validation
  schema.js                Result-object builder and validator (versioned result schema)
  engine.js                Execution engine: timeouts, cancellation, yielding, dependency results
  store.js                 Opt-in local persistence (settings, saved snapshots only)
js/tests/*.js              Technique definitions, one module per category (no DOM access at import)
js/analysis/
  profile.js               Canonical profile, include/exclude, digest
  compare.js               Profile comparison (added/removed/changed/randomized/…)
  assessment.js            Qualitative privacy assessment with documented rules
  recommendations.js       Measured-result-driven, browser-aware mitigation engine
  filters.js               Composable filters, search and sorting (shared by all views)
  report.js                JSON exports, import validation, printable reports
  result-code.js           Result codes: FPLAB1. + base64url(deflate-raw(JSON)), redaction, size-limited decoding
  side-by-side.js          Field-level comparison of the current run with a pasted result code
  interpret.js             Plain-language meaning of actual result values, per check
js/adapters/server-adapter.js   Optional server adapter interface (disabled; null implementation)
js/ui/*.js                 One module per view, plus charts.js (SVG charts, ridge figure), icons.js (custom icon set),
                           illustrations.js (lesson diagrams) and detail.js (technique panel)
tests/unit/*.test.mjs      node:test suite for pure logic
tests/browser/index.html   In-browser integration suite (real APIs, cleanup, no-network checks)
scripts/generate-docs.mjs  Generates docs/TECHNIQUES.md from the registry
```

## Test definition (catalogue entry)

Each technique is a plain object registered with `registry.register()`. The registry rejects definitions that lack any of the required fields.

| Field | Meaning |
|---|---|
| `id`, `version` | Stable identifier, plus a per-test semantic version that is bumped when output semantics change |
| `category`, `tier` | Category key; `basic` or `advanced` |
| `maturity` | `demonstrated` (used in the wild / shipping libraries), `research` (published research concept), `speculative` (inference) |
| `name`, `simple`, `how`, `technical` | Name, plain-language summary, mechanism, and a technical explanation for professionals |
| `exposes`, `dataType`, `apis` | What the browser reveals, the result data type, and the Web APIs touched |
| `purpose[]` | Purposes from `PURPOSES` (identification, fraud-prevention, bot-detection, …) |
| `relevance` | `high` / `medium` / `low` fingerprinting relevance, plus `relevanceBasis` text and sources |
| `stability` | `stable` / `semi-stable` / `volatile` |
| `combinesWith[]` | `{ id, basis: 'documented' or 'hypothetical', note, source? }` |
| `privacyImpact`, `concern` | Impact text; `privacy` / `limitation` / `security` |
| `limitations[]`, `permissions[]` | Known limitations; required permissions (always empty for auto-run tests) |
| `secureContext`, `serverRequired`, `interaction` | Requirement flags |
| `defenses`, `mitigations[]`, `sources[]` | Defenses that alter results; recommended mitigations; source ids |
| `includeByDefault` | Whether the signal enters the default fingerprint profile |
| `run(ctx)` | `async` function returning `{ status, raw, normalized?, confidence, protection, notes[], image? }` |

## Result object (schema `1.0`)

`schema.buildResult(def, outcome, timing, associations)` produces exactly these fields:

`schemaVersion, testId, testVersion, category, techniqueName, description, educationalExplanation, technicalExplanation, purpose, dataCollected, rawResult, normalizedResult, executionStatus, executionTimestamp, executionDuration, confidence, protectionIndicator, fingerprintingRelevance, potentialPrivacyImpact, limitations, requiredPermissions, secureContextRequired, serverRequired, mitigationRecommendations, sourceReferences, companyAssociations, errorDetails, notes`

**Execution statuses:** `measured`, `inferred`, `blocked`, `unsupported`, `permission-required`, `interaction-required`, `server-only`, `error`, `skipped`.

**Protection indicator** is kept separate from status: `none-detected`, `randomized`, `standardized`, `blocked`, `unknown`.

**Confidence scale:**
- `high`: value read directly from an API.
- `medium`: derived from a measurement, e.g. a font inferred from text widths.
- `low`: a heuristic inference.
- `n/a`: nothing measured.

Missing, blocked or unsupported results carry `rawResult: null`, never fabricated values.

## Entity catalogue (`data/entities.json`)

```
{ catalogueVersion, lastUpdated, entities: [ {
    entityId, name, entityType, organizationCategory, adversaryCategory|null, purpose[], description,
    associations: [ { techniqueId, relation: uses|measures|mitigates|researched|permits,
                      evidenceLevel: 1..5, summary, sources[] } ],
    evidenceSummary, sourceReferences[], lastVerified, confidence, limitations } ] }
```

`associatedTechniqueIds` is derived from `associations`, so every link carries its own evidence level.

## Data flow

1. `main.js` loads both JSON catalogues and the test registry, and validates cross-references (source ids, technique ids).
2. The user reads the pre-run explanation and starts a run. `engine.run()` executes tests sequentially with a per-test timeout and an `AbortSignal`, yields to the event loop between tests, and passes earlier results to dependent tests (`dependsOn`).
3. Results go to an in-memory `state.results`. **Nothing is persisted** unless the user saves a snapshot or enables "remember settings".
4. Views (overview, tests, signals, entities, compare, assessment, learn) all read from the same registry, results and filter module.
