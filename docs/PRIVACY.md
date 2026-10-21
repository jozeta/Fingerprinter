# Privacy Statement

This lab measures your browser **locally, in your own browser tab**. It is designed around data minimization.

## What is collected

Browser characteristics are read by the tests you start (see the in-app catalogue or `docs/TECHNIQUES.md`). They are held **in memory only** and discarded when you close or reload the tab.

## What is never collected

- Passwords, form contents (the typing exercise records key timings only, never which keys), clipboard contents, or browsing history.
- Camera, microphone, location, notification or any other permission-gated data. **No permission is ever requested.** Media-device labels are never read.
- Your IP address. The app does not contact any IP-lookup service, and the WebRTC check uses no STUN/TURN servers.

## What is transmitted

**Nothing.** The only network requests are for the app's own files (HTML, CSS, JS, fonts, `data/*.json`) from the same origin. There are no analytics, advertising, CDNs or third-party scripts. A Content Security Policy (`default-src 'self'; connect-src 'self'`) enforces this. The automated test suite verifies that no cross-origin requests occur.

## What is stored on your device

| Item | When | Where | How to remove |
|---|---|---|---|
| Settings | Only if you enable "Remember settings" | `localStorage` key `fplab:settings` | Settings → Clear all local data |
| Snapshots | Only when you click "Save in this browser" | `localStorage` key `fplab:snapshots` | Delete per snapshot, or Clear all local data |
| Storage-test probe | During the storage test only | One value `fplab-probe` in each mechanism | Deleted automatically before the test finishes |

No hidden visitor identifier is created, and nothing is "respawned" if you clear storage.

## Result codes

A result code is created only when you click **Copy result code**. It is written to your clipboard; the app never reads your clipboard. You paste old codes into a text box yourself.
- A **full** code contains the actual values of your results (e.g. screen size, graphics chip, fonts, languages, time zone) so comparisons can show them. Anyone you give the code to can read these values.
- A **compact** code contains only fingerprints (hashes) of the values.
- Local IP addresses from the WebRTC check are never included, in either kind.
- Pasted codes are decoded on the page as data only: size-limited (including a decompression limit), schema-validated, never executed, and never sent anywhere.

## Exports

JSON and printable reports are generated in your browser and downloaded by you. Raw values (e.g. exact GPU model, fonts, local IPs) are **excluded** unless you enable "Include raw data". Nothing is uploaded automatically.

## Optional server adapter

The static build contains only a disabled null adapter. If a deployer ever adds a server adapter, it must disclose its endpoint, what it observes and stores, its retention and its logging, and it must obtain consent before running (see `docs/SERVER-ADAPTER.md`).
