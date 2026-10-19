# chat-20 — micro-details parity (checklist A3, A4, I)

Baseline: `docs/design/legacy-styles/`, `docs/design/old-lms-shell.css`, `docs/design/old-lms-shell-spec.md`. Work is isolated to `src/styles/micro-details.css` and this audit. `src/app/globals.css:9` imports the micro CSS **once**, directly below the legacy-skin import. Do not edit `src/components/ui/*`, `legacy-skin.css`, layouts, icons, page markup or scripts.

This audit distinguishes **source-matched CSS details** from **unknown or non-CSS behavior**. A checked entry is a completed *static-value implementation*, not a claim that live screenshots and automated coverage were performed. The full strict category closure remains unticked until an orchestrator runtime pass.

## Work queue — individual details

- [x] A3: fast/normal/slow transition values and standard easing — `components___variables.scss:251-259`; micro CSS 12-15; 4 exact token matches.
- [x] A3: interactive button hover, active, pressed, disabled, loading/pending paint — `components___antddesign.scss:153-181`, `components___button.scss:13-16`; existing `globals.css:371-405,615-635,1127-1148` + micro CSS 38-52,203-205 (no changes to component behavior).
- [x] A3: touch pressed card feedback — `components___accessibility.scss:49-60`; micro CSS 65-72 (scale .98, opacity .9, 50ms ease).
- [x] A3/A4: pointer, disabled, loading cursor states — `components___button.scss:13-17`, `components___notification-drawer.scss:26-41,192-203`; micro CSS 38-52,203-205; disabled not-allowed is vNext fallback because legacy leaves it unspecified.
- [x] A4: click versus keyboard focus — `components___accessibility.scss:13-36`; micro CSS 23-33,55-59,430-434 (generic 2px #1a95a1 / +3px, elevated 2px / +2px and 12% halo; extra `[tabindex]` and editable-region fallback).
- [x] A4: notification item focus ring — `components___notification-drawer.scss:217-224`; micro CSS 225-230 (1px #6b7280 / +1px).
- [x] A4: hidden scrollbar baseline — `components___common.scss:307-311,329-331` and `old-lms-shell.css:10-11`; existing `globals.css:183-193`.
- [x] A4: admin table 4px and tab 3px scrollbars — `pages___admin-list-pages.scss:96-106,244-254`; micro CSS 238-268 plus transparent WebKit scrollbar track at 456-462, using real ScrollCue viewport markup (`src/components/ui/scroll-cue.tsx`).
- [x] A4: tap highlight disabled for semantic controls — `components___notification-drawer.scss:38-41,196-203`; micro CSS 180-185.
- [x] A4: link colour and hover underline — `components___common.scss:68-75`; micro CSS 77-87 and `legacy-skin.css:349-368`.
- [x] A4: placeholder muted neutral — `components___form.scss:57-60`, `components___variables.scss:28`; micro CSS 109-114 (14px inherited from legacy skin).
- [x] I: checkbox/radio checked TEAL and switch checked track — `components___antddesign.scss:123-132,742-745`, `components___common.scss:226-228`; micro CSS 89-103,187-193,327-340.
- [x] I: notification list link/button hover, active and focus transition 200ms — `components___notification-drawer.scss:192-224`; micro CSS 206-229 (list-button hover at 216-224, item focus at 225-229).
- [x] I: notification panel open 200ms ease-out from 8px, backdrop 150ms — `components___notification-drawer.scss:83-102,112-143`; micro CSS 296-321.
- [x] I: active-tab underline width and opacity 200ms ease-in-out — `components___common.scss:381-415`; micro CSS 394-396 (same native tab pseudo-element; no layout changes).
- [x] I: selected menu option #26bac7/white (separate from nav tint) — `components___antddesign.scss:134-137`; micro CSS 142-147.
- [x] I: sticky shadow paint on **already sticky** table cells — `old-lms-shell.css:56`: 0 1px 3px rgba(26,45,72,.035); micro CSS 151-154,290-297. No sticky positioning added.
- [x] I: reduced-motion preference — `components___accessibility.scss:116-124`, `components___antddesign.scss:184-189`; existing `globals.css:304-312`; micro CSS 173-177,379-386.
- [x] I: print interaction paint only, no layout — `components___accessibility.scss:116-124`; micro CSS 355-372; `src/app/(authenticated)/authenticated-print.css` owns paper/layout rules.
- [ ] A4: text-selection **legacy exact parity** — `components___variables.scss:10-13,24` supplies colours but no `::selection` selector; micro CSS 122-127 uses those tokens. Actual legacy selection paint unverified.
- [ ] I: table-row hover and selected-row **whole-app parity** — standard `.ln-table` hover is now source-matched (`components___common.scss:697-714,849-855` → micro CSS 443-454: cell `background:none !important`); `components___common.scss:130-139` proves the white no-hover exemption. Selected-row colour is still not specified by legacy SCSS (`old-lms-shell.css:45-48` is navigation, not a table), and custom/non-shared table instances have not been exhaustively grepped; full strict tick withheld.
- [ ] I: checkbox/radio glyph and switch-thumb **animation parity** — teal checked colours matched, 150ms track-transition aligned to `components___variables.scss:251-259` (micro CSS 327-340); the old SCSS does not define the glyph/thumb animation, and native browser checkmarks are not tweenable by CSS.
- [ ] I: input browser autofill **exact parity** — `components___form.scss:57-60` gives placeholder but not autofill; micro CSS 115-120,342-353 preserves ink/caret. Browser-autofill background remains user-agent controlled.
- [ ] I: tooltip mouse-enter/mouse-leave **delay parity** — `components___antddesign.scss:46-80` defines visual palette, not delay. `src/components/ui/tooltip.tsx:18-34` opens immediately on pointer-enter. CSS cannot alter the trigger's JS event timing; no delay invented.
- [ ] I: toast **timeout parity** — no toast lifetime in the supplied legacy SCSS. `src/components/ui/toast.tsx:133-143` uses 4500–15000ms reading time, errors persistent, timers paused during focus/hover. Timer logic is not CSS-editable.
- [ ] I: toast **placement parity** — old SCSS has no toast placement. Current bottom-right safe-area placement is `src/components/ui/toast.tsx:49-73`; positioning would change layout/JS scope and is not modified.
- [ ] I: toast **animation exact parity** — `globals.css:269-287` already has 250ms entrance (generic normal token from `components___variables.scss:253-259`); no legacy toast keyframes were found to confirm exact curves.
- [ ] I: generic dropdown/menu **close** animation — generic menu enters at 250ms material ease in micro CSS 158-169; legacy `components___dropdown.scss:27-35,96-104` specifies shape/shadow but not close animation. Native `details` closes immediately in `src/components/ui/dropdown.tsx`; a CSS exit cannot keep a dismissed popup mounted.
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
| Notification row ring | `components___notification-drawer.scss:221-224` 1px neutral-500 +1px | `micro-details.css:225-229` same | Equal |
| Press scale | `components___accessibility.scss:49-60` .98/.9 and 50ms | `micro-details.css:65-72` same | Equal |
| Hover link | `components___common.scss:68-75` #26bac7 + underline | `micro-details.css:77-87`, `legacy-skin.css:349-368` | Equal |
| Tap flash | `components___notification-drawer.scss:40,203` transparent | `micro-details.css:182-185` transparent | Equal |
| Native checked colour | `components___antddesign.scss:123-132,742-745` #26bac7 | `micro-details.css:89-103` #26bac7 | Equal paint |
| Checked switch fill | `components___common.scss:226-228` #26bac7 | `micro-details.css:187-193` #26bac7 | Equal paint |
| Placeholder | `components___form.scss:57-60` #a9a7ae and 14px | `micro-details.css:109-114` + legacy skin | Equal |
| Generic scrollbars hidden | `components___common.scss:307-311,329-331` none | `globals.css:183-193` none | Equal |
| Admin table scrollbar | `pages___admin-list-pages.scss:96-106` thin, 4px thumb rgba(0,0,0,.2) 2px radius | `micro-details.css:238-252` same | Equal |
| Admin tabs scrollbar | `pages___admin-list-pages.scss:244-254` thin, 3px thumb rgba(0,0,0,.2) 2px radius | `micro-details.css:254-268` same | Equal |
| Admin table scrollbar track | `pages___admin-list-pages.scss:106` WebKit track transparent, Firefox scrollbar-color transparent | `micro-details.css:456-462` `background-color:transparent`, alongside `:240-253` `scrollbar-color: ... transparent` | Equal declarations |
| Notification button hover | `components___notification-drawer.scss:192-210` #fafbfc, #e5e9f0 border, 0 1px 3px rgba(0,0,0,.04) | `micro-details.css:216-223` same on list buttons (list links styled by legacy-overlays) | Equal paint |
| Notification list transitions | `components___notification-drawer.scss:202-215` 200ms ease, active rgba(0,0,0,.06) | `micro-details.css:206-215` same | Equal paint |
| Tab underline | `components___common.scss:381-415` width/opacity 200ms ease-in-out | `micro-details.css:394-396` same | Equal |
| Notification panel enter | `components___notification-drawer.scss:125-143` 200ms ease-out, -8px | `micro-details.css:308-314` same | Equal |
| Notification backdrop enter | `components___notification-drawer.scss:90-102` 150ms ease-out | `micro-details.css:304-307,316-318` same | Equal declaration |
| Selected option | `components___antddesign.scss:134-137` teal + white | `micro-details.css:142-147` teal + white | Equal |
| Sticky shadow | `old-lms-shell.css:56` 0 1px 3px rgba(26,45,72,.035) | `micro-details.css:290-296` same | Equal shadow |
| Reduced motion | `components___accessibility.scss:116-124` .01ms and scroll auto | `globals.css:304-312`, `micro-details.css:379-386` | Equal |
| Print interaction | No legacy print-specific declarations in copied SCSS | `micro-details.css:355-372`: transition/animation none, no geometry | Unverifiable |

## Next unticked batch — source-backed value and coverage proof (2026-10-19)

This batch changed only `src/styles/micro-details.css` plus this audit; component markup, event handling, data access and CSS geometry are unchanged. The two additions correspond to exact legacy selectors, not guessed hover colours or tooltip delays.

| Micro-state/property | Old LMS reference, state and value | vNext declaration and value | Finding |
| --- | --- | --- | --- |
| Keyboard outline, explicit-focus regions | `components___accessibility.scss:19-23` `:focus-visible`: `2px solid #1a95a1`, offset `3px` | `micro-details.css:430-434` explicit tab stops, editable regions and semantic options: `2px solid var(--lms-micro-focus)` = `#1a95a1`, offset `3px` | Equal for these properties, component-specific rings intentionally retained |
| Keyboard-focus ring for cards | `components___accessibility.scss:25-36`: `2px` / `2px` offset, `0 0 0 4px rgba(26,149,161,.12)` | `micro-details.css:55-59` same | Already source-matched; no change |
| Ordinary table cell, resting | `components___common.scss:697-714` `.ln-table td`: `background:#fff` | `table.tsx:14-17`, `data-table.tsx:93-110`: white surface via component/skin | Existing shared table source read; not a new override |
| Ordinary `.ln-table` cell, hovered | `components___common.scss:849-855`: `background:none !important` on `tr:hover td` | `micro-details.css:443-447` Table and `:448-454` responsive DataTable: `background:none !important` on unselected hovered cells | **Exact hover-property match** for these shared-table states |
| Legacy hover opt-out | `components___common.scss:130-139` `.ln-table-no-hover`: `background:#fff !important` | `micro-details.css:287-290` existing white exemption; `:445,451` excludes descendant `.ln-table-no-hover` from new clear | Exemption preserved |
| Selected row, mouse / keyboard | Legacy SCSS supplies no general selected-row colour; `old-lms-shell.css:45-48` is sidebar only | `micro-details.css:130-137,271-280`: `#eff8fa` when selected state is explicit | **Unknown legacy value; unticked** |
| Exam-table odd-row hover | `components___common.scss:808-815` odd cells `#f8fbff !important` | No change to `Table` striped option or exam-specific styling in this lane | **Special-case parity not claimed; chat-14 owns table types** |

**Read-only source-search / grep evidence.** GitHub code-search in `42Students/lms-vnext` returned the following paths. These are actual search results, not claims that a local `grep`, build, TypeScript checker, or screenshot runner was executed:

| Exact search string | Hits | Production declarations found |
| --- | ---: | --- |
| `@import "../styles/micro-details.css"` | 1 | `src/app/globals.css:9`, exactly once after legacy skin at line 6 |
| `data-slot="table"` | 3 | `src/components/ui/table.tsx:14`; `src/styles/micro-details.css`; `src/app/globals.css` |
| `data-slot="data-table"` | 14 | `src/components/ui/data-table.tsx:38,93`; remaining hits are skin/print CSS and tests; only one production component source |
| `data-slot="scroll-cue"` | 12 | `src/components/ui/scroll-cue.tsx:61-69` provides `[tabindex]` and its actual first-child scroll viewport; remaining matches are style/audit/test references |

Whole-repository negative greps required by the STRICT TICK RULE remain **unrun** because this lane is expressly not permitted to run code. Re-run these source-only commands in the orchestrator before ticking broad closure:

```sh
rg -n --glob '*.tsx' 'data-slot="(table|data-table)"|<table[ >]|<tr[ >]' src
rg -n --glob '*.tsx' 'tabIndex=|contentEditable|role="(checkbox|radio|option)"' src
rg -n '::selection|autofill|selected|mouseEnterDelay|mouseLeaveDelay' docs/design/legacy-styles
rg -n 'micro-details\.css' src/app src/styles
```

**Responsive source comparison (no screenshots claimed):** `old-lms-shell.css:23,73-100` uses a `767px` mobile limit; `micro-details.css:448-454` therefore applies DataTable's hover-background reset only at `768px+`. `data-table.tsx:93-110` displays card-form rows on small screens; the new rule does not affect those rows at 320–767px. Shared `Table` continues to use its existing horizontal ScrollCue at all widths (no new layout rule); table scrollbar 4px/tab scrollbar 3px are handled by `micro-details.css:238-268` with transparent WebKit tracks at `:456-462`, with actual viewport at `scroll-cue.tsx:61-69`. At tablet width 768–1199px and desktop 1200px+, the shared table-hover declaration applies to unselected cells without changing their dimensions. Focus fallback is width-independent; existing `@media (hover:none)` protects touch press, `@media (prefers-reduced-motion:reduce)` protects animations, and print retains separate `@media print` interaction suppression. **Browser focus rings, selection highlighting, tablet hover with touch hardware, and side-by-side screenshots still need runtime observation.**

**Ownership and no-regression:** No React/TypeScript or shared UI/component file was edited, and no styles were added for positioning, padding, margins, widths, heights, or z-index. Matched elements retain their keyboard order and click handlers. CSS source read confirmed matched `{`/`}` counts after each micro stylesheet edit; runtime CSS parsing and computed-style comparison remain unperformed.

## Source-only follow-up: interactive cards, dark selection and external legacy artifacts

The current pass also inspected the **original legacy repository** `42Students/lms2-fe@prod-2026`, rather than guessing behavior from only copied SCSS. Legacy source reads were informational; no other repository, page, component or shared skin file was changed.

| Detail and state | Source of exact legacy value | Existing/new vNext value | Status |
| --- | --- | --- | --- |
| Opted-in card, resting shadow | `src/styles/components/_common.scss:141-147`: no resting shadow declared in `.ln-card-hvr`; transition `box-shadow 0.2s ease` | `src/components/ui/card.tsx:13`: static `shadow-none`; `micro-details.css:412-416`: opted-in interactive cards transition `200ms ease` | Equal declaration; browser verification open |
| Opted-in card on hover | `src/styles/components/_common.scss:144-146`: `0 4px 12px rgba(0,0,0,.08)` | `micro-details.css:407-411`: identical shadow for explicitly interactive cards only | Equal source-backed paint |
| Noninteractive cards | Legacy `.ln-card-hvr` is opt-in (`_common.scss:141`); ordinary cards do not inherit hover shadow | `card.tsx:13` static `shadow-none`; micro rule requires `[role="button"]` or `.ln-card-hvr` | Unaffected by the new rule |
| Keyboard / touch card | `_accessibility.scss:25-36,49-60`: 2px teal ring, offset 2px, touch 0.98 scale/0.9 opacity over 50ms | `micro-details.css:55-72` preserved unchanged | Same paint for semantically interactive cards |
| Reduced motion on hovered card | `_accessibility.scss:116-124`: transitions 0.01ms; hover effect itself persists | `micro-details.css:407-421`: shadow still appears on hover, but transition is disabled in reduce mode | Same interaction behavior, no transition |
| Light text selection | No `::selection` rule in copied legacy SCSS; palette `_variables.scss:10-13,24` | `micro-details.css:124-127` #1a1d21 on #eff8fa; `legacy-skin.css:494-498` adds scoped `!important` | **Unverified**, not claimed equal |
| Tracker opt-in dark selection | No dark-mode equivalent in old LMS | `micro-details.css:345-349` now uses `!important` to take precedence over the light skin's high-priority selection rule and preserve foreground contrast | **vNext compatibility fix**, not legacy parity |
| Legacy favicon paths/colours | `42Students/lms2-fe/public/favicon.svg:1-4`: two paths, fills `#266891` and `#ADE2E7`; `public/manifest.json:8-11` references favicon.png and favicon.svg | `src/app/icon.svg:1-5`: three paths, fills `#266891`, `#9EE4E8`, `#26BAC7` | **Different artworks**, CSS-only chat-20 cannot rewrite SVG |
| Browser-title metadata | Legacy `src/utils/pageTitle.js:23-26` `42 LMS - ${pageTitle}` (fallback `42 LMS`), used in `src/layouts/layout.js:297-303`; college admin `AdminLayout.js:40-43` uses `42 LMS - ${title}` | `src/app/layout.tsx:11-14`: `42LMS` default, `%s · 42LMS` template | **Confirmed text/format mismatch**, outside CSS-only scope; hand off to metadata owner |
| Legacy Tooltip delay | `src/components/Global/Tooltips/CustomToolTipTable.jsx:1-35` uses Ant Design `Tooltip` without explicitly passed delay props | `src/components/ui/tooltip.tsx:30-45` opens/closes native `details` immediately | Old effective default belongs to AntD runtime; **do not guess milliseconds** or change JS from CSS |
| Modal/drawer behavior | `src/components/Global/ModalContainer/ModalContainer.jsx:25-61` and `RightDrawer/DrawerWidget.js:28-76` use AntD `Modal`/`Drawer`; no authored exit duration in those wrappers | `src/components/ui/legacy-overlays.css:305-359` supplies open/close CSS; state unmount belongs to components | Runtime comparison and overlay-owner lane required |
| Printable page output | Legacy source proof absent for paper layout; vNext `authenticated-print.css:1-80` handles print structure | `micro-details.css:355-372` disables residual interaction visuals only | **Print geometry remains outside scope** |

**Source-search proof, not a false full grep:** prior GitHub repository search on `data-slot="card"` identified the shared `src/components/ui/card.tsx:13` declaration. The SCSS's opted-in `.ln-card-hvr` rule is specifically `_common.scss:141-147`; no global static-card hover rule is copied. New selectors live entirely in `micro-details.css:403-421` and are gated by `(hover:hover)`. Breakpoints and geometry are unchanged: on a phone/touchscreen where `(hover:none)`, these shadows do not appear and existing tap-feedback code handles pressed state; a mouse-capable tablet or desktop gets the shadow without affecting layout. Reduced-motion users keep the hovered shadow but lose the animation. Actual screenshots and the legacy AntD/browser default timings remain unverified.

## Coverage and responsive review

- CSS entrypoints reviewed: `src/app/globals.css`, `src/styles/legacy-skin.css`, `src/styles/micro-details.css`, `src/components/ui/legacy-overlays.css`, `src/components/shell/sidebar-legacy.css`.
- UI markup inspected read-only: `src/components/ui/table.tsx`, `data-table.tsx`, `tabs.tsx`, `scroll-cue.tsx`, `dropdown.tsx`, `tooltip.tsx`, `toast.tsx`, `src/app/layout.tsx`, `src/app/icon.svg`, `src/app/(authenticated)/authenticated-print.css`. No component props/events changed.
- Selector integration: table and tab thin scrollbars address `[data-slot="scroll-cue"][data-axis="x"] > div:first-child`, exactly the native viewport in `scroll-cue.tsx`; selected rows require a real `aria-selected` / `data-state` attribute. CSS does not fabricate selection state.
- Responsive: baseline hidden scrollbars and focus rules apply on mobile and desktop; the thin scrollbar exceptions are for horizontally overflowing table/tab viewport only. Touch press is guarded by `@media (hover:none)`; reduced motion is guarded by the OS setting; print rules are in `@media print`. No widths, paddings, grid/flex, positioning or modal dimensions changed.
- No CI, TypeScript checks or app execution were performed, as requested. GitHub code search is not a substitute for a whole-repo grep; **do not claim zero hand-rolled instances**. Full paired-screen verification is a separate future orchestrator step.

## Strict checklist closure

- [x] Import once below legacy skin (source read: `globals.css:6-9`; one micro import).
- [x] Static source-backed CSS values implemented for the checked micro-details above.
- [ ] A3/A4/I **fully closed** — missing old LMS values for the explicitly unverified categories and exhaustive grep + phone/tablet/desktop visual observation. No false completion tick for these.
