# Changelog

All notable changes to this project. Versions follow [semantic versioning](https://semver.org/): new features bump the minor version, fixes bump the patch version. The version shown in the app's sidebar comes from `APP_VERSION` in `js/core/constants.js` and must match the newest entry here (checked by `npm test`).

## 2.2.0 (2026-10-21)
- Version number in the sidebar, linked to this changelog.
- "How common is your value?" estimate for every result, plus "How identifying is this check?" using published per-attribute entropy (EFF Panopticlick, 2010) where available.
- New checks: browser UI language (built-in validation messages), font smoothing (subpixel anti-aliasing), Apple Pay availability, regional formats (first day of week, list and plural rules), gamepad API.
- Hover and focus boxes on the category bar chart and the fingerprint figure that show the checks and values behind each part.
- Plain-language rewrite of every check description.
- Learning center: more lessons and illustrations, and an interactive "your signals in bits" exercise.
- More micro-animations and graphics polish.

## 2.1.0 (2026-10-21)
- Result codes: copy the whole result as one text string (full or compact), paste an earlier code, and compare side by side with highlighted differences and filters.
- Every result can expand to show the actual data, what it means, why it matters and how to hide it.

## 2.0.0 (2026-10-19)
- First public release: 93 techniques, evidence-based company catalogue, signal explorer, comparison, privacy assessment, learning center, reports, tests and docs.
