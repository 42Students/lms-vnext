# Checkpoint B3–B4 · Sidebar, footer and route transitions

Owner lane: **chat-19**. Source-of-truth: `docs/design/ui-clone-checklist.md`, **STRICT TICK RULE** (lines 8–14). Branch `chatgpt/chat-19-b`. Source comparison only; no browser/CI.

- [ ] **B3 sidebar** (missing: full-state/source-value parity, repository-wide coverage proof, and responsive source discrepancies listed below; no runtime screenshot is claimed).
- [ ] **B4 footer, route progress bar and transitions** (missing: legacy progress-bar specification, verified footer parity, route loading/transition coverage and all transition states).

## B3 measured properties (source-value comparison)

| State / property | Legacy value with source | vNext value with source | Result |
|---|---|---|---|
| collapsed width | 96px — `old-lms-shell.css:13` | 96px — `sidebar-legacy.css:8-9` | Equal |
| expanded width | 256px on hover — `old-lms-shell.css:18` | 256px on hover/focus — `sidebar-legacy.css:17` | Hover matches; extra focus state |
| width animation | 0.15s cubic-bezier(.2,0,0,1) — `old-lms-shell.css:13` | 0.15s cubic-bezier(.2,0,0,1) — `sidebar-legacy.css:14` | Equal |
| opacity animation | 0.15s cubic-bezier(.2,0,0,1) — `old-lms-shell.css:13` | 0.15s cubic-bezier(.2,0,0,1) — `sidebar-legacy.css:14` | Equal |
| content push | legacy panel relative flex — `old-lms-shell.css:13` | fixed panel + page padding 96→256 — `app-shell.tsx:74-97`, `sidebar-legacy.css:19-24` | Similar result, different layout mechanism; **not proof of exact parity** |
| white background | rgb(255,255,255) — `old-lms-shell.css:13` | #fff — `sidebar-legacy.css:11` | Equal |
| right border | 1px rgb(241,244,249) — `old-lms-shell.css:13` | 1px #f1f4f9 — `sidebar-legacy.css:12` | Equal |
| scroll body padding | 8px 0 16px — `old-lms-shell.css:21` | pt-2 pb-4 — `app-shell.tsx:81` | Vertical match; horizontal wrapper differs |
| footer | z-index 2, margin-top auto, padding 25px 16px — `old-lms-shell.css:22` | role details z-index 2, margin-top auto — `sidebar-legacy.css:225`; py25/px16 — `app-shell.tsx:84` | Equal specified values, footer content not proved identical |
| link height | 44px min — `old-lms-shell.css:30` | 44px min — `sidebar-legacy.css:101` | Equal |
| link margin | 6px bottom — `old-lms-shell.css:29` | 6px bottom — `sidebar-legacy.css:102` | Equal |
| link corner | 8px — `old-lms-shell.css:30` | 8px — `sidebar-legacy.css:108` | Equal |
| link padding | 10px 12px — `old-lms-shell.css:30` | 10px 12px — `sidebar-legacy.css:107` | Equal |
| focus outline | 2px rgba(38,186,199,.45), offset −2 — `old-lms-shell.css:31` | same — `sidebar-legacy.css:125-128` | Equal |
| icon | 24px box, opacity .55 — `old-lms-shell.css:33` | 24px, .55 — `sidebar-legacy.css:129-140` | Equal CSS; asset/version proof remains |
| icon artwork | legacy Ant outlined 20px — `old-lms-shell.css:34-35`, `legacy-copy-B.md` TPO nav | 20px, upstream path set — `shell-nav-icons.tsx`, `legacy-ant-paths.ts` | No version/screenshot proof |
| label | 15px/20px — `old-lms-shell.css:32` | 15px/20px — `sidebar-legacy.css:149-150` | Equal |
| active | #eff8fa, inset 3px #26bac7 — `old-lms-shell.css:45-46` | same — `sidebar-legacy.css:119-124` | Equal |
| hover | rgba(38,186,199,.07), #1a95a1 — `old-lms-shell.css:47-48` | same — `sidebar-legacy.css:115-118` | Equal |
| badge collapsed | top 4px, left 50%, margin 5px, scale .72 — `old-lms-shell.css:38` | same — `sidebar-legacy.css:69-76` | Equal |
| badge expanded | static, margin-left auto — `old-lms-shell.css:39` | same — `sidebar-legacy.css:77-81` | Equal |
| headings | height 18px, margin 7px 12px 4px, .105em, weight 750 — `old-lms-shell.css:50` | same — `sidebar-legacy.css:168-180` | Source values match, collapsed computed font differs |
| divider | 22px hairline #f1f4f9 — `old-lms-shell.css:51` | same — `sidebar-legacy.css:56-61` | Equal |
| TPO hover scroll | thin, 4px rgba(107,114,128,.28) — `old-lms-shell.css:41-43` | same — `sidebar-legacy.css:230-246` | Equal for hover |
| logo | 38×36px image — `old-lms-shell.css:12` | 38×36px inline logo — `shell-nav-icons.tsx`, `app-shell.tsx:78` | Size matches; source artwork/browser rendering not independently proved |
| desktop responsive | hidden ≤767px — `old-lms-shell.css:23` | desktop `md:flex` ≥768px — `app-shell.tsx:74` | Equal breakpoint |
| mobile drawer | width 82%, max 300px — `legacy-styles/components___antddesign.scss:305-308` | min(82vw,300px) — `mobile-navigation.tsx` | Width matches intended sizing; browser proof pending |
| mobile drawer body | 8px top, 12px horizontal, 24px + safe area bottom — `legacy-styles/components___antddesign.scss:348-359` | `mobile-navigation.tsx` and `sidebar-legacy.css:182-191` | Vertical/side values implemented; scroll states not visually verified |

## B4 evidence and remaining gaps

| Feature | Legacy source | vNext source | Strict status |
|---|---|---|---|
| sidebar role-details footer | `old-lms-shell.css:22` padding 25px 16px, z-index 2 | `app-shell.tsx:84-96`, `sidebar-legacy.css:225` | Layout values matched; actual content/copy unverified |
| mobile TPO footer | no footer metrics in `old-lms-shell.css:1-101`; legacy nav SCSS may be elsewhere | `src/components/tpo/tpo-mobile-footer.tsx` | **Unticked**; cannot invent reference |
| top route-progress line | no progress-bar values in `old-lms-shell.css:1-101` | no proved shell top loader | **Unticked**; cannot infer absent means parity |
| page overlay loader | `legacy-styles/components___common.scss:1008-1019` fixed, full viewport, z999, rgba(255,255,255,.99) | route-specific loading UI and `app-shell.tsx` | **Unticked**; not same shell behavior |
| learner entrance | `legacy-styles/components___learn-layout.scss:49-69` 8px→0 over 250ms ease-out | no proved page-enter class in shell | **Unticked** |
| learner transition | `legacy-styles/components___learn-layout.scss:71-86` 220ms opacity, 260ms transform, transition opacity .78, 6px scale .998 | `route-announcer.tsx` only announces and restores focus | **Unticked**; different behavior |
| reduced motion | `legacy-styles/components___learn-layout.scss:577-585` disable tab transition | `sidebar-legacy.css:248-251` disables rail transition | **Unticked**; page-level state not covered |

## Coverage and responsive grep ledger

These commands must be run on a complete checked-out tree, **and their actual numeric counts pasted before ticking**:

```sh
grep -RnlE 'lms-desktop-sidebar|fl-d-panel-l|lms-sidebar-item' src --include='*.tsx' --include='*.css'
grep -RnlE 'role="dialog"|fixed inset-0|fixed inset-x-0 bottom-0' src/components/shell src/components/tpo --include='*.tsx'
grep -RnlE 'progress|nprogress|pageSlideIn|is-route-transitioning' src/components/shell src/app --include='*.tsx' --include='*.css'
grep -RnlE '<button[ >]|<select[ >]|<input[ >]|<textarea[ >]' src/components/shell src/components/tpo --include='*.tsx'
grep -RnlE '#[0-9a-fA-F]{3,8}|rounded-(lg|xl|md)' src/components/shell --include='*.tsx' --include='*.css'
```

**Counts:** not available from a complete local checkout in this connector-only session; **coverage proof fails**, so neither item is ticked. Source scoped inspections are recorded separately below; do not call them repository-wide greps.

## JSX and responsive verification limits

Review the exact source opening/closing names for every edited JSX component. No CI, typecheck, build or browser was run per owner instruction. Phone, tablet, desktop are compared by rules (`max-width:767px`, `min-width:768px`), not with screenshots. Section J later owns visual side-by-side checks.
