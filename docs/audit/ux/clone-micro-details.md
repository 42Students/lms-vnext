# chat-20 — micro-details parity (checklist A3, A4, I)

Baseline: `docs/design/legacy-styles/`, `docs/design/old-lms-shell.css`, `docs/design/old-lms-shell-spec.md`. Work is isolated to `src/styles/micro-details.css` and this audit. `src/app/globals.css:9` imports the micro CSS **once**, directly below the legacy-skin import. Do not edit `src/components/ui/*`, `legacy-skin.css`, layouts, icons, page markup or scripts.

This audit distinguishes **source-matched CSS details** from **unknown or non-CSS behavior**. A checked entry is a completed *static-value implementation*, not a claim that live screenshots and automated coverage were performed. The full strict category closure remains unticked until an orchestrator runtime pass.

## Work queue — individual details

- [x] A3: fast/normal/slow transition values and standard easing — `components___variables.scss:251-259`; micro CSS 12-15; 4 exact token matches.
- [x] A3: interactive button hover, active, pressed, disabled, loading/pending paint — `components___antddesign.scss:153-181`, `components___button.scss:13-16`; existing `globals.css:371-405,615-635,1127-1148` + micro CSS 38-52,203-205 (no changes to component behavior).
- [x] A3: touch pressed card feedback — `components___accessibility.scss:49-60`; micro CSS 65-72 (scale .98, opacity .9, 50ms ease).
- [x] A3/A4: pointer, disabled, loading cursor states — `components___button.scss:13-17`, `components___notification-drawer.scss:26-41,192-203`; micro CSS 38-52,203-205; disabled not-allowed is vNext fallback because legacy leaves it unspecified.
- [x] A4: click versus keyboard focus — `components___accessibility.scss:13-36`; micro CSS 23-33,55-59 (generic 2px #1a95a1 / +3px, elevated 2px / +2px and 12% halo).
- [x] A4: notification item focus ring — `components___notification-drawer.scss:217-224`; micro CSS 216-221 (1px #6b7280 / +1px).
- [x] A4: hidden scrollbar baseline — `components___common.scss:307-311,329-331` and `old-lms-shell.css:10-11`; existing `globals.css:183-193`.
- [x] A4: admin table 4px and tab 3px scrollbars — `pages___admin-list-pages.scss:96-106,244-254`; micro CSS 229-259, using real ScrollCue viewport markup (`src/components/ui/scroll-cue.tsx`).
- [x] A4: tap highlight disabled for semantic controls — `components___notification-drawer.scss:38-41,196-203`; micro CSS 180-185.
- [x] A4: link colour and hover underline — `components___common.scss:68-75`; micro CSS 77-87 and `legacy-skin.css:349-368`.
- [x] A4: placeholder muted neutral — `components___form.scss:57-60`, `components___variables.scss:28`; micro CSS 109-114 (14px inherited from legacy skin).
- [x] I: checkbox/radio checked TEAL and switch checked track — `components___antddesign.scss:123-132,742-745`, `components___common.scss:226-228`; micro CSS 89-103,187-193,318-331.
- [x] I: notification hover/active and focus transition 200ms — `components___notification-drawer.scss:192-224`; micro CSS 206-220.
- [x] I: notification panel open 200ms ease-out from 8px, backdrop 150ms — `components___notification-drawer.scss:83-102,112-143`; micro CSS 287-312.
- [x] I: active-tab underline width and opacity 200ms ease-in-out — `components___common.scss:381-415`; micro CSS 384-386 (same native tab pseudo-element; no layout changes).
- [x] I: selected menu option #26bac7/white (separate from nav tint) — `components___antddesign.scss:134-137`; micro CSS 142-147.
- [x] I: sticky shadow paint on **already sticky** table cells — `old-lms-shell.css:56`: 0 1px 3px rgba(26,45,72,.035); micro CSS 151-154,281-288. No sticky positioning added.
- [x] I: reduced-motion preference — `components___accessibility.scss:116-124`, `components___antddesign.scss:184-189`; existing `globals.css:304-312`; micro CSS 173-177,365-377.
- [x] I: print interaction paint only, no layout — `components___accessibility.scss:116-124`; micro CSS 345-363; `src/app/(authenticated)/authenticated-print.css` owns paper/layout rules.
- [ ] A4: text-selection **legacy exact parity** — `components___variables.scss:10-13,24` supplies colours but no `::selection` selector; micro CSS 122-127 uses those tokens. Actual legacy selection paint unverified.
- [ ] I: table row hover and selection **legacy exact parity** — `components___common.scss:130-139` proves only no-hover exemption; `old-lms-shell.css:45-48` is for sidebar rows, not table rows. Micro CSS 130-137,262-279 and `globals.css:579` implement safe palette-based behavior, but no old selected-table colour is specified.
- [ ] I: checkbox/radio glyph and switch-thumb **animation parity** — teal checked colours matched, 150ms track-transition aligned to `components___variables.scss:251-259` (micro CSS 318-331); the old SCSS does not define the glyph/thumb animation, and native browser checkmarks are not tweenable by CSS.
- [ ] I: input browser autofill **exact parity** — `components___form.scss:57-60` gives placeholder but not autofill; micro CSS 115-120,333-343 preserves ink/caret. Browser-autofill background remains user-agent controlled.
- [ ] I: tooltip mouse-enter/mouse-leave **delay parity** — `components___antddesign.scss:46-80` defines visual palette, not delay. `src/components/ui/tooltip.tsx:18-34` opens immediately on pointer-enter. CSS cannot alter the trigger's JS event timing; no delay invented.
- [ ] I: toast **timeout parity** — no toast lifetime in the supplied legacy SCSS. `src/components/ui/toast.tsx:133-143` uses 4500–15000ms reading time, errors persistent, timers paused during focus/hover. Timer logic is not CSS-editable.
- [ ] I: toast **placement parity** — old SCSS has no toast placement. Current bottom-right safe-area placement is `src/components/ui/toast.tsx:49-73`; positioning would change layout/JS scope and is not modified.
- [ ] I: toast **animation exact parity** — `globals.css:269-287` already has 250ms entrance (generic normal token from `components___variables.scss:253-259`); no legacy toast keyframes were found to confirm exact curves.
- [ ] I: generic dropdown/menu **close** animation — generic menu enters at 250ms material ease in micro CSS 158-169; legacy `components___dropdown.scss:27-35,96-104` specifies shape/shadow but not close animation. Native `details` closes immediately in `src/components/ui/dropdown.tsx`; a CSS exit cannot keep a dismissed popup mounted.
- [ ] I: generic modal/drawer **open/close** animation parity — shared `legacy-overlays.css` owns 180/200ms open/close, `globals.css:218-268` has entrance effects. Legacy `components___antddesign.scss:1033-1065` specifies geometry, not comparable exit keyframes. Ownership remains chat-16; micro CSS does not override it.
- [ ] A3/I: scrollbar and focus **responsive screenshot comparison** — legacy `old-lms-shell.css:23,41-43,73-100` covers phone/rail behavior. CSS scopes verified statically; side-by-side browser observation still required.
- [ ] A4: favicon artwork — `src/app/icon.svg:1-6` exists; no old favicon asset is present in the SCSS. Browser favicon cannot be changed from an imported CSS file.
- [ ] A4: browser-tab title format — `src/app/layout.tsx:11-14` currently uses `%s · 42LMS`. CSS cannot set the document title or Next metadata; the old browser title is not established by SCSS.
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
| Notification row ring | `components___notification-drawer.scss:221-224` 1px neutral-500 +1px | `micro-details.css:216-220` same | Equal |
| Press scale | `components___accessibility.scss:49-60` .98/.9 and 50ms | `micro-details.css:65-72` same | Equal |
| Hover link | `components___common.scss:68-75` #26bac7 + underline | `micro-details.css:77-87`, `legacy-skin.css:349-368` | Equal |
| Tap flash | `components___notification-drawer.scss:40,203` transparent | `micro-details.css:182-185` transparent | Equal |
| Native checked colour | `components___antddesign.scss:123-132,742-745` #26bac7 | `micro-details.css:89-103` #26bac7 | Equal paint |
| Checked switch fill | `components___common.scss:226-228` #26bac7 | `micro-details.css:187-193` #26bac7 | Equal paint |
| Placeholder | `components___form.scss:57-60` #a9a7ae and 14px | `micro-details.css:109-114` + legacy skin | Equal |
| Generic scrollbars hidden | `components___common.scss:307-311,329-331` none | `globals.css:183-193` none | Equal |
| Admin table scrollbar | `pages___admin-list-pages.scss:96-106` thin, 4px thumb rgba(0,0,0,.2) 2px radius | `micro-details.css:229-243` same | Equal |
| Admin tabs scrollbar | `pages___admin-list-pages.scss:244-254` thin, 3px thumb rgba(0,0,0,.2) 2px radius | `micro-details.css:245-259` same | Equal |
| Notification list transitions | `components___notification-drawer.scss:202-215` 200ms ease, active rgba(0,0,0,.06) | `micro-details.css:206-215` same | Equal paint |
| Tab underline | `components___common.scss:381-415` width/opacity 200ms ease-in-out | `micro-details.css:384-386` same | Equal |
| Notification panel enter | `components___notification-drawer.scss:125-143` 200ms ease-out, -8px | `micro-details.css:299-305` same | Equal |
| Notification backdrop enter | `components___notification-drawer.scss:90-102` 150ms ease-out | `micro-details.css:295-298,307-309` same | Equal declaration |
| Selected option | `components___antddesign.scss:134-137` teal + white | `micro-details.css:142-147` teal + white | Equal |
| Sticky shadow | `old-lms-shell.css:56` 0 1px 3px rgba(26,45,72,.035) | `micro-details.css:281-287` same | Equal shadow |
| Reduced motion | `components___accessibility.scss:116-124` .01ms and scroll auto | `globals.css:304-312`, `micro-details.css:365-377` | Equal |
| Print interaction | No legacy print-specific declarations in copied SCSS | `micro-details.css:345-363`: transition/animation none, no geometry | Unverifiable |

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
