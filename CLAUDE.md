# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Fingerprinting Lab: an educational, defensive privacy lab that runs real browser-fingerprinting
techniques against the visitor's own browser and explains what each one revealed. Static SPA in
vanilla JS ES modules (Bootstrap 5, self-hosted), no build step, no backend. Live at
https://jozeta.github.io/Fingerprinter/ (GitHub Pages from `main` root, `.nojekyll`). Version
lives in `js/core/constants.js` and `CHANGELOG.md`.

## Commands

```sh
python3 scripts/serve.py            # http://localhost:8765/ (no-cache server; ES modules don't work from file://)
npm test                            # node:test unit suite, tests/unit/ (Node 22+, no deps)
BROWSER="/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" npm run test:browser
                                    # with serve.py running: CDP-driven integration suite + UI walkthrough
npm run docs                        # regenerate docs/TECHNIQUES.md (and coverage docs) from the registry
```

## Architecture

See `docs/ARCHITECTURE.md` for the full module map. Key points:

- `js/core/`: `registry.js` (validates technique definitions), `schema.js` (versioned result
  schema), `engine.js` (timeouts, cancellation, yielding, dependencies), `hash.js` (canonical
  JSON + SHA-256), `store.js` (opt-in persistence only).
- `js/tests/`: technique definitions, one module per category. **Adding a technique = adding one
  `define({...})` object**; the registry rejects definitions missing required fields (id, version,
  category, tier, maturity, explanations, sources, `run(ctx)`, …). Views, filters, docs and
  exports pick it up automatically. Then run `npm run docs`.
- `js/analysis/`: profile, compare, assessment, recommendations, filters, reports, result codes
  (`FPLAB1.` + base64url(deflate-raw(JSON))).
- `js/ui/`: one module per view, plus SVG charts, icons, illustrations.
- `data/entities.json`, `data/sources.json`: versioned catalogues; claims must cite a source id.

## Rules (enforced by tests or docs)

- **No network:** no CDN, analytics or third-party requests; CSP is `connect-src 'self'`. No IP
  lookup or STUN. A static privacy scan in the unit tests checks this.
- **Consent first:** nothing runs before the user clicks Run; nothing is stored unless they save
  a snapshot or enable "remember settings". No permission prompts (camera, mic, location,
  clipboard, notifications).
- **No fabricated values:** a technique that can't measure reports that status, never a guess.
  No uniqueness percentage (see `docs/METHODOLOGY.md`).
- Technique modules must not touch the DOM at import time, and must clean up any DOM/storage they
  create during `run()`.
- Bump a technique's `version` when its output semantics change.
