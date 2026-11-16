# Låda Glass changelog

Newest first. Apps vendor a version under `vendor/lada-glass/<version>/`; `claude-check` reports an
older copy as advice (DES-FAMILY-2).

## 2.2.1 (2026-11-16)

Bug fixes from the 2026-11-15 bug check. Apps copy the new files over the old ones.

- Reopening a modal, drawer or the palette during its close animation keeps it open (it used to
  end closed). New `LadaGlass.overlay.isOpen(dialog)`: true when open and not closing.
- Notifications: the stored history is trimmed to the load limit (512 KB, oldest left out) when
  saving, so a large `max` no longer wipes the whole history on the next page load; `center.open()`
  from inside a modal puts the panel in that modal even when the bell is elsewhere or missing.
- `palette()` returns `destroy()`, which removes its ⌘K/Ctrl+K listener and closes it.
- Charts and sparklines with very many points (over ~125,000) no longer throw.
- The stepper works with steps in exponent form (e.g. `step="0.0000001"`).
- Swift: `LGSparkline` ignores NaN and infinite values (it crashed); a toast with a huge or
  infinite duration stays until dismissed (it crashed). New `LadaGlass.sparklineSeries(_:)`.
- Tooling: `build.py` writes nothing when any output fails and stops on a missing
  `<!-- build:x -->` marker; `check_tokens.py` checks each Swift colour's dark and light value in
  place, and `textHex`.

## 2.2.0 (2026-11-11)

Notifications: a notification centre for web apps and system notifications for Mac apps. Nothing
existing changes behaviour; apps copy the new files over the old ones (`lada-glass.css`,
`lada-glass.js`, `icons/`, and `LadaGlass.swift` for Mac apps).

- `LadaGlass.notifications({storageKey, max = 50, toast = false, locale})` → a centre with `add`
  (`{title, description, type: info|ok|warn|bad, time, href, read}`), `markRead`, `markAllRead`,
  `remove`, `clear`, `list` (newest first), `unread`, `on("change" | "select", fn) → off`, `attach(bell)`,
  `open` / `close` / `isOpen`, `panel` and `destroy`. Items added with `read: true` are history: kept,
  not toasted or announced. `add` returns null for an item older than everything kept when `max` is full
  (it is not added, toasted or announced).
- Bell: `<button data-lg-notifications="<storageKey>">` (a bare attribute for a centre without a key)
  is wired to the newest centre made with that key, by auto-init or when either appears later; or call
  `center.attach(button)`. It gets a `.lg-counter` badge ("9+" above 9; hidden at 0) and the
  `aria-label` "Notifications, 3 unread".
- Panel: `.lg-notifications`, a floating panel on the menus' layer (`role="dialog"`, moves into an open
  modal like menus do). A header with "Mark all read", the items grouped Today / Earlier (`role="list"`),
  each with a type stripe and icon, title, description, relative time (`Intl.RelativeTimeFormat`, short:
  now, minutes, hours, days, weeks, months, years; refreshed every 30 s while open), an unread dot (unread
  is also said in text and shown by a bolder title) and a remove button; "No notifications" when empty.
  Opening it marks nothing read; activating an item does; after "Mark all read" focus moves to the first item. ↑ ↓ Home End move between items; Esc closes it
  and puts focus back on the bell; focus stays in the list when an item is removed.
- Safety: all text goes in as `textContent`; only `http:`, `https:` and same-site relative links are
  used (`javascript:`, `data:`, `vbscript:` and every other scheme are dropped, also with tabs or control
  characters inside, and so are protocol-relative `//host`, `\\host` and `/\host`). Storage is `{v: 1, items}` in `localStorage`, all access in try/catch; on load,
  unknown versions and wrong shapes are dropped, titles are capped at 200 characters and descriptions at
  1,000, and a store over 512 KB is ignored.
- Announcements: with `toast: true` each new item is a `LadaGlass.toast` (warn shows as info: toasts
  have no warn type); otherwise it is announced in a visually hidden polite live region (in the newest
  open modal while one is open).
- CSS: the panel uses the 2.0 surface recipe; type stripes and icons use the `*-text` status colours
  (3:1 on the focused fill, where the plain status colours are not); a hovered or focused item has the
  menus' 16 % accent fill, and its description and time take the text colour there. Still under reduced
  motion, outlined in forced colours (stripes and dots kept), not printed, 44 px targets on touch.
  New `.lg-sr-only` (visually hidden) and `.lg-counter[hidden]`.
- Contrast pairs for the notification text and muted text on the panel, text on the focused fill, the
  unread dot and every type stripe on the panel and the focused fill, both themes, all accents.
- Floating panels: a click on a control the panel removed or rebuilt while handling the click (a
  notification's remove button) no longer counts as a click outside (the event path is checked too).
- Icons: new `bell`.
- Swift: `LadaGlass.SystemNotifications(sender:toasts:isAppActive:policy:)` with
  `requestAuthorization()` and `post(title:body:identifier:type:)`. The default rule posts a macOS
  notification (UserNotifications) only when the app is not active and shows an `LGToastCenter` toast
  otherwise; `policy` overrides it. When the user hasn't allowed notifications (or turned them off), a
  system notification becomes a toast instead (`.none` with no toast centre). Alerts and sound only, no badge. The sender is the injectable `LGNotificationSender` protocol
  (`LGUserNotificationSender` is the real one), with unit tests in `design/swift`.
- Preview: a Notifications section with a bell in a demo header, buttons for the sample events (scan
  finished, new finding, certificate expires in 3 days, sync failed) and a page-palette command "Add
  sample notification".

## 2.1.0 (2026-11-11)

SwiftUI parity: Mac apps built with `LadaGlass.swift` now look and behave like the 2.0 web apps.
Nothing changes for web apps (only the version in the headers). Mac apps copy the new
`LadaGlass.swift` over the old one; it needs macOS 14 and imports Charts.

- Tokens: `LadaGlass.Glass` carries the `glass` group (fill top and bottom, edge, highlight, shadow,
  glow), and `check_tokens.py swift` checks it.
- Look: `lgSurface()` and `lgPanel()` use the 2.0 recipe (vertical fill gradient over the material, a
  1 pt edge, a top highlight, a layered shadow). New `LGButtonStyle` (`.buttonStyle(.lg(.primary))`,
  also `.secondary`, `.ghost`, `.danger`), with a lit primary and visible pressed states. `LGChip`
  is a pill with a 12 % tint and a thin tinted outline (neutral: 5 %).
- Toasts: `LGToastCenter` (`show`, `update`, `dismiss`, `promise`) and `.lgToasts(center)`. Stacked
  bottom-trailing, at most three visible, fanned out on hover or keyboard / VoiceOver focus (timers
  pause), 4 s auto-dismiss, loading toasts stay until updated, swipe right or × to dismiss, announced
  to VoiceOver (bad toasts with high priority).
- Command palette: `.lgCommandPalette(isPresented:commands:)`, toggled with ⌘K, with the web's fuzzy
  scoring (`LadaGlass.fuzzy`) and groups; ↑↓ move, Return runs, Esc closes.
- Numbers: `LGNumber(value:format:showsDelta:)` rolls with `.numericText`; `LGDelta` shows +n / −n
  (a real minus sign). Instant under Reduce Motion.
- Charts: `LadaGlass.chartColors()` (the web's order), `.lgChartSeriesStyle(index:)` (a distinct
  symbol and dash per series, so no chart relies on colour alone) and `LGSparkline(values:)`.
- Sheets, drawers and popovers stay native: `.lgSheetSurface()` for `.inspector` and `.sheet`,
  `.lgPopoverSurface()` for `.popover` (recipes in the file header).
- `design/swift/`: a SwiftPM harness that builds the shipped file, unit tests for the pure parts
  (fuzzy, chart colours and series styles, delta formatting, toast timing and stacking) and a
  `#Preview` of every component. `tests/design-swift.test.sh` runs the tests on macOS.

## 2.0.0 (2026-11-11)

### Breaking

- Radii changed: control 6 to 9 px, card 10 to 12 px; new small (6 px) and sheet (16 px). Anything
  that hard-coded the old values or relied on them looks different.
- Tables need `.lg-table-wrap` for rounded corners. `.lg-table` is now `border-collapse: separate`
  and draws its row lines as inset shadows inside the cells (not borders).
- Accent stripes (toast, alert) are a clipped `::before` driven by `--lg-stripe`, not `border-left`.
  An app that recoloured a toast with `border-left-color` must set `--lg-stripe` instead.
- Glass surfaces have a real 1 px border (`--lg-glass-edge`) instead of the `::after` gradient edge,
  so popup, toast and empty state grow 1 px per side and `::after` is free on surfaces.
- `.lg-kbd` is restyled as a keycap (taller, with a bottom edge).
- Behaviour: while a modal or drawer is open the toaster lives inside it, so toasts appear above the
  backdrop instead of under it.
- Bootstrap bridge: Bootstrap components (cards, modals, dropdowns, offcanvas, toasts, popovers,
  tables, list groups, buttons) now take the 2.0 look, with radius variables set on the component
  selectors and thead and list-group colours driven by variables.

### How to upgrade an app

Copy the new files from `design/` into `vendor/lada-glass/2.0.0/` (`lada-glass.css`, `lada-glass.js`,
`lada-glass-bootstrap.css` if the app uses Bootstrap, `VERSION`, `CHANGELOG.md`, `icons/` and
`graphics/`; this is what `new-project.sh` vendors) and point the `<link>` at the new folder. Add
`<script src="vendor/lada-glass/2.0.0/lada-glass.js" defer></script>` if the app wants the components
(modals, drawer, toasts, palette, tooltips, charts, tables). Wrap tables in `.lg-table-wrap`, then go
through the Breaking list above. Native apps replace `LadaGlass.swift` and keep its first line.
`claude-check` reports apps still on 1.x as older (DES-FAMILY-2); that is expected until they upgrade.

### Added and changed

- Bootstrap bridge: cards, modals, dropdowns, offcanvas, toasts and popovers get the 2.0 glass surface (gradient, padding-box clip, edge, top light, layered shadow); Bootstrap radius variables use the control/card/sheet tokens; `.btn-primary` is lit; `.table-responsive` is a rounded clipping wrapper and `.table` uses separate borders. No JS.
- Keyboard and focus: a focused danger menu item has its own fill (a 12 % danger tint, AA in both
  themes); an overlay whose trigger is gone or hidden (⌘K pressed from an open menu) returns focus to
  the menu's trigger; Esc hides a visible tooltip before it closes a popover or menu around it;
  `[data-lg-step]` buttons never submit their form; a toast's × pressed from the keyboard moves focus
  to the next toast's × or back to where it was; `.lg-spotlight` no longer overrides its host's
  position (a sticky `.lg-sidebar` stays sticky).
- `.lg-nav` styles `aria-current="location"` and `"true"` like `"page"` (for in-page indexes, e.g. a scroll-spy).
- Demo page (`preview.html`): a shimmer hero title with KPI cards (spotlight, rolling numbers, sparklines), a sticky grouped in-page index of every section (marks the section in view; a sideways-scrolling sticky bar on phones), and a page command palette on ⌘K / Ctrl K (jump to a section, switch theme, accent or density). The Palette section's demo palette now opens from its button only (`shortcut: false`), and the shortcut labels read Ctrl K off Apple platforms.
- Tables: sortable headers (`th[data-lg-sort]`, `aria-sort` cycle, a keyboard-operable button inside the header, `LadaGlass.table.compare`), row selection (`data-lg-select`, `data-lg-select-all` with indeterminate state, `lg-selection` event; selected rows get `data-lg-selected` as the styling hook, not `aria-selected`, which is only valid in grids — the row's checkbox is the accessible state), `.lg-table-sticky` and `.lg-table-empty`.
- Tokens 2.0: radii are control 9, card 12, small 6, sheet 16 px (were 6 and 10); new `glass` token group
  (`--lg-glass-fill-top/-bottom/-edge/-highlight/-shadow/-glow`, with `-d`/`-l` values and an active
  value per theme). `check_tokens.py css` checks them; Swift gains `Radius.small` and `Radius.sheet`.
- `lada-glass.js`: a classic script with one global, `LadaGlass` (`version`, `tokens.accents`, `util`:
  `el`, `svg`, `focusables`, `reducedMotion`, `onKey`, `uid`), built by `build.py` from `design/js/`. It
  also loads in Node (`require`). The preview loads it; new projects vendor it.
- The 2.0 look on every existing component: glass panels have a faint vertical gradient, a real 1 px
  edge (`--lg-glass-edge`, replacing the `::after` gradient edge, so `::after` is free on surfaces), a
  soft top light and a layered shadow; the primary button is lit (accent gradient, top highlight,
  glow); chips are pills with a 12 % tint and a thin tinted outline (the neutral chip 5 %); tabs,
  inputs, toggle, nav, code and the popup mark follow; the backdrop is a radial accent wash.
- Form controls: `.lg-check` (checkbox, radio, indeterminate), `.lg-select`, `.lg-segmented`, `.lg-slider`
  (fill from `--lg-fill`, kept by the script), `.lg-search` (icon, optional `.lg-kbd` hint, styled clear
  button), `.lg-stepper` (`data-lg-step` buttons; honours min, max, step, fires `input` and `change`) and
  a restyled `textarea.lg-input`. Invalid shows for `:user-invalid` and `aria-invalid="true"`.
  `LadaGlass.syncSliders(root?)` sets the fill for sliders added later by script.
- Clean corners: backgrounds are clipped to the padding box; `.lg-table-wrap` is now a rounded,
  clipping frame (`border-collapse: separate`, row lines drawn inside the cells); the toast's accent
  stripe is a clipped `::before` instead of `border-left` (apps that recoloured it with
  `border-left-color` set `--lg-stripe` instead).
- Drawer: `<dialog class="lg-drawer">` with `LadaGlass.drawer.open/close/shouldDismiss`. A side sheet on wide
  screens, a bottom sheet with a draggable `.lg-drawer-handle` at 760 px and narrower; slides in and out,
  nothing animates under reduced motion.
- Toasts: `LadaGlass.toast(title, {type, description, duration})` (`info`, `ok`, `bad`, `loading`; 4 s, a
  loading toast or `duration: 0` stays) returns `{update, dismiss}`; `LadaGlass.toast.promise(promise,
  {loading, success, error})`. Sonner-style: a `.lg-toaster` live region (`aria-live="polite"`, bad toasts
  `role="alert"`) in the bottom-right corner, at most 3 visible, fanned out on hover or focus (timers
  pause), dismissed by × or a 90 px drag right. `.lg-toast` gains `.lg-info`/`.lg-loading`,
  `.lg-toast-icon`, `-title`, `-description` and `-close`; a static `.lg-toast` still works as before. While a
  modal or drawer is open the toaster lives inside it (a manual popover in the top layer), so toasts stay
  visible, usable and announced above the backdrop.
- Command palette: `LadaGlass.palette({commands, placeholder, shortcut = true})` returns `{open, close,
  setCommands}`; each command is `{group, label, keywords, shortcut, run}`. ⌘K (Ctrl K off Apple
  platforms) toggles it; a `<dialog class="lg-palette">` 70 px from the top with a fuzzy-filtered,
  grouped list (ARIA combobox and listbox, ↑ ↓ wrap, Enter or a click runs the command after the
  palette closes, Esc closes only it, "No results" when nothing matches). `LadaGlass.fuzzy(query, text)`
  is the scorer (null for no match). `LadaGlass.util.onKey` no longer throws on a keydown without a key
  (Chrome's autofill).
- Tooltips, popovers and menus: `[data-lg-tooltip="text"]` (optional `data-lg-shortcut`) shows a shared
  `.lg-tooltip` (`role="tooltip"`, linked by `aria-describedby`) 400 ms after hover or at once on keyboard
  focus; `[data-lg-popover="<id>"]` toggles a `.lg-popover`; `[data-lg-menu="<id>"]` opens a
  `<div class="lg-menu" role="menu">` (`role="menuitem"` items, `.lg-menu-sep`, `data-danger`; ↑ ↓ wrap,
  Home, End, first-letter typeahead, Enter/Space or a click dispatches `lg-select` with
  `detail.value` from `data-value`). `LadaGlass.contextMenu(target, menu)` opens a menu at the pointer
  (or Shift F10). `LadaGlass.combobox(input, {options, onSelect})` filters a `.lg-combobox` listbox with
  the fuzzy scorer. Esc, an outside click or focus moving away closes them; Esc and closing return focus
  to the trigger and never also close an enclosing modal. They float in the top layer (inside an open
  modal when their trigger is in one), placed by `LadaGlass.place(anchorRect, size, viewport, side, gap)`,
  which flips and clamps them inside the viewport.
- Opt-in extras: `.lg-spotlight` (a soft accent light follows the pointer; `lada-glass.js` sets
  `--lg-x`/`--lg-y`) and `.lg-shimmer` (a 2.8 s light sweep over text). Under reduced motion the light
  is hidden and the shimmer is static muted text. The preview has an Extras section.
- `check_tokens.py contrast` also checks the 2.0 glass top and the 2.0 chip tints in both themes.
- Feedback, navigation and data display (CSS only): `.lg-progress` (native `<progress>`, indeterminate
  pulse), `.lg-ring` (`--lg-value` 0 to 100), `.lg-spinner`, `.lg-skeleton` (seamless shimmer tile),
  `.lg-alert` (`-info`, `-ok`, `-warn`, `-bad`, with the toast's clipped stripe) and `.lg-banner`;
  `.lg-breadcrumbs`, `.lg-pagination`, `.lg-load-more`, `.lg-accordion` (`<details>`), `.lg-steps`
  (`data-state`); `.lg-badge`, `.lg-counter`, `.lg-avatar` (`-s`, `-l`), `.lg-kv`, `.lg-divider`, `.lg-tag`;
  `.lg-kbd` is now a keycap. Loaders stop under Reduce Motion. New contrast pairs; preview sections.
- Modals on the native `<dialog>`: `.lg-modal` (glass on the solid surface, title `.lg-modal-title`,
  scrolling `.lg-modal-body`, `.lg-modal-actions`), `.lg-modal-lg` (`min(960px, 92vw)`), a dimmed and
  blurred `::backdrop`, and a quick fade and scale from .96 on open and close (none under Reduce
  Motion). `LadaGlass.modal.open(dialog, {trigger})` / `close(dialog, value?)`, and
  `LadaGlass.confirm({title, body, confirmLabel, cancelLabel, danger})` → `Promise<boolean>` (builds
  and removes its own dialog; text only). A backdrop click closes unless the dialog has
  `data-lg-static`; a `type="button"` with `data-lg-close` closes its dialog with its `value` (for
  Cancel, so Enter in a field submits rather than cancels). Form dialogs (`<form method="dialog">`) show the browser's validation message in
  a `.lg-field-error` after each invalid field (with `aria-invalid="true"`) and stay open.
  `LadaGlass.overlay` (`open`, `close`, `stack`) is the shared core: focus goes back to the trigger,
  and Esc closes only the newest overlay. The preview has a Modals section.
- Animated numbers: `LadaGlass.number(el, value, {locale, format, delta})` shows an `Intl.NumberFormat` value
  with one rolling column per digit (separators and signs static, a real minus sign), the value as
  `aria-label`, and with `delta: true` a `.lg-delta` badge (`+n` `.lg-delta-up`, `−n` `.lg-delta-down`).
  `[data-lg-number="<value>"]` works without your own script (lada-glass.js auto-init) and redraws
  when the attribute changes. Instant under reduced motion.
- Chart core `LadaGlass.chart`: `niceTicks`, `scale`, `linePath`, `arcPath` (never `NaN`) and `colors(el)`
  (`--lg-accent`, `--lg-accent-2`, then the other accents for the active theme), plus
  `chart.sparkline(el, values, {area})`: a small accent trend line (`.lg-sparkline`; under 2 values it
  draws nothing and sets `data-lg-empty`). The preview has a Numbers section and sparklines in the KPI cards.
- Charts, hand-made SVG on the chart core: `chart.line(el, {label, series, area, x: {type, format}, y: {format}})`,
  `chart.bar(el, {label, categories, series, stacked, horizontal})`, `chart.donut(el, {label, parts, center})` and
  `chart.meter(el, {label, value, max})` (a half-ring gauge), each returning `{update, destroy}`. Every chart is
  `role="img"` with an `aria-label` summary of its data, redraws on resize, shows `.lg-chart-empty` "No data"
  (and `data-lg-empty`) without finite values, and sets all text with `textContent`. Colour is never the only
  cue: two or more series get a legend, lines get dash patterns and end labels, bar series and donut parts
  after the first get hatching, and donut parts are listed with value and share. Line, bar and donut charts
  are focusable; hover or the arrow keys show a `.lg-chart-tip` tooltip with every series' value. Pure helpers `chart.barPath` and
  `chart.nearest`. The preview has a Charts section in both themes.

## 1.1.1 (2026-11-08)

- Bootstrap bridge: a forced `data-bs-theme` now always wins. On a light-mode system, the system-light
  rule of `lada-glass.css` outranked `[data-bs-theme="dark"]`, so a dark Bootstrap app got light
  accent-text tokens (white text on accent colours; found by Fingerprinter's contrast checks).

## 1.1.0 (2026-11-08)

- `lada-glass-bootstrap.css`, a bridge for apps built with Bootstrap 5.3: `data-bs-theme` picks the
  same theme tokens as `data-theme`, Bootstrap's variables (body, borders, radii, primary, links,
  status colours) point at the Låda Glass tokens, and cards, modals, dropdowns, navbars, buttons,
  form controls, tables, tabs and badges get the frosted-glass look. Markup and scripts stay as they
  are. Built by `build.py` from `lada-glass.css` and `bootstrap-bridge.src.css`.

## 1.0.1 (2026-11-04)

- Fix: a button written as a link (`<a class="lg-btn lg-btn-primary">`) got the link colour, which made
  the primary button's text invisible. The base link rule is now `.lg :where(a)`, so `.lg-btn*` wins.
- `LadaGlass.swift` is unchanged apart from the version line.

## 1.0.0 (2026-11-04)

- First version. Tokens from Låda (`tokens.json`): surfaces, text, borders, status colours, ten
  accent themes (fjord default, frost cyan second accent), 4-pt spacing, radii 6/10, type scale,
  motion (140 ms quick, 320 standard, 350 data, 550 slow), compact density.
- For WCAG AA: chip labels use `*-text` status colours, and the light cloudberry and birch-gold
  accents are 3 % deeper than Låda's.
- `lada-glass.css`: dark/light themes (system, or `data-theme`), accent presets and custom accents,
  frosted-glass surfaces with a fine edge, backdrop with two glows, app shell (sidebar becomes a top
  bar on phones), responsive grid, cards, KPIs, buttons, inputs, tabs, toggle, chips, table, toast,
  empty state, extension popup, icons; 44 px touch targets on touch screens; reduced motion,
  reduced transparency, forced colours and print.
- `LadaGlass.swift`: the same tokens for SwiftUI, with panel, backdrop, chip and motion helpers.
- 44 line icons (`icons/`, plus `sprite.svg`), 4 line-art graphics (`graphics/`), `preview.html`.
