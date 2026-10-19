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
