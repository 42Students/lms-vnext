# Checkpoint B3–B4: old-LMS sidebar, footer and route motion

Owner: chat-19. Source: `docs/design/ui-clone-checklist.md:8-18`, `docs/design/old-lms-shell.css`, `docs/design/old-lms-shell-spec.md` and `docs/design/legacy-styles/`. The owner runs runtime/CI and screenshot comparison later; **none was run here**.

- [ ] **B3 Sidebar** (missing: command-level full-repository grep proof and exact historical icon/artwork equivalence; browser icon/hover/tablet verification is deferred to checklist J. See refreshed source-value and import evidence below.)
- [ ] **B4 Footer, progress and route transitions** (missing: authoritative old top route progress and TPO mobile footer visual values, exact full-page loader behavior, and command-level repository grep counts. Learner entrance/exit CSS values now match their provided legacy source.)

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
| Mobile body | `legacy-styles/components___antddesign.scss:348-359` top8, left/right12, bottom24+safe area | `mobile-navigation.tsx:35` shared Drawer viewport classes `!pt-2 !px-3 !bottom padding 24px plus safe area` | Source match |
| Mobile scroll | `legacy-styles/components___antddesign.scss:354-359` y-auto, x-hidden, touch inertia, hidden thumb | `drawer.tsx:55`, `scroll-cue.tsx:61-69`, `sidebar-legacy.css:213-219` | Source rules match |
| Reduced motion | `legacy-styles/components___learn-layout.scss:577-585` disables transitions | `sidebar-legacy.css:258-261` disables rail motion | Comparable intent; page motion below |

### Icon coverage

Source parse of `shell-model.ts:45-86,122-320`: **63 declared navigation rows / 61 unique destinations / 61 explicit route-to-icon mappings / 0 unmapped destinations.** `shell-nav-icons.tsx:2` imports `legacyAntPaths` from `./legacy-ant-paths`; `legacy-ant-paths.ts:1-4` exports it. All 12 referenced learner/faculty image URLs were individually present in the `public/assets/images/common/` GitHub directory at audit time. This proves the sources and missing-import regression guard, not old and new browser glyph equivalence.

## B4 value proof (legacy → vNext)

| Property / state | Old LMS file:line and value | vNext file:line and value | Status |
|---|---|---|---|
| Sidebar footer geometry | `old-lms-shell.css:22`: z2, margin-top auto, 25px 16px | `app-shell.tsx:86-99`, `sidebar-legacy.css:235` | Geometry match; copy unverified |
| TPO bottom mobile footer | No comparable values in `old-lms-shell.css:1-101` | `src/components/tpo/tpo-mobile-footer.tsx:14-47`, shell re-export | Open: no exact reference |
| Top route progress bar | No matched timing/colour spec in `old-lms-shell.css:1-101` nor matched `nprogress` in the indexed legacy sources | No dedicated progress bar added | Open: do not fabricate |
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

**Next file:** `src/components/shell/route-transition.tsx` (route completion/back-forward/recovery behavior, then review missing progress-bar reference).


## 2026-10-19 continued turn: evidence and current exceptions

**Main synchronization:** fast-forwarded branch `chatgpt/chat-19-b` to origin/main commit `55a3efe0a5917631ab26e17e158a29f6e5282e25` before editing. Later pushes use only the lane branch.

**Import verification (source tree, not a build):** GitHub tree at main SHA `55a3efe0a5917631ab26e17e158a29f6e5282e25` listed 15,670 repository entries. All **36** `src/components/shell/**/*.ts(x)` or CSS files were read, and **135 relative or `@/` imports** resolved to entries in that tree; **0 missing**. Forty-seven bare-package imports were identified but not dependency-compiled. `shell-nav-icons.tsx:3` explicitly imports `legacyAntPaths` from `./legacy-ant-paths`; the named module exports it.

**Scoped source scans (all 36 shell source/style files, equivalent regex checks, not actual `grep` runs):** raw `<button`, `<input`, `<select`, `<textarea` tags = **0**; `lms-desktop-sidebar|fl-d-panel-l|lms-sidebar-item` text hits = **50**. The 60 literal colour codes include exact legacy-brand SVG paths and shared topbar CSS owned by chat-13; they are not a finding of 60 unapproved colours. GitHub indexed code search on main returned **2** files for `lms-desktop-sidebar` (app-shell, sidebar-legacy.css), **1** for `fl-d-panel-l` (sidebar-legacy.css comment), and **2** for `lms-sidebar-item` (sidebar-nav.tsx, sidebar-legacy.css); indexed discovery is not a complete local working-tree grep.

**Mobile breakpoint proof:** at ≤767px, `app-shell.tsx:75` hides desktop rail; `mobile-navigation.tsx:33-36` uses the shared native-dialog Drawer; `sidebar-legacy.css:187-225` forces legacy 82vw max300 width, header 52px + top safe area, 10/16/4/10px header insets, 44px close target and hidden, touch-inertial scroll; `mobile-navigation.tsx:35` restores 8px top, 12px horizontal, 24px + safe-area bottom padding. At ≥768px, `app-shell.tsx:75` shows 96px rail and `sidebar-legacy.css:6-25` expands on hover/focus to 256px by flex push; the same applies at tablet 768–1199px. Actual viewport screenshot parity is deferred to J.

**B4 source status:** `old-lms-shell.css:1-101` defines no top progress strip. Indexed legacy SCSS searches for `nprogress`, `progressbar`, and `progress-bar` returned 0 hits. The known full-page loader remains `components___common.scss:1008-1019` (fixed white .99, z-index 999), which is different from current route-local skeletons. Do **not** invent a loader colour, progress timing, spinner or unsupported equivalence. `src/components/tpo/tpo-mobile-footer.tsx` now visibly marks the More parent active when a More destination is current; its exact historical TPO footer values remain unproven.

**STRICT TICK RULE outcome:** B3 and B4 remain **unticked**. The source comparisons and scoped counts above are useful progress but do not substitute for the checklist's command-level `grep` output and unmatched footer/loading values. Do not report a visual clone without the later browser pass.

**Next file:** `src/components/shell/sidebar-legacy.css` — resolve remaining geometry/scroll discrepancies after a checkout-based grep; then `src/components/tpo/tpo-mobile-footer.tsx` for historical footer metrics when a source is found.
