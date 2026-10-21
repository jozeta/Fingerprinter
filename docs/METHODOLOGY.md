# Methodology

## 1. Measurement

Each technique is a registered definition with a `run(ctx)` function. The engine (`js/core/engine.js`) runs them as follows:

- Sequentially, yielding to the event loop between tests so the page never freezes.
- With a per-test timeout (default 5 s; configurable), after which the result becomes `error` with details.
- Cancellable via `AbortSignal`. Tests that have not started become `skipped`.
- In dependency order (`dependsOn`). Advanced tests such as cross-signal consistency read earlier results instead of collecting data again.

Workloads are bounded:
- Canvas: 240×60 px.
- WebGL: 64×64 px; contexts are released with `WEBGL_lose_context`.
- Audio: 5,000 samples offline.
- Timer loop: at most 20,000 iterations.
- CPU timing: 3 × 300,000 iterations.

### Repeated-render consistency

Canvas, WebGL render and audio are executed `repeat` times (default 3). If the outputs differ within one page load, the protection indicator is `randomized`. The normalized value is then `null`, so a randomized value never enters the fingerprint.

### Status rules

On screen, `measured` is shown as **Revealed** (the browser gave the value away) and `inferred` as **Estimated** (worked out indirectly; may be wrong). Exports and the result schema keep the original status codes.


- Only `measured` and `inferred` results carry values.
- `blocked` may carry diagnostic notes.
- Every other status has `rawResult: null`. Unit and browser tests enforce this, so missing, blocked or unsupported data is never turned into a value.
- API presence is reported as capability, never as exploitability.

## 2. Fingerprint aggregation

1. **Eligibility:** status `measured`/`inferred`, a non-null `normalizedResult`, and no randomization detected.
2. **Default selection:** eligible signals whose definition has `includeByDefault` (false for volatile signals such as viewport, battery, network info and CPU timing, and for all server-only and interaction tests). Users can include or exclude any eligible signal in the Signal Explorer.
3. **Normalization** happens only where it is technically justified, for example a digest instead of a pixel buffer, a detected-font list instead of raw widths, or a quota rounded to GB. Raw results are kept separately.
4. **Canonical form:** `canonicalize({ testId: normalizedResult, … })`. Keys are sorted recursively, `undefined` is dropped, and non-finite numbers are stringified.
5. **Digest:** SHA-256 via Web Crypto. Where Web Crypto is unavailable (non-secure contexts), a non-cryptographic cyrb53 fallback is used and labeled in the UI and exports.

Timestamps, durations, random values and raw data never enter the digest.

**Interpretation.** The digest is a compact representation of the selected measurements. It is not proof of identity and **not a measure of global uniqueness or entropy**. Two equal digests mean equal inputs; they say nothing about how many other browsers share those inputs.

**Why there is no uniqueness percentage.** Uniqueness depends entirely on the comparison population. Self-selected datasets (EFF Panopticlick: 83.6% unique; AmIUnique) report far higher uniqueness than general-population studies (Gómez-Boix et al., WWW 2018: 33.6% of ~2M fingerprints). This app has no representative dataset, so it does not report one. A future dataset-backed feature must document population, collection period, sample size, normalization, method, uncertainty and limitations.

## 3. Comparison

Snapshots store, per test, `{ status, protection, testVersion, digest(normalizedResult) }`. They contain no raw values. Each pair of entries is classified as:

| Class | Rule |
|---|---|
| added / removed | present in only one snapshot |
| inconclusive | either side is error, skipped, interaction-required or permission-required, or the major test version differs |
| randomized | either side has protection `randomized` |
| newly-blocked / newly-available | value ↔ `blocked` |
| changed / unchanged | digest comparison (or status comparison when neither side has a value) |

A changed fingerprint is **not** treated as improved privacy. Randomization and inconsistent measurements are reported separately.

### Result codes

A result code holds, per check: `[status, protection, testVersion, digest, value?]`. The digest is SHA-256 (first 20 hex characters) of the canonical normalized value, so two codes can be compared even when one is compact (digest only). The side-by-side view classifies each check as same, different, randomised, now blocked, now readable, result type changed, only in one result, or cannot compare (different major test version). Field-level highlighting compares the raw values one level deep; for lists such as fonts it shows which items exist only on one side. Checks marked volatile (window size, timing, battery) are hidden by default because they change on their own.

### How common is your value? How identifying is the check?

- **How common** is a rule-of-thumb *estimate* per check (`js/analysis/commonness.js`): for example 1920×1080, 60 Hz or a single en-US language are "very common"; a list of three languages or a long font list is "rare"; randomised or blocked values are "hidden or randomised". It is never presented as a measured percentage, because that would need a representative comparison dataset (see §2). Checks without a defensible rule show "Not estimated".
- **How identifying** uses the literature-based relevance tier for every check, and adds the published mean entropy where a verified source exists: EFF Panopticlick (Eckersley 2010, Table 2, 470,161 browsers), e.g. user agent 10.0 bits, fonts 13.9, screen 4.83, time zone 3.04. These are labelled as an upper bound because the sample was self-selected and browsers expose less today. The plugin figure (15.4 bits) is shown for history only and never counted, since plugin lists are standardised in current browsers.

## 4. Privacy assessment

The assessment is qualitative and separate from security severity. The rules are implemented in `js/analysis/assessment.js` and shown verbatim in the app:

1. Coverage = definitive client-side results (measured, inferred, blocked) ÷ client-side tests that ran. If coverage < 60%, the level is **indeterminate**.
2. H = high-relevance tests that were measured with no randomization or standardization detected.
3. P = high-relevance tests that were blocked, randomized or standardized.
4. **Elevated:** H ≥ 4 and P ≤ 1. **Low:** H ≤ 1 or P ≥ 3. **Moderate:** everything else.
5. **Confidence:** high when coverage ≥ 85% and repeat ≥ 2; medium when coverage ≥ 60%; otherwise low.
6. Server-only signals are never counted.

"Relevance" per technique (high/medium/low) is assigned from cited literature, with a stated basis. It is not measured by the app. There is no numeric score.

## 5. Confidence scale

| Value | Meaning |
|---|---|
| high | Direct API read (the value may itself be spoofed by the browser) |
| medium | Derived from a measurement (e.g. font inference, layout guess) |
| low | Heuristic inference |
| n/a | Nothing measured |

## 6. Evidence levels (entity associations)

1. **Confirmed implementation:** e.g. published source code, or the organisation's own measurement tool.
2. **Documented capability:** first-party documentation.
3. **Research-supported:** credible independent research or reporting.
4. **Category-level relevance:** fits the organisation's purpose; the specific use is unverified.
5. **Unverified:** not presented as fact.

Each association stores relation (`uses`, `measures`, `mitigates`, `researched`, `permits`), evidence level, a summary and source ids. Sources record URL, type, the claim supported, and `dateChecked`. That field is `null` when a source was cited from prior knowledge and not re-verified. A company name appearing in a generic article is not evidence. The app never claims that an organisation has fingerprinted the visitor.

## 7. Technique maturity

- **Demonstrated:** observed in the wild or implemented in shipping libraries/products.
- **Research:** described in published research; deployment not established.
- **Speculative:** an inference the lab makes from indicators (e.g. storage partitioning, protection indicators).

## 8. Known limitations

- Results reflect one browser, profile, configuration and moment.
- Font detection, engine inference and keyboard layout are inferences.
- Privacy-extension detection is limited to a small probe list and cannot detect most extensions.
- Server-side signals (IP, TLS, HTTP/2, headers, TCP) are not measured in static mode.
- Timing measurements are noisy.
- Headless browsers can stall some storage APIs (observed with `--virtual-time-budget`); such cases surface as timeouts, never as fabricated values.
