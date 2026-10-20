# Checkpoint B3–B4: old-LMS sidebar, footer and route motion

Owner: chat-19. Source: `docs/design/ui-clone-checklist.md:8-18`, `docs/design/old-lms-shell.css`, `docs/design/old-lms-shell-spec.md` and `docs/design/legacy-styles/`. The owner runs runtime/CI and screenshot comparison later; **none was run here**.

- [ ] **B3 Sidebar** (missing: command-level full-repository grep proof and exact historical icon/artwork equivalence; browser icon/hover/tablet verification is deferred to checklist J. See refreshed source-value and import evidence below.)
- [ ] **B4 Footer, progress and route transitions** (role-specific mobile footer and 20s recovery are source-matched; the four-dot spinner now follows Ant Design v5 dimensions and per-dot animation, but the thin intent bar remains a modern adaptation; executable repo-wide greps and browser comparison are outstanding.)

## B3 value proof (legacy → vNext)

All file:line references are repository-relative. An explicitly different implementation is marked open rather than passed.

| Property / state | Old LMS file:line and value | vNext file:line and value | Status |
|---|---|---|---|
| Desktop rail base | `old-lms-shell.css:13` width/min-width 6rem (96px) | `sidebar-legacy.css:10-11` width/min-width 96px | Source match |
| Desktop expansion | `old-lms-shell.css:18` hover width 16rem (256px) | `sidebar-legacy.css:22` hover width 256px | Match on hover; focus-within addition |
| Width/opacity timing | `old-lms-shell.css:13` .15s cubic-bezier(.2,0,0,1) | `sidebar-legacy.css:19` both .15s cubic-bezier(.2,0,0,1) | Source match |
| Relative position | `old-lms-shell.css:13` position relative | `app-shell.tsx:75`, `sidebar-legacy.css:9-18` relative | Source match |
| Flex-shrink | `old-lms-shell.css:13` flex-shrink 0 | `app-shell.tsx:75`, `sidebar-legacy.css:13` shrink 0 | Source match |
| Content push | `old-lms-shell.css:13,18` sidebar flex width changes page x | `app-shell.tsx:73,75,102`, `sidebar-legacy.css:8,24` relative flex sibling, page flex 1 | Structural match; browser geometry still pending |
| Full-height rail | `old-lms-shell.css:13` 100vh | `app-shell.tsx:75`, `sidebar-legacy.css:16` 100vh | Source match |
| Background | `old-lms-shell.css:13` rgb(255,255,255) | `sidebar-legacy.css:17` #fff | Same RGB |
| Right border | `old-lms-shell.css:13` 1px rgb(241,244,249) | `sidebar-legacy.css:18` 1px #f1f4f9 | Same RGB |
| Box shadow | `old-lms-shell.css:13` none | `sidebar-legacy.css:18-19` none | Source match |
| Navigation body gutter | `old-lms-shell.css:21` padding 8px 0 16px | `app-shell.tsx:82` pt-2 pb-4, `sidebar-legacy.css:98` item gutter 8px | Vertical match; inner wrapper differs |
| Footer box | `old-lms-shell.css:22` z2, margin-top auto, padding 25px 16px | `app-shell.tsx:86-99`, `sidebar-legacy.css:235` | Box match, exact role/footer copy open |
| Logo mark size | `old-lms-shell.css:12` image 38×36 | `shell-nav-icons.tsx:65-70`, `app-shell.tsx:79` SVG 38×36 | Dimensions match; rendering unverified |
| Expanded wordmark | `old-lms-shell-spec.md:5-11` expanded mark/wordmark | `sidebar-legacy.css:263-270`, `shell-nav-icons.tsx:73-76` 151×37 | Source-specific asset used, visual open |
| Item minimum height | `old-lms-shell.css:30-31` 44px | `sidebar-legacy.css:103-104` 44px | Source match |
| Item vertical gap | `old-lms-shell.css:30` 6px | `sidebar-legacy.css:104` 6px | Source match |
| Item padding/corner | `old-lms-shell.css:31` 10×12px, radius 8px | `sidebar-legacy.css:108-109` 10×12px, 8px | Source match |
| Focus | `old-lms-shell.css:32` 2px rgba(38,186,199,.45), inset offset -2px | `sidebar-legacy.css:127-130` same | Source match |
| Glyph box | `old-lms-shell.css:34-35` 24×24 opacity .55; 20px artwork | `sidebar-legacy.css:132-144`, `shell-nav-icons.tsx:51-62` | CSS match, artwork browser check open |
| Text | `old-lms-shell.css:33` 15px/20px | `sidebar-legacy.css:147-154` 15px/20px | Source match |
| Active | `old-lms-shell.css:45-46` #eff8fa, 3px inset #26bac7, #1a95a1 | `sidebar-legacy.css:121-126` same | Source match |
| Hover | `old-lms-shell.css:47-48` rgba(38,186,199,.07), #1a95a1 | `sidebar-legacy.css:117-120` same | Source match |
| Collapsed badge | `old-lms-shell.css:39` top 4, left 50%, margin 5, scale .72 | `sidebar-legacy.css:71-78` same | Source match |
| Expanded badge | `old-lms-shell.css:40` static, margin-left auto, no transform | `sidebar-legacy.css:79-83` same | Source match |
| Section collapsed | `old-lms-shell.css:50-51` font-size 0, 22px divider | `sidebar-legacy.css:50-62` 0px, 22px divider | Source match |
| Section expanded | `old-lms-shell.css:52-53` 12px upper headings | `sidebar-legacy.css:63-70,170-184` 12px headings | Source match |
| Group dividers | `old-lms-shell.css:49-53` collapsed hairline | `sidebar-legacy.css:205-227` 1px #f1f4f9 | Source match |
| TPO expanded scrollbar | `old-lms-shell.css:41-43` thin/4px rgba(107,114,128,.28) | `sidebar-legacy.css:240-256` same | Source match |
| Desktop breakpoint | `old-lms-shell.css:23` hidden through 767px | `app-shell.tsx:75` md:flex from 768px | Source match |
| Mobile width | `legacy-styles/components___antddesign.scss:305-308` 82%, max300 | `sidebar-legacy.css:187-196` 82vw max300 on shared Drawer at 0–767px; `mobile-navigation.tsx:33-36` | Width values source-match; viewport visuals deferred |
| Mobile header | `legacy-styles/components___antddesign.scss:314-325` safe-area, 52px, 10px/16px/4px | `sidebar-legacy.css:198-212`; shared `drawer.tsx:49-54` | Source values match mobile overrides |
| Mobile body | `legacy-styles/components___antddesign.scss:348-359` top8, left/right12, bottom24+safe area | `mobile-navigation.tsx:35` shared Drawer viewport classes `!pt-2 !px-3 !pb-[calc(24px+env(...))]` | Source match |
| Mobile backdrop | `legacy-styles/components___antddesign.scss:143-146` rgba(30,54,63,.1) with 0 4px 4px #00000040 shadow | `sidebar-legacy.css:198` native dialog ::backdrop same values | Source match |
| Mobile close touch target | `legacy-styles/components___antddesign.scss:334-346` 44×44px target | `sidebar-legacy.css:208-214` 44px × min44px, padding0 | Source match |
| Mobile scroll | `legacy-styles/components___antddesign.scss:354-359` y-auto, x-hidden, touch inertia, hidden thumb | `drawer.tsx:55`, `scroll-cue.tsx:61-69`, `sidebar-legacy.css:213-219` | Source rules match |
| Reduced motion | `legacy-styles/components___learn-layout.scss:577-585` disables transitions | `sidebar-legacy.css:258-261` disables rail motion | Comparable intent; page motion below |

### Icon coverage

Source parse of `shell-model.ts:45-86,122-320`: **63 declared navigation rows / 61 unique destinations / 61 explicit route-to-icon mappings / 0 unmapped destinations.** `shell-nav-icons.tsx:2` imports `legacyAntPaths` from `./legacy-ant-paths`; `legacy-ant-paths.ts:1-4` exports it. All 12 referenced learner/faculty image URLs were individually present in the `public/assets/images/common/` GitHub directory at audit time. This proves the sources and missing-import regression guard, not old and new browser glyph equivalence.

## B4 value proof (legacy → vNext)

| Property / state | Old LMS file:line and value | vNext file:line and value | Status |
|---|---|---|---|
| Sidebar footer geometry | `old-lms-shell.css:22`: z2, margin-top auto, 25px 16px | `app-shell.tsx:86-99`, `sidebar-legacy.css:235` | Geometry match; copy unverified |
| TPO bottom mobile footer | No comparable TPO-specific footer markup in original legacy sources; shared 64px + safe-area `.ln-footer` at `components___antddesign.scss:912-936` | `src/components/tpo/tpo-mobile-footer.tsx:27-49`, `legacy-mobile-footer.css:27-34` matches shared shell styling, retains TPO link content | Shared skin matched, **TPO-specific visual contents unverified** |
| Top route progress bar | No top strip specified in `old-lms-shell.css:1-101`; original `lms2-fe/src/pages/_app.js:1-34` has no route event progress | `route-progress.tsx:14-69`, `route-progress.css:7-26`: *new accessible indeterminate adapter* using legacy teal #26bac7 | Implemented; **not a historic pixel match** |
| Full-page loader | `legacy-styles/components___common.scss:1008-1019` fixed fullscreen z999, rgba(255,255,255,.99) | Route-specific skeleton/loading components | Open: not equivalent |
| Learner page entrance | `legacy-styles/components___learn-layout.scss:49-69` opacity 0→1, translateY(8→0), 250ms ease-out | `route-transition.css:4-7,20-24`, `route-transition.tsx:11-12,39-40` learner-only | CSS values source-match |
| Learner route exit | `legacy-styles/components___learn-layout.scss:71-86` 220ms opacity, 260ms transform, .78 opacity, translateY(6px) scale(.998) | `route-transition.css:15-24`, `route-transition.tsx:12-38` capture-phase Link intent | CSS source-match; browser/back states unverified |
| Reduced motion | `legacy-styles/components___learn-layout.scss:577-585` disables transitions | `route-transition.css:26-29` disables animation/transition/transform | Source match |
| Shell isolation | Old `learn-page-wrapper` is below header (`learn-layout.scss:60-69`) | `app-shell.tsx:102-122` places RouteTransition **inside main** only | Source structural match |
| Query-only navigation | Old filter/page query handling not measured in provided CSS | `route-transition.tsx:9,25,39` keys by pathname only | Behavior preserved; not a legacy parity claim |

## Coverage proof and unverified full-repository commands

Connected-source, file-by-file string scans of **10 exact sidebar/route files**: `app-shell.tsx`, `sidebar-nav.tsx`, `sidebar-legacy.css`, `mobile-navigation.tsx`, `route-transition.tsx`, `route-transition.css`, `route-announcer.tsx`, `shell-model.ts`, `shell-nav-icons.tsx`, `legacy-ant-paths.ts` (all under `src/components/shell/`).

| Expression | Matches across the 10 files | Files with matches |
|---|---:|---|
| `lms-desktop-sidebar\|fl-d-panel-l\|lms-sidebar-item` | 50 | app-shell (1), sidebar-legacy.css (47), sidebar-nav (2) |
| `role="dialog"\|fixed inset-0` | 3 | mobile-navigation (2), route-announcer (1); expected mobile overlay/announcer reference |
| `progress\|nprogress\|pageSlideIn\|route-transitioning` | 3 | route-transition.tsx (1), route-transition.css (2) |
| `<(button\|select\|input\|textarea)(?=[ >])` | **0** | none in this inspected scope |
| `legacyAntPaths` | 3 | shell-nav-icons (2), legacy-ant-paths (1) |

The above are **scoped connector source scans**, not a shell `grep` of the whole checkout. Before ticking B3/B4, run and paste actual complete tree counts:

```sh
grep -RnlE 'lms-desktop-sidebar|fl-d-panel-l|lms-sidebar-item' src --include='*.tsx' --include='*.css'
grep -RnlE 'role="dialog"|fixed inset-0|fixed inset-x-0 bottom-0' src/components/shell src/components/tpo --include='*.tsx'
grep -RnlE 'progress|nprogress|pageSlideIn|is-route-transitioning' src/components/shell src/app --include='*.tsx' --include='*.css'
grep -RnlE '<button[ >]|<select[ >]|<input[ >]|<textarea[ >]' src/components/shell src/components/tpo --include='*.tsx'
grep -RnlE '#[0-9a-fA-F]{3,8}|rounded-(lg|xl|md)' src/components/shell --include='*.tsx' --include='*.css'
```

## Responsive source proof and JSX safety

Desktop ≥768px: `app-shell.tsx:75` shows the 100vh rail; `sidebar-legacy.css:6-25` uses relative flex width 96→256 and pushes the sibling; hovering expands labels, badges and TPO group headings. Tablet 768–1199px: same legacy 96→256 push rules, with no overlay. Phone ≤767px: `app-shell.tsx:75` hides the rail; `mobile-navigation.tsx:66-124` has the focus-trapped 82%/300px left drawer, accessible buttons, Escape/Tab behavior and scrollable padded body. Motion `sidebar-legacy.css:258-261` and `route-transition.css:23-26` is disabled for reduced-motion preferences. Browser viewport and zoom observations remain outstanding.

Every edited sidebar-related JSX opening and closing tag has been source reviewed. `shell-nav-icons.tsx:2` has the required import. The new `tests/unit/chat19-shell-sidebar-clone.test.ts` and `chat19-shell-route-transitions.test.ts` are **written, not run**.

## Work queue (resume without replanning)

1. Complete repository-wide grep counts and resolve any duplicate shell/sidebar markup before B3 tick.
2. Obtain running-legacy screenshot/asset checks for desktop collapsed/hover and tablet, especially icon artwork and precise canvas x, plus mobile drawers.
3. Find authoritative old top progress-bar and TPO mobile footer behavior; align `src/components/shell/route-transition.tsx` and loading/page exit states. Leave B4 unticked until values and states are proven.
4. HR pages are owned by chat-15; only sweep HR files explicitly unowned in their queue, without overwriting chat-15 work.

**Historic handoff superseded:** route-transition has been updated; see latest continuation below.


## 2026-10-19 continued turn: evidence and current exceptions

**Main synchronization:** fast-forwarded branch `chatgpt/chat-19-b` to origin/main commit `55a3efe0a5917631ab26e17e158a29f6e5282e25` before editing. Later pushes use only the lane branch.

**Import verification (source tree, not a build):** GitHub tree at main SHA `55a3efe0a5917631ab26e17e158a29f6e5282e25` listed 15,670 repository entries. All **36** `src/components/shell/**/*.ts(x)` or CSS files were read, and **135 relative or `@/` imports** resolved to entries in that tree; **0 missing**. Forty-seven bare-package imports were identified but not dependency-compiled. `shell-nav-icons.tsx:3` explicitly imports `legacyAntPaths` from `./legacy-ant-paths`; the named module exports it.

**Scoped source scans (all 36 shell source/style files, equivalent regex checks, not actual `grep` runs):** raw `<button`, `<input`, `<select`, `<textarea` tags = **0**; `lms-desktop-sidebar|fl-d-panel-l|lms-sidebar-item` text hits = **50**. The 60 literal colour codes include exact legacy-brand SVG paths and shared topbar CSS owned by chat-13; they are not a finding of 60 unapproved colours. GitHub indexed code search on main returned **2** files for `lms-desktop-sidebar` (app-shell, sidebar-legacy.css), **1** for `fl-d-panel-l` (sidebar-legacy.css comment), and **2** for `lms-sidebar-item` (sidebar-nav.tsx, sidebar-legacy.css); indexed discovery is not a complete local working-tree grep.

**Mobile breakpoint proof:** at ≤767px, `app-shell.tsx:75` hides desktop rail; `mobile-navigation.tsx:33-36` uses the shared native-dialog Drawer; `sidebar-legacy.css:187-225` forces legacy 82vw max300 width, header 52px + top safe area, 10/16/4/10px header insets, 44px close target and hidden, touch-inertial scroll; `mobile-navigation.tsx:35` restores 8px top, 12px horizontal, 24px + safe-area bottom padding. At ≥768px, `app-shell.tsx:75` shows 96px rail and `sidebar-legacy.css:6-25` expands on hover/focus to 256px by flex push; the same applies at tablet 768–1199px. Actual viewport screenshot parity is deferred to J.

**B4 source status:** `old-lms-shell.css:1-101` defines no top progress strip. Indexed legacy SCSS searches for `nprogress`, `progressbar`, and `progress-bar` returned 0 hits. The known full-page loader remains `components___common.scss:1008-1019` (fixed white .99, z-index 999), which is different from current route-local skeletons. Do **not** invent a loader colour, progress timing, spinner or unsupported equivalence. `src/components/tpo/tpo-mobile-footer.tsx` now visibly marks the More parent active when a More destination is current; its exact historical TPO footer values remain unproven.

**STRICT TICK RULE outcome:** B3 and B4 remain **unticked**. The source comparisons and scoped counts above are useful progress but do not substitute for the checklist's command-level `grep` output and unmatched footer/loading values. Do not report a visual clone without the later browser pass.

**Historic handoff superseded:** 40-file shell import scan completed later; see latest continuation below.


## Lane 19 owner sprint: original mobile footer and route-entry evidence

The original GitHub `42Students/lms2-fe` repository at `main` commit `522960b1a55779cfb9b694a6f6266c301d4e8056` was inspected read-only. It includes `src/components/MobileFooter/MobileFooter.jsx:21-149` and `src/components/MobileFooter/mobileFooter.scss:1-11`. This is **learner/faculty** footer evidence, not a claim that the same historic repository implements a TPO footer. Its `src/styles/components/_antddesign.scss:613-619` has an older 64px footer rule; the checked-in newer extracted source `docs/design/legacy-styles/components___antddesign.scss:912-936` adds phone safe-area, border and shadow. The newer extracted source takes precedence.

| Footer property/state | Old LMS source (file:line) | vNext source (file:line) | Source result |
|---|---|---|---|
| Footer bottom positioning | `components___antddesign.scss:912-916` fixed bottom 0 | `legacy-mobile-footer.css:7-13` fixed bottom 0; TPO `tpo-mobile-footer.tsx:27` fixed bottom | Match |
| Height | `components___antddesign.scss:914-916` 64px + bottom safe area | `legacy-mobile-footer.css:13,28` same | Match |
| White surface | `components___antddesign.scss:918` #fff | `legacy-mobile-footer.css:18,31` #fff | Match |
| Hairline top border | `components___antddesign.scss:919` 1px $neutral-100 (#f1f4f9) | `legacy-mobile-footer.css:19,32` 1px #f1f4f9 | Match |
| Shadow | `components___antddesign.scss:920` 0 -2px 8px rgba(0,0,0,.04) | `legacy-mobile-footer.css:20,33` same | Match |
| Home-indicator inset | `components___antddesign.scss:922` padding-bottom env(safe-area-inset-bottom) | `legacy-mobile-footer.css:15,30` same | Match |
| Flex nav | `components___antddesign.scss:924-935` flex-column container, nav flex 1 | `legacy-mobile-footer.css:16-17,35` same | Match |
| Mobile icon artwork | Original `MobileFooter.jsx:38-47,65-72,91-96,112-124,131-145` image size 30x30 | `learner-faculty-mobile-footer.tsx:20-29,63` 30x30 original public SVG URLs | Match on named artwork/declared size |
| Disabled/inactive icon opacity | Original `mobileFooter.scss:2-4` .5 | `legacy-mobile-footer.css:56` .5 | Match |
| Active icon opacity | Original `mobileFooter.scss:6-9` 1 | `legacy-mobile-footer.css:57` 1 | Match |
| Learner destinations | Original `MobileFooter.jsx:21-74,128-149` Courses, Notifications, Profile | `learner-faculty-mobile-footer.tsx:19-23` same destinations | Match |
| Faculty destinations | Original `MobileFooter.jsx:76-149` Courses, quizzes (bell), assignments, Profile | `learner-faculty-mobile-footer.tsx:25-30` same original icon artwork/order | Match |
| Notification count | Original `MobileFooter.jsx:65` count from class notification list | `learner-faculty-mobile-footer.tsx:42-51,65-68` personal unread inbox count | **Intentional modern content/semantics difference**; not strict functional parity |
| TPO destinations | No TPO mobile footer in original learner/faculty `MobileFooter.jsx` | `tpo-mobile-footer.tsx:8-49` existing 5-column vNext TPO destinations | **Content preserved; no historic TPO component parity source** |
| Mobile visibility | Extracted `components___learn-notifications.scss:9-10,40-47` 767px breakpoint; original `MobileFooter.jsx:22` d-sm-none | `legacy-mobile-footer.css:5-6` hidden ≥768, visible ≤767 | Modern extracted breakpoint matches; original Bootstrap differs |
| Canvas clearance | `components___learn-notifications.scss:40` footer height plus spacing + safe-area | `legacy-mobile-footer.css:22-25` 80px + safe area | Match 64px plus 16px padding assumption; exact $s3 requires token confirmation |

### Route progress versus fullscreen loader

No `NProgress`/top-progress-bar definition was identified in the **original** `lms2-fe/package.json`, `src/pages/_app.js` or the provided `old-lms-shell.css:1-101`. No fabricated top progress strip was added. The known fullscreen legacy `.ln-page-loader` remains `components___common.scss:1008-1019` (fixed viewport, z-index 999, white .99): the vNext app's route-specific loading screens still do **not** prove an identical loading overlay.

| Route motion | Old LMS source file:line | vNext source file:line | State |
|---|---|---|---|
| Entrance opacity 0→1, y 8→0 | `components___learn-layout.scss:49-58` | `route-transition.css:4-7` | Match |
| Entrance 250ms ease-out for learning shell | `components___learn-layout.scss:60-69` | `route-transition.css:20-21`, `route-transition.tsx:11-13,40` learner + faculty | Match |
| Learner exit opacity .78 and 6px×.998 | `components___learn-layout.scss:72-79` | `route-transition.css:15-19`, `route-transition.tsx:12-41` | Match values; client timing still runtime-unverified |
| Fade 220ms, move 260ms, matching easing | `components___learn-layout.scss:72-74` | `route-transition.css:22-24` | Match |
| Reduced-motion disable | `components___learn-layout.scss:577-585` | `route-transition.css:26-29` | Match |
| Pending state accessibility | No explicit ARIA progress marker in these old sources | `route-transition.tsx:41` `aria-busy` learner only | Accessibility improvement, not a visual progress bar |

### New local shell controls / verification

`src/components/shell/app-shell.tsx:17,124` imports and renders `LearnerFacultyMobileFooter` **after** `</main>`, one instance per authenticated shell. On non-learning routes it returns null, so it cannot duplicate TPO's existing footer. Original bell.svg exists at `public/assets/images/common/bell.svg`; all original public image paths are resolved. The footer source, CSS, and `tests/unit/chat19-legacy-mobile-footer.test.ts` were re-read for matching JSX opening/closing tags and imports. Tests were authored, **not executed**.

A repeatable complete-tree `git grep` ledger is committed as `scripts/audit/chat19-shell-grep.cjs`, but **not executed** per owner instruction. It prints exact matched lines/file counts for B3/B4; its future output must be pasted in the audit before ticking. The full source tree is not mounted in this connector session.

**STRICT OUTCOME:** B3 and B4 remain `[ ]`. B3 still needs executable complete-tree coverage counts and any uncovered sidebar states. B4 still needs complete-tree grep counts, the exact fullscreen loader treatment, and a historical or measured source for TPO footer-specific states. These are not represented as passes.

**Historic handoff superseded:** mobile footer and route progress source were updated later. Only the four unclaimed HR grid adapters were audited under `clone-chat19-hr-unclaimed.md`.


## Chat-19 continuation: 40-file shell import check and route progress adapter

The lane was reconciled with origin/main at `1308e7c9748b6c164a6761c2296501732761539b` before edits. The complete recursively enumerated GitHub tree was used to identify the HR files not claimed by chat-15/chat-18. **Four** unclaimed adapter files were audited source-complete in `docs/audit/ux/clone-chat19-hr-unclaimed.md`; every HR/recruiter route page in those trees is already assigned to those lanes.

**Current shell import scan:** all **40** source/style files under `src/components/shell/**` were fetched in three batches; **144** relative / `@/` imports were checked against the same GitHub tree: **0 unresolved**. Scan of `<button|<input|<select|<textarea` opening tags in all 40 source/style files: **0**. The navigation icon import remains explicit in `shell-nav-icons.tsx:3`: `legacyAntPaths` from `./legacy-ant-paths`. This is an exhaustive *shell subtree source scan*, not an executable `git grep` in a locally mounted checkout. The root checkout is not available in this tool environment; `scripts/audit/chat19-shell-grep.cjs` is committed as the reproducible command-level proof to be run after checkout.

### Route progress, original loader and current vNext implementation

| Feature/state | Legacy evidence (file:line) | Implemented vNext (file:line) | Strict result |
|---|---|---|---|
| Teal navigation accent | `old-lms-shell.css:45-48` #26bac7 active 3px rail | `route-progress.css:11-18` 3px indicator using the same #26bac7 | Shared legacy **colour** only, **not** an original top bar |
| Fullscreen loading | `legacy-styles/components___common.scss:1008-1019` white .99, fixed, z999 | `route-progress.tsx:64-68`, `route-progress.css:7-19` indeterminate top bar | **Different behavior**, leave B4 unticked |
| Original route progress | No progress-bar rule in `old-lms-shell.css:1-101`; original `lms2-fe/src/pages/_app.js:1-34` has no route-change listener or NProgress configuration | `route-progress.tsx:14-68` Next App Router progress | Modern adaptation, not historic visual parity |
| No layout interference | Legacy sidebar is relative flex sibling: `old-lms-shell.css:13,18` | `app-shell.tsx:73-126` progress after topbar, outside main, fixed with pointer-events none | Shell preservation |
| Rejected navigation recovery | Original sources do not define recovery interval | `route-progress.tsx:23-31` 8s fallback + pathname change reset | Adaptation, no legacy value comparison |
| Reduced motion | `components___learn-layout.scss:577-585` disables page animation | `route-progress.css:23-25` static full-width bar | Preserves reduced-motion intent; original top-bar state unmeasured |
| Accessible pending state | No `aria-valuenow` in original sources | `route-progress.tsx:64-68` indeterminate ARIA progressbar | Accessibility improvement |
| Desktop/mobile | Original top header is 68px desktop / 58px min mobile: `old-lms-shell.css:55,74-75` | `route-progress.css:7-18` fixed at viewport top, 3px, all widths | Adaptation; no measured original thin-bar width |

### Remaining strict blockers

- **B3:** Every rail/hover/group/badge/logo/drawer property in the B3 table has its old and new file:line references; exact full-repository `git grep` output counts have not been captured, and no rendered source-vs-vNext comparison of the icon artwork/viewport has occurred. The checklist allows visual comparison later, but requires actual coverage and no regressions now. B3 remains **[ ]**.
- **B4:** The completed learner/faculty footer is source-grounded; the TPO footer's original five-icon reference has now been recovered from the legacy production branch. The modern progress bar is accessible and functional by source but not pixel-equivalent to the documented legacy fullscreen loader. Both are explicitly recorded rather than falsely compared as equal. B4 remains **[ ]**.
- Full local reproduction script: `node scripts/audit/chat19-shell-grep.cjs`, committed, **not run**. New `tests/unit/chat19-route-progress.test.ts` and `tests/unit/chat19-unclaimed-hr-grid-parity.test.ts` were authored, **not run**.

**Next file if the remaining evidence becomes available:** `docs/audit/ux/clone-sidebar.md` — paste real repo-wide grep counts and old live loader/TPO-footer reference, then tick. No unclaimed HR portal pages remain.


## Production legacy footer reconciliation (supersedes earlier main-only search)

The authoritative original TPO/recruiter implementation is **lms2-fe
`prod-2026` commit `e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`**,
not the much older `main` branch examined above.

| Property and state | Original production file:line | vNext file:line | Result |
|---|---|---|---|
| Fixed white footer 64px + safe area, 1px hairline and light upward shadow | `docs/design/legacy-styles/components___antddesign.scss:912-936` | `legacy-mobile-footer.css:7-20,27-34` | Exact CSS values |
| Inactive/active icon opacity .5/1, transition .15s ease | `lms2-fe/prod-2026/src/components/MobileFooter/mobileFooter.scss:1-5,32-35` | `legacy-mobile-footer.css:36,44` | Exact |
| Minimum 44px tap, 6×8px padding, 3px gap, pressed scale(.93) .05s | `lms2-fe/prod-2026/mobileFooter.scss:7-21` | `legacy-mobile-footer.css:37-42` | Exact |
| 10px/500 caption, #a9a7ae default, #26bac7 active, line-height 1.2 | `lms2-fe/prod-2026/mobileFooter.scss:23-40` | `legacy-mobile-footer.css:43-45` | Exact |
| Five TPO icons and labels | `lms2-fe/prod-2026/MobileFooter.jsx:175-191` | `tpo-mobile-footer.tsx:12-17,32-48` | Home analytics; Engage contact; Drives assignment; Students myAccount; More Menu-Icon |
| Five recruiter icons and labels | `lms2-fe/prod-2026/MobileFooter.jsx:193-210` | `learner-faculty-mobile-footer.tsx:39-45,85-105` | Today, Drives, Calendar, Messages, Company |
| Six learner icons and labels | `lms2-fe/prod-2026/MobileFooter.jsx:92-137` | `learner-faculty-mobile-footer.tsx:25-32,85-105` | Courses, Alerts, Schedule, Placements, Projects, Profile |
| Four faculty icons and labels | `lms2-fe/prod-2026/MobileFooter.jsx:139-173` | `learner-faculty-mobile-footer.tsx:33-38,85-105` | Courses, Quizzes, Assignments, Profile |
| College admin five, mentor one | `lms2-fe/prod-2026/MobileFooter.jsx:38-91,211-225` | `learner-faculty-mobile-footer.tsx:46-56,85-105` | Role-specific original icon categories |
| Phone visibility below 768px | `lms2-fe/prod-2026/MobileFooter.jsx:35` `d-md-none` | `legacy-mobile-footer.css:5-6`, `tpo-mobile-footer.tsx:32` | Exact breakpoint |
| Route gating prevents mixing portals | `lms2-fe/prod-2026/MobileFooter.jsx:12-32` | `app-shell.tsx:126`, `learner-faculty-mobile-footer.tsx:58-86` | Role grouping preserved; links checked against server-permitted shell routes |

All original SVG filenames exist in `public/assets/images/common/`. Only
the destination URLs differ intentionally where vNext renamed
`/tpo/drives` → `/tpo/placements` and recruiter routes → `/hr/*`.
The old full-page spinner was `lms2-fe/prod-2026/src/components/Loader/loader.js:6-35`:
AntD large Spin and, at **20,000ms**, a `Still loading…` / `Reload`
recovery action. That is separate from the new App Router thin indicator and
is **not** yet copied pixel-for-pixel. Under the strict rule the combined B4
checkbox remains unticked pending that loader equivalence and executable
repository-wide grep proof; do not report both as a perfect match.


### Fullscreen loader follow-up — source values now implemented

The new `route-progress.tsx:14-95` maintains its nonblocking top indicator
for immediate route intent. After 700ms pending navigation, it displays a
fullscreen overlay based on original
`lms2-fe/prod-2026/src/styles/components/_common.scss:1008-1019`.
The old `Loader/loader.js:6-35` showed a large AntD Spin and offered
`Still loading…` / `Reload` after 20s. Those copy and recovery timing
values are now reproduced. The fallback guard at 30s is an additional safety
measure, not an old LMS property.

| Loading state | Original production file:line | vNext file:line | Result |
|---|---|---|---|
| Overlay fixed top0 left0 100%×100% | `_common.scss:1008-1013` | `route-progress.css:35-40` | Match |
| Flex centered, z-index 999 | `_common.scss:1014-1017` | `route-progress.css:41-44` | Match |
| Near-white mask rgba(255,255,255,.99) | `_common.scss:1018` | `route-progress.css:45` | Match |
| Spinner wrapper margins/padding/radius | `_antddesign.scss:741-748` | `route-progress.css:47-53` | Match |
| Large spinner | `Loader/loader.js:20` AntD `Spin size="large"` | `route-progress.tsx:83-86`, `route-progress.css:54-75` 32px four-dot approximate | **Not exact AntD path/animation** |
| Slow recovery copy and action | `Loader/loader.js:21-30` 20s `Still loading…`, `Reload` | `route-progress.tsx:43,87-91` | Text/timing match |
| Top route-intent progress strip | No matching bar in original `_app.js:1-228` / shell SCSS | `route-progress.tsx:76-80`, CSS :7-29 | Modern requested enhancement, not pixel legacy |
| Reduced motion | `learn-layout.scss:577-585` disables motions | `route-progress.css:24-29,80-83` | Static fallback |

The mixed solution is intentionally labeled as partial legacy parity.
**Do not tick B4** without the full checkout grep, final icon/spinner artwork
comparison and actual phone/tablet browser proof. No CI/browser run occurred.

## Replacement-lane checkpoint — 2026-10-19 (commits 287c109, dd61fe8, 372911a)

The previous chat-19 head `e21ba2a` was already an ancestor of
`main` (0 ahead, 653 behind). Branch `chatgpt/chat-19-b` was fast-forwarded
to `12ee0a58` before the following new work; no unique lane commits
were discarded. All writes in this checkpoint target only this lane branch.

### B4: exact source/implementation delta

| Property / interaction | Original old-LMS reference and value | vNext reference and value | Strict result |
|---|---|---|---|
| Fullscreen masking | `lms2-fe/prod-2026/src/styles/components/_common.scss:1008-1019`: fixed, white .99 mask, z999 | `route-progress.css:35-46`: matching mask | Source matched |
| Large spinner selection | `lms2-fe/prod-2026/src/components/Loader/loader.js:20`: AntD `Spin size="large"` | `route-progress.tsx:92-96`, `route-progress.css:58-77`: 32px group, four 14px dot elements | AntD v5 pattern reproduced in CSS; rendered identity pending |
| Individual dot animation | Legacy `package.json` dependency `antd:^5.1.7`; large Spin uses per-dot 1s alternate opacity with stagger | `route-progress.css:67-87`: opacity .3→1, scale(.75), delays 0/.4/.8/1.2s, 1.2s rotating wrapper | Closer source adaptation, not browser-certified |
| Spinner colour | AntD v5 default `colorPrimary` is #1677ff, no ConfigProvider in legacy `src/pages/_app.js` | `route-progress.css:72` #1677ff | ConfigProvider elsewhere not exhaustively ruled out; keep unverified |
| Slow recovery | `lms2-fe/prod-2026/Loader/loader.js:6-30`: 20s then “Still loading…” and Reload | `route-progress.tsx:43,97-100`: 20s and same copy/action | Source matched |
| Back/forward query-only history | Legacy App Router equivalent not present; no historical progress bar | `route-progress.tsx:63-73`: if pathname unchanged, clear timers/overlay rather than starting a 30s pending state | Modern correctness fix; no historic equality claim |
| Accessibility and reduced motion | Old full-screen loader offered a status, AntD handles Spin internals | `route-progress.tsx:89-95` role=status; `route-progress.css:90-92` stops wrapper AND dot animation when reduced-motion | Adaptation |
| Desktop, tablet and phone | Fullscreen old `_common.scss:1008-1019` does not vary by media breakpoint | New `route-progress.css:35-46` fixed fullscreen at 0–767, 768–1199 and ≥1200; sidebar remains a separate flex sibling | Structural rule proof only, browser check outstanding |

**Source regression guard:** `tests/unit/chat19-route-progress.test.ts` now checks
the four staggering delays, dot dimensions, reduced-motion behaviour, and the
same-path popstate early clear. It was written but **not run**, per no-code/no-CI
instruction.

**Coverage status:** No local `git grep` was executed. The prior shell-subtree
fetch scan of 40 files / 144 imports / 0 unresolved and 0 raw controls remains
the available source-only coverage record; it is not sufficient to tick either
category under STRICT TICK RULE. The committed exact commands live at
`scripts/audit/chat19-shell-grep.cjs`. B3 and B4 remain `[ ]` until the
orchestrator executes the ledger, attaches output counts, and completes the
historical icon/spinner and phone/tablet comparisons.

**Next file:** `docs/audit/ux/clone-sidebar.md` after the orchestrator runs
`node scripts/audit/chat19-shell-grep.cjs` and provides the full checkout output.

### B3 no-regression test correction (commits 63a76a2, be2fad7)

Two existing chat-19 suites described earlier abandoned DOM variants and would have
incorrectly failed the current legacy-matched implementation:

| State | Original source requirement | vNext actual file:line | Guard now checks |
|---|---|---|---|
| Push rather than overlay | `old-lms-shell.css:13,18`: rail is a relative flex sibling, width 96→256px | `app-shell.tsx:75-104`; `sidebar-legacy.css:7-25` | `chat19-north-star-legacy-sidebar.test.ts:150-152`: flex frame/page sizing, no fake padding-left shift |
| Mobile drawer role and Escape | `legacy-styles/components___antddesign.scss:305-359`: modal left drawer, 82% width / max300px | `mobile-navigation.tsx:25-37`; `ui/drawer.tsx:38-41`: native dialog and onCancel | `chat19-north-star-legacy-sidebar.test.ts:178-186,229-235` and `chat19-sidebar-hr-original-icons-and-secondary-surfaces.test.ts:30-34` |
| Mobile body gutter | `components___antddesign.scss:348-359`: 12px sides, 8px top | `mobile-navigation.tsx:35`: `!px-3 !pt-2`, `sidebar-legacy.css:220`: internal nav padding 0 | Guard compares Drawer body gutter rather than obsolete nav padding |

No page, route, or UI shell contract was weakened; the assertions now inspect
where the behaviour actually lives. Neither suite was run, and **neither B3
nor B4 is ticked** without the pending coverage/output and browser proof.

## Follow-up batch — legacy footer badge and entire shell-subtree source scan

**Scan basis:** branch `chatgpt/chat-19-b` after
`639ffda6a43b4056547bc1b5bf360672675cf390`, Git tree
`8eea8081dc04005635710841e94b27ccf6677548`.
A recursive GitHub Git-tree listing was **not truncated** (15,723 entries).
All **41** `src/components/shell/**` `.ts`, `.tsx` and `.css` blobs
were read, including the 16 `topbar/` files owned by chat-13 for
**read-only coverage**. The following counts come from searching the
actual fetched file content, not indexed GitHub search results:

| Full shell-subtree search expression | Matching lines/occurrences | Files affected | Result |
|---|---:|---|---|
| `<(button\|input\|select\|textarea)(?=[[:space:]>])` (tag-start equivalent) | **0** | none of 41 | No raw controls in shell subtree |
| `lms-desktop-sidebar\|fl-d-panel-l\|lms-sidebar-item` | **50** | `app-shell.tsx` 1, `sidebar-nav.tsx` 2, `sidebar-legacy.css` 47 | All confined to owned shell classes; `fl-d-panel-l` is a historical CSS comment |
| `legacyAntPaths` in icon component and shape source | **3** | `shell-nav-icons.tsx` 2, `legacy-ant-paths.ts` 1 | Explicit import/export checked at `shell-nav-icons.tsx:3` |

**Exact checkout commands for re-verification** (not executed in this
connector-only session):
`git grep -n -I -E 'lms-desktop-sidebar|fl-d-panel-l|lms-sidebar-item' -- src/components/shell`;
`git grep -n -I -E '<(button|select|input|textarea)([[:space:]>])' -- src/components/shell`.
The committed `scripts/audit/chat19-shell-grep.cjs` expands the scan
to other relevant `src/` and `src/components/tpo/` files and will
print full file+line output when run in a checkout. Do not claim these
remote-source counts as an executed `git grep`; the broader required
checkout ledger remains **open**.

### Newly corrected mobile notification-badge values

| State/property | Legacy source and exact value | Current vNext source and value | Result |
|---|---|---|---|
| Icon wrapper | `lms2-fe/prod-2026/src/components/MobileFooter/MobileFooter.jsx:104-110`: AntD Badge wraps 24×24 notification image | `learner-faculty-mobile-footer.tsx:97-103`: relative icon wrapper wraps Image and count | Source match |
| Small indicator height/min-width | AntD v5 small Badge token `indicatorHeightSM=14` (old app `package.json` uses `antd:^5.1.7`) | `legacy-mobile-footer.css:89-90`: min-width14, height14 | Match |
| Small indicator font/line height | AntD v5 small Badge `textFontSizeSM=12`, line-height14 | `legacy-mobile-footer.css:96-98`: font12, line-height14 | Match |
| Badge background | Original uses uncustomized AntD count; v5 `colorError=#ff4d4f` | `legacy-mobile-footer.css:93`: #ff4d4f | Default-match; computed theme remains unverified |
| Badge location | AntD badge is attached to the 24px icon (not the full 44px link) | `legacy-mobile-footer.css:75-88`: relative 24px wrapper; count top0/right0, translate(50%,-50%) | Structural match; rendered pixel position open |
| Empty, 1–99, 99+ | Legacy `MobileFooter.jsx:104-110`: hides zero, overflowCount99 | `learner-faculty-mobile-footer.tsx:100-102`: hidden at zero, original string through 99, 99+ above 99 | Visual states matched |
| Disabled/unavailable item | Original footer renders permitted role's links only | `learner-faculty-mobile-footer.tsx:82-87`: only `items`-authorized routes are shown | Preserves vNext permission behavior |
| Pressed/active/focus | Legacy `mobileFooter.scss:1-40`: .5 icon opacity, active 1, 44px target, pressed .93 | `legacy-mobile-footer.css:36-45,68-73`: same | Source match |
| Phone and safe area | Old `components___antddesign.scss:912-936`: 64px + safe-bottom footer, fixed | `legacy-mobile-footer.css:6-25`: fixed 64px+safe inset | Match |
| Tablet/desktop | Old `MobileFooter.jsx:35`: Bootstrap `d-md-none` at 768px | `legacy-mobile-footer.css:5-6`: desktop hidden, phone ≤767px shown | Match |
| Reduced motion | Old mobile footer only specifies opacity .15s / press .05s | `legacy-mobile-footer.css:46-49` stops transitions for reduced motion | Accessibility addition; not identical source |
| Accessibility | Original `MobileFooter.jsx:104-110`: badge visible as child image count | `learner-faculty-mobile-footer.tsx:95-103`: decorative indicator aria-hidden, count in Link accessible label | Accessibility enhancement; not visual change |

**Responsive proof from source rules:** at 320/360/390px the six-item
learner footer uses six 44px minimum touch targets and 24px side padding
(`legacy-mobile-footer.css:50-73`), fitting 312px total minimum width
at 320px. Badge positioning is within the 24px icon wrapper. Below
768px the footer is fixed above the safe-area inset; at 768/1024/1280px
it is hidden and the desktop sidebar is visible. These are **static CSS
derivations**, not screenshots or a responsive browser run.

**JSX and imports:** all opening/closing link, span, list-item, nav,
and footer tags in `learner-faculty-mobile-footer.tsx:88-112`
were re-read after the wrapper edit; `Image`, `Link`, hooks and
`./legacy-mobile-footer.css` remain imported.
`tests/unit/chat19-legacy-mobile-footer.test.ts` now asserts the
real active selector and all small badge dimensions/positioning.
The suite was not executed.

**Work queue status:**
- Source-complete this batch: `learner-faculty-mobile-footer.tsx`,
  `legacy-mobile-footer.css`, and their dedicated source regression suite;
  historical notes in `north-star-sweep-chat-19.md` were corrected.
- Still open B3: actual checkout-wide command output, glyph artwork
  screenshots, desktop hover and tablet measurements.
- Still open B4: executing the complete checkout ledger, full pixel
  verification of AntD spinner and footer, and an explicit owner
  decision whether the new thin route-intent bar remains as an intentional
  non-legacy enhancement.

No topbar, HR-owned pages or data behavior were changed in this scan.
B3 and B4 both remain **[ ]** under the strict tick rule.

## Chat-19 follow-up: route transitions, portal headings and role-home links

This is a **source-complete bounded-file pass**, not a B3/B4 category sign-off.
The values below are compared to the actual legacy rules, with behavioral
modernizations clearly separated. No app, test, lint or CI task was run.

### Route-transition source-value table

| Interaction/value | Legacy evidence | vNext file:line | Result |
|---|---|---|---|
| Entrance opacity 0→1 | `components___learn-layout.scss:49-58`: keyframe 0 to 1 | `route-transition.css:4-7`: same | Match |
| Entrance translateY 8→0px | `components___learn-layout.scss:49-58` | `route-transition.css:5-6`: 8→0 | Match |
| Entrance speed/easing | `components___learn-layout.scss:60-69`: 250ms ease-out when no reduction | `route-transition.css:20-21`: 250ms ease-out when no reduction | Match |
| Learner exit opacity | `components___learn-layout.scss:71-86`: 0.78 | `route-transition.css:14-17`: .78 | Match |
| Exit translate/scale | `components___learn-layout.scss:77-79`: translateY(6px) scale(.998) | `route-transition.css:15-19`: same | Match |
| Exit easing/duration | `components___learn-layout.scss:71-74`: 220ms opacity, 260ms transform, cubic-bezier(.2,.8,.2,1) | `route-transition.css:20-24`: same | Match |
| Pending stacking hint | `components___learn-layout.scss:79`: will-change opacity, transform | `route-transition.css:17-20`: same | Match |
| Ready-state transform | `components___learn-layout.scss:81-86`: no transform/stacking context on ready | `route-transition.tsx:54-56` attribute removed on ready | Source structure matches |
| Reduced motion | `components___learn-layout.scss:577-585`: disable animation/transition | `route-transition.css:26-29` disables animation/transition/transform | Same intent; broader override |
| Learner-only exit | `learn-layout.scss:71-86` scoped to `.learn-layout--learner` | `route-transition.tsx:11,55` scoped to learner only | Match |
| Query-only filters | No old source equivalent in that SCSS slice | `route-transition.tsx:54` key=`pathname`; `onNavigate` ignores same pathname, including ?page= and #hash | Modern behavior, not source parity |
| Modified/other-target links | Old click middleware outside inspected SCSS | `route-transition.tsx:23-35` skips modified, external, download, disabled, non-self target; URL parse guarded | Modern safety check |
| Back/Forward navigation | Legacy pages router transition behavior not defined by SCSS | `route-transition.tsx:39-48`: popstate starts exit only for a changed pathname; listener cleanup | Modern correctness adaptation |
| Failed navigation reset | No old recovery timeout specified | `route-transition.tsx:18-22,49-52`: 3000ms fallback clears pending opacity | Adaptation, NOT exact original |
| Full-screen accessibility | Old source defines page wrapper only | `app-shell.tsx:124-126` keeps animation inside main, with `aria-busy` only during learner exit | Structural/source adaptation |

**Responsive proof:** `route-transition.css:4-29` has no viewport-dependent
values, so phone ≤767px, tablet 768–1199px and desktop ≥1200px receive
the same 250ms entrance, 220/260ms learner exit. Media query for
`prefers-reduced-motion:reduce` disables transforms at all three sizes.
Neither topbar nor sidebar is nested within the animated element
(`app-shell.tsx:104-126`), preventing the route animation from shifting
the 96→256px rail or 68px topbar. Browser layout proof remains
unperformed under checklist J.

### B3: role-scoped headings and safe sidebar home

| State | Old LMS reference | Current implementation | Outcome |
|---|---|---|---|
| TPO expanded section labels only | `old-lms-shell.css:49-53`: sections for TPO sidebar | `sidebar-nav.tsx:20-25,87`: `sectionLabel(item,sidebarPortal)` requires portal `tpo` and excludes the College Admin `Placement cell` cross-link | Match; no false TPO heading on `/college/*` or `/tpo/home` shortcut |
| Non-TPO grouping | Other role menus in `old-lms-shell.css:49-53` have no TPO labels | `sidebar-nav.tsx:89-95`: a hairline for group break without TPO heading | Structure match; visual pending |
| Collapsed section separator | `old-lms-shell.css:50-51`: 22px and 1px #f1f4f9 | `sidebar-legacy.css:54-61,205-227`: same | Match |
| Desktop expansion | `old-lms-shell.css:13,18`: relative 96→256px flex push in 150ms | `sidebar-legacy.css:6-25`: same; focus-within additionally expands | Match with a11y enhancement |
| Brand logo size | `old-lms-shell.css:12`: 38×36px | `app-shell.tsx:79-84` and `shell-nav-icons.tsx:65-70`: 38×36px | Match dimensions |
| Brand link destination | No exact old destination value measured; one account menu active | `app-shell.tsx:54-55,80`: first permitted `navigation[0]?.href` rather than always `/dashboard` | Functional safety, not a visual comparison |
| Sidebar failure fallback | Legacy source doesn't specify a fallback route | `app-shell.tsx:87`: `ShellWidgetBoundary` fallback uses same authorized role landing page | Functional safety, not a visual comparison |
| Mobile drawer | `components___antddesign.scss:305-359`: 82% max300px, safe area, touch scroll | `mobile-navigation.tsx:25-36`; `sidebar-legacy.css:187-225` | CSS values match, physical viewport still unverified |

**Source grep-equivalent scope:** The previous exhaustive connected-source
scan of all 41 `src/components/shell/**/*.{ts,tsx,css}` blobs found
**0** raw opening `button/input/select/textarea` tags and **50**
`lms-desktop-sidebar|fl-d-panel-l|lms-sidebar-item` references, all
in `app-shell.tsx` (1), `sidebar-nav.tsx` (2), and
`sidebar-legacy.css` (47). Changes this turn added no raw controls and
no new rail-selector occurrences. The exact follow-up full-checkout
commands remain:

```sh
git grep -n -I -E 'lms-desktop-sidebar|fl-d-panel-l|lms-sidebar-item' -- src
git grep -n -I -E '<(button|input|select|textarea)([[:space:]>])' -- src/components/shell src/components/tpo
git grep -n -I -E 'route-transitioning|pageSlideIn|nprogress|progress' -- src/components/shell src/app
node scripts/audit/chat19-shell-grep.cjs
```

They were **not executed** here, so no whole-checkout counts are invented.
Source assertions were updated in
`tests/unit/chat19-shell-route-transitions.test.ts`,
`tests/unit/chat19-north-star-legacy-sidebar.test.ts` and
`tests/unit/chat19-shell-sidebar-clone.test.ts`; none were executed.
Opening/closing JSX markup of the route wrapper, sidebar link and logo
remains paired after the edits. `shell-nav-icons.tsx:3` still imports
`legacyAntPaths` from `./legacy-ant-paths`.

**Strict status:** B3 `[ ]` (needs browser icon/hover/tablet proof and
full-checkout command output); B4 `[ ]` (modern top progress strip
has no old-LMS equivalent, pending pixel proof of loader/footers and
full-checkout command output). Route behavior and per-file source work
are complete; do not mislabel them as perfect pixel equality.

**Next practical file:** `src/components/shell/sidebar-legacy.css`,
if orchestrator provides screenshot diffs; otherwise
`scripts/audit/chat19-shell-grep.cjs` for full-checkout evidence
after local checkout.

### Mobile drawer pixel-value corrections (source-complete)

Reviewing `docs/design/legacy-styles/components___antddesign.scss:305-426`
exposed three real vNext mobile differences after the earlier width/scroll
clone. They are now corrected in `sidebar-legacy.css` without changing
the desktop 96px rail or another owner's shared Drawer:

| Property/state | Legacy SCSS file:line and value | vNext file:line and value | Status |
|---|---|---|---|
| Left drawer shadow | `components___antddesign.scss:412-426` `4px 0 16px rgba(0,0,0,.12)` | `sidebar-legacy.css:189-199` same on `.lms-mobile-sidebar[data-slot=drawer]` | Match (previous shared right drawer cast wrong-direction -4px shadow) |
| Mobile long labels | `components___antddesign.scss:383-389` `word-break:break-word`, `overflow-wrap:break-word`, 15px readable text | `sidebar-legacy.css:232-239` same, with `white-space:normal`, no desktop ellipsis | Match source intent |
| Item icon/label gutter | `components___antddesign.scss:374-389`: 10px nav padding and 10px text offset | `sidebar-legacy.css:225-230`: padding10px, flex gap10px | Match spacing |
| Mobile group divider margins | `components___antddesign.scss:403-405`: 6px 8px | `sidebar-legacy.css:268-273`: 6px 8px | Match (previous 14px/10px vertical, 12px horizontal) |
| Collapsed desktop ellipsis remains | Old desktop `old-lms-shell.css:14,33` hides labels in rail, shows on hover | `sidebar-legacy.css:147-154` desktop overflow ellipsis; override only in mobile Drawer | No desktop regression |
| Breakpoints | `old-lms-shell.css:23` and mobile SCSS max767px | `sidebar-legacy.css:6,189` desktop ≥768px, mobile ≤767px | Match |
| Original mobile touch scroll | `components___antddesign.scss:348-359` touch inertia, no scrollbar | `sidebar-legacy.css:216-223` same | Match |

**Responsive/grep source proof:** At phone widths 320, 360 and 390px,
a long menu label wraps instead of overflowing its native 82vw/max300px
drawer; group dividers use 8px inline and 6px block margins.
At 768/1024/1280px, only the original desktop ellipsis and flex rail
apply; `@media (max-width:767px)` keeps new drawer values out of tablet.
The changed CSS introduces **zero** opening raw HTML control tags and
**zero** additional `lms-desktop-sidebar|fl-d-panel-l|lms-sidebar-item`
occurrences relative to the earlier 41-file source scan.
`tests/unit/chat19-shell-sidebar-clone.test.ts` now contains source
guards for these SCSS values. Tests and browser screenshots were not run.

**Strict tick:** B3 remains `[ ]` until the executed checkout grep,
hover/collapsed icon screenshot, keyboard interaction, and tablet/phone
viewport proof are attached. These source-value fixes do not justify a
false whole-category tick. B4 remains `[ ]` for the non-legacy route bar
and remaining loader pixel comparisons.

### College Admin ↔ TPO shortcut: menu isolation completed from source

A genuine College Admin-only navigation has one `Placement cell` link
whose destination is `/tpo/home`. Previously selecting it made
`scopedShellNavigation` treat that sole shortcut as a complete TPO
portal, hiding every College Admin sidebar entry and enabling TPO-only
group/scrollbar chrome. The following source contract now holds:

| State | Legacy account contract | vNext evidence | Outcome |
|---|---|---|---|
| College home | College Admin menu is the single active account menu | `shell-model.ts:103-126,319-329`: college rows retained and Placement cell shortcut included | Source match |
| College → Placement cell | A shortcut is not a separate TPO role | `shell-model.ts:108-118`: when the sole TPO row is `Placement cell`, selected portal stays college | Corrected |
| Genuine TPO account | TPO Home/Students/Drives/etc. remain a full separate account | `shell-model.ts:113-119`: 2+ TPO rows or the real `Home` row selects TPO | No regression by construction |
| Logo/fallback destination | Account role home rather than cross-role generic page | `app-shell.tsx:54-55,80,87` derives first permitted `homeHref` | Corrected functional safety |
| Group headings | `old-lms-shell.css:49-53`: uppercase TPO groups only | `sidebar-nav.tsx:20-25,53-58,94`: visible College Admin rows prevent TPO headings | Source match |
| Scrollbar mode | `old-lms-shell.css:41-43`: thin TPO scrollbar only for TPO | `sidebar-nav.tsx:53-58` sets `data-sidebar-portal=other` for college; `sidebar-legacy.css:240-256` uses `tpo` selector | Corrected |
| Responsive link geometry | `old-lms-shell.css:23`, `components___antddesign.scss:305-389`: desktop icon rail, mobile drawer with all menu links | Shared `SidebarNav`/scoping applies to both widths; no branch-specific filtered copy | Structural match; browser still open |

**Regression proof:** `tests/unit/chat19-north-star-legacy-sidebar.test.ts`
adds two explicit route cases: a sole College Admin shortcut keeps all
college entries while opening `/tpo/home`, whereas a real two-row TPO
navigation selects only TPO rows. Assertions were authored but not run.

No additional raw controls or modal implementations were introduced.
The earlier remote-source sweep across 41 shell TypeScript/CSS files
(0 raw controls, 50 rail-class matches) remains the available scoped
coverage proof, not a checkout `git grep`. Browser hover, keyboard
and phone/tablet screenshot parity remain open. **B3 stays [ ]; B4
stays [ ].**

## Next batch: executable grep ledger and unified mobile active highlighting

The old LMS `lms2-fe/prod-2026/src/components/MobileFooter/MobileFooter.jsx:35-225`
shares the same role-specific active footer semantics as its desktop
navigation. The current recruiter alias pages can render from `/recruiter/*`
while navigation URLs are canonical `/hr/*`. Before this batch their
mobile bar had **no active tab**, although the desktop sidebar correctly
recognized the alias. The mobile footer now reuses the same pure route
ownership helper used by `SidebarNav`. All link destinations, icons,
spacing, permission filtering and content remain unchanged.

| Property/state | Original production value and source | Current file:line evidence | Result |
|---|---|---|---|
| Active icon opacity | `mobileFooter.scss:32-40` sets active image opacity 1 | `legacy-mobile-footer.css:36-45` same; `learner-faculty-mobile-footer.tsx:94-105` derives the active item | Exact CSS; active logic reconciled |
| Active caption | `mobileFooter.scss:37-39` active #26bac7 | `legacy-mobile-footer.css:43-45` same | Exact CSS |
| Inactive caption | `mobileFooter.scss:23-30` 10px/500/#a9a7ae/line-height1.2 | `legacy-mobile-footer.css:43-45` same | Exact CSS |
| 24px icons | `MobileFooter.jsx:38-224` image width24/height24 | `learner-faculty-mobile-footer.tsx:98-103` 24×24 | Exact declared size |
| Active recruiter aliases | Legacy maps `/recruiter/home|drives|messages|calendar|company` to their own active footer items (`MobileFooter.jsx:195-210`) | `legacy-sidebar-active-model.ts` maps aliases to canonical HR routes; `learner-faculty-mobile-footer.tsx:94` reuses it | Corrected canonical-route adaptation |
| Nested drive/message detail | Legacy footer active selected by account section id | `legacy-sidebar-active-model.ts:20-47` owns result/job and conversation child pages; shared by both footer and sidebar | Corrected modern route ownership |
| Active College Admin profile utility | Legacy College Admin footer Profile option at `MobileFooter.jsx:65-69` | `legacy-sidebar-active-model.ts:17-23` maps branding/domains/college-profile to Profile; shared by mobile and desktop | Modern alias continuity |
| Role filtering | Legacy role predicates at `MobileFooter.jsx:12-35` | `learner-faculty-mobile-footer.tsx:58-87` role+permitted sidebar paths | Existing behavior retained |
| Phone versus tablet | Legacy `d-md-none` at ≥768px | `legacy-mobile-footer.css:5-6` renders ≤767px, hidden ≥768px | Same breakpoint |
| Safe-area height | `components___antddesign.scss:912-936` 64px+safe-area | `legacy-mobile-footer.css:7-25` same | Exact source values |

**Grep proof available now:** A source-only scan of the complete
41-file `src/components/shell/**/*.{ts,tsx,css}` subtree at the
previous recorded tree has 0 raw button/input/select/textarea opening
tags, and 50 `lms-desktop-sidebar|fl-d-panel-l|lms-sidebar-item`
references confined to the three canonical shell files. This batch
adds one pure import and one helper call; it introduces no new class
selector or raw control. The full-checkout command script has been
upgraded to print each individual Git command and unabridged path:line
matching output, plus line count, file count and shell/TPO breakdown
for six separate B3/B4 patterns. It accepts
`node scripts/audit/chat19-shell-grep.cjs --markdown` for a directly
pasteable audit table or defaults to JSON. It treats Git grep's exit
status 1 as zero matches and propagates all other failures.

**Important limitation:** the GitHub-connected environment has no
mounted Git worktree, so the revised script and
`tests/unit/chat19-shell-grep-ledger.test.ts` are authored but
not executed. The exact whole-checkout count cannot be claimed.
The owner can run:

```sh
node scripts/audit/chat19-shell-grep.cjs --markdown
```

at the final branch HEAD and attach its actual output. Only after that,
reconcile any hand-rolled legacy/sidebar/footer references and record
exemptions for topbar/TPO files owned by other lanes. At phone widths
320/360/390px, alias-aware active class uses the same 24px icon and
10px caption inside 64px+safe-area as before. At 768/1024/1280px,
the footer remains absent and desktop `SidebarNav` remains canonical.

**B3: [ ] and B4: [ ]**. Both retain missing executable complete-tree
grep and browser source-vNext comparison; B4 additionally retains the
known intentional non-legacy top route progress bar.

**Next file for execution evidence:**
`docs/audit/ux/clone-sidebar.md` (paste actual
`chat19-shell-grep.cjs --markdown` output and browser observations).

### Follow-up: routed mobile Drawer and scoped TPO counter states

This batch corrected two source-visible state mismatches without changing
the shared Drawer, underlying server counter route, or any page contents.

| State | Legacy or existing source contract | Current source implementation | Result |
|---|---|---|---|
| Drawer width phone | `components___antddesign.scss:305-308`: 82%, cap 300px | `sidebar-legacy.css:189-199`: 82vw capped 300px | Values match |
| Drawer focus/close | Original drawer modal closes on navigation; shared vNext `Drawer` handles Escape/backdrop/focus trap | `mobile-navigation.tsx:13-18,32-43` closes on route pathname commit, link click, and shared `onOpenChange` | Additional Back/Forward safeguard; browser still pending |
| Open state on desktop breakpoint | Original phone only through 767px | `mobile-navigation.tsx:20-28`: closes at min-width 768px and resize | Source match |
| Expanded TPO badge poll | Only a genuine TPO portal needs TPO notifications, requests, messages/team counts | `sidebar-nav.tsx:49-82`: `sidebarPortal==="tpo"` guard, 60-second poll and visibility refetch | No college-only API poll |
| College Admin Placement cell | College Admin has a single `/tpo/home` shortcut but not a full TPO rail | `shell-model.ts:108-126`, `sidebar-nav.tsx:49-62`: route resolves to college menu and no TPO count requests | Corrected scoped behavior |
| Unknown TPO Team count | `shell-counts-model.ts`: `team:number|null`, unknown must not be inferred as 0 | `sidebar-nav.tsx:30-37`: returns nullable `counts.team` directly | Corrected unknown state |
| Known zero / positive counts | `shell-counts-model.ts`: only positive badges, 99+ overflow | `sidebar-nav.tsx:97-119`: existing `shellUnreadBadge` unchanged | No regression |
| Mobile vs tablet counter UI | Old sidebar switches from touch drawer ≤767 to rail ≥768 | `SidebarNav` is shared inside both, same guarded data and link state | Structural match, browser check open |

The `mobile-navigation.tsx` role menu still has its single 44px
launcher, native-dialog focus trap, Escape and backdrop handling.
The new pathname listener is cleaned up by React, while its existing
breakpoint listener cleans up on unmount. The read-only script
`scripts/audit/chat19-shell-grep.cjs` searches all tracked source
`.ts/.tsx/.css` entries in B3/B4 scopes and records line/file counts.
This turn added no custom button, input, modal or footer implementation.

Tests in `chat19-north-star-legacy-sidebar.test.ts` and
`chat19-shell-sidebar-clone.test.ts` now assert TPO count authority
and pathname-based Drawer closure; **not executed**.
Responsive source analysis covers phone 320/360/390 and tablet
768/1024px; physical browser and old-site side-by-side proof are still
the orchestrator's section J work.

**Strict status remains B3 [ ], B4 [ ]:** actual full-checkout
`git grep` output has not been executed/recorded and browser
artwork/animation comparison remains open.

### Exhaustive connected-source TPO subtree coverage (127 files)

To supplement the completed **41-file shell** scan, every one of the
**127** tracked `src/components/tpo/**/*.{ts,tsx,css}` files was read
from the lane branch Git tree in eight complete, disjoint batches:
0–15, 16–31, 32–47, 48–63, 64–79, 80–95, 96–111 and 112–126.
The Git tree listing was nontruncated. The source regex for raw tags
was `<(button|input|select|textarea)(?=[\\s>])`; for overlays,
`role="(dialog|alertdialog)"|fixed inset-0|fixed inset-x-0 bottom-0`.

| Coverage expression/scope | Files searched | Occurrences / matching lines | File count | Interpretation |
|---|---:|---:|---:|---|
| Raw controls, **shell** | 41 | **0 / 0** | 0 | Shell B3/B4 does not hand-roll form controls |
| Raw controls, **TPO components** | 127 | **28 tag occurrences / 22 source lines** | 10 | Outside chat-19's shell/footer ownership; see owner handoff below |
| Potential overlay/position patterns, TPO | 127 | **4 / 4** | 4 | One legitimate fixed TPO footer; other three use shared `Dialog`, NOT hand-rolled overlays |
| Shell/footer CSS class identifiers, TPO | 127 | **7 occurrences** | **1** | Only `src/components/tpo/tpo-mobile-footer.tsx`; shell re-export simply reuses this component |
| Class identifier duplication under TPO | 127 | **0 second fixed-footer implementations** | 0 | No duplicate TPO mobile bar component in that directory |

**TPO raw source matches, routed to other owners rather than changed
outside this lane:** `recruiter-bulk-invite-controls.tsx` (1),
`recruiter-bulk-owner-controls.tsx` (9),
`recruiter-bulk-stage-controls.tsx` (9),
`tpo-batch-facet-filters.tsx` (1 hidden input),
`tpo-batch-invitation-control.tsx` (1 checkbox),
`tpo-draft-drive-step-one-form.tsx` (1 button),
`tpo-find-shortcut.tsx` (1 button),
`tpo-notice-audience-picker.tsx` (1 hidden input),
`tpo-notice-delete-confirm.tsx` (2 hidden inputs),
`tpo-notice-undo-toast.tsx` (2 hidden inputs).
The 28 number counts individual JSX tag openings, including several
multiple-tag lines; `git grep -n` will report **22 source lines**,
not 28 occurrences, for the same TPO files.

**Overlay proof by file:line:** `tpo-mobile-footer.tsx:32` is the
intended fixed footer (not a modal); `tpo-notice-delete-confirm.tsx:22`,
`tpo-team-ask-panel.tsx:40` and `tpo-team-message-actions.tsx:42`
pass `role="alertdialog"` to the shared `Dialog`. These three
are allowed shared-dialog usages, not new absolute-positioned overlays.
This source distinction avoids misreporting every grep hit as a
violation. The separate UI/Forms owners must resolve non-hidden raw
buttons/checkboxes in the TPO client components if the global strict
form audit requires that; chat-19 will not modify their work.

**Important scope and reproducibility disclaimer:** These are
exhaustive **GitHub remote-content** regex scans of the two directories,
not an executed local `git grep`, and not an exhaustive check of
every `src/app` file. The full-checkout script
`node scripts/audit/chat19-shell-grep.cjs --markdown` must still be
run on the final branch SHA and its exact output recorded. B3/B4
remain unticked.

**Responsive proof for the found intended footer:** the unique TPO
nav in `src/components/tpo/tpo-mobile-footer.tsx:32` has
`md:hidden`, and `legacy-mobile-footer.css:27-34` supplies
fixed 64px + safe-area, #fff surface, #f1f4f9 border and upward
0 -2px 8px shadow below 768px. It cannot create a second desktop bar
at 768/1024/1280px. The `ShellMobileFooter` import path is an
explicit re-export, not independent nav markup. This is source
breakpoint proof, not a rendered comparison.

### Final source regression sweep: TPO More sheet and legacy guard suites

The five-label TPO footer remains the single implementation in
`src/components/tpo/tpo-mobile-footer.tsx`, re-exported by the shell.
On the old phone layout (≤767px) the bottom bar stays fixed with the
five original labelled SVGs and safe-area height, while vNext retains
its owner-approved More `BottomSheet` destinations. A responsive
state bug is corrected: opening More and then using browser Back,
programmatic navigation, or resizing to tablet could previously leave
the open modal over unrelated content.

| State/property | Original production source | vNext source | Result |
|---|---|---|---|
| Five icons, ordering | `lms2-fe/prod-2026/MobileFooter.jsx:175-191`: Home/Engage/Drives/Students/More | `tpo-mobile-footer.tsx:11-17`: same names/artwork | Source match; vNext hrefs intentionally renamed |
| TPO footer fixed height | `components___antddesign.scss:912-936`: 64px + safe inset | `legacy-mobile-footer.css:27-34`, `tpo-mobile-footer.tsx` fixed nav | Source match |
| Touch icon 24px, labels 10px | `MobileFooter.jsx:179-191`, `mobileFooter.scss:23-40` | `tpo-mobile-footer.tsx` 24px SVGs; `legacy-mobile-footer.css:36-45` | Source match |
| Phone only | Original `d-md-none`: visible through 767px | `tpo-mobile-footer.tsx`: `md:hidden` | Source match |
| More sheet, client content | Original More is a link to `/tpo/more` | vNext `BottomSheet`, preserved approved TPO destinations | **Intentional behavior difference**, B4 not fully equivalent |
| Route change while More open | Original link navigated away | `tpo-mobile-footer.tsx`: `useEffect` observes pathname, closes More on commit; click closes too | Corrected modern modal state |
| Phone → tablet/desktop | Original `d-md-none` hides footer at 768px | `tpo-mobile-footer.tsx`: viewport change closes its More sheet; `md:hidden` hides bar | Corrected responsive behavior |
| Footer bottom clearance | Legacy route reserves 64px+safe area | `app-shell.tsx:124` applies `pb-24 md:pb-6` when TPO workspace available | Existing clearance preserved |

**Stale source-guard repairs:** `tests/unit/chat19-clone-sidebar-checkpoint.test.ts`
and `tests/unit/chat19-sidebar-hr-value-parity.test.ts` had retained
obsolete claims that the desktop page moves via hardcoded
`padding-left:96px/256px` and that mobile Drawer manually implements
`aria-modal`, Escape and Tab. The production implementation actually
uses a **relative flex sibling push** (`sidebar-legacy.css:6-25`)
and shared native `<dialog>` (`src/components/ui/drawer.tsx:32-44`).
Both source suites now check the real contract; no business or visual
runtime behavior was changed. `tests/unit/chat19-tpo-mobile-footer.test.ts`
adds source assertions for pathname and breakpoint sheet dismissal.
All tests are written but **not executed**.

**Responsive proof limits:** the legacy footer and drawer breakpoints
are compared for 320/360/390px phone versus 768/1024/1280px tablet/desktop.
The remote-source subtree scan covered 41 shell files and 127 TPO files,
but final checkout-wide `git grep` and rendered browser comparisons
remain open. **B3 [ ], B4 [ ]** remain unchanged.

### Chat-19 regression-file coverage: 27 suites

The entire 27-file `tests/unit/chat19*.test.ts(x)` inventory was
enumerated from the nontruncated GitHub tree and searched file by file
for five superseded shell assumptions: hardcoded content
`padding-left:96px/256px`, the old `w-[min(82vw,300px)]` drawer
class, raw `aria-modal="true"`/manual Escape handlers in
`mobile-navigation.tsx`, and outdated checklist strings.
The **only four remaining 256px references** are intentionally
*negative* regression assertions (`not.toContain`) in:
`chat19-clone-sidebar-checkpoint.test.ts`,
`chat19-north-star-legacy-sidebar.test.ts`,
`chat19-shell-sidebar-clone.test.ts` and
`chat19-sidebar-hr-value-parity.test.ts`.
No positive obsolete signatures remain in those 27 suites.
This proves the named source-grep predicates, not that all tests pass.

A paired source review confirmed both stale-value suites were updated
to inspect `src/components/ui/drawer.tsx` for native
`<dialog>` Escape/focus-return and `sidebar-legacy.css` for
96→256px flex-push. The single TPO More footer remains on one client
component, and its navigation/viewport cleanup is covered by
`chat19-tpo-mobile-footer.test.ts`. JSX closing tags in the changed
mobile footer and shared shell wrappers were re-read by source.

**No tests, build, lint, browser or checkout-wide `git grep` were run.**
Only confirmed remote-source findings are reported. Under the strict
tick rule, B3 and B4 remain **[ ]** until the owner executes the
generated ledger and verifies browser pixels and interactions.


## 2026-10-20 B3/B4 continuation: synced main, legacy rail corrections, 18 source files

**Branch safety:** `chatgpt/chat-19-b` was 0 commits ahead and 1,695 behind `main` (compare at `96efdcc5dcf3b3f7bc54a85ff033923e6ca06c84`); safely fast-forwarded only the lane branch. No other branch/HR-owned page was written. The following is a bounded **source** audit; it does not certify old/new browser pixels.

### Two source-value corrections, opening/hover/mobile state

| Property | Legacy source file:line / exact value | vNext file:line / exact value | Result |
|---|---|---|---|
| Admin menu item, normal/hover/active vertical inset | `docs/design/old-lms-shell.css:27-28`: admin menu `padding-top:12px; padding-bottom:12px`, min-height44 | `src/components/shell/sidebar-legacy.css:122-124`: same; previous base rule was 10px | Fixed; 12px in normal/hover/active |
| TPO/recruiter menu item, normal/hover/active inset | `docs/design/old-lms-shell.css:30-31`: `padding:10px 12px`, radius8, min-height44 | `sidebar-legacy.css:111`: `padding:10px 12px` retained outside admin-specific override | Still matches |
| Learner desktop right inset | `docs/design/old-lms-shell.css:24-25` + `legacy-styles/components___learn-layout.scss:516-521`: `$learn-s2 = 16px` at ≥768 | `src/components/shell/sidebar-legacy.css:25`: `padding-right:16px` at ≥768 | Fixed; 96→256 border-box width unchanged |
| Explicit visual-role choice | Legacy `.admin-sidebar-panel` and `.learn-layout` style by account; not by arbitrary destination | `sidebar-nav.tsx:58-96`: derives visual skin from **visible role rows** | Super Admin overview at /dashboard gets admin rules; College Admin /tpo/home shortcut keeps college rules |
| Rail collapsed/hover width and easing | `old-lms-shell.css:13,18`: 96→256px, .15s cubic-bezier(.2,0,0,1) | `sidebar-legacy.css:10-12`: same | Unchanged |
| Phone drawer dimensions | `components___antddesign.scss:305-359`: 82%, max300, visible text | `sidebar-legacy.css:201`, `mobile-navigation.tsx:39` | Still matches, tablet conversion at 768 |

### 18-file complete scoped source review

Each listed file was fetched in full from `chatgpt/chat-19-b`, and its control/overlay literal occurrences were counted directly in the returned source. This is a **per-file connected-source scan**, **not** an executed checkout `git grep`; results are not evidence that all remaining `src/app`/TPO component code is clean. No other lane's ownership was altered.

| File checked | Legacy property reference | Current vNext source anchor | State, breakpoints and scoped grep counts |
|---|---|---|---|
| `src/components/shell/app-shell.tsx` | `old-lms-shell.css:13,18,22` | `app-shell.tsx:76` | Flex-push, footer box, sidebar hidden at ≤767 via md:flex; raw control openings **0**, direct dialog/overlay tokens **0** |
| `src/components/shell/sidebar-nav.tsx` | `old-lms-shell.css:27-53` | `sidebar-nav.tsx:96` | One role-scoped navigation for phone and desktop; raw control openings **0**, direct dialog/overlay tokens **0** |
| `src/components/shell/sidebar-legacy.css` | `old-lms-shell.css:13-53; learn-layout.scss:516-521` | `sidebar-legacy.css:25` | 96→256 hover/focus desktop; learner right inset; 82vw phone drawer; raw control openings **0**, direct dialog/overlay tokens **0** |
| `src/components/shell/shell-model.ts` | `docs/audit/legacy-copy-A.md; old-lms-shell.css:49-53` | `shell-model.ts:45` | Account-route keys and legacy section grouping; raw control openings **0**, direct dialog/overlay tokens **0** |
| `src/components/shell/shell-nav-icons.tsx` | `old-lms-shell.css:12,34-35` | `shell-nav-icons.tsx:3` | 38×36 SVG rail mark, 20px glyphs; raw control openings **0**, direct dialog/overlay tokens **0** |
| `src/components/shell/legacy-ant-paths.ts` | `old-lms-shell.css:34-35` | `legacy-ant-paths.ts:6` | SVG paths are fixed size-independent artwork; raw control openings **0**, direct dialog/overlay tokens **0** |
| `src/components/shell/legacy-sidebar-active-model.ts` | `old-lms-shell.css:45-46` | `legacy-sidebar-active-model.ts:4` | Legacy teal state selected by route for phone and desktop; raw control openings **0**, direct dialog/overlay tokens **0** |
| `src/components/shell/shell-counts-model.ts` | `old-lms-shell.css:39-40` | `shell-counts-model.ts:12` | Collapsed .72 bubble and expanded position styled in CSS; raw control openings **0**, direct dialog/overlay tokens **0** |
| `src/components/shell/mobile-navigation.tsx` | `components___antddesign.scss:305-359` | `mobile-navigation.tsx:39` | 82vw/max300 phone drawer; closes on viewport ≥768; raw control openings **0**, direct dialog/overlay tokens **0** |
| `src/components/shell/tpo-mobile-footer.tsx` | `components___antddesign.scss:912-936` | `tpo-mobile-footer.tsx:4` | Re-export avoids second TPO bottom nav; raw control openings **0**, direct dialog/overlay tokens **0** |
| `src/components/shell/route-progress.tsx` | `components___common.scss:1008-1019` | `route-progress.tsx:90` | Full-screen slow loader present; nonhistoric top bar open; raw control openings **0**, direct dialog/overlay tokens **0** |
| `src/components/shell/route-progress.css` | `components___common.scss:1008-1019` | `route-progress.css:35` | White fixed overlay, 4-dot Ant spin; novel 3px bar open; raw control openings **0**, direct dialog/overlay tokens **0** |
| `src/components/shell/route-transition.tsx` | `components___learn-layout.scss:49-86` | `route-transition.tsx:55` | Learner-only exit, path change, browser Back; no query remount; raw control openings **0**, direct dialog/overlay tokens **0** |
| `src/components/shell/route-transition.css` | `components___learn-layout.scss:49-86` | `route-transition.css:21` | 250ms entrance + 220/260ms exit, reduction opt out; raw control openings **0**, direct dialog/overlay tokens **0** |
| `src/components/shell/route-announcer.tsx` | `No matching visual legacy rule (screen-reader only)` | `route-announcer.tsx:34` | Live route announcement, no painted footprint; raw control openings **0**, direct dialog/overlay tokens **1** |
| `src/components/shell/learner-faculty-mobile-footer.tsx` | `components___antddesign.scss:912-936` | `learner-faculty-mobile-footer.tsx:88` | Phone-only permitted-account link inventory; raw control openings **0**, direct dialog/overlay tokens **0** |
| `src/components/shell/legacy-mobile-footer.css` | `components___antddesign.scss:912-936` | `legacy-mobile-footer.css:13` | Phone 64px+safe area; hidden ≥768; raw control openings **0**, direct dialog/overlay tokens **0** |
| `src/components/shell/shell-widget-boundary.tsx` | `No matching visual legacy rule (failure-only)` | `shell-widget-boundary.tsx:10` | Only mounts retry/error when widget throws; raw control openings **0**, direct dialog/overlay tokens **0** |

**Source scan predicates and scope:** `<(button|select|input|textarea)(?=[ >\\n])` and `role="dialog"|fixed inset-0` on the 18 exact source paths above. Totals are **0 direct raw-control tag openings** and **1 direct hand-rolled overlay tokens** in this inspected scope. The sole native Drawer is imported from `@/components/ui/drawer`; actual overlay focus/escape is delegated to shared UI. `shell-nav-icons.tsx:3` imports `legacyAntPaths` from `./legacy-ant-paths`, and `legacy-ant-paths.ts:6` exports it.

**Responsive static proof:** 320, 360, 390, and 767px: `md:flex` keeps rail hidden and native Drawer uses max300px/82vw, with icon+labels visible and touch-scroll; the new admin/learner overrides are wrapped in `@media(min-width:768px)` and have no mobile effect. At 768/1024/1280px the rail remains a relative flex sibling, pushing content from 96 to 256px on hover/focus in .15s, learner right padding is 16px, admin block padding 12px, and ordinary TPO/recruiter menu padding 10px. Phone footer remains 64px+safe-area and hidden at tablet sizes; route entrance/exits are reduced-motion aware. These are **source-rule proofs**, not browser screenshots.

**Remaining strict tick prerequisites:** run `node scripts/audit/chat19-shell-grep.cjs --markdown` on the final checkout and retain its command-level complete-tree output; verify historical icon glyphs, actual desktop expanded/collapsed canvas x and 320/768/1024px drawer in a real browser; confirm historic TPO More interactions, Ant spin rendering, and the nonlegacy 3px intent bar disposition. Accordingly, **B3 [ ] and B4 [ ] stay open**. The source-only test assertions are written but no tests, code, build, lint or CI were executed.
