# Lane chat-2 — E7 tiles, funnels, progress, charts, calendar and board clone audit

Owner goal: vNext looks like a **new module inside the old LMS**, without changing page content, wording, metrics, routes, or behaviour. Owner: chat-2. Branch: `chatgpt/chat-2-b`. Initial comparison baseline: `main@f12ea67bdc18d3caeadc47890e5d0e73f158c7c7`; this turn fast-forwarded `chatgpt/chat-2-b` to `main@d915bd67b20838f496d2a5b25b4365e748a35dd5` before the source edits (2026-10-19). Source references are checked against `docs/design/legacy-styles/`, not inferred from vNext.

## Strict checklist (no premature completion)

- [ ] E7 stat tiles (missing: coverage of every portal; existing call sites may hand-roll tiles; exhaustive hover/focus/mobile property table and repository-wide grep).
- [ ] E7 funnel and summary strips (missing: exact values for every legacy arrow, amber in-between pill, labels, hover/focus and all portals; entire source inventory and zero hand-rolled count).
- [ ] E7 progress bars (missing: all call sites and states; stacked/multiseries proportions, bounds and accessibility need whole-repo review).
- [ ] E7 charts, axes, tooltips and legends (missing: legacy chart SCSS/real-page axis/legend/tooltip measurements; visual and responsive parity evidence, zero hand-rolled chart count).
- [ ] E7 calendar/month/week/day grid (missing: calendar colour, weekday/Sunday treatment, disabled/focus/selected/time-line states; all portal calendar instances and tablet/phone proof).
- [ ] G6 kanban/board views (missing: every board, card, drag/drop, keyboard/touch responsiveness; exact legacy column width and state comparison).
- [ ] Raw native select migration (missing: repository-wide native-case grep and migration of remaining call sites; GitHub search matches uppercase `<Select>` too).
- [ ] Raw long-class input/textarea migration (missing: complete source enumeration, field semantic exceptions and exhaustive valid JSX review).

No ticks claimed. Section J screenshot comparison belongs to the orchestrator and has **not** been done. No build, CI, test, linter or runtime execution.

## Exact value comparisons — checked subset

| Property and state | Old LMS (file:line) | vNext (file:line) | Result |
| --- | --- | --- | --- |
| Primary teal progress fill, default | `docs/design/legacy-styles/components___variables.scss:10` `$clrThird = #26bac7` | `src/app/globals.css:14` `--lms-primary: #26bac7`; `src/components/ui/metric-bar.tsx:37` consumes token | Match |
| Light-cyan progress track, default | `docs/design/legacy-styles/components___variables.scss:14` `$light-cyan = #9ee4e8` | `src/app/globals.css:24` `--lms-primary-light: #9ee4e8`; `src/components/ui/metric-bar.tsx:31` | Match |
| Card neutral border colour | `docs/design/legacy-styles/components___variables.scss:30` `$neutral-200 = #e5e9f0` | `src/app/globals.css:322` `--lms-canvas-border: #e5e9f0`; `src/components/ui/summary-strip.tsx:24` | Match |
| Metric number ink | `docs/design/legacy-styles/components___variables.scss:24` `$neutral-900 = #1a1d21` | `src/app/globals.css:27` `--lms-neutral-900: #1a1d21`; `src/components/ui/summary-strip.tsx:35` | Match |
| Metric caption ink | `docs/design/legacy-styles/components___variables.scss:27` `$neutral-500 = #6b7280` | `src/app/globals.css:29` `--lms-neutral-500: #6b7280`; `src/components/ui/summary-strip.tsx:40` | Match |
| Teal-tinted college stat background | `docs/design/legacy-styles/pages___admin-dashboard.scss:40-42` `$teal-subtle = #eff8fa` (resolved at variables:13) | `src/app/globals.css:23` `--lms-primary-subtle: #eff8fa`; `src/components/ui/stat-tile.tsx:29` college variant | Match |
| College stat border | `docs/design/legacy-styles/pages___admin-dashboard.scss:42` `1px rgba($clrThird,0.35)`, resolved teal `#26bac7` | `src/components/ui/stat-tile.tsx:29` `rgba(38,186,199,0.35)` border; `src/components/ui/stat-tile.tsx:28` 1px border | Match |
| College stat radius | `docs/design/legacy-styles/pages___admin-dashboard.scss:43` `8px` | `src/components/ui/stat-tile.tsx:29` `rounded-lg` (8px Tailwind default) | Match subject to Tailwind theme |
| College stat title colour/size | `docs/design/legacy-styles/pages___admin-dashboard.scss:45-47` `12px rgba(0,0,0,.45)` | `src/components/ui/stat-tile.tsx:23` `text-xs text-[rgba(0,0,0,0.45)]` | Match subject to Tailwind theme |
| College stat value weight/size/ink | `docs/design/legacy-styles/pages___admin-dashboard.scss:49-52` `16px / 600 / $neutral-900` | `src/components/ui/stat-tile.tsx:24` `text-base font-semibold text-[var(--lms-neutral-900)]` | Match subject to Tailwind theme |
| College stat mobile padding | `docs/design/legacy-styles/pages___admin-dashboard.scss:289-290` `12px 16px` under max-width767px | `src/components/ui/stat-tile.tsx:29` `p-3 sm:px-4 sm:py-3` applies 12px until sm (640px), then 12px/16px | **Mismatch at <=639px**; align with old after verifying responsive variant and card body |
| Calendar active day | `docs/design/legacy-styles/components___variables.scss:272` `#26bac7` | `src/components/ui/calendar-grid.tsx:15-23` does not set selected/active treatment; callers vary | Missing |
| Calendar Sunday | `docs/design/legacy-styles/components___variables.scss:273` `#ff7576` | `src/components/ui/calendar-grid.tsx:15-23` no Sunday slot/state; callers vary | Missing |
| Calendar border grid colour | `docs/design/legacy-styles/components___variables.scss:275` `#dddddd52` | `src/components/ui/calendar-grid.tsx:19` `--lms-canvas-border` = `#e5e9f0` | **Mismatch**; legacy value may be used by some page variants |
| Funnel layout | `docs/design/old-lms-pages.md:12-16` one border strip, large counts, arrows and small pills | `src/components/ui/summary-strip.tsx:20-45` border strip/counts/arrows/optional pills | Partial; exact count typography, arrow shape/gaps and amber note colours unproven |
| Board status columns | Legacy board values absent in supplied SCSS; must extract further from source/live reference | `src/components/ui/board-column.tsx:10-24` reusable 256/288px widths | Missing legacy value proof |
| Chart axes/legend/tooltip colours | Not specified in inspected variables/common SCSS; need original chart styles/live source | Existing chart renderers and `src/components/ui/metric-bar.tsx` | Missing |

The rows above cover inspected source properties only. **No claim** of exhaustive matching; hover, focus, active, disabled, loading, empty and mobile/tablet rules remain to be checked item-by-item.

## Shared primitives and migrated instances

Shared primitives added/extended: `src/components/ui/metric-bar.tsx`, `stacked-metric-bar.tsx`, `summary-strip.tsx`, `calendar-grid.tsx`, `board-column.tsx`, and backward-compatible `StatTile.variant="college"`.

- Stats/summary: `src/components/admin/college-dashboard-cards.tsx`, `src/components/placements/college-hiring-funnel.tsx`, `placement-report-ui.tsx`, `learner-placements-dashboard.tsx`, `src/app/(authenticated)/hr/calendar/page.tsx`.
- Progress and charts: `src/components/placements/report-bar-chart.tsx`, `college-hiring-funnel.tsx`, `src/components/tpo/tpo-company-memory-workspace.tsx`, `src/app/(authenticated)/admin/placements/analytics/page.tsx`, `hr/company/reports/page.tsx`, `hr/placements/jobs/[jobId]/page.tsx`, `learn/courses/[deliveryId]/progress/page.tsx`, `src/components/projects/project-workspace-readiness.tsx`, `project-admin-workspace-list.tsx`, `src/components/courses/learner-course-list.tsx`, `learner-quiz-attempt.tsx`, `faculty-course-home-signals.tsx`, `teacher/report/quiz/[quizId]/page.tsx`, `teacher/report/assignment/[contentId]/page.tsx`, `src/app/(authenticated)/tpo/batches/[batchId]/page.tsx`, `tpo/batches/page.tsx`.
- Calendar grids: `src/app/(authenticated)/teacher/calendar/page.tsx`, `learn/attendance/calendar/page.tsx`, `src/components/placements/learner-career-calendar.tsx`, `placement-calendar-workspace.tsx`.
- Boards: `src/components/projects/mentor-lane-board.tsx`, `learner-board-interactive.tsx`.
- Native controls: `src/components/placements/learner-career-calendar.tsx` date field, `src/app/(authenticated)/hr/calendar/page.tsx` date field, `src/components/academics/learner-class-schedule.tsx` searchable field and session-kind select.

## Coverage proof / grep commands

Strict command set required for final tick (not executed; only GitHub connector source reads were permitted in this lane):

```sh
grep -RnlE '<select[ >]' src --include='*.tsx' | wc -l
grep -RnlE '<input[ >]' src --include='*.tsx' | wc -l
grep -RnlE '<textarea[ >]' src --include='*.tsx' | wc -l
grep -RnlE 'overflow-hidden.*(h-2|h-3)|h-2.*overflow-hidden|h-3.*overflow-hidden' src --include='*.tsx' | wc -l
grep -RnlE 'grid-cols-7|w-72 shrink-0|w-64 shrink-0' src --include='*.tsx' | wc -l
grep -RnlE 'rounded.*border.*bg-.*p-[345]' src --include='*.tsx' | wc -l
```

Results: **NOT RUN — no checked-out repository or shell available to lane, therefore exact whole-source counts are unknown.** The GitHub code search for `<select` returned **401 TSX candidate files**, but GitHub search is case-insensitive and matches `<Select` as well; **401 is NOT a raw-native count**. Individual connector-backed JSX source inspections verified `<CalendarGrid>` opening/closing pairs 1/1 in the four migrated pages and `<BoardColumn>` 1/1 in both migrated boards; not an exhaustive parser or regression test.

## Open / next source files

Continue E7 migration with `src/components/courses/learner-course-workspace.tsx`, `src/components/courses/faculty-course-home-signals.tsx` remaining distribution bar, `src/components/academics/learner-class-schedule.tsx` other grids, `src/components/projects/mentor-task-allocation.tsx`, `src/app/(authenticated)/hr/calendar/page.tsx` seven-day grid, and all chart/legend/calendar callers. Then complete native `select/input/textarea` long-class source search, verify close tags, document concrete exemptions, and only tick after exhaustive proof.


## 2026-10-19 bounded turn — source edits, verified scope, and E8 dependency

No completion boxes above are checked. Every source write was committed directly to `chatgpt/chat-2-b` with a `[chat-2]` prefix. The branch had **0 unique commits / 1,453 commits behind main** before the fast-forward; the post-edit comparison observed **0 behind / 12 ahead** at the interim check. This is a connector-managed fast-forward plus remote file commits, not a local `git pull` or a tested build.

### Work queue (observed/next; repeat whole-repo grep when shell is available)
1. **Stat tiles — edited:** `src/components/courses/faculty-course-home-signals.tsx:100-126` (four links); `src/components/courses/admin-offering-learning-overview.tsx:400` (dynamic tile grid); `src/app/(authenticated)/learn/attendance/calendar/page.tsx:118` (four totals); `src/app/(authenticated)/mentor/reports/page.tsx:56,67` (two dynamic groups); `src/app/(authenticated)/mentor/team-coverage/page.tsx:112` (three team totals); `src/components/placements/college-drive-pipeline-overview.tsx:24-27` (nine linked stage tiles). All now render `StatTile` from `src/components/ui/stat-tile.tsx`; labels/counts/links and grid breakpoints preserved at each call site.
2. **Calendar — edited:** `src/components/academics/learner-class-schedule.tsx:638-669` renders a `CalendarGrid variant="hairline"` for its 42-day month, preserving grid children, day selection, event dots, and `role="group"`. `"use client"` is now the first statement in this file and `src/components/projects/mentor-task-allocation.tsx`. **Next calendar scope:** `src/components/placements/tpo-week-hour-calendar.tsx`, `src/components/academics/learner-class-schedule.tsx:699-774` (unreachable legacy month branch), `src/components/placements/placement-calendar-workspace.tsx`, recruiter/HR/teacher calendars. Week-hour grids are 8-column layouts and must not be replaced by a seven-day shell blindly.
3. **Forms — edited:** `src/components/tpo/tpo-draft-drive-step-one-form.tsx:91-132` (3 Select / 2 Input / 1 Textarea); `src/components/tpo/tpo-drive-request-actions.tsx`, `src/components/placements/tpo-request-decision-control.tsx`, `src/components/placements/learner-application-detail-withdraw.tsx` (4 shared Textareas); `src/components/placements/learner-placement-preferences.tsx` (3 Select / 3 Input / 3 Checkbox); `src/components/tpo/tpo-debar-control.tsx` (Input and Checkbox); `src/components/placements/learner-jobs-browse.tsx:125-196` (3 Select / 1 Input / 2 Checkbox). All edited native select closing tags were changed to `</Select>`; counts were source-checked per file. Hidden fields and form state were not intentionally changed.
4. **Remaining hand-rolled stat surface to inspect next:** `src/components/placements/learner-placements-dashboard.tsx:19-44` defines a custom linked Metric. It carries an explicit `aria-label` not supported by the current `StatTile` public props; migrate only without losing the accessibility contract. Then `src/components/placements/college-hiring-funnel.tsx:108-117` and remaining stat strips, followed by the chart legend/axis/tooltip inventory and all board calendar variants.
5. **Raw control candidate queue:** use the exact case-sensitive `<select([[:space:]]|>)`, `<input([[:space:]]|>)`, `<textarea([[:space:]]|>)` source greps (and close-tag grep) on the entire repository. Connector code search for `<select`, `<input` and `<textarea` capped results at **100 files per query** and is case-insensitive; it is **not** a native-tag count, full work queue, or coverage proof. Explicitly inspect `src/components/projects/admin-readiness-workspace-picker.tsx` (radio), `src/components/placements/tpo-delete-draft-action.tsx` (checkbox), `src/components/tpo/tpo-notice-undo-toast.tsx` (hidden field), `src/app/(authenticated)/hr/activity/page.tsx` (hidden fields), and other portal forms. Only native long-class controls are in scope; document hidden-field exemptions.
6. **E8 TPO/HR export parity — still open:** `docs/design/legacy-grid/` and `docs/design/legacy-grid/gridExport.js.txt` are **not present in the inspected current `main` tree** (directory read returned 404). Exact old export column names/order and `name - D MMM YYYY` filenames cannot be proven against that source. Once supplied, compare with `src/app/api/placements/tpo/students/export-xlsx/route.ts`, `src/app/api/placements/tpo/students/export/route.ts`, the TPO drives/applications export services, and HR exports. Do not infer schemas or tick E8.

### Additional source-level comparison rows (not exhaustive)

| Property/state | Legacy reference (file:line) | vNext reference (file:line) | Current observation |
| --- | --- | --- | --- |
| College card teal background | `docs/design/legacy-styles/pages___admin-dashboard.scss:40-42`; token at `components___variables.scss:13` = `#eff8fa` | `src/components/ui/stat-tile.tsx:28-29` `variant="college"` uses `--lms-primary-subtle` | Token match; does **not** prove all college page call sites |
| College card border/radius | `pages___admin-dashboard.scss:42-43` 1px teal 35% and 8px | `src/components/ui/stat-tile.tsx:28-29` `border-[rgba(38,186,199,0.35)]` and rounded-lg | Partial; Tailwind computed values and responsive padding still unverified |
| Generic summary-strip border | `components___variables.scss:30` `#e5e9f0`; `old-lms-pages.md:12-16` single bordered strip | `src/components/ui/summary-strip.tsx:20-28` uses `--lms-canvas-border` | Token match, visual geometry/notes still open |
| Learner month seven-column grid | `components___variables.scss:275` calendar `#dddddd52` | `src/components/academics/learner-class-schedule.tsx:638` shared `CalendarGrid`; `src/components/ui/calendar-grid.tsx:17-20` uses `--lms-canvas-border` | **Mismatch persists**; shared UI is owned by chat-17, no shared edits made here |
| Day selection/focus | `components___variables.scss:272-273` active teal and Sunday warning | `src/components/academics/learner-class-schedule.tsx:649-655` retains its own focus/selection classes | Exact selected/Sunday states unproven |
| Read-only progress fill | `components___variables.scss:10,14` teal and cyan | `src/components/ui/metric-bar.tsx:31-38` consumes same tokens | Token match, percent/aria and responsive states not exhaustive |

### Source-only validation limits
All modified JSX conversions used guarded exact-source matches; `<Select>` pairs were checked against `</Select>` in changed files, and the edited `<CalendarGrid>` opening and closing were checked 1/1. No application code, build, tests, lint, CI, browser screenshots, responsive renders, or whole-repo shell greps were run. No legacy grid export reference was invented. **E7, G6, native-control migration, and E8 remain unticked** until the strict proof conditions are met.


## 2026-10-19 bounded turn 2 — E7 surfaces and E8 filename suffix

### Git sync and verified writes
- At turn start `chatgpt/chat-2-b` was **0 ahead / 1,044 behind** `main@46cd0161a0e289e7da68e615359589b03ee463e9`; it was fast-forwarded to that main SHA (connector ref operation, equivalent of pulling fast-forward only). No writes were made to `main`.
- After 36 separate `[chat-2]` commits, GitHub compare was **36 ahead / 113 behind** because other lanes advanced main while this turn ran. Do not describe the branch as rebased on the *latest* moving main until the next pull/merge. No CI or application was run.
- `src/components/ui/*` was not modified. The codemod owns raw-control sweeps; do not redo their already handled instances.

### E7 value-by-value observations, not completion
| Legacy property / state and source | vNext property / state and source | Verdict |
| --- | --- | --- |
| TPO list and report strips: one bordered summary with counts/captions, `docs/design/old-lms-pages.md:12-16` | `src/components/placements/college-hiring-funnel.tsx:109-117` now uses `SummaryStrip`, whose border is `src/components/ui/summary-strip.tsx:20-28` | Structural match; exact font, spacing, arrows and mobile remain open |
| Old border `#e5e9f0`, `docs/design/legacy-styles/components___variables.scss:30` | `src/components/ui/summary-strip.tsx:24` `--lms-canvas-border` | Token match |
| Old card neutral text `#1a1d21` and captions `#6b7280`, `docs/design/legacy-styles/components___variables.scss:24,27` | `src/components/ui/stat-tile.tsx:25-27`; `src/components/placements/learner-placements-dashboard.tsx:34-44` now composes `StatTile` | Token family match; exact label/value typography and hover unproven |
| Original linked placement metric had `aria-label` and internal route, `src/components/placements/learner-placements-dashboard.tsx` pre-turn custom `Metric` | `src/components/placements/learner-placements-dashboard.tsx:31-45` retains a labeled `Link` around shared `StatTile` | Source-checked accessibility naming and href preserved; responsive visual parity unproven |
| Legacy calendar grid active `#26bac7`, Sunday `#ff7576`, hairline `#dddddd52`, `docs/design/legacy-styles/components___variables.scss:270-275` | `src/components/placements/tpo-week-hour-calendar.tsx:147-158` now positions neutral `ghost` slot controls with borders; `src/components/ui/calendar-grid.tsx:17-20` uses `--lms-canvas-border` | Partial; Sunday/border value mismatch and calendar grid details unresolved |
| Legacy TPO weekly slot surface white with hairline separators, old-page table guidance `docs/design/old-lms-pages.md:7,12` | `src/components/placements/tpo-week-hour-calendar.tsx:147-158`: `absolute inset-x-0` hour hit zones, neutral ghost button, bottom border, hover tint, focus z-index | Source-only improvement; exact dimensions/hover focus and side-by-side not verified |
| Legacy mobile breakpoint 767px, `docs/design/legacy-styles/components___variables.scss:160-181` | `src/components/placements/learner-placements-dashboard.tsx:145-175` still grid `sm:grid-cols-2 xl:grid-cols-4`; TPO weekly uses horizontal scroll | **Missing** responsive equivalence; no phone/tablet proof |

**Next E7 queue:** `src/components/placements/learner-career-calendar.tsx` (Sunday, active day, calendar cell border and month/day responsiveness); `src/components/placements/placement-calendar-workspace.tsx` (week/day grid vs legacy), `src/components/projects/mentor-lane-board.tsx`, `src/components/projects/learner-board-interactive.tsx` (board card spacing, drag/drop and mobile), `src/components/placements/report-bar-chart.tsx` (axis, tooltip, legend), then remaining visual selectors across portals. Never tick charts without exact legacy chart sources.

### E8 export file conventions
- The old grid reference `docs/design/legacy-grid/gridExport.js.txt` remains absent from the current main tree. Therefore old column headers, order, sheet names, prefixes and source-defined filename base **cannot be declared matched**. The owner-provided filename **suffix requirement** `name - D MMM YYYY` is implemented; exact old export filename parity remains open.
- Added `src/modules/placements/grid-export-filename.ts:1-26` using `Intl.DateTimeFormat("en-GB")` with `timeZone:"Asia/Kolkata"`; e.g. a given 2026-10-19 IST instant produces `recruiter-report - 19 Oct 2026.csv`. Unsafe filesystem characters are stripped from the caller-provided base. No export data, filters, authorization, CSV escaping, Excel encoding, or column sequences were intentionally changed.
- **Route inventory inspected:** 9 `src/app/api/placements/recruiter/**/export/route.ts` and 23 `src/app/api/placements/tpo/**/export*/route.ts` (including students XLSX). 31 static filename routes now call `gridExportFilename`; the dynamic TPO Drives name is produced by `src/modules/placements/tpo-drive-list-export-service.ts:29-48`. `src/app/api/placements/tpo/settings/recruiter-grants/export/route.ts:25-33` handles both CSV and XLSX. This inventory excludes other export URL shapes or paths not matching the inspected route pattern.
- The downloaded name base for each route is preserved from its existing vNext literal; matching the **old** name is intentionally unverified without the grid reference. Sample: `src/app/api/placements/recruiter/reports/export/route.ts:27-29` uses `gridExportFilename("recruiter-report","csv")`; `src/app/api/placements/tpo/students/export-xlsx/route.ts:30-31` uses `gridExportFilename("tpo-students","xlsx")`. The export attachment headers keep quotes.
- **Still unticked:** `[ ] E8 exact columns, ordering, Excel sheet metadata and filenames` (missing: legacy `gridExport.js.txt`, verified grids, whole-tree grep, endpoint responses and browser download comparison). Confirm consumer expectations before changing any base names.

### Source-only integrity and remaining proof
- Guarded route edits required **exactly one** simple static attachment filename per route; the dual-format grants and dynamic drives exports were handled separately. Re-opened the learner metric, hiring summary strip, hour grid, grants and recruiter-report code after writes; all referenced components and JSX opening/closing tags in those excerpts are paired. No compilation, exhaustive parse, CI, actual downloads, comparison screenshots or responsive rendering.
- Strict checklist remains **unticked** for E7 tiles, funnel, progress, charts, calendar, G6 boards and E8. Re-run exhaustive repository greps at the first available checked-out source snapshot; the GitHub connector cannot substitute an all-source grep or a visual comparison.


## 2026-10-19 bounded turn 3 — recovered original legacy grid sources

**Sync:** Branch `chatgpt/chat-2-b` was 0 ahead / 553 behind and fast-forwarded to `main@5a2abb4bba7e3bcfcf7523ffde18a0346e3590ed` before editing. All subsequent commits are `[chat-2]` on the lane branch only, no application execution or CI. The requested copy `docs/design/legacy-grid/gridExport.js.txt` remains missing on main, but the original source is accessible at **`42Students/lms2-fe@prod-2026:src/components/tpo/grid/gridExport.js`** (blob `6a7d12cbed7bc6b73db853b0c8739f8bf11af593`), with `TpoGrid.jsx` (`b3b315d4c13e631df307f25800612ac78d5baa20`), `GridWorkspace.jsx` (`ed002a88f2ef1498396e0fc41496ae4df98abaad`), and the original SCSS. Earlier "not supplied" notes above are historical; do not treat them as a reason to infer any values.

### E7 exact legacy value comparisons — checked source subset

| Property and state | Original legacy source:line | This branch source:line | Source inspection verdict |
| --- | --- | --- | --- |
| Seven-day calendar selected/active ink | `lms2-fe/src/styles/components/_variables.scss:272` also mirrored in `docs/design/legacy-styles/components___variables.scss:272`: `#26bac7` | `src/components/placements/legacy-calendar-theme.module.css:21-24` current-day inset ring, `learner-career-calendar.tsx:241-246`, `placement-calendar-workspace.tsx:997-1016` | Exact colour; active-day **shape** and live screenshot still unproven |
| Calendar Sunday ink | `docs/design/legacy-styles/components___variables.scss:273` `#ff7576` | `src/components/placements/legacy-calendar-theme.module.css:17-20` and two caller weekday headers and date numerals | Exact colour; applied to the known month/week grids without changing schedule dates |
| Calendar hairline separator | `docs/design/legacy-styles/components___variables.scss:275` `#dddddd52` | `src/components/placements/legacy-calendar-theme.module.css:6-11` scoped grid override, `CalendarGrid variant="hairline"` on both calendars | Colour match, but row/cell density responsive proof outstanding |
| TPO recruiter board column width | `lms2-fe/src/styles/components/_tpo-crm.scss:203-214` flex/min/max all **260px** | `src/components/tpo/recruiter-board-theme.module.css:6-9`; recruiter board call site scoped with CSS module | Exact width on this board only; other project boards remain open |
| TPO recruiter board surface | `lms2-fe/src/styles/components/_tpo-crm.scss:217-225`: 1px `$tpo-line=#e7ecf2`, radius 13px, `$tpo-surface-soft=#f8fafc`, no shadow | `src/components/tpo/recruiter-board-theme.module.css:10-15` | Exact values, no live computed-style proof |
| TPO recruiter board header | `lms2-fe/src/styles/components/_tpo-crm.scss:227-230`: min-height 46px, horizontal padding 12px, border `#e8edf3`, fill `#f4f7fb` | `src/components/tpo/recruiter-board-theme.module.css:18-23`; heading carries class without reordering existing description | Paint/height matched, legacy Ant Card DOM differed |
| TPO recruiter lead card | `lms2-fe/src/styles/components/_tpo-crm.scss:239-248`: hairline 1px, radius 10px, white, no shadow | `src/components/tpo/recruiter-board-theme.module.css:24-30` | Exact paint; hover and state still need full comparison |
| TPO board horizontal scroll | `lms2-fe/src/styles/components/_tpo-crm.scss:1390-1393`: scroll confined within board | `src/components/tpo/recruiter-leads-workspace.tsx:1061`: `overflow-x-auto` region | Source-level behavior aligned, visual/mobile not proven |

### E8 recovered grid-export contract — exact differences
| Contract | Old source | Current vNext | Status |
| --- | --- | --- | --- |
| Which rows | `lms2-fe/src/components/tpo/grid/TpoGrid.jsx:100-118`: shown in filtered/sorted order or selected shown nodes | `src/components/tpo/grid/grid-workspace.tsx:85-93`: authorized page `rows`, or `selectedPage` | **Partial**: vNext has paginated rows; legacy sorted grid view may differ |
| Which columns | `TpoGrid.jsx:103-112`: visible displayed columns plus `context.exportAlways` even when hidden, excluding selection checkbox | `src/modules/placements/tpo-grid-model.ts:11-44` new `exportAlways` property/helper; `grid-workspace.tsx:86,132,144` uses same list for CSV and TSV copy | **Partial**: hidden required columns supported; drag reorder/other layouts still unverified |
| Student Batch and Branch | `lms2-fe/src/pages/tpo/students/index.js:163-166` marks Batch + Branch `exportAlways:true`, hidden with single filter | `src/components/tpo/tpo-students-spreadsheet.tsx:31-32` now explicitly marks both required | Exact hidden-column rule for these two, but vNext default student column names/order differ |
| Student default headings | `lms2-fe/src/pages/tpo/students/index.js:158-195` begins Student / Roll no. / Batch / Branch / Stage / After college / Profile | `src/components/tpo/tpo-students-spreadsheet.tsx:27-75` currently begins Student / Student number / Branch / Batch / Stage / ... | **MISMATCH** — do not tick E8 columns/ordering |
| Cell formatting | `lms2-fe/src/components/tpo/grid/gridExport.js:8-35` supports boolean Yes/No, dates, lists and object label/name/title; exact displayed values preferred | `src/modules/placements/tpo-grid-model.ts:55-60` accepts scalar read values and protects spreadsheet formula prefixes | **Partial**; value render and type parity not proved |
| File name for legacy grid | `lms2-fe/src/components/tpo/grid/gridExport.js:33,39-58`: `safeName(exportName).xlsx` / `.csv` — **no automatic date suffix in this specific original file** | `src/components/tpo/grid/grid-workspace.tsx:136` and `src/components/tpo/recruiter-leads-workspace.tsx:423` call `gridExportFilename(name, extension)` yielding `name - D MMM YYYY.ext` | **CONFLICT / OPEN**: this follows the owner's separately specified filename pattern, but is *not literal* parity with the inspected historical `gridExport.js`. Do not declare both matched |
| Legacy defaults | `lms2-fe/src/components/tpo/grid/GridWorkspace.jsx:144-151`: `exportName || "export"`; TPO Students `exportName="students"` at `src/pages/tpo/students/index.js:274-276` | `src/components/tpo/grid/grid-workspace.tsx:52` defaults `exportName="export"` | Base-name match for default, but old file suffix differs |
| Safety | `lms2-fe/gridExport.js:38-64` Excel writer creates numeric/date-typed cells; CSV browser helper `tpoFiles.js:120-132` emits BOM and CRLF | vNext `exportTpoGridCsv` emits BOM in workspace Blob, CRLF, neutralizes formula-like strings; its XLSX export implementation differs | Not fully proven and should not weaken current safe escaping |

**E8 remaining:** Compare *every* TPO Students, Recruiter leads, Drives and HR grid column with the matching `prod-2026` page definitions; check dynamically shown/reordered headings, `exportAlways` and formatted values, selected-row order, Excel numeric/date types, backend downloadable report schemas, and name/suffix conflict with the owner. The originally requested copied fixture is absent; use the recovered original sources with exact file:line. Do not change page content to force export parity; reconcile export-only adapters separately.

### Source-only validation and next work
All edited source files were fetched again after writing and inspected for the relevant imports, classes, paired `<CalendarGrid>` tags (both grids 1/1), `exportColumns` usages, hidden-column flags and stray quote patterns; no suspicious quote before `className` found in inspected files. No TypeScript/build/test/CI/browsers and no whole-repo shell greps were run. Consequently **0 new strict ticks**, although the source subset above has exact values. Next file: `src/components/placements/report-bar-chart.tsx` (E7 axes, chart fill, tooltip and legend), then `src/components/projects/mentor-lane-board.tsx` (board widths and keyboard/phone), then the E8 column adapters.

## 2026-10-19 one-hour sprint — E7 chart values and E8 grid contracts

### Source-verified work this sprint (no runtime)
- Started with lane **0 ahead / 263 behind**; fast-forwarded `chatgpt/chat-2-b` to `main@3a77aebd651756d5a16b9fea375ffc276fa4404b`. The integration branch continued moving afterward. Every subsequent commit uses `[chat-2]` and targets the lane branch; GitHub Contents API commits each write remotely, with no CI, tests or app execution.
- Chart axis/paint: `src/components/placements/report-bar-chart.module.css` and `report-bar-chart.tsx` now mirror `lms2-fe@prod-2026/src/styles/components/_tpo-reports.scss:429-483,600-605`: first axis **minmax(120px,180px)**, track **1fr**, value **52px** with **10px** gaps, label **12px / 600 / #44536a**, value **12px / 650 / #334155**, track **11px / #e7ecf2**, fill **#26bac7** (2px minimum only when positive), and <=767px axes **minmax(82px,110px) / 1fr / 42px**, gap **7px**. The existing `MetricBar` keeps its aria meter semantics; the original chart contains no separate plotted numeric ticks/legend/tooltip controller, so none were invented. Inline labels use `title` for truncated names; no visual comparison run.
- TPO company bars: `src/components/tpo/legacy-company-bar.module.css` and `tpo-company-memory-workspace.tsx` apply the original `linear-gradient(90deg,#9ee4e8,#26bac7)` from `lms2-fe/src/styles/components/_tpo-intelligence-light.scss:346-348`. Fixed missing `MetricBar` import by source inspection.
- HR recruiter funnel: `src/components/hr/recruiter-report-funnel.module.css` and `src/app/(authenticated)/hr/company/reports/page.tsx` use `lms2-fe/src/styles/components/_recruiter-v2.scss:150-163`: **110px / 1fr / minmax(120px,auto)** with **12px** gap, <=860px **90px / 1fr** with number below, maintaining values/MetricBar.
- Seven-day grids: scoped legacy Sunday colour `#ff7576` and hairline `#dddddd52` from `docs/design/legacy-styles/components___variables.scss:273,275` on `src/app/(authenticated)/teacher/calendar/page.tsx`, `learn/attendance/calendar/page.tsx`, `hr/calendar/page.tsx` and `src/components/academics/learner-class-schedule.tsx`. Existing `CalendarGrid` opening/closing tags preserved, Sunday determined in UTC noon only for calendar-date labeling. No event/URL/IST semantics intentionally changed.
- `src/components/placements/college-hiring-funnel.tsx` no longer wraps the one shared SummaryStrip in a second bordered card: `docs/design/old-lms-pages.md:8` calls for a single bordered funnel strip.

### E8 — original fixture restored from source (not the missing copied docs directory)
- **Legacy source:** `42Students/lms2-fe@prod-2026/src/components/tpo/grid/gridExport.js:36-64`, `TpoGrid.jsx:102-115`, `GridWorkspace.jsx:144-151`; TPO Students `src/pages/tpo/students/index.js:158-196,274-276`; recruiter leads `src/pages/tpo/recruiters/index.js:363-416,475-478`; recruiter frontend styling at `src/styles/components/_recruiter-v2.scss:150-163`.
- **Original filename conflict resolved for grid downloads:** `gridExport.js` uses `safeName(name).csv/.xlsx`, without a date. Earlier lane implementation dated *all* downloads, following the separate owner phrase `name - D MMM YYYY`. We now preserve BOTH distinct conventions: `legacyGridExportFilename` in `src/modules/placements/grid-export-filename.ts` replicates the original grid sanitizer (bad characters -> `-`, existing `.csv/.xlsx` stripped, 80-char cap) and `gridExportFilename` remains for newer report APIs. Applied original basename/format to `src/components/tpo/grid/grid-workspace.tsx`, `tpo-students-spreadsheet.tsx`, `recruiter-leads-workspace.tsx`, `tpo-companies-spreadsheet.tsx`, `src/app/api/placements/tpo/students/export/route.ts`, `export-xlsx/route.ts`, and `src/modules/placements/tpo-drive-list-export-service.ts`. Exact TPO grid names now include `students.csv/.xlsx`, `recruiter-leads.csv/.xlsx`, `companies.csv`, `drives-<view>.csv`; newer non-grid report paths still carry dates. This is **not** a claim of every endpoint's filename parity.
- **Columns:** `src/modules/placements/tpo-grid-model.ts` uses source-ordered visible columns plus hidden `exportAlways` columns, excluding `exportOnly`. `GridWorkspace` uses the exact same selected export columns for CSV and TSV. `tpo-students-spreadsheet.tsx` labels `Roll no.`, and orders `Batch` before `Branch`, both `exportAlways`, as the legacy source. `src/modules/placements/tpo-students-xlsx.ts` now orders its selected headers using a canonical source sequence while preserving mandatory staff-only export fields. `src/modules/placements/tpo-recruiter-export-model.ts` reorders represented recruiter fields according to original `Contact / Status / Stage / Company / Email / Phone / Flags / Owner / Last activity / Next follow-up / Invite / Added / Source / Company drives` header order; its value projection was moved together.
- **Remaining mismatches / strict no-tick:** historical grid has Designation, Students placed, and some old formatted values with no verified present counterpart; vNext paginated exports need row/filter/sort parity checks; Excel native numeric/date types, headers for individual report endpoints, non-grid report filename expectation, actual export selection, safe formula escaping and real browser download must be verified. The legacy source can be read directly from `lms2-fe`, but `docs/design/legacy-grid/gridExport.js.txt` still does not exist on `main`.

### E7/E8 work queue / coverage
Source search observed `ReportBarChart` on seven TPO report pages, `MetricBar` across 17 placements/courses/projects pages, `StackedMetricBar` in two TPO batch pages, `CalendarGrid` on teacher, HR, learner attendance, learner class schedule and two placements calendars, `BoardColumn` in mentor and learner projects plus mentor task allocation, and separate recruiter stage board. Shared primitive files are owned by chat-17 and were **not** modified. Still open: source-by-source values/hover/focus/mobile for all 17 MetricBar instances; all boards' keyboard/touch behavior; report and HR Excel typed cells; full-row filtered/sorted views; whole-repo greps and phone/tablet screenshots.

**Strict checklist remains unchecked:** no computed-style report, no full repository checkout grep, no browser-side comparison, no actual CSV/XLSX download and no CI or runtime verification. Work is source-reviewed only.


### Final E8 roster alignment and remaining exceptions
- `src/components/tpo/recruiter-leads-workspace.tsx:67-85`, `src/modules/placements/tpo-recruiter-table-view-model.ts:1-7`, and `src/modules/placements/tpo-recruiter-export-model.ts:29-65` now use the legacy relative order of **all represented** Engage fields (Contact / Status / Stage / Company / Email / Phone / Flags / Owner / Last activity / Next follow-up / Invite / Added / Source / Company drives); Email, Phone and Added are hidden by default, matching `lms2-fe@prod-2026/src/pages/tpo/recruiters/index.js:363-416`. Previously saved visibility selections remain valid by key. **Not complete:** old `Designation` and `Students placed` headers are not available in this vNext export view; historical per-column formatted value contracts and layout states require parity verification.
- `src/app/(authenticated)/tpo/students/page.tsx` now uses `students.csv` on the filtered CSV link, matching `lms2-fe@prod-2026/src/pages/tpo/students/index.js:274-276`. `src/components/tpo/tpo-students-spreadsheet.tsx` uses the same base for selected/export-visible paths. The backend TPO students XLSX/CSV attachments were updated to that name, but the route-exported data schema is intentionally not changed without proving all fields against the old data projection.
- An additional source-only review of the edited JSX, CSS modules and backend filenames did not find any doubled quote before `className`, and each edited `<CalendarGrid>` had exactly one matching `</CalendarGrid>`. Shared Button/Select/Input/CalendarGrid/MetricBar implementations were not modified. **No CI or runtime verification.**


### TPO batch eligibility meter and chart content-preservation check
- `lms2-fe@prod-2026/src/styles/components/_tpo-batches.scss:2-6,39-42` uses **6px** track, `#e7ecf2` track fill, `#15803d` Eligible and `#b91c1c` Ineligible. `src/components/tpo/legacy-batch-eligibility.module.css` scopes those exact values to `StackedMetricBar` from `src/app/(authenticated)/tpo/batches/page.tsx` and `batches/[batchId]/page.tsx`; the detail page also fixes the prior Ineligible `warning` orange tone to `error`. Additional Not decided / Needs review segments belong to vNext content and are retained. Other stacked/proportional bar usages still need value proof; **do not tick E7 progress**.
- `src/components/placements/report-bar-chart.tsx` keeps the original vNext visible `{value} {units}` string in the new three-track layout (a source-review follow-up corrected the first draft, which had temporarily hidden units in a tooltip). The original TPO template is numerical only, but keeping vNext's on-screen units is the explicitly required non-content regression guard.


## 2026-10-19 next board batch — three complete source migrations

**Scope:** `src/components/projects/mentor-lane-board.tsx`, `learner-board-interactive.tsx`, and `mentor-task-allocation.tsx`. All three now consume `src/components/projects/legacy-project-board.module.css`. The shared `src/components/ui/board-column.tsx` remained unchanged; the CSS module overrides its lane sizes locally without changing its props. Data, filters, task details, links, selection, existing move/assign actions, and drag/drop handlers were preserved; a local drag-state flag provides the legacy hover-suppression and drop-target styling. The allocation file also restores a previously missing `BoardColumn` import.

### Value proof — original SCSS versus scoped CSS

| Property/state | Old LMS source and exact value | vNext source and exact value | Source result |
| --- | --- | --- | --- |
| Board layout and gap | `lms2-fe@prod-2026/src/styles/components/_learn-projects.scss:3953-59`: horizontal flex; gap `$space-3=12px`; x-scroll and 8px bottom pad | `legacy-project-board.module.css:7-13,95-99`: flex, gap 12px, x-scroll and 8px bottom pad | Match |
| Scrollbar/keyboard | `_learn-projects.scss:3960-69`: hidden Firefox/WebKit scrollbar; scroll retained | `legacy-project-board.module.css:95-104`: no scrollbar chrome; `mentor-lane-board.tsx:191`, `learner-board-interactive.tsx:104`, `mentor-task-allocation.tsx:195` preserve tab-focusable scroll regions | Match of scroll surface; runtime key-wheel not tested |
| Desktop lane width | `_learn-projects.scss:3972-78`: workflow 320px; backlog 260px at :3982-85 | `legacy-project-board.module.css:14-31`: flex-basis/width 320px, backlog 260px, with !important against shared width utility | Match |
| Single lane width | `_learn-projects.scss:3987-93`: flex grow and max-width 640px | `legacy-project-board.module.css:32-37`: `singleLane` conditional, grow and max-width 640px | Match |
| Lane border/shape/background | `_learn-projects.scss:4159-68`: 1px `rgba(#26bac7,.16)`, 20px radius, 12px padding, teal 4%-to-white vertical gradient, 260px min-height, 12px grid gap | `legacy-project-board.module.css:14-26`; shared `BoardColumn` still contributes `p-3=12px` | Match |
| Elevation resting/hover | `_learn-projects.scss:37-40,4177-83`: e2 `0 1px 2px rgba(#1a1d21,.04),0 8px 20px rgba(#1a1d21,.05)`; hover e3 `0 2px 6px rgba(...,.05),0 14px 32px rgba(...,.09)`, lift 1px, teal border 28% | `legacy-project-board.module.css:26-41,68-76` copied exact shadows and hover lift | Match |
| Hover/focus transition | `_learn-projects.scss:42-50,4172-76,4314-25`: 200ms cubic-bezier(0.2,0,0,1), 2px teal focus outline | `legacy-project-board.module.css:27,72-93,101-104` same duration/easing/ring; focus applied to card :focus-within to preserve nested actions | Visual match; focus-trigger semantics differ, remains an exception |
| Header | `_learn-projects.scss:4193-4203,4223-39`: 8px gap, 8px bottom padding, fine border, 14px/600 label | `legacy-project-board.module.css:38-49`; counts preserve shared Badge in two lane views | Match for header surface; badge measurements still owned by chat-14 |
| Lane body | `_learn-projects.scss:4249-59`: internal scroll `min(62vh,720px)`, 8px gap, 4px inset, overscroll contain | `legacy-project-board.module.css:50-61`: same | Match |
| Task card | `_learn-projects.scss:4299-4335`: white, 1px border rgba(`#e5e9f0`,.85), 16px radius, 12px padding, e2/e3 hover elevations | `legacy-project-board.module.css:62-93` plus each card's `p-3` | Match in CSS; source retains functional nested actions |
| Drop target/disabled | `_learn-projects.scss:3995-4007,4207-21`: suppress hover translation while dragging; accepted lane teal 90% border, 7% background, two-layer teal shadow; unsupported target 55% opacity | `legacy-project-board.module.css:77-92`; each caller supplies `data-dragging` and `data-can-drop` based on existing role/status rules | Match for defined native drag states; interaction not browser-tested |
| Phone snapping | `_learn-projects.scss:5662-5697`: <=767px horizontal snap proximity, columns 82% wide, filtered one lane 100%, lane max-height 58vh | `legacy-project-board.module.css:106-120`: same breakpoint/values; parent still x-scrollable and each lane has snap-start | Source responsive match |
| Tablet rule | Original desktop rules until <=767px; horizontal overflow handles narrow tablets | Module preserves desktop 320px lanes and scroll for >767px | Source responsive match |
| Reduced motion | Original reduced-motion approach in `_learn-projects.scss` | `legacy-project-board.module.css:121-123`: no transition when user prefers reduced motion | Added safe safeguard, no behavioural regression |

### Source-search (equivalent to scoped grep) and responsive proof

Fetched **all three complete current branch file bodies** after editing and scanned them with regex; these are actual source-search counts, not a browser/layout assertion.

| Scan (reproducible shell expression for orchestrator) | Result in three listed files |
| --- | --- |
| `grep -o '<BoardColumn' <three files> \| wc -l` | 3 opens |
| `grep -o '</BoardColumn>' <three files> \| wc -l` | 3 closes |
| `grep -Eo 'data-dragging=|data-can-drop=|onDragEnd=' <three files> \| sort \| uniq -c` | 3 of each |
| `grep -Eo 'min-w-max\|w-64\|w-72' <three files> \| wc -l` | 0 obsolete widths |
| `grep -Eo '<select\b\|<input\b' <three files> \| wc -l` | 0 raw form controls |
| `grep -Eo 'styles\.(track\|lane\|body\|card)' <three files>` | 12 class references, 4 per file |
| Quote/source guard `/["']{2}\s*className|["']\s+"className/` on each full body | 0 matches |
| `grep -Ec '@media \(max-width: 767px\)|@media \(prefers-reduced-motion: reduce\)' legacy-project-board.module.css` | 2 media rules |

**Responsive proof status:** desktop/phone/tablet source rules line-by-line verified against the original SCSS, with no physical browser rendered or computed-style screenshot. The user and orchestrator have asked for stricter responsive comparison, so do not call this a visual pass.

**Completed source migrations (3 files):** `mentor-lane-board.tsx`, `learner-board-interactive.tsx`, `mentor-task-allocation.tsx`. The shared scoped stylesheet is also finished for those callers. **Overall G6 remains [ ]** because other kanban variants, selection/drag touch tests, full repo grep and any remaining state differences are not covered; do not tick the umbrella item. Next unticked E7 target: `src/components/placements/placement-calendar-workspace.tsx` to review 42-day/week/day responsiveness, then `src/components/placements/tpo-week-hour-calendar.tsx`.


## 2026-10-19 replacement chat-2 — TPO calendar source-value batch (10 commits including this audit)

**Source sync:** At entry the lane was **0 ahead / 1,633 behind** `main@12ee0a58fd9af5e0e1f1ad975155f864966cb6c0`; the lane ref was fast-forwarded to that exact main SHA before any write. Nine working commits were then pushed on `chatgpt/chat-2-b` (one additional audit commit here), all prefixed `[chat-2]`. **No changes to main or `src/components/ui/*`.** At the most recent comparison before this audit: 9 ahead / 0 behind; main can move independently.

### Source-to-source comparison — the exact TPO week grid

| Property/state | Original old LMS file:line/value | vNext file:line/value | Source inspection |
| --- | --- | --- | --- |
| Hour height | `lms2-fe@prod-2026/src/components/tpo/ui/calendarGrid.js:4-6` `HOUR_PX=52`, 07:00–21:00 | `src/components/placements/tpo-week-hour-calendar.tsx:18` `FIRST=7,LAST=21,HEIGHT=52` | Match |
| Time gutter and 7 day columns | `lms2-fe/src/styles/components/_tpo-ui.scss:202,210` `56px repeat(7,minmax(120px,1fr))` | `tpo-week-hour-calendar.module.css:13-16`, called from `tpo-week-hour-calendar.tsx:134`; 56rem minimum width | Match for defined track widths |
| Outer surface | `_tpo-ui.scss:201` border 1px `#e7ecf2`, radius `$tpo-radius=10px`, white and horizontal scroll | `tpo-week-hour-calendar.module.css:8-12`, `tpo-week-hour-calendar.tsx:133` | Match; removed a non-legacy edge-fade mask |
| Weekday heading | `_tpo-ui.scss:204-206` padding 8px, muted `#5b6b82`, day divider `#e7ecf2` | `tpo-week-hour-calendar.module.css:23-28`, `tpo-week-hour-calendar.tsx:136` | Paint match; old separate day-number pill differs from vNext combined label, preserved its wording |
| Hour labels | `_tpo-ui.scss:211` 12px, `#5b6b82`, 0 6px padding, right-aligned, Y -8px | `tpo-week-hour-calendar.module.css:29-36`, `tpo-week-hour-calendar.tsx:140-141` | Match |
| Dividers, hover and focus | `_tpo-ui.scss:212-213` line `#e7ecf2`, droppable teal at 4% | `tpo-week-hour-calendar.module.css:37-53`, `tpo-week-hour-calendar.tsx:157`; teal focus outlined | Match line/hover fill; focus is an accessible addition, not literal old UI |
| Current-time marker | `_tpo-ui.scss:214` `#d92d20`, 2px, z3 | `tpo-week-hour-calendar.module.css:54-57`, `tpo-week-hour-calendar.tsx:160` | Match |
| Event lane inset | `lms2-fe/src/components/tpo/WeekTimeGrid.jsx`: `left calc(lane% + 2px)`, `width calc(share% - 4px)` | `tpo-week-hour-calendar.tsx:166-167` same 2px inset | Match source formula |
| Event min visual height | `lms2-fe/src/components/tpo/ui/calendarGrid.js:25` min `22`px | `tpo-week-hour-calendar.tsx:164` min 22px | Match |
| Event body fill/border/radius/padding/type | `lms2-fe/src/styles/components/_tpo-calendar.scss:217-227` 1px `#e7ecf2`, 4px kind-colour left edge, 7px radius, `#f8fafc`, `#334155`, 5px 7px, 12px, 1.35 | `tpo-week-hour-calendar.module.css:57-67`, on 3 render alternatives at `tpo-week-hour-calendar.tsx:175,183-184` | Paint/geometry match, exact kind map for represented legacy kinds; new interview kind uses the legacy talk purple |
| Event hover | `_tpo-calendar.scss:230-237` 150ms, fill `#f6f9fd`, three other edges `#dde6f0` | `tpo-week-hour-calendar.module.css:68-73` | Match paint/transition |
| Mobile horizontal layout | `_tpo-ui.scss:201-210` overflow-x:auto, 120px/day + 56px gutter, no edge mask | `tpo-week-hour-calendar.tsx:133-134` uses x-scroll and min 896px; no edge mask | Source geometry match; physical scroll/touch not tested |

### TPO month and responsive command bar (no page-content restructuring)

| Property/state | Original source and value | vNext source and value | Verdict |
| --- | --- | --- | --- |
| Command bar surface | `lms2-fe/src/styles/components/_tpo-calendar.scss:25-38`: border `#e7ecf2`, radius 14px, white, 16px 18px padding, shadow `0 4px 18px rgba(26,45,72,.045)` | `legacy-calendar-theme.module.css:38-44`, scoped to TPO in `placement-calendar-workspace.tsx:672` | Match static values; TPO's existing controls and text retained |
| TPO month surround | `_tpo-calendar.scss:253-269`: 1px `#e7ecf2`, radius 14px, shadow `0 4px 18px rgba(26,45,72,.045)`, inner padding 10px 14px 14px | `legacy-calendar-theme.module.css:45-52`, TPO-only `placement-calendar-workspace.tsx:963` | Match surface; old Ant Calendar internals not proven |
| Phone command bar | `_tpo-calendar.scss:349-370`: <=767px, 13px padding, 3 equal view switches | `legacy-calendar-theme.module.css:60-76`, `placement-calendar-workspace.tsx:684` | Match source breakpoint + dimensions; no screenshot |
| Phone navigation | `_tpo-calendar.scss:372-385`: vertical navigation grouping, 10px gap, three equal full-width buttons | `legacy-calendar-theme.module.css:77-95`, `placement-calendar-workspace.tsx:714` | Match geometry; existing period label displayed above controls rather than modifying its content |
| Tablet responsive | `_tpo-calendar.scss:333-345`: <=991px no forced desktop two-column command body | TPO wrapper flex-wraps; `legacy-calendar-theme.module.css:53-56` prevents min-content expansion | Partial: exact tablet wrapping and actual computed styles unverified |

### Scoped source search, paired tags and exceptions

Connector-fetched *complete* bodies of the four changed source files were checked after writes. Reproducible check expressions for the orchestrator:

- `grep -nE 'HEIGHT=64|min-w-\\[63rem\\]|grid-cols-\\[5rem' src/components/placements/tpo-week-hour-calendar.tsx` ⇒ **0** obsolete geometry matches.
- `grep -o 'weekStyles.event' src/components/placements/tpo-week-hour-calendar.tsx | wc -l` ⇒ **3** event render paths, with `data-event-kind={event.kind}` ⇒ **3**.
- `grep -o '<CalendarGrid' src/components/placements/placement-calendar-workspace.tsx | wc -l` ⇒ **1 open**, `grep -o '</CalendarGrid>' ... | wc -l` ⇒ **1 close**.
- Exact-case raw native source-tag counts in the two edited TSX files: **0 raw `<select>`**, **1 raw `<input>`** (the existing `type="hidden" name="view"` at `placement-calendar-workspace.tsx:770`, exempt because native hidden field has no long styling), **0 raw `<textarea>`**.
- Suspicious duplicate quote-before-className pattern in the four fetched files: **0 matches**. Existing `<Select>…</Select>`, `<Dialog>…</Dialog>` and `<CalendarGrid>…</CalendarGrid>` pairs were retained; no raw JSX tag renamed without its closing partner.

**STRICT TICK RULE:** `- [ ] E7 stats/funnels/charts/calendar and G6 boards (missing: every remaining portal file and value state, all-repo grep, keyboard/touch/phone/tablet computed-style side-by-side; current evidence is scoped source only).` `- [ ] E8 TPO/HR exports (missing: full legacy-vNext column/value/type parity, whole-export route coverage, downloaded XLSX/CSV comparisons and original grid name-vs-owner date-suffix exception).` No UI screenshot, rendered browser, compilation, lint, CI or runtime application code was executed.

**Next exact file:** `src/components/placements/learner-career-calendar.tsx` — compare its toolbar, metric legend and 767px phone period navigation to `lms2-fe@prod-2026/src/styles/components/_learn-career-calendar.scss:225-386,549-599,610-690`, then continue all remaining calendar/chart instances. Do not tick umbrella items without whole-category proof.


## 2026-10-19 replacement chat-2 continuation — career calendar + college hiring funnel

**Completed source migrations in this batch (two TSX files):**
1. `src/components/placements/learner-career-calendar.tsx`, with its new `learner-career-calendar.module.css` (all four views and the mobile agenda remain the existing vNext views).
2. `src/components/placements/college-hiring-funnel.tsx`, reusing the already legacy-sourced `report-bar-chart.module.css` and correcting its two unresolved `DateInput` JSX names to shared `Input type="date"`.

No `src/components/ui/*` edits, server schema edits, generated files, runtime app execution or CI. The legacy values below come directly from `42Students/lms2-fe@prod-2026`; they are **source comparisons**, not a claim of pixel-equal rendered browser styles.

### Learner career calendar — desktop/hover/active/focus source-value table

| Property/state | Original LMS source:line and value | vNext source:line and value | Verdict |
| --- | --- | --- | --- |
| Header row alignment/gap | `src/styles/components/_learn-career-calendar.scss:34-41`: flex, start-aligned, justify-between, 24px gap | `learner-career-calendar.module.css:15-20`, called `learner-career-calendar.tsx:136` | Match |
| Calendar title | `_learn-career-calendar.scss:42-50`: 28px/600, `#1a1d21`, line-height 1.3, tracking -0.02em | `learner-career-calendar.module.css:21-28`, `learner-career-calendar.tsx:138` | Match |
| Toolbar padding and surface | `_learn-career-calendar.scss:225-234`: white, 16px vertical / 24px horizontal padding, 1px `#e5e9f0` bottom hairline | `learner-career-calendar.module.css:7-14`, `learner-career-calendar.tsx:135` | Match paint/spacing; vNext also contains the original page's export and filter controls in this region |
| Nav and arrows | `_learn-career-calendar.scss:236-270`: nav flex with 8px gap; arrow 44px square, transparent, 8px radius, `#6b7280`; 150ms cubic-bezier(.2,0,0,1); hover `#26bac7` on 8% teal | `learner-career-calendar.module.css:36-63`, `learner-career-calendar.tsx:167-185` | Match values; disabled state retains shared Button behaviour |
| Nav keyboard focus | `_learn-career-calendar.scss:268-271`: 2px `#0e7c87`, 2px outward offset | `learner-career-calendar.module.css:58-63` | Match |
| Today action | `_learn-career-calendar.scss:355-366`: 44px high, teal border/ink, hover dark teal `#1e9aa8` and 8% fill, 200ms ease | `learner-career-calendar.module.css:64-74`, `learner-career-calendar.tsx:175` | Match |
| Period label | `_learn-career-calendar.scss:285-313`: 16px/600/1.3, 180px minimum, 40px minimum height, 8px 12px padding, radius10 | `learner-career-calendar.module.css:75-91`, `learner-career-calendar.tsx:187` | Static values match; original was also a period *picker trigger*, while vNext preserves its separate date input |
| Legend strip | `_learn-career-calendar.scss:610-619`: 8px gap, 12px 24px padding, white, `#e5e9f0` bottom line | `learner-career-calendar.module.css:92-101`, `learner-career-calendar.tsx:201` | Match |
| Legend chip base/active/focus | `_learn-career-calendar.scss:621-655`: 32px minimum, 4px 12px padding, `#e5e9f0` border, pill, 12px/1.4, focus 2px `#0e7c87`, selected inset 1px accent | `learner-career-calendar.module.css:102-128`, `learner-career-calendar.tsx:204-209` | Match geometry, baseline and focus; selected event tones handled below |
| Event accent pairs | `src/components/Placements/careerEventVisuals.js:11-49`: green interview `#ecfdf5/#047857/#065f46`, blue job interview date `#e6f4ff/#1d4ed8/#1e40af`, gray other `#f1f5f9/#475569/#334155` | `learner-career-calendar.module.css:129-168` for legend; `:216-242` chips; `:260-281` agenda rows, with `data-kind` | Same exact source colours for represented INTERVIEW, ASSESSMENT and OTHER; original had additional kinds not in vNext data, intentionally not invented |
| Month/week grid frame | `_learn-career-calendar.scss:903-913`: white, 1px `#e5e9f0`, 10px corner, overflow clipped in original RBC | `learner-career-calendar.module.css:160-175`, `learner-career-calendar.tsx:224-225` | Paint values match; calendar engine and scrolling approach differ, so **not literal DOM parity** |
| Weekday header | `_learn-career-calendar.scss:915-926`: 12px/600 uppercase, 0.05em tracking, 12px 8px padding, `#54505d` on `#fafbfc` | `learner-career-calendar.module.css:176-186`, `learner-career-calendar.tsx:227` | Match |
| Calendar month day cell | `_learn-career-calendar.scss:928-950`: day min-height116px, numeral 13px/600 and right-aligned, `#fafbfc` outside month, today `#eff8fa` + inset 2px teal at 45% | `learner-career-calendar.module.css:187-215`, `learner-career-calendar.tsx:241-247` | Source paint/density match; pre-existing `CalendarGrid` structure retained, 42-day and 7-day state preserved |
| Event chip and overflow count | `_learn-career-calendar.scss:960-1017`: 28px minimum, 6px 10px 6px 8px padding, 2px 4px margin, 3px coloured left edge, 6px corner, 13px/1.35; +N more as a round gray pill | `learner-career-calendar.module.css:216-253`, `learner-career-calendar.tsx:250-255` | Match geometry; chip remains static existing vNext span and its details/tooltip intact |
| Agenda card/rest/hover/focus | `_learn-career-calendar.scss:765-789`: 12px 16px padding, 4px accent left border, radius10, white, hover elev-2 + `#d6dbe3`, focus 2px `#0e7c87` | `learner-career-calendar.module.css:260-281`, `learner-career-calendar.tsx:327` and mobile list at `:287` | Match visual states via :hover / :focus-within; original keyboard focus directly on entire row, while vNext retains interactive nested link/button |
| Reduced motion | No extra controls required by original; global reduced motion honoured | `learner-career-calendar.module.css:331-334` removes local transitions on user preference | Safe addition |

**Preserved page content and behaviour:** vNext's agenda/month/week/day options, date navigation (IST), filters and labels, exact round links, aria labels, event detail Drawer, count summaries, reschedule information, and period ICS download remain unchanged. Added only visual `data-kind` for old event colour roles. The original legacy calendar covers more event types; the vNext content was not broadened to mimic it.

### Learner responsive source proof — phone/tablet/desktop

| Breakpoint/state | Original old LMS | Source-level comparison in vNext |
| --- | --- | --- |
| Phone up to **767px** | `_learn-career-calendar.scss:113-127,549-571,686-690,856-868`: title 20px, header stacked 8px gap, toolbar padding12px, legend horizontal-scrolling with 12px padding and chips32px, agenda 12px padding, stacked event row | `learner-career-calendar.module.css:314-327`: 20px title, 8px header gap, 12px padding, horizontal chip scroll 32px high, stacked rows, 44px nav buttons; `learner-career-calendar.tsx:273-305` retains mobile agenda |
| Tablet **768–1099px** | `_learn-career-calendar.scss:875-902`: fluid calendar width (no 700px minimum), thin scrollbar and 28px right-side fade when overflow exists | `learner-career-calendar.module.css:169-175,302-313`: 100% grid, min-width:0, auto horizontal overflow, thin scrollbar, original 28px cue |
| Desktop **1100px+** | `_learn-career-calendar.scss:875-902`: no fade, white grid; full seven columns | `learner-career-calendar.module.css:302-313` fade only at <=1099px; full `CalendarGrid` at md and up |
| Agenda visibility | Original uses mobile-only agenda rendering (up to 767px) | `learner-career-calendar.tsx:273,306` and `learner-career-calendar.module.css:328-330` mobile agenda only below 768; desktop month/week grid visible instead |

**Source limitations:** CSS exact values and responsiveness were read directly; no screenshots or actual computed-style sampling. Extra 4-wide month/week/day/agenda vNext view buttons are retained rather than replacing them with the old calendar's different control composition. Default/hover/focus/selected palette rows are proved only for represented vNext events.

### College hiring funnel — source-value + responsive table

| Property/state | Legacy TPO report source and value | vNext source and value | Result |
| --- | --- | --- | --- |
| Bar row and axes | `lms2-fe/src/styles/components/_tpo-reports.scss:444-454`: `minmax(120px,180px) minmax(0,1fr) 52px`, gap10px, align center, bottom gap8px | `src/components/placements/report-bar-chart.module.css:13-19` already implements exact grid; `college-hiring-funnel.tsx:84` now reuses it | Source match |
| Label | `_tpo-reports.scss:456-463`: `#44536a`, 12px/600, ellipsis/no wrap | `report-bar-chart.module.css:21-28`, `college-hiring-funnel.tsx:85` | Match |
| Track/fill | `_tpo-reports.scss:465-477`: 11px track, 999px radius, `#e7ecf2` track, `#26bac7` fill, positive-only 2px minimum | `report-bar-chart.module.css:35-45`, `college-hiring-funnel.tsx:86-87` passes `MetricBar` class while retaining meter ARIA/real counts | Match |
| Numeric value | `_tpo-reports.scss:479-484`: `#334155`, 12px/650, right-aligned | `report-bar-chart.module.css:29-34`, `college-hiring-funnel.tsx:88` | Match |
| Phone axes up to **767px** | `_tpo-reports.scss:602-605`: `minmax(82px,110px) minmax(0,1fr) 42px`, gap7px | `report-bar-chart.module.css:47-52` automatically applies to `college-hiring-funnel.tsx:84` | Match CSS, actual phone/browser remains untested |
| Tablet and desktop | >767px original larger axes, overflow-safe middle bar | `report-bar-chart.module.css:13-19` same; `college-hiring-funnel.tsx` unchanged grid parent | Match source |
| Filter date input controls | No additional legacy TPO chart-specific styling; shared forms control owns field paint | `college-hiring-funnel.tsx:58,61`: now shared `Input type="date"` replacing unresolved `DateInput` markup, retaining name/defaultValue/aria label wrapper and CSS classes | JSX/source contract fixed, no runtime tested |
| Summary strip and tiles | `docs/design/old-lms-pages.md:8-9`: one bordered summary, cards only for distinct report objects | `college-hiring-funnel.tsx:69-75,112-116` keeps the `StatTile` totals and one `SummaryStrip`, no nested metric card | Shared styling remains chat-17's responsibility |

### Exact scoped-source coverage/grep proof

Complete latest branch TSX/CSS bodies were fetched and checked for the edited file set; these are *not whole-repo greps*. Reproducible shell commands:

| Source command | Actual checked result |
| --- | --- |
| `grep -Eo '<select([[:space:]]|>)|<input([[:space:]]|>)|<textarea([[:space:]]|>)' src/components/placements/learner-career-calendar.tsx | wc -l` | **0** |
| `grep -Eo '<CalendarGrid|</CalendarGrid>|<Drawer|</Drawer>|<Button|</Button>' src/components/placements/learner-career-calendar.tsx` | **CalendarGrid 1/1**, **Drawer 1/1**, **Button 7/7** |
| `grep -Eo '<FilterChip|</FilterChip>' src/components/placements/learner-career-calendar.tsx` | **1/1** |
| `grep -o 'data-kind={option.key}' src/components/placements/learner-career-calendar.tsx | wc -l` | **1** map site covering all four current filter options |
| `grep -o 'styles.agendaEvent' src/components/placements/learner-career-calendar.tsx | wc -l` | **1** mapped agenda card site |
| `grep -Eo '<select([[:space:]]|>)|<input([[:space:]]|>)|<textarea([[:space:]]|>)' src/components/placements/college-hiring-funnel.tsx` | **2**, exclusively `type="hidden"` filters `seasonId` and `jobId` (unstyled native-control exemptions) |
| `grep -o '<Select\|</Select>' src/components/placements/college-hiring-funnel.tsx` | **3/3** |
| `grep -o '<Input type="date"' src/components/placements/college-hiring-funnel.tsx | wc -l` | **2**; `grep -o DateInput ...` **0** |
| `grep -o 'reportStyles.chartRow\|reportStyles.track' src/components/placements/college-hiring-funnel.tsx` | **1 chart row call site**, **1 track call site**, in a loop over every funnel stage |
| `grep -Ec '@media \(max-width: 767px\)|@media \(max-width: 1099px\)|@media \(min-width: 768px\)' src/components/placements/learner-career-calendar.module.css` | **3** explicit responsive boundaries |
| `grep -Ec '@media \(max-width: 767px\)' src/components/placements/report-bar-chart.module.css` | **1** original chart-mobile rule |
| Malformed duplicate-quote before `className`, scanned four full files | **0** |

**Verification limit:** No physical phone/tablet rendering, app source execution, build, TypeScript, lint, test or CI. Existing props/handlers were source-preserved. Overall category E7/E8 strict ticks remain **[ ]**: other portal charts and remaining state variants have not been exhaustively inventoried; original/vNext browser-computed values, side-by-side screenshots and all-portal greps are outstanding. These two **file migrations are source-complete**, not asserted as whole-category pixel parity.

**Next exact unticked file:** `src/components/academics/learner-class-schedule.tsx`, then teacher/HR/learner seven-day calendar surfaces; compare their month/day responsive styling to `lms2-fe@prod-2026/src/styles/components/_learn-class-schedule.scss` and the relevant legacy calendar SCSS, keeping page content unchanged.


## 2026-10-19 chat-2 continuation — learner class schedule and mentor meetings calendar

**Work-queue progress:** `src/components/academics/learner-class-schedule.tsx` and `src/components/projects/mentor-meetings-calendar.tsx` are **source-migrated**, with their two local CSS modules, no shared UI or model changes. All UI values below were inspected against `42Students/lms2-fe@prod-2026`; the checked source line numbers are recorded for handover. **Do not tick E7 umbrella** until the remaining calendar/chart/stat files and global/responsive visual proof are complete. These calendar renderers intentionally preserve different vNext page contents and structures.

### Exact-value checks — learner class schedule

| Property / state | Old LMS location and value | vNext location and value | Source verdict |
| --- | --- | --- | --- |
| Schedule page content | `src/styles/components/_learn-class-schedule.scss:26-36`: 100% width/max, box-sizing:border-box, overflow-x:hidden | `src/components/academics/learner-class-schedule.module.css:7-12`, applied `learner-class-schedule.tsx:420` | Match |
| Upcoming container | `_learn-class-schedule.scss:65-73`: grid gap16, padding16, bottom gap16, white, 1px rgba(teal,.12), radius12 | `learner-class-schedule.module.css:14-23`; TSX:447 | Match |
| Upcoming 3-column / phone list | `_learn-class-schedule.scss:96-104`: repeat(3,minmax(0,1fr)), gap8; <=767px one column | `learner-class-schedule.module.css:34-39,267`; TSX:458 | Match source breakpoint |
| Upcoming heading / count | `_learn-class-schedule.scss:75-94`: heading14px/850/primary `#1a1d21`, metadata12px/800 `#6b7280`/0.02em/uppercase | `learner-class-schedule.module.css:24-33`; TSX:450 | Match |
| Calendar card boundary | `_learn-class-schedule.scss:147-151`: margin-top16, hidden overflow, zero component padding | `learner-class-schedule.module.css:50-57`; TSX:470 | Match spacing and overflow; retained surface outline follows global Ant/card border |
| Toolbar geometry | `_learn-class-schedule.scss:156-169`: flex/wrap/space-between, 16px gap, 16px 24px padding, white, bottom hairline `#e5e9f0` | `learner-class-schedule.module.css:58-68`; TSX:471 | Match |
| Nav grouping | `_learn-class-schedule.scss:171-175`: center-aligned flex, 8px gap | `learner-class-schedule.module.css:69-74`; TSX:472 | Match |
| Previous/next arrows default | `_learn-class-schedule.scss:185-198`: 44x44, no border, transparent, radius8, muted `#6b7280`, 0.2s ease | `learner-class-schedule.module.css:75-87`; TSX:474,493 | Match |
| Arrow hover / focus | `_learn-class-schedule.scss:199-207`: teal `#26bac7` on 8% teal; focus 2px teal, offset2px | `learner-class-schedule.module.css:88-95` | Match |
| Period name | `_learn-class-schedule.scss:214-228`: font16/600/1.3, `#1a1d21`, margin8 each side, 140px min-width; phone font14/min120 | `learner-class-schedule.module.css:107-116,281`; TSX:501 | Match |
| Today default/hover | `_learn-class-schedule.scss:241-252`: min-height44, `#26bac7` border + ink; hover `#1e9aa8` and 8% teal fill | `learner-class-schedule.module.css:96-106`; TSX:483 | Match after explicit token correction |
| View select and keyboard focus | `_learn-class-schedule.scss:254-270`: width120, min-height44, radius8, border `#e5e9f0`, font14; focus `#26bac7` / 2px 20% teal | `learner-class-schedule.module.css:122-141`; TSX:514 | Match |
| Filters spacing | `_learn-class-schedule.scss:272-291` legacy course filter min160, max260, touch44, phone max none | `learner-class-schedule.module.css:142-167,282-287` for available filter surfaces; vNext keeps multiple search/kind/course filters (different content) | Partial: view and global Select apply; not every vNext filter has the old course-select class |
| Main calendar surface | `_learn-class-schedule.scss:297-358`: min-height320, width100%, min-width0 for desktop, no hard horizontal minimum | `learner-class-schedule.module.css:168-185,211-262`; TSX:626-655 and 185-214 | Width/density source aligned; legacy RBC markup differs from vNext's `CalendarGrid` and hourly renderer |
| Phone month/date grid | `_learn-class-schedule.scss:380-455`: <=767px edge-to-edge calendar, radius12 top corners, 16px inset removal; mobile list contains width/overflow and 44px events | `learner-class-schedule.module.css:265-294`; TSX:626-672 retains the functional custom 42-day month and selected agenda | Geometry match where comparable; **mobile toolbar kept** because old calendar's mobile list had its own nav and current vNext depends on the toolbar to change view/date |
| Day and week accessibility | Legacy uses antd/mobile list states and 44px touch target | `learner-class-schedule.module.css:244-261`; TSX:185-214 retains labelled empty hour buttons and old vNext schedule tooltip | Source behavior preserved; browser keyboard and touch not executed |

**Exact old style reference note:** `src/styles/components/_variables.scss:5-28` defines `$clrThird=#26bac7`, `$teal-dark=#1e9aa8`, `$neutral-900=#1a1d21`, `$neutral-500=#6b7280`, `$neutral-200=#e5e9f0`. The original app uses a different calendar implementation; no claim of exact event-row DOM parity is made. Existing IST clock, month selection, filters, course links, section awareness, weekday ICS export, disclosure notes and teacher attendance link were not changed.

### Exact-value checks — mentor meeting list/calendar

| Property / state | Old LMS source and expected | vNext module and caller | Source verdict |
| --- | --- | --- | --- |
| List rhythm | `_learn-projects.scss:3674-3696,3743-3746`: grid with 12px gap, uppercase/12px history label | `mentor-meetings-calendar.module.css:7-16,117-126`; TSX:87-109 | 12px rows match; vNext's Upcoming/Past section headings remain its own text |
| Card base | `_learn-projects.scss:3721-3727`: positioned grid, 1px `$border=#e5e9f0`, `$radius-md=16px`, white | `mentor-meetings-calendar.module.css:29-52`; TSX:35 | Uses compact variant surface (below) instead of normal 16px base because vNext list rows are compact |
| Compact cards | `_learn-projects.scss:3729-3739`: gap20px, padding20px, radius20px, teal 12% border, nearly white gradient, elevation2 | `mentor-meetings-calendar.module.css:29-52`; TSX:35 | Match border/padding/radius/fill/shadow; old 44px icon track not inserted because vNext has no corresponding icon content |
| Hover card | `_learn-projects.scss:3763-3767`: raise1px, teal25% border, elevation3 | `mentor-meetings-calendar.module.css:45-52` | Match values/durations based on legacy token pair 140ms/ease-out |
| Title and secondary | `_learn-projects.scss:3790-3815`: wrapping header gap12, 16px/1.35 title `#1a1d21`, 6px secondary margin, muted `#6b7280`, line-height1.55 | `mentor-meetings-calendar.module.css:53-81`; TSX:36-39 | Match |
| Time/meta/actions | `_learn-projects.scss:3818-3829`: flex-wrap with 8px gap; actions to end | `mentor-meetings-calendar.module.css:82-112`; TSX:47,55 | Match geometry, vNext real join/project links unchanged |
| Phone <=767px | `_learn-projects.scss:5569-5578`: compact card drops rigid grid, uses 12px padding, 12px row gap, actions full row aligned start | `mentor-meetings-calendar.module.css:127-136`; TSX unchanged | Match source breakpoint; actual screenshot/touch not tested |
| Empty / focus / reduced motion | Empty rows originally need meaningful absent state; global keyboard focus required | `mentor-meetings-calendar.module.css:46-51,113-140`; TSX:95,107 | Scoped dashed empty state + focus-within and motion-reduction; accessibility enhancement, **not** literal original markup |

**Source-only responsive proof:** checked selectors for phone `max-width:767px`, desktop `min-width:768px` and reduced motion in `learner-class-schedule.module.css`; phone and reduced motion in `mentor-meetings-calendar.module.css`. They match the legacy compact-card 767px breakpoint; class schedule hourly grid remains scrollable only where needed. No running app, Playwright, CSS-computed layout, CI, compile, lint or screenshot inspection.

### Scoped source-search (paste-ready greps and actual counts)

| Reproducible search | Count from the complete fetched branch files |
| --- | --- |
| `grep -o '<Button' src/components/academics/learner-class-schedule.tsx; grep -o '</Button>' ...` | **7 opens / 7 closes** |
| `grep -o '<Select' src/components/academics/learner-class-schedule.tsx; grep -o '</Select>' ...` | **3 / 3** |
| `grep -o '<CalendarGrid' src/components/academics/learner-class-schedule.tsx; grep -o '</CalendarGrid>' ...` | **1 / 1** |
| `grep -o '<FilterChip' src/components/academics/learner-class-schedule.tsx; grep -o '</FilterChip>' ...` | **2 / 2** |
| `grep -Eo '<(select|input|textarea)\\b' src/components/academics/learner-class-schedule.tsx` | **0** |
| `grep -o '<button' src/components/academics/learner-class-schedule.tsx` | **1**, retained date-grid dynamic pressed-state control; real `type=button`, label, aria-pressed and click handler; deliberate exempt judgement control |
| `grep -E 'className="-subtle|sm: border-t' src/components/academics/learner-class-schedule.tsx` | **0** malformed old class spans after replacement |
| `grep -o '<article' src/components/projects/mentor-meetings-calendar.tsx; grep -o '</article>' ...` | **1 / 1** |
| `grep -o '<section' src/components/projects/mentor-meetings-calendar.tsx; grep -o '</section>' ...` | **2 / 2** |
| `grep -Eo '<(button|select|input|textarea)\\b' src/components/projects/mentor-meetings-calendar.tsx` | **0** |
| `grep -o '<StatusBadge' src/components/projects/mentor-meetings-calendar.tsx; grep -o '</StatusBadge>' ...` | **1 / 1** |
| Full bodies: local `styles.foo` references resolving to CSS module selectors | **27 distinct + 13 distinct, all found**, no undefined CSS selectors |
| `grep -Ec '@media' src/components/academics/learner-class-schedule.module.css` and mentor module | **3 + 2** respectively |
| Bad duplicate quote before className, in four complete files | **0** |

**Strict E7 queue status:** `- [ ] calendar/tiles/charts entire category` (missing: remaining HR and faculty/stat/schedule instances, whole-repository grep proof, all values/states for every listed component, desktop/phone/tablet computed visual proof). These two files are **completed as scoped visual migrations**, not certified category-wide pixel clones. Original and vNext meeting-calendar markup and course-calendar engines intentionally differ.

**Next exact unticked file:** `src/components/hr/recruiter-report-funnel.module.css` and its caller(s), then remaining teacher/HR reporting charts and date grids. Search original HR/report SCSS before editing. E8 export AG Grid ownership is now chat-14 per current `docs/design/ui-clone-checklist.md:57`, so chat-2 stays on E7 surfaces.


## 2026-10-19 chat-2 calendar and chart source migration — HR, faculty, attendance, course and SA

**File-level source work queue** (not category-level strict ticks): recruiter funnel legacy CSS **reviewed, no source edit necessary**; recruiter calendar **source migrated**; faculty month schedule **source migrated**; learner attendance month calendar **source migrated**; faculty course progress distribution **source migrated**; Super Admin hiring chart **source migrated**. Source proof is limited to complete fetched file bodies. No run of application code, build, test, CSS compositor, browser screenshots or all-repository grep. The owner goal is a *skin clone only*; no event data, views, endpoints, filters, percentages or export columns changed.

### HR funnel existing source recheck (no new edit)

| Original `lms2-fe@prod-2026/src/styles/components/_recruiter-v2.scss` | Current `src/components/hr/recruiter-report-funnel.module.css` and caller | Check |
| --- | --- | --- |
| :151 110px / minmax(0,1fr) / minmax(120px,auto), gap12px, aligned center, 4px 0 padding | CSS :2-8, used by `src/app/(authenticated)/hr/company/reports/page.tsx` for mapped funnel rows | Source match |
| :152 label weight600 | CSS :9, `funnelStyles.label` existing call | Match |
| :153 number right + tabular numerals | CSS :10-13, `funnelStyles.num` existing call | Match |
| :157-163 phone/tablet <=860px 90px / 1fr and number full-width left aligned | CSS :14-18 | Source match, no actual viewport check |

### Recruiter calendar month/week source-to-source value table

| State / element | Original `_recruiter-v2.scss` values | vNext changed source | Result |
| --- | --- | --- | --- |
| Nav | :139 flex with 8px gap | `recruiter-calendar-legacy.module.css:6-11`, `hr/calendar/page.tsx` nav | Match |
| Calendar range | :140 display:block, 4px 0 12px margin | CSS :12-17 prepared, existing display text preserved elsewhere in page | Module value match; no exact range hook because vNext differs |
| Seven-day grid | :141 repeat(7,minmax(150px,1fr)), 10px gap, horizontal scroll and 6px bottom padding | CSS :18-30; `src/app/(authenticated)/hr/calendar/page.tsx` CalendarGrid now uses `styles.board` | Match seven-column geometry at >860px |
| Day box | :142 min-height140px, column flex with 8px gap | CSS :39-48; `styles.day` on each mapped day | Match |
| Today state | :143 blue `#2f6fed` border and inset 1px same | CSS :49-52 via `data-today={isToday}` | Match, leaves existing label `Today` intact |
| Event default/hover | :145 flex column gap2px, 8px pad, 1px `#e3e8ef` border, radius8, white; hover `#f6f8fb` | CSS :57-74; `styles.event` on all current linked events | Match paint and geometry, helper links remain focusable |
| Event time | :146 `#4a5568`, 12px, tabular nums | CSS :79-83 and `styles.time` | Match |
| Due card styling | Legacy recruiter attention row :106 `#f5c27a` and `#fffaf2` | CSS :84-87, applied only to results-due link | Matches attention role paint |
| <=860px | :157-163 one-column calendar board | CSS :103-107, vNext mobile list remains mounted below md; 768-860px board changes to one column | Source match, not browser-verified |
| <=767px | Original one-column board, vNext has separate day agenda | CSS :108-115 mobile agenda, `hr/calendar/page.tsx` mobileDay/mobileEvents | Functional page composition intentionally retained |
| Focus, reduced motion | Original link focus inherited from app; vNext link must be reachable | CSS :75-78, :116-119 | Accessibility addition, not literal old source |

### Faculty and learner attendance month calendars — source values

| Value/state | Original old LMS source | vNext module + caller | Source verdict |
| --- | --- | --- | --- |
| Month toolbar | `_learn-class-schedule.scss:156-169`: white, 16px 24px pad, 16px gap, border bottom `#e5e9f0`; phone 16px | `legacy-class-month-grid.module.css:16-25,183-195`, applied `teacher/calendar/page.tsx` and `learn/attendance/calendar/page.tsx` | Match source geometry |
| Month title | `_learn-class-schedule.scss:214-228`: 16px/600/1.3 `#1a1d21`; 14px phone | CSS :26-31, :186; both calendar pages use `monthStyles.period` | Match |
| Navigation | `CalendarMobileList.module.scss:46-63`: 44px tap, transparent, radius8, muted `#6b7280`, teal hover | CSS :32-59 on existing navigation links; vNext text labels unchanged | Match area/paint |
| Day-grid wrap | `_learn-class-schedule.scss:297-358`: full width, min-width0, frame flexible; `_learn-career-calendar.scss:907-929`: 1px hairlines and neutral white | CSS :68-80; `teacher/calendar/page.tsx` uses `monthStyles.scroll/grid` | Match paint; vNext CalendarGrid DOM differs from RBC |
| Weekday | `_learn-career-calendar.scss:915-926`: 12px/600/0.05em, 12px 8px, `#fafbfc` `#54505d` | CSS :81-92; faculty page `monthStyles.weekday` | Match |
| Desktop day | `_learn-career-calendar.scss:928-950`: min116px and off-month `#fafbfc`, current day teal-tint and inset ring | CSS :93-117; faculty page day with `data-outside={!day.inMonth}` | Match for supported outside state; today's server-side boolean is not present in source and is **not fabricated** |
| Event chip | `_learn-career-calendar.scss:960-979`: 3px accent edge, 6px corner, 6/10/6/8 pad, min28px | CSS :118-139; faculty `monthStyles.dayEvent` | Source paint match; existing event links/times/labels preserved |
| Phone mini-grid | `CalendarMobileList.module.scss:73-117`: grid seven equal columns, gap4px, weekdays11px/600, day min32px and max44px | CSS :140-182, :183-196; attendance calendar `monthStyles.mobileGrid/mobileWeekday/mobileDay` | Match base mini-grid; 44px min touch is safe enhancement above original 32px |
| Phone/tablet boundaries | `_learn-class-schedule.scss:383-455` and `CalendarMobileList.module.scss:11-15,169-177`: mobile <=767px; desktop fluid >=768px | CSS :183-200 phone and 768-1099 tablet; teacher uses ScrollCue for narrow grids; attendance always fluid | Source breakpoint match; physical viewport not checked |

**No content changes:** Faculty schedule still calls `getFacultyIstMonth` with the same authorization and day model; attendance continues own-roster counting/status filters and course links. Both preserve title, month navigation, day label, raw event count and courses. Any theme-level Sunday/hairline application remains part of the global styling owned elsewhere.

### Faculty course completion and Super Admin hiring charts

| Property/state | Original old LMS reference | VNext source and line | Source check |
| --- | --- | --- | --- |
| Course progress card white/border/elevation | `_learn-courses.scss:2447-2462`: white, border `#e5e9f0`, contact shadow `0 1px 2px rgba(15,23,42,.04)` | Existing course panel inherits global canvas skin; no content wrapper edits | Partial global theme work |
| Course progress track/fill | `_learn-courses.scss:2486-2500`: `#f1f4f9` track, `#6b7280` fill for course dashboard bars | `faculty-course-home-signals.module.css:7-16`, `faculty-course-home-signals.tsx` both mapped `MetricBar` sites | Exact token match |
| Course progress distribution row | Existing vNext 6rem / 1fr / 2rem, 12px gap | `faculty-course-home-signals.module.css:17-35` matches existing dimensions, uses neutral 12px labels/count | VNext layout preserved; no analogous original distribution-axis evidence |
| Phone course distribution | Legacy responsive cards have full-width stacked layout | CSS :36-41, 70px min label and 8px gap | Source responsive support; exact original per-breakpoint comparator unavailable |
| TPO bar/track | `_tpo-reports.scss:465-477`: 11px `#e7ecf2` track, rounded999, teal `#26bac7` fill, min2px for nonzero | `super-admin-hiring-funnel.module.css:37-45`, `admin/placements/analytics/page.tsx` one mapped `MetricBar` call inside all stages | Match |
| TPO chart label and numeric | `_tpo-reports.scss:456-463,479-484`: 12px/600 label `#44536a`; numeric `#334155` and 650 weight | CSS :14-30, stages preserve their own 3-up layout and real counts | Match label and ink; enlarged 24px count is a vNext stage-display exception |
| TPO chart phone axes | `_tpo-reports.scss:602-605` reduces axes at <=767px | `super-admin-hiring-funnel.module.css:46-49` reduces stage inset/count while keeping vNext 3-up/stacked stage card layout | Partial original row geometry intentionally not imposed on different vNext stage cards |

### Reproducible scoped search/coverage and responsive evidence

Fetched **complete** latest branch bodies after the edits and checked:
- `src/app/(authenticated)/hr/calendar/page.tsx`: `<CalendarGrid>` **1/1 open/close**, `<Button>` **1/1**, `<Link>` **13/13**, raw native button/select/input/textarea **0**; SummaryStrip is self-closing (1 site). **10 distinct scoped CSS class references, all defined**.
- `src/app/(authenticated)/teacher/calendar/page.tsx`: `<CalendarGrid>` **1/1**, `<Button>` **1/1**, `<Select>` **1/1**, `<Link>` **6/6**; raw native controls **0**; **12 distinct CSS class references, all defined**.
- `src/app/(authenticated)/learn/attendance/calendar/page.tsx`: `<CalendarGrid>` **1/1**, `<Button>` **1/1**, `<Select>` **2/2**, `<Link>` **6/6**; raw native controls **0**; **9 distinct CSS classes, all defined**.
- `src/components/courses/faculty-course-home-signals.tsx`: `<MetricBar>` **2**, `styles.track` **2**, raw native controls **0**, `<Link>` **5/5**; all four distinct style identifiers defined.
- `src/app/(authenticated)/admin/placements/analytics/page.tsx`: `<MetricBar>` **1**, `styles.track` **1**, `<Button>` **1/1**, `<Select>` **1/1**, `<Link>` **3/3**; raw native controls **0**, five scoped classes defined.
- New CSS modules responsive declarations: recruiter calendar **860px, 767px, reduced motion**; academic month grid **767px, 768-1099px, reduced motion**; faculty course bars **767px, reduced motion**; SA hiring bars **767px, reduced motion**.
- No suspicious duplicate quote-before-className matches in any five complete fetched TSX source bodies.
- Source-search equivalents for the orchestrator: `grep -Eo '<(button|select|input|textarea)\\b' <five TSX files> | wc -l` = **0**; `grep -o 'monthStyles\\.' teacher/calendar/page.tsx` = **14** instances; `grep -o 'monthStyles\\.' learn/attendance/calendar/page.tsx` = **10**; `grep -o 'styles\\.track' faculty-course-home-signals.tsx` = **2**.
- No full-project grep, checked-out source program, computed responsive CSS, screenshot, or downloadable/export verification. Strict E7 subitems are still **[ ]** due to remaining chart, state and per-portal coverage.

**Next exact untouched E7 target:** `src/components/courses/college-learner-progress-report.tsx` (per-learner progress bars and responsive summary) and `src/components/projects/project-workspace-readiness.tsx`; compare to old `_learn-courses.scss` and `_learn-projects.scss` before editing.


## 2026-10-19 chat-2 additional progress/metric batch — five more file-level migrations

**Completed scoped visual source migrations:** `src/components/courses/college-learner-progress-report.tsx`, `src/components/projects/project-workspace-readiness.tsx`, `src/components/projects/project-admin-workspace-list.tsx`, `src/components/courses/learner-course-list.tsx`, `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx`. These are **not category-wide E7 strict ticks**. Read old LMS originals and fetched the entire new TSX/CSS files after editing. All JS event handlers, data filtering, value calculations and module access logic are retained. Shared `MetricBar` remains unchanged.

### Exact original value vs new source table — progress and stage bars

| Source element / state | Original old LMS style value | Current scoped vNext file and value | Source verdict |
| --- | --- | --- | --- |
| Course progress background | `lms2-fe@prod-2026/src/styles/components/_learn-courses.scss:2486-2492` — `$neutral-100=#f1f4f9` on every course dashboard track | `college-learner-progress-report.module.css:13-22` and `learner-course-progress.module.css:6-15` — `#f1f4f9` track | Exact token match |
| Course progress fill | `_learn-courses.scss:2494-2500` — `$neutral-500=#6b7280` on all course dashboard fills | Both progress CSS modules' `> div` fill `#6b7280`; `college-learner-progress-report.tsx` and `learner-course-list.tsx` use scoped class | Exact token match |
| Course read-only percentage text | Old course text uses `$neutral-900=#1a1d21`, caption12px/600 where displayed; progress count stays textual | `college-learner-progress-report.module.css:23-29` displays `#1a1d21`, 12px/600/tabular; model `row.progress` unchanged | Match ink/type; original specific DataTable cell layout not fully proved |
| Course progress row width | `_learn-courses.scss` course-card progress is full width; other report cell widths are contextual | `learner-course-progress.module.css:6-15` full width; `college-learner-progress-report.module.css:6-13` report-cell 96px, wrapped narrow phone 72px at <=767 | Source layout preserved; report-cell width is a vNext exception, not legacy-derived |
| Project progress group | `lms2-fe/src/styles/components/_learn-projects.scss:2057-2061` min-width220px, grid gap8 | `project-workspace-readiness.module.css:8-16`; all three mapped real task/sprint/release `MetricBar` rows in `project-workspace-readiness.tsx` | Match desktop geometry |
| Project progress caption | `_learn-projects.scss:261-268,2680-2693` flex space-between, gap12px, 13px/600 muted `#6b7280`, strong 14px dark | `project-workspace-readiness.module.css:17-29`; `project-workspace-readiness.tsx` mapped row label/amount | Match |
| Project progress fill and track | Old LMS common progress fill teal `#26bac7`, light cyan `#9ee4e8` at `_variables.scss:5-16` | `project-workspace-readiness.module.css:30-36`; `project-admin-workspace-list.tsx` imported same module for row's 96px progress meter | Match palette; full original per-progress meter width not separately specified |
| Project <=767px | `_learn-projects.scss:5731-5734` removes min-width and sets width100% for progress | `project-workspace-readiness.module.css:37-44`; inline table progress separately shrinks to 72px phone | Exact group responsiveness; inline table is contextual exception |
| Recruiter tally card | `lms2-fe/src/styles/components/_recruiter-v2.scss:132-134` tally fill `#f3f6fa`, radius10, 14px vertical padding, count26px/1.1 and caption12px `#66758d` | `recruiter-drive-funnel.module.css:7-31`; all `hr/placements/jobs/[jobId]/page.tsx` stage loop cards | Match fill/radius/count scale/ink; existing vNext 3-across card layout retained |
| Recruiter chart progress | Original TPO report `_tpo-reports.scss:465-477`: 11px `#e7ecf2` rounded track; teal `#26bac7` fill, 2px nonzero width | `recruiter-drive-funnel.module.css:32-38`; one `MetricBar` loop site for all employer-visible stages | Match track and visual fill (real stage calculations unmodified) |
| Recruiter 860px and phone | `_recruiter-v2.scss:157-164` medium breakpoint at 860px, compact layout | `recruiter-drive-funnel.module.css:39-52` medium card inset/count adjustment and <=767 phone fluid card | Source responsiveness exists, exact original card-arrangement parity not proved |

### Coverage grep/source proof — all five latest file bodies, no local app execution

| Reproducible scoped source search | Observed connector-backed result |
| --- | --- |
| `grep -o '<MetricBar' src/components/courses/college-learner-progress-report.tsx | wc -l` | **1**, class `styles.progressTrack` applied inside each DataTable progress cell |
| `grep -o '<MetricBar' src/components/projects/project-workspace-readiness.tsx | wc -l` | **1 mapped site** over 3 real execution counters, class `styles.track` |
| `grep -o '<MetricBar' src/components/projects/project-admin-workspace-list.tsx | wc -l` | **1 mapped site** for table rows, class `styles.inlineTrack` |
| `grep -o '<MetricBar' src/components/courses/learner-course-list.tsx | wc -l` | **1 mapped site** over course cards, class `progressStyles.track` |
| `grep -o '<MetricBar' 'src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx' | wc -l` | **1 mapped site** over employer-visible stages, class `funnelStyles.track` |
| Raw native `<(button|select|input|textarea)` in these five files | **0** complete-file matches |
| Literal malformed duplicate-quote-before-className, five files | **0** |
| `<Select>` pairs in `college-learner-progress-report.tsx` | **2 open / 2 close** |
| `<Link>` pairs in `learner-course-list.tsx` and HR drive page | **3/3** and **27/27** |
| CSS-module class name audit | **3 + 4 + 3 + 1 + 5 distinct references, every class exists** |
| New CSS responsive source declarations | College report <=767/reduced-motion; project progress <=767/reduced-motion (group and inline); learner course <=767/reduced-motion; recruiter drive <=860, <=767, reduced-motion |

All `MetricBar` instances are **self-closing JSX**, not unmatched paired tags. `DataTable` is also self-closing where present. These are source string checks of full files, not TS typechecking, runtime assertions or actual touch/keyboard checks. No confidence claim is made for browser-computed geometry without the owner-run parity report.

**Remaining E7 and G6 [ ]:** deep chart legend/tooltip parity, generic metric tile/summary-strip exhaustive coverage, progress metrics on all remaining pages and states, original/native `<progress>` in HR focused review, category-wide grep; keyboard/motion/phone/tablet screenshots and full component state comparison. **Next exact file:** `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx` (graded report distribution bars), then `src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx`. Compare original `_learn-report.scss` and original academic reporting stylesheet before changing any values.


## 2026-10-19 chat-2 teacher quiz/assignment report source batch

**Additional source-complete page migrations:** `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx` and `src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx`, both using the new `src/components/courses/faculty-report-legacy-charts.module.css`. Original pages: `lms2-fe@prod-2026/src/components/Report/QuizReportContent.jsx`, `AssignmentReportContent.jsx`; original SCSS `src/styles/components/_learn-report.scss`; original question accuracy tones `src/components/Report/QuestionAccuracyList.jsx`. All data retrieval, sorting, exports, grade calculations, links, question prompts and submission content remain vNext originals; **CSS/visible classes only** changed.

### Original value table: header metrics and distribution charts

| Property/state | Exact old LMS reference | vNext source | Result |
| --- | --- | --- | --- |
| Four summary metrics columns/gap | `_learn-report.scss:45-50` 4 equal columns, 12px gap, top margin16 | `faculty-report-legacy-charts.module.css:9-13`, quiz and assignment pages use `styles.stats` | Match columns/gap; page's existing outer section margin retained |
| Metric base surface | `_learn-report.scss:52-59` padding12px, border `#e5e9f0`, radius12px (`$radius-card`), white, 2px internal gap | CSS :14-23, `styles.stat` | Match |
| Metric number | `_learn-report.scss:61-68` 20px/800, `#1a1d21`, tabular figures | CSS :24-32, `styles.statValue` | Match |
| Metric label | `_learn-report.scss:70-73` 12px, muted `#6b7280` | CSS :33-37, `styles.statLabel` | Match |
| Distribution layout | vNext existing 6rem / 1fr / 2rem, gap12px; original uses report-specific question rows, not this newer vNext bucket control | CSS :38-45 with `styles.distribution` on original markup of both pages | Layout preserved; original control not directly equivalent |
| Distribution numbers/track | `_learn-report.scss:160-176` 14px/800 dark numbers; old question track6px; vNext scores are distributions rather than questions | CSS :46-63 `styles.distributionLabel/Count/Track`; neutral count, gray progress | Label/count match ink/weight; bar height8px is **documented vNext category-specific exception** |
| Quiz question row | `_learn-report.scss:110-118` padding8px 12px, radius6px, `#f1f4f9`; poor/fair left bar 3px in :183-184 | CSS :64-73, quiz page `styles.accuracyRow` with computed old risk tone | Match paint/geometry; vNext retains question card content arrangement |
| Question accuracy track | `_learn-report.scss:142-157` track6px, round999, `#e5e9f0`, fill success `#059669` / warning `#d97706` / error `#ef4444` / unanswered `#a9a7ae` | CSS :74-87; quiz `MetricBar` gets `accuracyTrack` and dynamic status class | Exact track/color match |
| Quiz accuracy cutoffs | `src/components/Report/QuestionAccuracyList.jsx:3-7`: null=unanswered, under50 poor, under75 fair, >=75 good | quiz page conditional `question.accuracyPercent===null ? accuracyUnanswered : <50 ? accuracyPoor : <75 ? accuracyFair : accuracyGood` | Exact old logic, not a guessed threshold |
| Assignment timing cards | `_learn-report.scss:293-328`: neutral `#f1f4f9`, radius6, padding12, numbers18px/800, muted label11px | CSS :88-104; assignment page uses `styles.timing/TimingStat/TimingValue` | Paint and value match; original two-column on-time/late layout differs from vNext three columns including missing, which must remain |
| Phone stats | `_learn-report.scss:388-391`: 4-up metrics become 2-up at <=767px | CSS :105-107 `@media(max-width:767px)` | Source breakpoint match |
| Phone accuracy | `_learn-report.scss:407-422`: rows become 2 tracks, value shifts below body | CSS :105-114 reduces spacing and grid width but keeps current vNext question structure | Partial geometry match; actual browser layout and keyboard interactions untested |

### Scoped grep / JSX and responsive proof

- Quiz report full body: `grep -o '<MetricBar' ...` ⇒ **2 mapped sites** (distribution and accuracy), `<Disclosure>` **1 open / 1 close**, `<Link>` **5/5**, **0 raw native button/input/select/textarea**. **16 distinct scoped CSS class identifiers**, all defined.
- Assignment report full body: `<MetricBar>` **1 mapped site**, `<Disclosure>` **1/1**, `<Link>` **2/2**, **0 raw native button/input/select/textarea**. **11 distinct scoped CSS identifiers**, all defined.
- Suspicious duplicate-quote before `className`: **0** in both complete fetched TSX file bodies.
- Module contains `@media (max-width:767px)` and `@media (prefers-reduced-motion: reduce)`, with source-checked 2-up summary at phone.
- **Not performed:** TypeScript parsing/build, app render, PDF/XLS exports, snapshots, whole-repo grep, side-by-side legacy comparison at computed/browser level. Therefore E7 stat tiles, charts/legends and progress remain **[ ]** at umbrella level.

**Next exact file:** `src/components/courses/learner-course-workspace.tsx` (dashboard course completion chart), then `src/app/(authenticated)/learn/courses/[deliveryId]/progress/page.tsx` and any unscoped calendar/kanban surfaces.


## 2026-10-19 chat-2 last learner course progress pass

**Additional file-level source migrations:** `src/components/courses/learner-course-workspace.tsx` and `src/app/(authenticated)/learn/courses/[deliveryId]/progress/page.tsx`. They reuse the already authored `src/components/courses/learner-course-progress.module.css` (no duplicate stylesheet or shared UI control change).

| Old LMS source/state | vNext source | Result |
| --- | --- | --- |
| `lms2-fe@prod-2026/src/styles/components/_learn-courses.scss:2486-2492`: course dashboard progress background neutral100 `#f1f4f9` | `learner-course-progress.module.css:6-12`, both measured `MetricBar` components now have `progressStyles.track` | Exact paint token |
| `_learn-courses.scss:2494-2500`: muted fill `#6b7280` | `learner-course-progress.module.css:13-16` fill via `.track > div` | Exact paint token |
| Legacy neutral course track height matches 8px common `MetricBar` compact | CSS :6-12 height8px; both caller calculations retain percent and labels | Source match for compact; vNext workspace used `MetricBar size="medium"` (2.5 Tailwind unit = 10px), overridden to 8px by module; intentional colour/height parity |
| Responsive <=767px, full-width completion within course card | CSS :17-19, retains 100% width and min-width0 | Source responsive match; no physical phone rendering |
| Reduced motion | CSS :20-22 removes transition on bar fill | Safe addition |

**Scoped source greps:**
`grep -o '<MetricBar' src/components/courses/learner-course-workspace.tsx` ⇒ **1 mapped `ProgressBar` source call**, now `progressStyles.track` **1**; no raw native button/input/select/textarea tags (complete file fetch). `grep -o '<MetricBar' 'src/app/(authenticated)/learn/courses/[deliveryId]/progress/page.tsx'` ⇒ **1 mapped lesson loop**, `progressStyles.track` **1**; no raw form controls. All used module class identifiers exist, and both TSX complete file bodies had 0 malformed double-quote-before-className patterns.

**Preserved semantics:** Course video playback progress, aggregate completion status, null/unknown messaging, lesson drilldown, authorized persisted counts, links, badges, teaching content and interactions were not edited. No app execution, typecheck, CI, screenshots, full-repository grep or computed media-query comparison.

**Next exact untouched file:** `src/components/courses/learner-quiz-attempt.tsx` progress indicator, to compare against `lms2-fe@prod-2026/src/styles/components/_learn-assessments.scss` and quiz-specific styles before choosing neutral/semantic track tones. Overall E7 remains **[ ]**.


## 2026-10-20 chat-2 source migration — quiz, placements, assessment tiles, and read/upload meters

**File-level E7 migrations made in this batch:**
- `src/components/courses/learner-quiz-attempt.tsx` + local `learner-quiz-attempt.module.css`
- `src/components/placements/learner-placements-dashboard.tsx` + `learner-placement-metrics.module.css` (four linked placement snapshot metrics; the separate seven-day event list is a vNext content difference and remains outside source-parity certification)
- `src/components/courses/learner-assessment-overview.tsx` + `learner-assessment-metrics.module.css` (five assignment counters, rather than the original course-assessment four; five values retained)
- `src/components/tpo/tpo-notice-read-progress.tsx` (native meter -> shared `MetricBar`)
- `src/components/projects/project-resource-files-panel.tsx` (native upload progress -> shared `MetricBar`)
- `src/app/(authenticated)/admin/announcements/page.tsx` (native announcement read meter -> shared `MetricBar`)
- Reviewed without changing the already matched meters in `src/app/(authenticated)/tpo/batches/page.tsx` and `src/app/(authenticated)/tpo/batches/[batchId]/page.tsx`.

### Exact-value table A — quiz attempt

| Property / state | Original legacy reference, observed literal value | Scoped vNext caller/module | Source result |
| --- | --- | --- | --- |
| Progress fraction / data behavior | `lms2-fe@prod-2026/src/components/Quiz/quizpanel.js:867-873`: percentage `min(step+1,questions.length)/questions.length*100`, hidden Ant progress info | `learner-quiz-attempt.tsx` `<MetricBar value={step+1} maximum={questions.length}>` with readable ARIA label and no printed chart percentage | Equivalent model fraction for in-range indices; vNext still owns bounds |
| Desktop visual track height | `src/styles/pages/_quiz.scss:1531-1536`: 3px, flat square corners, transparent background | `learner-quiz-attempt.module.css:12-17`: 3px, radius0, transparent, applied `styles.track` | Exact paint value |
| Thin neutral baseline | `_quiz.scss:1538-1548`: `::after` 1px `#e5e9f0` centered vertically across full width | `learner-quiz-attempt.module.css:18-29`: `::before` 1px, same centered geometry and colour | Exact visible baseline; pseudo-element side differs intentionally |
| Filled percentage | `_quiz.scss:1551-1555`: solid `#26bac7`, 0 radius, foreground z-order | `learner-quiz-attempt.module.css:30-36` styles `MetricBar` child `>div`, z1 and teal | Match |
| Sticky header default | `_quiz.scss:1558-1564`: sticky top0, z8, 8px 0 12px, white | `learner-quiz-attempt.module.css:6-11` applied to preserved answer/quiz header; existing `pb-4` retained | Match legacy rules, plus vNext's existing bottom spacing |
| Phone height | `_quiz.scss:2217-2220,2332-2335`: <=767px 4px progress | CSS `@media(max-width:767px)` track 4px | Match |
| Question status nav touch | `_quiz.scss:2313-2329`: 44px min and active touch treatment | `learner-quiz-attempt.tsx` maps `<Button className="min-h-11 md:min-h-9">` with preserved aria-current and answered-state border | 44px mobile source match; exact icon/buttons not exhaustively browser-proved |
| Reduced motion | Legacy static progress; no explicit transition for fill | CSS `@media(prefers-reduced-motion:reduce)` turns off fill transition | Accessibility enhancement |
| Unavailable/error/loading | Original chart inside active attempt only; no data is invented | Existing loading/failure guards, retry and quiz submit state retained, source classes only changed | Model unchanged; no runtime check |

### Exact-value table B — placement linked stat cards

| Property / state | Original `lms2-fe@prod-2026/src/styles/components/_learn-placements.scss` | VNext `learner-placement-metrics.module.css` and caller | Source result |
| --- | --- | --- | --- |
| Base card | :298-310, `#fff`, 1px soft-neutral `#fafbfc`, radius12, padding8px 16px, min-height64, inline gaps8/16 | `.tile` white, soft border, radius12, padding8px 16px, min64, grid gap8px/4px | Match painted dimensions, grid chosen to preserve available label/value/detail DOM |
| Hover | :312-316 lift -1px, border `#e5e9f0`, elevation2 `0 2px 4px rgba(16,24,40,.04),0 4px 12px rgba(16,24,40,.06)`, 150ms ease | `.link:hover .tile` and `.tile` transition | Exact values |
| Focus | :318-321 outline 2px teal `#26bac7`, offset2 | `.link:focus-visible .tile` | Match |
| Disabled | :323-326 opacity.4 and not-allowed | VNext only renders valid linked metrics, has no disabled card state; no invented disabled links | Not applicable to rendered variant |
| Number | :428-435 20px/700/`#1a1d21`/1.2; note Lato bold aliases real 700 | `.tile > p:nth-child(2)` grid-first visually, 20px/700/1.2/tabular | Match type family inherited from shell |
| Caption | :437-443 12px/`#6b7280`/1.3 | `.tile > p:first-child`, grid-second visually, 12px/1.3 | Match |
| Detail copy | :445-451 12px, subtle neutral, margin-top4/1.3 | `.tile > span`, `#a9a7ae`, 12px/1.3, margin4, wraps | Match |
| Desktop column count | Old :281-288 auto-fit 120px, panel max-width50% in different hero layout | Current four linked cards remain 4-up at xl, two-up below, no 50%-width restriction (page differs) | Content/layout exception, **not** exact full-screen match |
| Mobile <=767px | Old :290-295 2 equal columns, gap16 | Current `grid-cols-2` base and scoped mobile padding8px12, gap8px/12 at breakpoints | Column count match; grid gap and mobile inset differ (documented) |
| Missing icon | Old :405-417 provides a 32px icon circle | Existing vNext linked `StatTile` intentionally has no icon; no invented icon supplied | Open item, not exact card identity |

### Exact-value table C — course assessment counters

| Property / state | Original `lms2-fe@prod-2026/src/styles/components/_learn-assessments.scss` | `learner-assessment-metrics.module.css` / `learner-assessment-overview.tsx` | Result |
| --- | --- | --- | --- |
| Background, border, radius, padding | :11-22,1515-1523 `#fff`, 1px `#e5e9f0`, radius12, padding16, gap16 | `.tile` has exact values, all five `<StatTile>` instances scoped | Match |
| Count | :1543-1552 dark `#1a1d21`, 22px/700, line-height1 | `.tile > p:nth-child(2)` visually first, tabular | Match |
| Label | :1554-1558 muted `#6b7280`, 12px/700 | `.tile > p:first-child` visually second, 12px/700 | Match |
| Four-across original | :1508-1513 repeat(4,1fr) gap16 margin24px 0 | `.metricGrid` 5 equal columns at desktop to preserve vNext fifth metric (`Courses`); gap16 margin24px 0 | Grid-count exception |
| Tablet <=1100 | :1797-1801 2 columns | `@media(max-width:1100px)` 2 columns | Match |
| Phone <=767 | :1804-1814 1 column | `@media(max-width:767px)` 1 column | Match |
| Missing icon treatment | :1530-1541 old 40px icon circles | vNext current data has no matching icon element; not fabricated | Open visual discrepancy |

### Exact-value table D — receipt and upload progress

| Page and meter | Old-LMS grounded bar value | New rendered value | Status |
| --- | --- | --- | --- |
| TPO notification-read meter | General original TPO report `_tpo-reports.scss:465-477` track11px, `#e7ecf2`, round999, fill `#26bac7`; notification-specific old meter has no separate SCSS | `tpo-notice-read-progress.tsx` uses `MetricBar` with `report-bar-chart.module.css:35-46` and real delivered/read values | Source-aligned TPO bar palette, **not** directly verified notification-specific legacy UI |
| TPO read zero-delivery | Original absence of measurable delivered fraction should not synthesize data | `data.delivered>0` guard preserved | Match behavior |
| Project resource upload | Original project progress family uses teal/cyan `#26bac7/#9ee4e8`, compact 8px in existing project module; no specific original upload-meter selector | `project-resource-files-panel.tsx` uses existing `project-workspace-readiness.module.css:30-37`, `MetricBar` role progressbar, real 0-100 upload fraction | Matches project progress family; upload-specific original visual unverified |
| Super Admin placement-cell read | General LMS `metric-bar.tsx` compact 8px teal/cyan backed by original `_variables.scss` tokens; no unique legacy Admin read meter | `admin/announcements/page.tsx` replaces native progress with self-closing `MetricBar`, `value={cellRead}`, `maximum={1}`, same accessible label | Token match, native browser meter standardized |
| In-progress refresh/error/cancel | Preserve existing loading, retry, refresh, and cancel behavior in all pages | All values/conditional branches/API requests unchanged | Source preservation, runtime not checked |

### Source-level coverage and responsive proof

Complete remote files were read after edits. The following are **source-backed counts**, not shell-executed greps; commands provided to reproduce in a checked-out repository:

| Reproduction | Observed complete-file result |
| --- | --- |
| `grep -o '<MetricBar' src/components/courses/learner-quiz-attempt.tsx | wc -l` | **1**, `styles.track` **1**, `styles.header` **1** |
| `grep -o '<Button' src/components/courses/learner-quiz-attempt.tsx` and `grep -o '</Button>'` | **12 / 12** |
| `grep -o '<StatTile' src/components/courses/learner-assessment-overview.tsx | wc -l` | **5**, `styles.tile` **5** and grid class once |
| `grep -o '<StatTile' src/components/placements/learner-placements-dashboard.tsx | wc -l` | **1** mapped component called for **4** metric slots, scoped `metricStyles.tile` and `metricStyles.link` |
| `grep -o '<MetricBar' src/components/tpo/tpo-notice-read-progress.tsx`, project files panel, admin announcements page | **1 + 1 + 1** |
| `grep -o '<progress' <these three files>` | **0 + 0 + 0** (raw meters replaced) |
| `grep -o '<input' src/components/projects/project-resource-files-panel.tsx` | **1**, deliberate **type=file native exemption** retaining file chooser semantics |
| Source `<Link>` open/close (learner dashboard, assessment overview) | **15/15; 7/7** |
| Source `<Button>` open/close (TPO notice, project files, assessment overview) | **2/2; 8/8; 5/5** |
| CSS class cross-reference in all six touched TSX files | **All references resolve**; no missing CSS module class |
| Duplicate quote before `className` in all touched TSX files | **0** |
| CSS breakpoint validation | Quiz <=767/reduced-motion; learner placements <=767/reduced-motion; assessments <=1100, <=767/reduced-motion; reused TPO bar <=767, project <=767/reduced-motion |

**Unchanged exact TPO stacked-bar recheck:** `src/app/(authenticated)/tpo/batches/page.tsx` and `.../batches/[batchId]/page.tsx` each have **1 self-closing `StackedMetricBar`**, both referencing `legacy-batch-eligibility.module.css .bar`; original `_tpo-batches.scss:39-43` is 6px/round999/TPO line `#e7ecf2`, green `#15803d`, red `#b91c1c`. Existing CSS defines exactly those values. No breakpoint-specific old style for this meter (both call sites keep responsive parent layout).

**Strict status:** No E7/G6 umbrella tick — source checks do not prove exhaustive screen/page coverage, hover and focus within all views, or computed desktop/tablet/mobile parity. Not run: app, code, TypeScript compiler, tests, CI, screenshot, repository-wide grep. The changed UI only paints measured values; no access scope, data or routes were altered.

**Next exact unticked source surface:** `src/app/(authenticated)/tpo/companies/[companyId]/page.tsx` (hand-rolled year-by-year recruitment chart; search current `style={{width:...}}` and original `lms2-fe@prod-2026/_tpo-intelligence-light.scss` first). Also review any other non-shared progress visual only when a direct legacy style source is confirmed.


## 2026-10-20 chat-2 TPO confirmed-joins per-year chart source migration

**Source migrated:** `src/app/(authenticated)/tpo/companies/[companyId]/page.tsx`, with `src/components/tpo/legacy-company-year-chart.module.css`. Kept original vNext `hiringPulse.hiredPerYear`, `joinedLearners`, `maxYearlyHires`, no-recorded-data state, IST joining-year semantics and existing screen copy unchanged. One hand-rolled width-percentage span became a self-closing shared `MetricBar role="img"` with its own accessible label. Unlike the old `Math.max(3,...)` percentage-width floor, any nonzero value now uses the legacy 2px minimum fill while the accessible percentage is computed from the real numerator/denominator.

### Exact-value / original-style comparison

| Property/state | Original `lms2-fe@prod-2026` | vNext and proof | Result |
| --- | --- | --- | --- |
| Year row grid | `src/styles/components/_tpo-crm.scss:1220-1226`: grid `70px minmax(0,1fr) 28px`, gap8, margin-top6, align center | `legacy-company-year-chart.module.css:7-14`; mapped list row uses `yearStyles.yearRow` | Match |
| Year label | `_tpo-crm.scss:1227-1233`, `_tpo-intelligence-light.scss:438-441`: 12px `#5b6b82`, ellipsis and nowrap | CSS `.year`, 12px, muted, ellipsis; recorded year text preserved | Match |
| Track | `_tpo-crm.scss:1235-1240`, light override `_tpo-intelligence-light.scss:443-449,783-794`: 7px, radius999, `#e7ecf2` | CSS `.track`, shared `MetricBar` overrides height to 7px/round999/`#e7ecf2` | Match |
| Filled bar | `_tpo-crm.scss:1241-1247`; light override `_tpo-intelligence-light.scss:443-448`: linear 90deg `#9ee4e8` to `#26bac7`, 2px minimum only when nonzero | CSS `.track > div` gradient and `[aria-valuenow]:not([aria-valuenow="0"]) > div` min2px | Match |
| Count text | `_tpo-crm.scss:1250-1254`; light override :451-453: 12px, right-aligned, `#172033` | CSS `.count` 12px, 700, tabular, dark ink | Match |
| Empty/no dated joins | Existing vNext page's measured-data empty state, not a rendered zero-bar list | Same `hiringPulse.hiredPerYear.length===0` branch untouched | Match existing semantics, not old-page DOM parity |
| Phone <=767px | Original TPO detail row uses same three-column grid; no special collapse for this graph | CSS media keeps min-width0 and the same 70px/1fr/28px; no fixed 4rem/3rem chart axes | Source geometry match; browser not run |
| Reduced motion | Original flat meter contains no interpolated hover/transition | CSS disables fill transition when reduced-motion requested | Safe improvement |

**Scoped source grep results:** full 476-line TPO company detail fetched after write: `<MetricBar` **1**, hard-coded `style={{width:...` year-bar expressions **0**, `<Link>` **12/12**, raw native button/input/select/textarea **0**, malformed consecutive JSX quote-before-className **0**. All **four** `yearStyles` class references resolve to the module. CSS media selectors `max-width:767px` and reduced-motion exist. There is no app build, TypeScript run, actual employer-record data test, screenshot or full repository grep.

**Next file if E7 work continues:** `src/components/courses/faculty-lesson-video-manager.tsx` (upload-meter paint) and `src/components/courses/assignment-file-submission-control.tsx` (multipart upload meter). Before changing them, verify whether upload-specific old LMS dimensions differ from current shared `MetricBar`; the source `_learn-assignments.scss` had no explicit matching upload-progress selector in inspected source, so do not guess. E7 umbrella remains **[ ]**.


### 2026-10-20 employer focused-review progress extension

`src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx` now uses the existing shared `MetricBar` for the focused-review pager (no raw browser progress left). Its `src/components/hr/recruiter-drive-funnel.module.css .reviewTrack` derives from `lms2-fe@prod-2026/src/styles/components/_recruiter-v2.scss:114-119`.

| State/value | Legacy | VNext | Verdict |
| --- | --- | --- | --- |
| Review pager bar flex | `_recruiter-v2.scss:117` `flex:1 1 120px`, min100px and zero margin | `.reviewTrack` flex1 1 120px, min100, margin0; mapped focused-review `MetricBar` | Match |
| Track | Old recruiter Ant `Progress`, legacy LMS primary palette | 8px `#e7ecf2` track; teal `#26bac7` fill, rounded999 | Token match; Ant-computed height not inspected |
| Counts and navigation | Legacy one-based progress position and total; previous/next | Existing `focusedNavigation.index+1`, `.total`, previous/next href unchanged | Source semantics match |
| Phone <=767px | Must remain fluid and not shrink below readable bar width | Module media keeps min-width100 and flex; surrounding nav wraps | Source responsive guard; no browser proof |
| Unavailable state | Pager only when navigation exists | Existing `focusedNavigation ? ... : null` unchanged | Match existing conditional state |

Full HR detail source after write: `<MetricBar` **2** (hiring pipeline and focused review), native `<progress` **0**, `<Link>` **27 opening / 27 closing**, native button/input/select/textarea **0**, duplicate-quote-before-className **0**; `funnelStyles` classes `stage,label,count,track,note,reviewTrack` all resolve. Static scoped checks only; no compilation/browser/app execution.

**Next untouched E7 file:** `src/components/courses/faculty-lesson-video-manager.tsx` (shared upload progress visual) or `src/components/courses/assignment-file-submission-control.tsx`; both already use `MetricBar`, so only change after original upload-specific styles have been found and compared; avoid made-up exact values. E7 category remains **[ ]**.

## 2026-10-20 replacement chat-2 — exact legacy learner snapshot and assessment counter repairs

**Source changes:** `src/components/placements/learner-placement-metrics.module.css`, `learner-placements-dashboard.tsx`, `learner-placement-snapshot-glyph.tsx`; `src/components/courses/learner-assessment-metrics.module.css`, `learner-assessment-overview.tsx`, `learner-assessment-metric-glyph.tsx`. Only local E7 visual CSS and decorative pictograms changed; business metrics, routes, captions, filters and behaviors remain vNext. **Status: individual source comparison, not E7 category certification**.

### Learner placement snapshot: focused-dashboard legacy reference corrected

Earlier audit compared to the original `learn-placements-stat-card` (the *older* stat variant), but `lms2-fe@prod-2026/src/pages/learn/my-placements/index.js:824-853` actually renders `placements-focus-stat`. Matching the *rendered* selector at `src/styles/components/_learn-placements.scss:1909-2002,2472-2513` resolves the previous 12px radius/no-icon mismatch.

| Property/state | Legacy source and value | vNext caller/CSS value | Source status |
| --- | --- | --- | --- |
| Desktop grid | `_learn-placements.scss:1910-1914`: 4 equal columns, gap 12px | `learner-placement-metrics.module.css .snapshot`: 4 equal, gap12 | Match |
| Phone <=767px grid | `:2472-2476`: 2 equal, gap8px | `@media(max-width:767px) .snapshot` 2 equal gap8 | Match |
| Tile | `:1917-1924`: white, 1px #e5e9f0, radius14, padding16 | `.tile` same | Match |
| Hover | `:1925-1934`: 150ms cubic-bezier(.2,0,0,1), translateY(-1), rgba(14,124,135,.35), two-layer shadow | `.tile`, `.link:hover .tile` same | Match |
| Keyboard focus | `:1936-1939`: 2px #0e7c87 offset2 | `.link:focus-visible .tile` same | Match |
| Icon tile | `:1946-1957`: 34x34, radius10, teal-deep #0e7c87, rgba(38,186,199,.1), 17px glyph, mb12 | `.icon` same; four decorative SVG silhouettes (glyph path shape remains Ant-vs-SVG approximation) | Geometry/paint match; **glyph shape not exact** |
| Count | `:1965-1969`: 24px/600/1.1/#1a1d21 | `.tile > p:nth-child(2)` same | Match |
| Caption | `:1972-1977`: margin-top4, 14px/500/1.4/#54505d | `.tile > p:first-child` same | Match |
| Helper | `:1980-1989`: flex gap4, top4, minheight15, 12px/1.4/#54505d | `.detail` same, original vNext arrow and text preserved | Match |
| Phone tile | `:2478-2513`: grid icon/value then label/helper, pad12, icon28, count20, caption13 | Local media grid/icon/value/caption same | Match |
| Loading / failed text | Original local data-fetch skeleton and errors in `my-placements/index.js:828-849` | vNext partial-data read renders em-dash and explanatory helper; existing server-projected data contract retained | **Content-model exception**, not pixel-matched skeleton |
| Reduced motion | Legacy optional motion suppression elsewhere in file | Local `prefers-reduced-motion:reduce` removes tile transition and hover transform | Match safe behavior |

**File-scope grep proof (complete fetched source, after write):** `grep -o '<StatTile' src/components/placements/learner-placements-dashboard.tsx | wc -l` ⇒ 1 component template for four data slots; `grep -o '<PlacementSnapshotGlyph'` ⇒ 1; four `kind` props (`jobs,applications,assessments,interviews`); native control opening tags ⇒ 0. CSS references `snapshot,tile,icon,detail,link` all exist; SVG paths are local and `aria-hidden`. At <=767, desktop layout becomes 2-up and icon/value row. No browser evaluation, no all-source grep.

### Assessment counter: source-matched icon geometry rather than missing icons

`lms2-fe@prod-2026/src/styles/components/_learn-assessments.scss:1508-1558,1797-1814` is the source for the assessment-card family, which displayed a 40px icon in a horizontal row. The vNext page retains five counts where the old source card group had four.

| Property/state | Legacy value (source:line) | New CSS/caller value | Status |
| --- | --- | --- | --- |
| Desktop columns/gap/margin | `_learn-assessments.scss:1508-1513`: 4 columns, gap16, margin24 | `learner-assessment-metrics.module.css .metricGrid`: **5** columns, gap16, margin24 | Column-count exception for fifth vNext counter |
| Card | `:1515-1523`: horizontal icon/copy gap16, padding16, border1px #e5e9f0, radius12, white | CSS `.tile` grid equivalent icon/copy, gap16, padding16, same paint | Match visual geometry (grid rather than flex DOM) |
| Icon | `:1530-1541`: 40x40, radius12, #6b7280 text, #fafbfc background, 18px | CSS `.icon`; five local aria-hidden glyph silhouettes | Paint match; SVG paths not verified as Ant-identical |
| Number | `:1543-1552`: 22px/700, line1, #1a1d21 | CSS `.tile > p:nth-child(2)`: 22/700/1/dark | Match |
| Label | `:1554-1558`: 12px/700 #6b7280 | `.tile > p:first-child`: same | Match |
| Tablet <=1100 | `:1797-1801`: 2 columns | CSS media 2 columns | Match |
| Phone <=767 | `:1804-1814`: 1 column | CSS media 1 column | Match |
| Zero/empty/loading | Existing vNext scoped counts, notices and empty states unchanged | Same conditional rendering and data values | Source semantics retained; no runtime equivalence claimed |

**File-scope grep:** five `<StatTile` opening / five `</StatTile>` closing pairs, five `<AssessmentMetricGlyph` self-closing children, five CSS `styles.icon` references, zero raw native select/input/textarea/button opening tags in the complete `learner-assessment-overview.tsx` source. Pictograms are decorative, never additional names or data. Breakpoints and reduced-motion media exist in the local CSS. **No TypeScript compiler, test, lint, runtime, responsive screenshot, original Ant icon path extraction, or CI ran**.

### STRICT TICK STATUS

- [ ] E7 stat tiles (missing: category-wide all-portal style/state inventory and full repository grep; original Ant SVG paths; side-by-side computed visual verification).
- [ ] E7 funnel/progress/charts/calendar (missing: remaining surfaces and source reference/whole-repo coverage proof).
- [ ] G6 boards (missing: remaining variants and touch/keyboard state proof).
- [ ] E8 export contracts (ownership now under chat-14 for AG Grid; missing all endpoint contract proof).
- [ ] Native controls (owner master-queue codemod supersedes manual migration; still needs all-repo native-tag grep).

**Next untouched E7 surface:** `src/components/courses/faculty-lesson-video-manager.tsx` (upload progress) and `src/components/courses/assignment-file-submission-control.tsx` (upload progress). These already render `MetricBar`; locate an exact old upload meter selector before changing their paints. If none exists, leave them unchanged with an explicit legacy reference gap. Then `src/components/placements/placement-calendar-workspace.tsx` for any unreviewed responsive week/day interaction.
