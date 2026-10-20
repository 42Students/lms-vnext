# chat-20 — micro-details parity (checklist A3, A4, I)

Baseline: `docs/design/legacy-styles/`, `docs/design/old-lms-shell.css`, `docs/design/old-lms-shell-spec.md`. Work is isolated to `src/styles/micro-details.css` and this audit. `src/app/globals.css:9` imports the micro CSS **once**, directly below the legacy-skin import. Do not edit `src/components/ui/*`, `legacy-skin.css`, layouts, icons, page markup or scripts.

This audit distinguishes **source-matched CSS details** from **unknown or non-CSS behavior**. A checked entry is a completed *static-value implementation*, not a claim that live screenshots and automated coverage were performed. The full strict category closure remains unticked until an orchestrator runtime pass.

## Work queue — individual details

- [x] A3: fast/normal/slow transition values and standard easing — `components___variables.scss:251-259`; micro CSS 12-15; 4 exact token matches.
- [x] A3: interactive button hover, active, pressed, disabled, loading/pending paint — `components___antddesign.scss:153-181`, `components___button.scss:13-16`; existing `globals.css:371-405,615-635,1127-1148` + micro CSS 38-52,203-205 (no changes to component behavior).
- [x] A3: touch pressed card feedback — `components___accessibility.scss:49-60`; micro CSS 67-74 (scale .98, opacity .9, 50ms ease).
- [x] A3/A4: pointer, disabled, loading cursor states — `components___button.scss:13-17`, `components___notification-drawer.scss:26-41,192-203`; micro CSS 38-52,203-205; disabled not-allowed is vNext fallback because legacy leaves it unspecified.
- [x] A4: click versus keyboard focus — `components___accessibility.scss:13-36`; micro CSS 23-33,55-59,437-441 (generic 2px #1a95a1 / +3px, elevated 2px / +2px and 12% halo; extra `[tabindex]` and editable-region fallback).
- [x] A4: notification item focus ring — `components___notification-drawer.scss:217-224`; micro CSS 228-231 (1px #6b7280 / +1px).
- [x] A4: hidden scrollbar baseline — `components___common.scss:307-311,329-331` and `old-lms-shell.css:10-11`; existing `globals.css:183-193`.
- [x] A4: admin table 4px and tab 3px scrollbars — `pages___admin-list-pages.scss:96-106,244-254`; micro CSS 240-272 plus transparent WebKit scrollbar track at 463-469, using real ScrollCue viewport markup (`src/components/ui/scroll-cue.tsx`).
- [x] A4: tap highlight disabled for semantic controls — `components___notification-drawer.scss:38-41,196-203`; micro CSS 183-186.
- [x] A4: link colour and hover underline — `components___common.scss:68-75`; micro CSS 79-87 and `legacy-skin.css:349-368`.
- [x] A4: placeholder muted neutral — `components___form.scss:57-60`, `components___variables.scss:28`; micro CSS 112-115 (14px inherited from legacy skin).
- [x] I: checkbox/radio checked TEAL and switch checked track — `components___antddesign.scss:123-132,742-745`, `components___common.scss:226-228`; micro CSS 92-104,191-194,338-347.
- [x] I: notification list link/button hover, active and focus transition 200ms — `components___notification-drawer.scss:192-224`; micro CSS 207-231 (list-button hover at 221-225, item focus at 228-231).
- [x] I: notification panel open 200ms ease-out from 8px, backdrop 150ms — `components___notification-drawer.scss:83-102,112-143`; micro CSS 311-326.
- [x] I: active-tab underline width and opacity 200ms ease-in-out — `components___common.scss:381-415`; micro CSS 401-403 (same native tab pseudo-element; no layout changes).
- [x] I: selected menu option #26bac7/white (separate from nav tint) — `components___antddesign.scss:134-137`; micro CSS 144-148.
- [ ] I: **sticky table shadow parity** — corrected the earlier false source mapping: `old-lms-shell.css:55-56` applies `0 1px 3px rgba(26,45,72,.035)` to `.tpo-shell-header.ln-head` **only**, not `thead`/`th`. Removed ungrounded sticky-table shadows from micro CSS (comments `micro-details.css:149-156,291-297`); table header shadow, if any, requires a real legacy table selector or browser measurement. Topbar styling belongs to chat-13.
- [x] I: reduced-motion preference — `components___accessibility.scss:116-124`, `components___antddesign.scss:184-189`; existing `globals.css:304-312`; micro CSS 174-178,386-393.
- [x] I: print interaction paint only, no layout — `components___accessibility.scss:116-124`; micro CSS 369-379; `src/app/(authenticated)/authenticated-print.css` owns paper/layout rules.
- [ ] A4: text-selection **legacy exact parity** — `components___variables.scss:10-13,24` supplies colours but no `::selection` selector; micro CSS 125-128 uses those tokens. Actual legacy selection paint unverified.
- [ ] I: table-row hover and selected-row **whole-app parity** — standard `.ln-table` hover is now source-matched (`components___common.scss:697-714,849-855` → micro CSS 450-461: cell `background:none !important`); `components___common.scss:130-139` proves the white no-hover exemption. Selected-row colour is still not specified by legacy SCSS (`old-lms-shell.css:45-48` is navigation, not a table), and custom/non-shared table instances have not been exhaustively grepped; full strict tick withheld.
- [ ] I: checkbox/radio glyph and switch-thumb **animation parity** — teal checked colours matched, 150ms track-transition aligned to `components___variables.scss:251-259` (micro CSS 338-347); the old SCSS does not define the glyph/thumb animation, and native browser checkmarks are not tweenable by CSS.
- [ ] I: input browser autofill **exact parity** — `components___form.scss:57-60` gives placeholder but not autofill; micro CSS 118-121,349-360 preserves ink/caret. Browser-autofill background remains user-agent controlled.
- [ ] I: tooltip mouse-enter/mouse-leave **delay parity** — confirmed source mismatch, not a styling mystery: `42Students/lms2-fe@prod-2026/src/components/Global/Tooltips/CustomToolTipTable.jsx:10-31` passes no timing props to AntD v5 Tooltip; [AntD v5 Tooltip API](https://5x.ant.design/components/tooltip/) documents **0.1s/0.1s** enter/leave defaults. `src/components/ui/tooltip.tsx:30-45` opens/closes immediately (**0ms**). CSS cannot delay JS `details.open` mutations, so leave unticked for tooltip component owner.
- [ ] I: toast **timeout parity** — no toast lifetime in the supplied legacy SCSS. `src/components/ui/toast.tsx:133-143` uses 4500–15000ms reading time, errors persistent, timers paused during focus/hover. Timer logic is not CSS-editable.
- [ ] I: toast **placement parity** — old SCSS has no toast placement. Current bottom-right safe-area placement is `src/components/ui/toast.tsx:49-73`; positioning would change layout/JS scope and is not modified.
- [ ] I: toast **animation exact parity** — `globals.css:269-287` already has 250ms entrance (generic normal token from `components___variables.scss:253-259`); no legacy toast keyframes were found to confirm exact curves.
- [ ] I: generic dropdown/menu **close** animation — removed an unsupported 250ms / -6px micro entrance. Shared `src/components/ui/legacy-overlays.css:330-359` already provides a 200ms ease-out / -8px entrance; legacy `components___dropdown.scss:27-35,96-104` specifies shape/shadow but **not timing**. Native `details` closes immediately in `src/components/ui/dropdown.tsx`, so a CSS exit cannot keep its dismissed popup mounted. Exact old-vs-new exit semantics still require the overlay owner/browser.
- [ ] I: generic modal/drawer **open/close** animation parity — shared `legacy-overlays.css` owns 180/200ms open/close, `globals.css:218-268` has entrance effects. Legacy `components___antddesign.scss:1033-1065` specifies geometry, not comparable exit keyframes. Ownership remains chat-16; micro CSS does not override it.
- [ ] A3/I: scrollbar and focus **responsive screenshot comparison** — legacy `old-lms-shell.css:23,41-43,73-100` covers phone/rail behavior. CSS scopes verified statically; side-by-side browser observation still required.
- [ ] A4: favicon artwork — `src/app/icon.svg:1-6` exists; no old favicon asset is present in the SCSS. Browser favicon cannot be changed from an imported CSS file.
- [ ] A4: browser-tab title format — confirmed mismatch: **legacy** `42Students/lms2-fe/src/utils/pageTitle.js:23-26` emits `42 LMS - ${pageTitle}` (fallback `42 LMS`), `src/layouts/layout.js:297-303` renders it; **vNext** `src/app/layout.tsx:11-14` emits `%s · 42LMS` (default `42LMS`). CSS cannot change Next metadata; mark for metadata owner, do not tick.
- [ ] I: full print output equivalence — `authenticated-print.css` contains current print layout, but supplied legacy SCSS has no `@media print` rule. The micro pass removes interaction paint only; output comparison remains external.

## Audited value table — exact referenced properties

| Detail | Old LMS file:line and value | vNext file:line and effective value | Static result |
| --- | --- | --- | --- |
| Motion fast | `components___variables.scss:251-252` 150ms | `micro-details.css:12` 150ms | Equal |
| Motion normal | `components___variables.scss:253-254` 250ms | `micro-details.css:13` 250ms | Equal |
| Motion slow | `components___variables.scss:255-256` 350ms | `micro-details.css:14` 350ms | Equal |
| Easing | `components___variables.scss:258` cubic-bezier(.2,0,0,1) | `micro-details.css:15` cubic-bezier(.2,0,0,1) | Equal |
| Keyboard ring | `components___accessibility.scss:19-23` teal text, 2px, offset 3px | `micro-details.css:27-32` #1a95a1, 2px, 3px | Equal fallback |
| Click outline | `components___accessibility.scss:13-16` none | `micro-details.css:23-26` none for non-keyboard focus | Equal |
| Card ring | `components___accessibility.scss:25-36` 2px, +2px, 4px 12% halo | `micro-details.css:55-59` same | Equal |
| Notification row ring | `components___notification-drawer.scss:221-224` 1px neutral-500 +1px | `micro-details.css:228-231` same | Equal |
| Press scale | `components___accessibility.scss:49-60` .98/.9 and 50ms | `micro-details.css:67-74` same | Equal |
| Hover link | `components___common.scss:68-75` #26bac7 + underline | `micro-details.css:79-87`, `legacy-skin.css:349-368` | Equal |
| Tap flash | `components___notification-drawer.scss:40,203` transparent | `micro-details.css:183-186` transparent | Equal |
| Native checked colour | `components___antddesign.scss:123-132,742-745` #26bac7 | `micro-details.css:92-104` #26bac7 | Equal paint |
| Checked switch fill | `components___common.scss:226-228` #26bac7 | `micro-details.css:191-194` #26bac7 | Equal paint |
| Placeholder | `components___form.scss:57-60` #a9a7ae and 14px | `micro-details.css:112-115` + legacy skin | Equal |
| Generic scrollbars hidden | `components___common.scss:307-311,329-331` none | `globals.css:183-193` none | Equal |
| Admin table scrollbar | `pages___admin-list-pages.scss:96-106` thin, 4px thumb rgba(0,0,0,.2) 2px radius | `micro-details.css:240-257` same | Equal |
| Admin tabs scrollbar | `pages___admin-list-pages.scss:244-254` thin, 3px thumb rgba(0,0,0,.2) 2px radius | `micro-details.css:258-272` same | Equal |
| Admin table scrollbar track | `pages___admin-list-pages.scss:106` WebKit track transparent, Firefox scrollbar-color transparent | `micro-details.css:463-469` `background-color:transparent`, alongside `:240-253` `scrollbar-color: ... transparent` | Equal declarations |
| Notification button hover | `components___notification-drawer.scss:192-210` #fafbfc, #e5e9f0 border, 0 1px 3px rgba(0,0,0,.04) | `micro-details.css:221-225` same on list buttons (list links styled by legacy-overlays) | Equal paint |
| Notification list transitions | `components___notification-drawer.scss:202-215` 200ms ease, active rgba(0,0,0,.06) | `micro-details.css:207-216` same | Equal paint |
| Tab underline | `components___common.scss:381-415` width/opacity 200ms ease-in-out | `micro-details.css:401-403` same | Equal |
| Notification panel enter | `components___notification-drawer.scss:125-143` 200ms ease-out, -8px | `micro-details.css:315-322` same | Equal |
| Notification backdrop enter | `components___notification-drawer.scss:90-102` 150ms ease-out | `micro-details.css:311-314,323-325` same | Equal declaration |
| Selected option | `components___antddesign.scss:134-137` teal + white | `micro-details.css:144-148` teal + white | Equal |
| Sticky **topbar** shadow, not a table rule | `old-lms-shell.css:55-56` `.tpo-shell-header.ln-head` only: `0 1px 3px rgba(26,45,72,.035)` | `micro-details.css:149-156,291-297` deliberately carries **no** table shadow; chat-13 owns header | Previous table application was incorrect; corrected, table-specific value unverified |
| Reduced motion | `components___accessibility.scss:116-124` .01ms and scroll auto | `globals.css:304-312`, `micro-details.css:386-393` | Equal |
| Print interaction | No legacy print-specific declarations in copied SCSS | `micro-details.css:369-379`: transition/animation none, no geometry | Unverifiable |

## Next unticked batch — source-backed value and coverage proof (2026-10-19)

This batch changed only `src/styles/micro-details.css` plus this audit; component markup, event handling, data access and CSS geometry are unchanged. The two additions correspond to exact legacy selectors, not guessed hover colours or tooltip delays.

| Micro-state/property | Old LMS reference, state and value | vNext declaration and value | Finding |
| --- | --- | --- | --- |
| Keyboard outline, explicit-focus regions | `components___accessibility.scss:19-23` `:focus-visible`: `2px solid #1a95a1`, offset `3px` | `micro-details.css:437-441` explicit tab stops, editable regions and semantic options: `2px solid var(--lms-micro-focus)` = `#1a95a1`, offset `3px` | Equal for these properties, component-specific rings intentionally retained |
| Keyboard-focus ring for cards | `components___accessibility.scss:25-36`: `2px` / `2px` offset, `0 0 0 4px rgba(26,149,161,.12)` | `micro-details.css:55-59` same | Already source-matched; no change |
| Ordinary table cell, resting | `components___common.scss:697-714` `.ln-table td`: `background:#fff` | `table.tsx:14-17`, `data-table.tsx:93-110`: white surface via component/skin | Existing shared table source read; not a new override |
| Ordinary `.ln-table` cell, hovered | `components___common.scss:849-855`: `background:none !important` on `tr:hover td` | `micro-details.css:450-454` Table and `:448-454` responsive DataTable: `background:none !important` on unselected hovered cells | **Exact hover-property match** for these shared-table states |
| Legacy hover opt-out | `components___common.scss:130-139` `.ln-table-no-hover`: `background:#fff !important` | `micro-details.css:294-297` existing white exemption; `:452,458` excludes descendant `.ln-table-no-hover` from new clear | Exemption preserved |
| Selected row, mouse / keyboard | Legacy SCSS supplies no general selected-row colour; `old-lms-shell.css:45-48` is sidebar only | `micro-details.css:133-136,282-287`: `#eff8fa` when selected state is explicit | **Unknown legacy value; unticked** |
| Exam-table odd-row hover | `components___common.scss:808-815` odd cells `#f8fbff !important` | No change to `Table` striped option or exam-specific styling in this lane | **Special-case parity not claimed; chat-14 owns table types** |

**Read-only source-search / grep evidence.** GitHub code-search in `42Students/lms-vnext` returned the following paths. These are actual search results, not claims that a local `grep`, build, TypeScript checker, or screenshot runner was executed:

| Exact search string | Hits | Production declarations found |
| --- | ---: | --- |
| `@import "../styles/micro-details.css"` | 2 indexed-file hits (1 code + 1 audit) | Only production CSS import: `src/app/globals.css:9`, once after legacy skin at line 6 |
| `data-slot="table"` | 4 indexed-file hits | `src/components/ui/table.tsx:14`, `src/styles/micro-details.css`, `src/app/globals.css`, this audit; only one shared component definition |
| `data-slot="data-table"` | 15 indexed-file hits | `src/components/ui/data-table.tsx:38,93` and style/print CSS, this audit, and tests; only one production component source |
| `data-slot="scroll-cue"` | 12 | `src/components/ui/scroll-cue.tsx:61-69` provides `[tabindex]` and its actual first-child scroll viewport; remaining matches are style/audit/test references |

Whole-repository negative greps required by the STRICT TICK RULE remain **unrun** because this lane is expressly not permitted to run code. Re-run these source-only commands in the orchestrator before ticking broad closure:

```sh
rg -n --glob '*.tsx' 'data-slot="(table|data-table)"|<table[ >]|<tr[ >]' src
rg -n --glob '*.tsx' 'tabIndex=|contentEditable|role="(checkbox|radio|option)"' src
rg -n '::selection|autofill|selected|mouseEnterDelay|mouseLeaveDelay' docs/design/legacy-styles
rg -n 'micro-details\.css' src/app src/styles
```

**Responsive source comparison (no screenshots claimed):** `old-lms-shell.css:23,73-100` uses a `767px` mobile limit; `micro-details.css:455-461` therefore applies DataTable's hover-background reset only at `768px+`. `data-table.tsx:93-110` displays card-form rows on small screens; the new rule does not affect those rows at 320–767px. Shared `Table` continues to use its existing horizontal ScrollCue at all widths (no new layout rule); table scrollbar 4px/tab scrollbar 3px are handled by `micro-details.css:238-268` with transparent WebKit tracks at `:456-462`, with actual viewport at `scroll-cue.tsx:61-69`. At tablet width 768–1199px and desktop 1200px+, the shared table-hover declaration applies to unselected cells without changing their dimensions. Focus fallback is width-independent; existing `@media (hover:none)` protects touch press, `@media (prefers-reduced-motion:reduce)` protects animations, and print retains separate `@media print` interaction suppression. **Browser focus rings, selection highlighting, tablet hover with touch hardware, and side-by-side screenshots still need runtime observation.**

**Ownership and no-regression:** No React/TypeScript or shared UI/component file was edited, and no styles were added for positioning, padding, margins, widths, heights, or z-index. Matched elements retain their keyboard order and click handlers. CSS source read confirmed matched `{`/`}` counts after each micro stylesheet edit; runtime CSS parsing and computed-style comparison remain unperformed.

## Source-only follow-up: interactive cards, dark selection and external legacy artifacts

The current pass also inspected the **original legacy repository** `42Students/lms2-fe@prod-2026`, rather than guessing behavior from only copied SCSS. Legacy source reads were informational; no other repository, page, component or shared skin file was changed.

| Detail and state | Source of exact legacy value | Existing/new vNext value | Status |
| --- | --- | --- | --- |
| Opted-in card, resting shadow | `src/styles/components/_common.scss:141-147`: no resting shadow declared in `.ln-card-hvr`; transition `box-shadow 0.2s ease` | `src/components/ui/card.tsx:13`: static `shadow-none`; `micro-details.css:419-423`: opted-in interactive cards transition `200ms ease` | Equal declaration; browser verification open |
| Opted-in card on hover | `src/styles/components/_common.scss:144-146`: `0 4px 12px rgba(0,0,0,.08)` | `micro-details.css:414-418`: identical shadow for explicitly interactive cards only | Equal source-backed paint |
| Noninteractive cards | Legacy `.ln-card-hvr` is opt-in (`_common.scss:141`); ordinary cards do not inherit hover shadow | `card.tsx:13` static `shadow-none`; micro rule requires `[role="button"]` or `.ln-card-hvr` | Unaffected by the new rule |
| Keyboard / touch card | `_accessibility.scss:25-36,49-60`: 2px teal ring, offset 2px, touch 0.98 scale/0.9 opacity over 50ms | `micro-details.css:55-74` preserved unchanged | Same paint for semantically interactive cards |
| Reduced motion on hovered card | `_accessibility.scss:116-124`: transitions 0.01ms; hover effect itself persists | `micro-details.css:414-428`: shadow still appears on hover, but transition is disabled in reduce mode | Same interaction behavior, no transition |
| Light text selection | No `::selection` rule in copied legacy SCSS; palette `_variables.scss:10-13,24` | `micro-details.css:124-127` #1a1d21 on #eff8fa; `legacy-skin.css:494-498` adds scoped `!important` | **Unverified**, not claimed equal |
| Tracker opt-in dark selection | No dark-mode equivalent in old LMS | `micro-details.css:352-356` now uses `!important` to take precedence over the light skin's high-priority selection rule and preserve foreground contrast | **vNext compatibility fix**, not legacy parity |
| Legacy favicon paths/colours | `42Students/lms2-fe/public/favicon.svg:1-4`: two paths, fills `#266891` and `#ADE2E7`; `public/manifest.json:8-11` references favicon.png and favicon.svg | `src/app/icon.svg:1-5`: three paths, fills `#266891`, `#9EE4E8`, `#26BAC7` | **Different artworks**, CSS-only chat-20 cannot rewrite SVG |
| Browser-title metadata | Legacy `src/utils/pageTitle.js:23-26` `42 LMS - ${pageTitle}` (fallback `42 LMS`), used in `src/layouts/layout.js:297-303`; college admin `AdminLayout.js:40-43` uses `42 LMS - ${title}` | `src/app/layout.tsx:11-14`: `42LMS` default, `%s · 42LMS` template | **Confirmed text/format mismatch**, outside CSS-only scope; hand off to metadata owner |
| Legacy Tooltip delay | `src/components/Global/Tooltips/CustomToolTipTable.jsx:1-35` uses Ant Design `Tooltip` without explicitly passed delay props | `src/components/ui/tooltip.tsx:30-45` opens/closes native `details` immediately | Old effective default belongs to AntD runtime; **do not guess milliseconds** or change JS from CSS |
| Modal/drawer behavior | `src/components/Global/ModalContainer/ModalContainer.jsx:25-61` and `RightDrawer/DrawerWidget.js:28-76` use AntD `Modal`/`Drawer`; no authored exit duration in those wrappers | `src/components/ui/legacy-overlays.css:305-359` supplies open/close CSS; state unmount belongs to components | Runtime comparison and overlay-owner lane required |
| Printable page output | Legacy source proof absent for paper layout; vNext `authenticated-print.css:1-80` handles print structure | `micro-details.css:369-379` disables residual interaction visuals only | **Print geometry remains outside scope** |

**Source-search proof, not a false full grep:** prior GitHub repository search on `data-slot="card"` identified the shared `src/components/ui/card.tsx:13` declaration. The SCSS's opted-in `.ln-card-hvr` rule is specifically `_common.scss:141-147`; no global static-card hover rule is copied. New selectors live entirely in `micro-details.css:410-428` and are gated by `(hover:hover)`. Breakpoints and geometry are unchanged: on a phone/touchscreen where `(hover:none)`, these shadows do not appear and existing tap-feedback code handles pressed state; a mouse-capable tablet or desktop gets the shadow without affecting layout. Reduced-motion users keep the hovered shadow but lose the animation. Actual screenshots and the legacy AntD/browser default timings remain unverified.

## Coverage and responsive review

- CSS entrypoints reviewed: `src/app/globals.css`, `src/styles/legacy-skin.css`, `src/styles/micro-details.css`, `src/components/ui/legacy-overlays.css`, `src/components/shell/sidebar-legacy.css`.
- UI markup inspected read-only: `src/components/ui/table.tsx`, `data-table.tsx`, `tabs.tsx`, `scroll-cue.tsx`, `dropdown.tsx`, `tooltip.tsx`, `toast.tsx`, `src/app/layout.tsx`, `src/app/icon.svg`, `src/app/(authenticated)/authenticated-print.css`. No component props/events changed.
- Selector integration: table and tab thin scrollbars address `[data-slot="scroll-cue"][data-axis="x"] > div:first-child`, exactly the native viewport in `scroll-cue.tsx`; selected rows require a real `aria-selected` / `data-state` attribute. CSS does not fabricate selection state.
- Responsive: baseline hidden scrollbars and focus rules apply on mobile and desktop; the thin scrollbar exceptions are for horizontally overflowing table/tab viewport only. Touch press is guarded by `@media (hover:none)`; reduced motion is guarded by the OS setting; print rules are in `@media print`. No widths, paddings, grid/flex, positioning or modal dimensions changed.
- No CI, TypeScript checks or app execution were performed, as requested. GitHub code search is not a substitute for a whole-repo grep; **do not claim zero hand-rolled instances**. Full paired-screen verification is a separate future orchestrator step.

**Correction to earlier audit evidence:** `docs/design/old-lms-shell.css:56` does **not** establish a sticky *table* header shadow. It specifically styles the TPO top bar. The two `box-shadow` declarations formerly assigned to table headers in `micro-details.css` were unsupported and have been removed without changing `position`, `z-index` or responsive breakpoints. Preserve a table-header-specific shadow only when independently proven from legacy code or computed styles. The topbar's shadow stays under chat-13 ownership.

## Focused CSS-only compatibility closure — dark-theme selected state

This is a **vNext-only regression prevention**, not an assertion that the old LMS had a dark theme. The legacy light-theme colours and focus geometry remain unchanged. The opt-in tracker mode declares the following values in `src/app/globals.css:168-181`, while `micro-details.css:12-18` defines legacy light-only fallback tokens.

| Property and state | Legacy light / vNext source | vNext dark-mode declaration | Result |
| --- | --- | --- | --- |
| Selected row background | Legacy text/selected-table paint unresolved; light vNext `micro-details.css:17` `#eff8fa` | `globals.css:180` `--lms-primary-subtle:#164e57`, now linked by `micro-details.css:476-479` to `--lms-micro-selected` | **Dark-mode compatibility fixed**; table-selected legacy parity still unticked |
| Keyboard focus tint | Legacy `components___accessibility.scss:19-23` `#1a95a1`, outline 2px, offset 3px | `globals.css:176` `--lms-primary-text:#75dce3`; `micro-details.css:476-479` reuses it for `--lms-micro-focus` | **Dark contrast paint corrected**; ring width/offset unchanged |
| Normal light selection and focus | `components___variables.scss:12-13` `#1a95a1`, `#eff8fa` | `micro-details.css:16-18` untouched for default theme | **No light-mode regression** |
| Responsive behaviour | Old `components___accessibility.scss:19-23,116-124` does not assign viewport-specific keyboard ring colour | Same CSS custom-property substitutions at phone 375px, tablet 768px and desktop 1280px; `prefers-reduced-motion` has no bearing on static colour | **Source media-query proof only**, no screenshot claim |

**Proof inventory (GitHub repository search, exact returned file-hit counts):** `@import "../styles/micro-details.css"` → **2 file hits**, one being the audit itself and only one production import in `src/app/globals.css:9`; `data-slot="table"` → **4** (component, two styles, audit); `data-slot="data-table"` → **15** (shared component, styles, audit and tests); `data-slot="scroll-cue"` → **12**; `data-slot="card"` → **4**; `data-slot="toast-stack"` → **8**; `data-slot="info-popover"` → **5**. Search index snapshots may lag moving `main`. These are source-index results, **not local grep output** or proof that no hand-rolled variants remain.

**Tooltip timing mismatch, now sourced:** Original source `CustomToolTipTable.jsx:10-31` renders AntD Tooltip without an override. AntD 5.x's [documented defaults](https://5x.ant.design/components/tooltip/) are 100ms before opening and 100ms before closing for pointer hover. vNext `src/components/ui/tooltip.tsx:30-45` mutates `details.open` immediately. **This is a real 100ms-vs-0ms source difference**, but requires a trigger/timer change in `src/components/ui/tooltip.tsx`, forbidden for chat-20. Do not paper over it with a 100ms CSS entry fade (the tooltip would still be interactive before the delay and its close timer would remain wrong).

## 2026-10-20 reconciliation — source-value, cascade and responsive proof

This bounded batch first confirmed that `origin/main` had integrated all previous chat-20 changes, then fast-forwarded `chatgpt/chat-20-b` to it. The following corrections are **CSS-only** and preserve all component props, handlers, focus order, route markup, widths and positioning.

| Property and interaction | Frozen old LMS source value | vNext source value and line | Result |
| --- | --- | --- | --- |
| Pressed touch card, normal motion | `components___accessibility.scss:49-60`: `@media(hover:none)`, `scale(.98)`, `opacity:.9`, `transition:transform .05s ease,opacity .05s ease` | `micro-details.css:67-74`: same (disabled buttons excluded) | Equal for scoped role/card surfaces |
| Pressed touch card, reduced motion | `components___accessibility.scss:116-124` keeps active `transform/opacity` but shortens animations and transitions to `.01ms !important` | `micro-details.css:67-74` always retains pressed paint, while `globals.css:304-312` suppresses its tween | Corrected: prior code incorrectly hid the active state entirely with reduced-motion preference |
| Explicit card hover opt-in | `components___common.scss:141-147` **only** `.ln-card-hvr`: `transition:box-shadow .2s ease`, `:hover box-shadow:0 4px 12px rgba(0,0,0,.08)` | `micro-details.css:410-428`: `main .ln-card-hvr` only; `(hover:hover)`; shadow/timing equal, motion-reduce disables tween | Corrected: removed an unsupported hover-elevation fallback for all `[data-slot=card][role=button]` |
| Standard card / role button on mouse hover | Legacy `components___accessibility.scss:25-36` assigns keyboard focus halo only; `components___common.scss:141-147` makes hover elevation opt-in | `micro-details.css:414-423` excludes generic role buttons unless the legacy opt-in class exists | No unexpected elevation |
| Admin table horizontal scrollbar, WebKit | `pages___admin-list-pages.scss:96-106`: track transparent, height `4px`, thumb `rgba(0,0,0,.2)`, `border-radius:2px` | `micro-details.css:240-257,463-469`: same; thumb background `!important` to beat `legacy-skin.css:511-514` generic important background | Corrected CSS cascade; equal declarations |
| Admin tab horizontal scrollbar, WebKit | `pages___admin-list-pages.scss:244-254`: height `3px`, same 20% black and radius `2px` thumb | `micro-details.css:258-272,463-469`: same; scoped `!important` thumb colour/radius | Corrected CSS cascade; equal declarations |
| Admin table/tab scrollbars, Firefox | Legacy `scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.2) transparent` | `micro-details.css:240-243,258-260`: identical values | Equal |
| Other scrollbars, all states | Legacy `components___common.scss:307-311,329-331`: hidden generic scrollbar chrome | `globals.css:183-193` hidden; exceptions scoped only to actual `[data-slot=scroll-cue][data-axis=x]` inside table/tabs | Unaffected |
| Responsive touch/mobile | Legacy touch selector `(hover:none)` independent of width; admin SCSS mobile limit `767px` | Mobile phone `375px`: hover elevation inactive, pressed effect active; tablet `768px` and desktop `1280px` with hover: explicit opt-in only; table scrollcue thumb style applies when its viewport is overflowed | CSS condition proof, **not screenshots** |
| Reduced-motion desktop hover | Legacy motion `.01ms` globally, but static hover shadow remains | `micro-details.css:414-428`: hover paint persists, `transition:none !important` in reduce mode | Equal state semantics |

**Grep/source-index proof:** GitHub code search for `ln-card-hvr` returned **3 files**—`docs/design/legacy-styles/components___common.scss`, `src/styles/micro-details.css`, and this audit. It returned **no vNext TSX usage**, so these rules are dormant until an opted-in card is intentionally marked; no blanket hover style was applied to make up for that gap. The exact `micro-details.css` CSS import occurs once in `src/app/globals.css:9`; the audit itself is a second indexed text hit for the import string. The production declarations of `data-slot="table"`/`data-slot="data-table"` remain their shared components. **These are GitHub source-index searches, not exhaustive local grep or runtime proof.**

**CSS cascade proof:** `src/styles/legacy-skin.css:511-514` applies `background-color:var(--lms-scrollbar-thumb)!important` to generic nested WebKit thumbs and a 1px (normal priority) radius. Without priority on the narrow exceptions, the generic fill won despite 20% black being specified in `micro-details.css`. The scoped table/tab thumb declarations now use `!important` for their specific measured values; this does not alter sidebar or body scrollbars. Motion reduction continues to be globally enforced with `animation-duration`/`transition-duration:.01ms!important`, with paint/selection retained.

**Outstanding verification:** Exact legacy selected-table colour, browser selection/autofill, native checkbox glyph motion, original tooltip/notification JS timing and position, modal close timing, favicon and title, actual print output, and phone/tablet/desktop side-by-side visual captures remain blocked on their respective owners and browser measurements. Do not convert their outstanding checklist boxes to `[x]` based on static CSS alone.

## Dropdown entrance deduplication and ownership (2026-10-20)

The old-LMS stylesheet `components___dropdown.scss:27-35,96-104` specifies the dropdown shape/shadow but **does not provide a 250ms entrance or a -6px translation**. The generic 250ms token in `components___variables.scss:253-259` is not proof that all dropdowns use that duration. Earlier chat-20 CSS added `lms-micro-dropdown-enter 250ms` and unintentionally overrode the explicitly owned `src/components/ui/legacy-overlays.css:330-359` popup transition.

| Item | Old LMS | Current vNext result | Status |
| --- | --- | --- | --- |
| Generic menu entry duration and vertical offset | Legacy dropdown-specific rule unknown; no comparable keyframes in `components___dropdown.scss:27-35,96-104` | Removed inferred chat-20 `250ms/-6px` declaration; `legacy-overlays.css:330-359` now supplies shared `200ms ease-out/-8px` | Duplicate/overriding animation **removed**; actual old popup motion unverified |
| Modal/drawer/notification entry | Notification source `components___notification-drawer.scss:90-102,125-143` proves **backdrop 150ms, panel 200ms/-8px** | Notification-specific micro CSS remains, same `200ms/-8px`; generic dialog/drawer remain chat-16 owned | Notification-specific value retained, no global dropdown guess |
| Closing native `details` | Old AntD popover lifecycle/timing not established by the static dropdown SCSS | `src/components/ui/dropdown.tsx:13-27` toggles `open=false` synchronously and does not preserve the popup for a delayed exit | JS/overlay-owner blocker, **unticked** |
| Responsive behavior | `old-lms-shell.css:23` mobile boundary at 767px | At 375px sheet and at 768px+ ordinary dropdown, the only remaining entrance is the shared overlay style; no new positioning or breakpoint introduced | Source-only scoped behavior, screenshots pending |
| Motion reduction | `components___accessibility.scss:116-124` `0.01ms` transition/animation suppression | `legacy-overlays.css:360-373` disables motion; `micro-details.css:164-171` retains a narrow explicit reduce-mode safety rule | Matches reduction semantics |

This addresses a CSS-cascade regression without claiming full old-LMS animation parity. The shared overlay owner remains responsible for JavaScript closing behavior and browser-side timing acceptance.

## Remaining acceptance queue — ownership and exact unblock condition

This is a deliberately finite list of the **unticked requirements**. The source-matched micro stylesheet is feature-complete within the allowed CSS-only surface, but the whole checklist is not closed until these external acceptance artifacts exist. Record verified values here; do not infer them from nearby menu/sidebar styles.

| Open requirement | Missing proof or required non-CSS change | Next action / owner |
| --- | --- | --- |
| A4 text selection | Legacy browser-computed `::selection` foreground/background and selected-range screenshot; SCSS did not define it | Orchestrator old-LMS browser comparison; update `micro-details.css` only if measured paint differs |
| Table selected row and sticky-header shadow | AntD legacy selected-cell background, focus-within, hovered-selected and **table** sticky-header shadow computed properties; `_common.scss:849-855` specifies only ordinary hover, while `old-lms-shell.css:56` belongs to the **top bar** | chat-14 table owner or orchestrator browser; never substitute the sidebar tint or topbar shadow for table paint |
| Checkbox/radio/switch glyph | Checkmark/dot/thumb motion and disabled/indeterminate state recordings on same browser/device | chat-17 shared controls owner + orchestrator; native glyph is not CSS-interpolable |
| Browser autofill | Chrome/Safari/Firefox user-agent paint and inherited ink measured against the old portal | Orchestrator; avoid forced background overrides until verified |
| Tooltip delay | Mouse-enter and mouse-leave timers from legacy AntD tooltip rendered behavior, then JS `InfoPopover` trigger semantics | chat-16/17 tooltip owner; CSS animation is not a mouse delay |
| Toast duration | Legacy success/info/error lifetime, pause-on-hover/focus and cap/queue behavior | chat-16/17 toast owner; currently 4,500–15,000ms/errors persistent from `toast.tsx:135-143` |
| Toast placement | Legacy viewport edge offsets and responsive bottom/side placement | chat-16/17; current `toast.tsx:54-73` uses bottom safe area; changing it may affect layout and is forbidden in this lane |
| Toast enter/exit motion | Legacy toast keyframes, easing and lifetime/unmount state in browser | chat-16/17; current `globals.css:269-287` is 250ms |
| Dropdown close | Exit animation needs a mounted closing state; native `details` closes immediately | chat-16 dropdown owner; cannot be solved by a style-only override |
| Modal/drawer animation | Browser-measured old AntD open/close vs `legacy-overlays.css` enter/exit, including focus restoration | chat-16 overlays; micro stylesheet does not change it |
| Responsive scrollbar/focus screenshots | Captures at phone 375px, tablet 768px/1024px, desktop 1280px, keyboard and mouse/touch with same elements | Orchestrator; CSS source breakpoint proof above is not a screenshot |
| Favicon | Legacy `lms2-fe/public/favicon.svg` has **two** fills `#266891/#ADE2E7`; vNext `icon.svg` has **three** fills with different cyan | chat-12/logo ownership; requires editing icon asset/Next icon metadata, disallowed for chat-20 |
| Browser tab title | Legacy `getBrowserTitle` gives `42 LMS - Title`; vNext title template is `Title · 42LMS` | chat-12/metadata owner; requires `layout.tsx`, not CSS |
| Print output | Actual legacy printable reports, page size, breakpoints and blank/overflow behavior | chat-6 print owner and orchestrator; existing micro `@media print` touches interaction paint only |
| A3/A4/I category closure | Above acceptance data + exhaustive local greps and responsive side-by-side evidence | Orchestrator after each owning lane finishes |

**Handoff protocol:** The comparison owner should send the exact screenshot/computed-style value, legacy page URL, viewport, browser and interaction state for each gap. Chat-20 can then amend only `micro-details.css` and this audit where the fix is CSS paint. Do not ask chat-20 to change tooltips, timers, metadata, favicon, shared components, grid code, or report geometry. No pass/fail CI or browser claims have been made in this source-only turn.

## Strict checklist closure

- [x] Import once below legacy skin (source read: `globals.css:6-9`; one micro import).
- [x] Static source-backed CSS values implemented for the checked micro-details above.
- [ ] A3/A4/I **fully closed** — missing old LMS values for the explicitly unverified categories and exhaustive grep + phone/tablet/desktop visual observation. No false completion tick for these.
