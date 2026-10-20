# Faculty / Teacher and Super Admin Academics / People — UI clone

Owner: chat-3; branch: `chatgpt/chat-3-b`. Branch fast-forwarded to main at `d915bd67b20838f496d2a5b25b4365e748a35dd5` on 2026-10-19. Do not edit `src/components/ui/*`.

## Work queue

Source: complete recursive GitHub tree of current `main`, filtered like `find src/app/'(authenticated)'/teacher src/app/'(authenticated)'/admin/{academics,people,recruiters} -name 'page.tsx' -o -name 'layout.tsx'` and component prefix filtering. This is a **path inventory**; not yet an executed local grep or a count of raw controls. Mark all unchecked until the strict value, coverage, responsive and no-regression proofs exist.

### Routes & layouts (46)

- [ ] `src/app/(authenticated)/admin/academics/page.tsx`
- [ ] `src/app/(authenticated)/admin/academics/sections/[sectionId]/page.tsx`
- [ ] `src/app/(authenticated)/admin/people/directory/[membershipId]/audit/page.tsx`
- [ ] `src/app/(authenticated)/admin/people/directory/[membershipId]/page.tsx`
- [ ] `src/app/(authenticated)/admin/people/directory/page.tsx`
- [ ] `src/app/(authenticated)/admin/people/page.tsx`
- [ ] `src/app/(authenticated)/admin/people/unassigned/page.tsx`
- [ ] `src/app/(authenticated)/admin/recruiters/page.tsx`
- [ ] `src/app/(authenticated)/teacher/allAssignments/page.tsx`
- [ ] `src/app/(authenticated)/teacher/allQuizzes/page.tsx`
- [ ] `src/app/(authenticated)/teacher/calendar/page.tsx`
- [ ] `src/app/(authenticated)/teacher/contacts/[contactsTab]/[membershipId]/page.tsx`
- [ ] `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx`
- [ ] `src/app/(authenticated)/teacher/contacts/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/assessment-health/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/assignments/manage/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/attendance-corrections/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-history/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-participation/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussions/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/[learnerMembershipId]/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/layout.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/notices/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/quizzes/manage/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/reports/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/session-coverage/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/students/[membershipId]/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/page.tsx`
- [ ] `src/app/(authenticated)/teacher/layout.tsx`
- [ ] `src/app/(authenticated)/teacher/live-classes/page.tsx`
- [ ] `src/app/(authenticated)/teacher/notifications/page.tsx`
- [ ] `src/app/(authenticated)/teacher/profile/contacts/page.tsx`
- [ ] `src/app/(authenticated)/teacher/profile/details/page.tsx`
- [ ] `src/app/(authenticated)/teacher/profile/page.tsx`
- [ ] `src/app/(authenticated)/teacher/profile/teaching/page.tsx`
- [ ] `src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx`
- [ ] `src/app/(authenticated)/teacher/report/assignment/[contentId]/submissions/page.tsx`
- [ ] `src/app/(authenticated)/teacher/report/quiz/[quizId]/attempts/page.tsx`
- [ ] `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx`
- [ ] `src/app/(authenticated)/teacher/response-followups/page.tsx`
- [ ] `src/app/(authenticated)/teacher/results/page.tsx`

### Directly related components (48)

- [ ] `src/components/academics/academics-actions.tsx`
- [ ] `src/components/academics/academics-create-panel.tsx`
- [ ] `src/components/academics/academics-overview.tsx`
- [ ] `src/components/academics/academics-section-page.tsx`
- [ ] `src/components/academics/section-operations.tsx`
- [ ] `src/components/admin/super-admin-attendance-settings-editor.tsx`
- [ ] `src/components/admin/super-admin-faculty-assignment-create.tsx`
- [ ] `src/components/admin/super-admin-faculty-bulk-import.tsx`
- [ ] `src/components/admin/super-admin-faculty-schedule-reassign-action.tsx`
- [ ] `src/components/admin/super-admin-people-csv-control.tsx`
- [ ] `src/components/attendance/faculty-attendance-schedule-editor.tsx`
- [ ] `src/components/attendance/faculty-attendance-workspace.tsx`
- [ ] `src/components/courses/faculty-assessment-create.tsx`
- [ ] `src/components/courses/faculty-assessment-editor.tsx`
- [ ] `src/components/courses/faculty-assessment-lifecycle.tsx`
- [ ] `src/components/courses/faculty-assessment-overview.tsx`
- [ ] `src/components/courses/faculty-assignment-editor.tsx`
- [ ] `src/components/courses/faculty-assignment-material-links.tsx`
- [ ] `src/components/courses/faculty-assignment-method-picker.tsx`
- [ ] `src/components/courses/faculty-assignment-review.tsx`
- [ ] `src/components/courses/faculty-choice-quiz-builder.tsx`
- [ ] `src/components/courses/faculty-contacts-table.tsx`
- [ ] `src/components/courses/faculty-content-editor.tsx`
- [ ] `src/components/courses/faculty-content-order-editor.tsx`
- [ ] `src/components/courses/faculty-course-filter-auto-submit.tsx`
- [ ] `src/components/courses/faculty-course-home-signals.tsx`
- [ ] `src/components/courses/faculty-course-list.tsx`
- [ ] `src/components/courses/faculty-course-roster.tsx`
- [ ] `src/components/courses/faculty-course-tab-navigation.tsx`
- [ ] `src/components/courses/faculty-course-workspace.tsx`
- [ ] `src/components/courses/faculty-ist-quarter-hour-picker.tsx`
- [ ] `src/components/courses/faculty-item-actions.tsx`
- [ ] `src/components/courses/faculty-lesson-authoring.tsx`
- [ ] `src/components/courses/faculty-lesson-video-manager.tsx`
- [ ] `src/components/courses/faculty-live-class-editor.tsx`
- [ ] `src/components/courses/faculty-quiz-learner-preview.tsx`
- [ ] `src/components/courses/faculty-quiz-question-editor.tsx`
- [ ] `src/components/courses/faculty-quiz-review.tsx`
- [ ] `src/components/courses/faculty-report-csv-download.tsx`
- [ ] `src/components/courses/faculty-report-download.tsx`
- [ ] `src/components/courses/faculty-report-student-table.tsx`
- [ ] `src/components/courses/faculty-submission-file-review.tsx`
- [ ] `src/components/courses/faculty-video-preview.tsx`
- [ ] `src/components/people/faculty-profile-editor.tsx`
- [ ] `src/components/people/faculty-profile-metadata.tsx`
- [ ] `src/components/people/faculty-profile-repeatable.tsx`
- [ ] `src/components/people/faculty-profile-skills.tsx`
- [ ] `src/components/people/faculty-profile-text-section.tsx`

### Required greps (pending execution and recorded counts)

```sh
rg -n '<(button|select|input|textarea|table)([[:space:]>])' 'src/app/(authenticated)/teacher' 'src/app/(authenticated)/admin/academics' 'src/app/(authenticated)/admin/people' 'src/app/(authenticated)/admin/recruiters' src/components/courses src/components/attendance src/components/people src/components/academics src/components/admin
rg -n '#[0-9A-Fa-f]{3,8}\\b|fixed inset-0|role=.?(alert)?dialog|<h1([[:space:]>])' SAME_PATHS
rg -n '<PageHeader([[:space:]>])' SAME_PATHS
```

Components shared with other portals must be narrowed by usage rather than changing others' ownership. Replace *only* page-owned raw controls with `src/components/ui` equivalents. Preserve section content, forms, handlers, semantics and responsive behavior; review every touched closing JSX tag.

## Strict tick status

- [ ] H Teacher/faculty pages (missing: raw-control inventory and migration, legacy/current file:line comparison tables, zero remaining grep hits, phone/tablet proof).
- [ ] H Assessments/quiz/attendance/grades components (missing: reference/usage graph and strict coverage proof).
- [ ] H Super Admin academics/people/recruiters (missing: raw-control migration, strict coverage proof).

Reference facts: `docs/design/old-lms-pages.md` prescribes one #fff canvas radius 12, border #e5e9f0, 24px padding on #f1f4f9, inline subtitle/title/right actions. `docs/design/legacy-styles/components___variables.scss` defines 767px / 991px / 1024px breakpoints. `src/components/ui/page-header.tsx` exposes PageHeader. Shared skins belong to their owner lane; do not modify them here.

## Next file

`src/app/(authenticated)/teacher/allAssignments/page.tsx` — audit the styled link and downstream `src/components/courses/faculty-assessment-overview.tsx`, then proceed in route order.

## Turn 1: verified changes (2026-10-19)

- Branch was originally 2,289 commits behind `main` and 0 ahead; fast-forwarded the lane ref to `d915bd67b20838f496d2a5b25b4365e748a35dd5` before writing.
- Migrated the one visible plain `<button type="submit">Filter</button>` at `src/app/(authenticated)/teacher/live-classes/page.tsx` to `<Button type="submit">Filter</Button>`; retains GET form submission, button text and semantics. Confirmed identical opening/closing JSX tag case by direct full-file review; no code/tests/CI executed.
- Removed TypeScript-conflicting duplicate named UI imports in `faculty-assessment-overview.tsx` (Button), `faculty-ist-quarter-hour-picker.tsx` (Select + Input, including whitespace-variant duplicate), `person-onboard-dialog.tsx` (Checkbox), `faculty-profile-metadata.tsx` (Input), `faculty-profile-repeatable.tsx` (Input + Checkbox), and `faculty-profile-skills.tsx` (Input). No runtime handlers/props changed.
- Full-file textual scan of 36 `src/components/courses/faculty-*` files and selected faculty attendance/profile components found no hardcoded hex or visible raw form controls in the scanned subset. This is **not** exhaustive component coverage; do not tick.
- Full-file scan identified `src/app/(authenticated)/admin/people/directory/page.tsx` with one raw `<input type="hidden" name="tab" ... />`, `teacher/report/assignment/[contentId]/submissions/page.tsx` with four hidden inputs and `teacher/report/quiz/[quizId]/attempts/page.tsx` with three hidden inputs. These are exempt as invisible GET query preservation fields without class/style strings; replacing them with a styled input risks changing form semantics. Audit any other hidden inputs individually.
- `src/components/attendance/faculty-attendance-workspace.tsx` retains one `<h1 className="sr-only">Attendance</h1>`; its embedding course-tab hierarchy must be checked before introducing another visible PageHeader, to avoid duplicate page heads.
- Most inspected teacher route pages already use `PageHeader` or delegate to a workspace; delegated routes require following the rendered component tree. No responsive screenshot/device comparison has been conducted.
- Search counts and the changed-file inspection are intentionally **not** recorded as completed greps or value proof. Strict section H items remain unchecked pending full counts, legacy-vNext file:line comparison tables and responsive proof.

### Exact next file

`src/components/admin/admin-program-directory.tsx` — inspect `src/app/(authenticated)/teacher/report/assignment/[contentId]/submissions/page.tsx` and indirect shared table/overlay components.

### Follow-on migration

- `src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx` directly renders the attendance workspace without a parent `PageHeader`. Replaced that workspace's screen-reader-only `<h1>` with shared `PageHeader` retaining the visible description, course/section/period context, and Schedule Class action; self-closing `PageHeader` and matching `Button` tags manually reviewed. No JSX build or CI run. This closes that specific markup gap, but NOT category H under the STRICT TICK RULE.
- Next inspect assignment submissions report's filter form (hidden-input exemptions, shared control styles), then quiz attempts report and Super Admin directory pages. Audit responsive changes against 767px/991px legacy breakpoints before checking any category.

## Turn 1: navigation and remaining strict proof

- Migrated **20 individually identified back-link instances across 19 route files** to `PageBackLink` (teacher profile/details; course students/discussions/session coverage/discussion participation/attendance detail/gradebook learner; assignment report; faculty course assignments/quizzes/manage and discussion history; contacts detail; assignment submissions invalid-filter state; Super Admin people directory/membership/audit/unassigned routes). Reused unchanged href expressions and visible labels (including the Users & Roles entity), removed `next/link` imports only when no remaining `<Link>` existed. The shared component already has keyboard focus states and a compact responsive treatment. Actual side-by-side phone/tablet verification is **pending**.
- Migrated one styled GET Filter submit button to shared `Button`, and one attendance heading to shared `PageHeader` with the same Schedule Class action. This is a component migration, **not** proof of a pixel-level match.
- Removed duplicate UI import declarations in six faculty/people files, including an import with whitespace-only differences.
- Native hidden `<input type="hidden">` fields in GET filter forms remain intentionally exempt when they have no class/style strings and preserve query state. Visible raw controls still require full coverage scan.
- Shared `src/components/ui/*` was not edited. No code, tests, typecheck, lint, browser rendering, CI, or screenshot comparisons run.
- [ ] Faculty/Teacher H (missing: full grep coverage including transitive components, legacy vs new file:line rows for every state, phone/tablet comparison).
- [ ] Super Admin academics/people/recruiters H (missing: complete page-by-page value/coverage/responsive proofs; the recruiters alias routes to HR and must be coordinated with HR owner).
- [ ] Formal JSX/type validation (not run by lane constraint; manually reviewed each changed tag pair and new self-closing component).

**Commit handoff:** 31 commits ahead of `main` at `d915bd67b20838f496d2a5b25b4365e748a35dd5`, 0 behind when checked immediately before this audit update. GitHub Contents API writes each commit directly to `chatgpt/chat-3-b`; no main push. 
**Next file:** `src/components/admin/admin-program-directory.tsx`. Check Super Admin academic program filter/button variants, responsive breakpoints, and exact legacy values. Do not alter shared `ui` files.


## Bounded turn 2 — value/state sweep (2026-10-19)

Starting point: `main` at `46cd0161a0e289e7da68e615359589b03ee463e9`. Lane had 0 lane-only commits / 1,029 behind and was fast-forwarded before changes. **37 new [chat-3] commits** were pushed directly to the lane branch during this turn. Main advanced concurrently and already incorporated the first 10 commits; its later sync must preserve the remaining commits and unrelated upstream files.

### Paths and changes

- `src/components/admin/admin-program-directory.tsx`: replaced custom rows-per-page control with shared `PageSizeSelect`; made toolbar fit narrow canvases; defined DataTable primary/secondary/action column priorities; made form and pagination actions touch-sized.
- `src/components/courses/faculty-course-tab-navigation.tsx`: removed codemod duplicate Select import; used shared `PageBackLink`; matched section selector responsive widths and shortcuts to outlined control tokens; preserved route destinations and actions.
- `src/components/attendance/faculty-attendance-workspace.tsx`: replaced hand-made two-button mode pill with `SegmentedControl`; the confirmation-before-discard callback remains in the onChange path; kept Present/Absent as accessible, tone-distinct `aria-pressed` buttons with larger mobile hit areas.
- `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx` and `src/app/(authenticated)/admin/people/directory/page.tsx`: moved hand-rolled active tab links to shared link-mode `Tabs`; removed nested contact directory canvas styling, retained URLs and counts.
- `src/components/people/faculty-profile-editor.tsx`: flattened profile section jump navigation and matched in-page anchors to shared token palette and focus/touch rules. These remain **anchors, not tabs**, because they scroll to headings on one page.
- `src/app/(authenticated)/teacher/calendar/page.tsx`: placed live-class shortcut in shared `PageHeader.actions`; adjusted month navigation, filters, and grid day border/surface tokens.
- `src/app/(authenticated)/teacher/results/page.tsx` and `src/app/(authenticated)/teacher/response-followups/page.tsx`: switched hand-rolled link pagers to `Pagination` with existing server href builders; used responsive form grids, shared control states, and consistent heading shortcuts.
- `src/app/(authenticated)/admin/academics/page.tsx`: moved scoped and unscoped shortcuts into shared `PageHeader.actions`, keeping permission-specific content; normalized outlined action states and mobile targets.
- `src/app/(authenticated)/admin/people/page.tsx`: rendered role labels as shared neutral `Badge` pills; moved CSV action into header beside onboarding; matched filter layout and Search hit target to token system.
- `src/components/courses/faculty-assessment-overview.tsx`: normalized assessment dates to Asia/Kolkata, matched secondary action links, delayed three-column filter layout until md, kept pager wrapping on phones.

### Partial legacy-to-vNext value review (NOT completion proof)

| Item/property | Legacy source and value | Current source/state | Assessment |
|---|---|---|---|
| Page canvas | `docs/design/old-lms-pages.md:6`: white, 12px radius, 1px #e5e9f0 border, 24px padding over #f1f4f9 | Inherited from shared canvas; this lane did not modify `src/components/ui/page-canvas.tsx` | Shared-owner verification and screenshot comparison outstanding |
| Shell neutral border/background | `docs/design/legacy-styles/components___variables.scss:30-31`: #e5e9f0 / #f1f4f9 | Route panels use `var(--lms-canvas-border)` and `var(--lms-neutral-50)` / `var(--lms-surface)`; verify values resolved from globals | Token-resolution proof missing |
| Page heading | `docs/design/old-lms-pages.md:7`: approx. 30px/600; `components___listing-page-header.scss:52-54`: 28px/600 | `src/components/ui/page-header.tsx:28,33-34`: 20px mobile / 30px desktop, 600 | Source specs differ; follow global owner choice, no tick |
| Responsive threshold | `components___variables.scss:148-156`: 767px and 992px breakpoint definitions | `src/components/ui/page-header.tsx:28` and migrated routes use Tailwind sm/md breakpoints | Visual breakpoint-by-breakpoint comparison missing |
| Legacy listing tab text | `docs/design/legacy-styles/pages___admin-list-pages.scss:239-241`: 0.875rem | `src/components/ui/tabs.tsx:89-90`: 13px link-mode tabs with 3px underline | Value mismatch/owner-level shared component work; leave unticked |
| Listing metric text | `components___listing-page-header.scss:171-178`: 13px | `src/components/ui/badge.tsx`: `var(--lms-font-xs)` | Resolve token before claiming equality |
| Faculty attendance mode | Legacy selected pills not independently proven; source `components___variables.scss` defines shared palette | `src/components/attendance/faculty-attendance-workspace.tsx:502-510` delegates to `SegmentedControl` and `src/components/ui/segmented-control.tsx:17-23` | Behavior preserved in source; no visual claim |
| Program page size | `pages___admin-list-pages.scss:9,39`: filter width 220px in a specific admin list | `src/components/admin/admin-program-directory.tsx:194`: shared PageSizeSelect auto width | Different control role; compare in browser, no tick |
| Tab strip/selection | `pages___admin-list-pages.scss:235-245` gives inset/padding rules | `src/components/ui/tabs.tsx:88-90` owns the underline and focus states | This lane only migrated consumers; shared-owner parity pending |

### Strict statuses — unchanged

- [ ] Teacher/Faculty Section H (missing full transitive-component raw-control/hex/overlay grep totals, exact per-property legacy/current values for all states, device-width screenshot proof).
- [ ] Super Admin academics/people/recruiters Section H (missing full portal-wide coverage and 767px/tablet behavior; recruiters aliases an HR-owned implementation).
- [ ] Regression proof (no build, lint, typecheck, browser or CI executed by user instruction; all changed JSX opening/closing tags were inspected in touched snippets).
- [ ] Pixel parity: orchestrator-owned side-by-side visual verification.

**Next file:** `src/components/academics/academics-overview.tsx` — inspect table/status badges and accordion/tabs of the Super Admin academic workspace, then `src/components/academics/section-operations.tsx`. Do not edit shared `src/components/ui/*`.

### Upstream synchronization after turn

While this turn was underway, `main` moved from `46cd0161a0e289e7da68e615359589b03ee463e9` to `55a3efe0a5917631ab26e17e158a29f6e5282e25`. Three same-path upstream edits (`admin-program-directory.tsx`, `faculty-course-tab-navigation.tsx`, `faculty-attendance-workspace.tsx`) had **identical Git blob SHA** on both sides, reflecting commits already picked up by main. The remaining ten lane-only changed files were overlaid onto main's tree and recorded in the two-parent merge commit `5e6d093b7725f88b5240bbf7d2547a52b89153b8`, pushed **only** to `chatgpt/chat-3-b`. This preserves both upstream changes and the lane's prior commit history; it is a **merge sync, not a rebase**. No change to `main` was made by this lane.

Turn total after this audit update: 40 pushed commits (37 UI/code commits, two audit updates, one upstream merge commit); no CI or application execution.

## Turn 3 — Academics overview and section operations (2026-10-19)

Read `docs/orchestrator/queues/master-queue.md` OWNER GOAL, CODEMODS and SMARTER PLAN. Per the SMARTER PLAN, fixed only portal-owned judgement cases and page layouts; **no shared skins/components, raw-control codemods or TypeScript compilation were run**. `docs/audit/ux/parity-report.md` was not available at the beginning of this turn (repository fetch returned not found). Category H stays unchecked.

**Branch baseline:** main `5a2abb4bba7e3bcfcf7523ffde18a0346e3590ed` was 447 commits ahead of the lane; fast-forwarded first. 33 file commits were made in the lane before this audit update; some have already appeared on a newer `main` via the orchestrator. Reconciled same-path Git blobs before final upstream synchronization.

### Changes / evidence by target

- `src/components/academics/academics-overview.tsx`: four DataTable definitions use explicit `mobilePriority="primary"` for each entity identity, `"action"` for management controls, plus `"secondary"` for selected statuses/cohorts. Grouped cohort and section headings with `aria-labelledby`/matching IDs. Kept capacity numerals tabular and changed outer vertical spacing to `var(--lms-space-5)`; all four underlying table data sources and mutations remain intact.
- `src/components/academics/section-operations.tsx`: four typed `DataTableColumn<Row>[]` structures prioritize identity/actions on phones; mutation buttons wrap and retain their handlers; learner/faculty selectors have explicit accessible names; schedule filter grid has responsive tablet/desktop widths; action buttons have 44px minimum mobile height. Fixed the multiline `as "ADVISOR" | "COORDINATOR"` syntax without changing accepted values.
- `src/components/academics/academics-create-panel.tsx`: four create forms use 24px outer rhythm and canvas border tokens, with responsive two-column fields at tablet size and touch-sized submit buttons. Form state, validation and API actions unchanged.
- `src/components/academics/academics-section-page.tsx`: retained shared `PageHeader`, replaced manually styled Back to Academics link with `PageBackLink` (same URL and accessible label); canvas wrapper now uses 24px spacing.
- `src/components/courses/faculty-course-list.tsx`: changed the hand-written previous/next link row to shared `Pagination` using existing `facultyCourseListHref`; adjusted Apply/Clear filter hit area and secondary outline state while preserving filtering and route params.

### Selected source-level value comparisons (not exhaustive)

| Legacy rule | vNext source-level implementation | Status |
|---|---|---|
| `docs/design/legacy-styles/components___variables.scss:120`: `$space-5:24px` | `src/components/academics/academics-overview.tsx` and `academics-create-panel.tsx` use `space-y-[var(--lms-space-5)]` or `gap-[var(--lms-space-5)]` | Verify computed token and exact page placement |
| `docs/design/legacy-styles/components___variables.scss:30`: `$neutral-200:#e5e9f0` hairline border | `src/components/academics/section-operations.tsx`: `border-[var(--lms-canvas-border)]` | Token value and rendered thickness still require parity report |
| `docs/design/legacy-styles/components___variables.scss:148-150`: 767px, 991px, 1024px reference breakpoints | Four academics-create forms use `md:grid-cols-2`, section schedule `md:grid-cols-2` and `xl:grid-cols-3` | Must check phone and tablet side by side |
| `docs/design/legacy-styles/pages___admin-list-pages.scss:9`: minimum touch target 44px | Section edit buttons and academic create submit controls use `min-h-11 sm:min-h-[var(--lms-control-height)]` | Touch sizing matched in markup, interactive states not fully proven |
| `docs/design/old-lms-pages.md:6`: one white canvas (12px radius, 1px border, 24px padding) | Changes add no new outer canvas; existing forms are separated by hairline dividers | Root canvas still externally owned, no full-value tick |
| `docs/design/legacy-styles/pages___admin-list-pages.scss:239-241`: 0.875rem tab labels | No tabs added to section operations; existing DataTable styling delegated to `src/components/ui` | Shared widget parity owner; this lane did not change global tabs |

### Source-only regression review (not a CI claim)

After editing, re-fetched and inspected **every changed TSX file**. The five changed files show zero textual `<button>`, `<input>`, `<select>`, `<textarea>`, or `<table>` tags and zero hard-coded hex matches in a bounded source-level check. In `section-operations.tsx`, ten `<Button>` match ten `</Button>` and six `<Select>` match six `</Select>`; in `academics-create-panel.tsx`, four Button pairs and six Select pairs match. All new Table/Pagination/PageHeader/PageBackLink components are self-closing. This is **not** a complete transitive grep, responsive proof, parser/typecheck or render test. No build, CI, unit test or local app execution occurred.

- [ ] Faculty/Teacher Section H (missing: whole-portal transitive greps, full parity-report property table, responsive and visual proof)
- [ ] Super Admin academics/people/recruiters Section H (missing: full per-state comparisons for scoped and unscoped academics/people screens; linked HR implementation remains another lane's responsibility)

**Exact next file:** `src/components/academics/academics-actions.tsx` — inspect section action link/buttons and all edit/confirmation dialogs for token and responsive judgement cases; then `src/components/courses/faculty-course-workspace.tsx` for dynamic class tabs/pills.

## Turn 4 — Faculty actions, course Blueprint and people views (2026-10-19)

**Source base:** latest `main` `3a77aebd651756d5a16b9fea375ffc276fa4404b`; lane was fast-forwarded first (144 behind, zero ahead). Reviewed SMARTER PLAN and kept edits in lane-owned portal files. Approximately 38 code commits in this turn, before the audit update/merge. Most initial commits have also been independently incorporated into main while work continued.

### Judgement cases closed in source (strict UI audit remains open)

- `src/components/academics/academics-actions.tsx`: four separate entity action strips now wrap instead of exceeding mobile table cells. Section Open action and small buttons use legacy outlined states, focus and touch-size tokens; existing edit/archive dialogs and mutation behavior retained. Three edit grids now switch to two columns at tablet size, with corresponding column spans.
- `src/components/courses/faculty-course-workspace.tsx`: Blueprint filter navigation uses shared `Tabs` with unchanged filter URLs and selected state; report, students and quiz links share legacy outlined styling; credits use `Badge`, summary tile grid uses tablet breakpoint, lesson subnavigation is flat. **Important conflict reconciliation:** upstream independently moved Overview actions into `PageHeader.actions` and converted Blueprint filters to `Tabs`; reconstructed this file from upstream `main` and reapplied lane styling, preserving the new header action placement and upstream Tabs.
- `src/app/(authenticated)/admin/people/directory/[membershipId]/page.tsx`: read-only membership roles use neutral `Badge` pills while actual statuses remain semantic `StatusBadge`; audit link has mobile touch/focus treatment; return link uses `PageBackLink`; field layout avoids a second canvas.
- `src/app/(authenticated)/teacher/profile/page.tsx`: matched shortcut outlined states, responsive field columns and divider tokens; reconciled against concurrently added upstream hover/focus classes rather than simply overwriting changes.
- `src/components/courses/faculty-assessment-lifecycle.tsx`: removed `window.confirm` and replaced it with `ConfirmDialog`, preserving assessment warning copy, pending/disabled state, optimistic timestamp and mutation. Confirmation state is reset after success/error.
- `src/components/courses/faculty-item-actions.tsx`: replaced native `window.confirm` for archive and close with shared `ConfirmDialog`; Publish still invokes its existing action directly. Confirmation warning copy, API path, payload and errors preserved. Controls have mobile hit areas.
- `src/components/admin/person-onboard-dialog.tsx`: aligned first/last-name and full-width fields with the updated tablet grid, made role selection 44px-tall at mobile sizes.
- `src/components/courses/faculty-assignment-review.tsx`: increased student navigation button hit areas and aligned grade editor fields with the tablet breakpoint.
- `src/components/courses/faculty-quiz-review.tsx`: kept attempted answers and scores inside existing cards but normalized their canvas border/background/padding tokens.

### Bounded textual safety review

Re-fetched all nine then-current lane-only TSX paths from the GitHub branch and inspected component boundaries, imports, close tags, literal hex and suspicious quote patterns. Matched open and close counts for `<Button>`, `<Select>`, `<Dialog>`, `<Link>`, `<Badge>`, `<StatusBadge>`, `<div>`, `<span>`, `<nav>`, `<section>`. Self-closing `PageHeader`, `PageBackLink`, `Tabs`, `ConfirmDialog` are intentionally counted as opens only. No stray quote or raw control tag was identified in this **limited set**. This is not a parser/typecheck/CI or visual test.

### Remaining blockers

- [ ] Strict value/state table and automated computed-style parity for all Faculty + scoped Super Admin pages. No `docs/audit/ux/parity-report.md` was available in the prior turn.
- [ ] Portal-wide coverage proofs for all remaining route and component files, including legacy vs phone/tablet pixel screenshots.
- [ ] Other `window.confirm` uses in `faculty-assignment-review.tsx` (three occurrences) and `faculty-quiz-review.tsx` (one occurrence), which require careful grading transaction-specific dialog state. Do not mark their overlays complete.
- [ ] All category H tick boxes remain open until every strict-proof condition is met. No CI, build, tests or local application run were performed.

**Next exact file:** `src/components/courses/faculty-assignment-review.tsx` — confirmation prompts and grading state judgement cases; then `src/components/courses/faculty-quiz-review.tsx` and `src/components/admin/person-membership-actions.tsx`.


## Targeted review completion — three files, source-level evidence (2026-10-19)

Scope: `src/components/courses/faculty-assignment-review.tsx`, `src/components/courses/faculty-quiz-review.tsx`, `src/components/admin/person-membership-actions.tsx`. This pass completes the **source migrations** for these three files while retaining the API actions, version receipts, roles and current page copy. No build, typecheck, CI or rendered pixel comparison was run. Strict pixel-parity checkboxes remain unticked until computed-style/browser evidence is available.

### 1. Faculty assignment review — implementation complete, visual verification pending

| Visual/state property | Legacy source with exact value | Current implementation with line | Source result |
|---|---|---|---|
| Submission record surface | `legacy-styles/components___variables.scss:30,134`: hairline #e5e9f0; 12px card radius; white from the surface palette | `faculty-assignment-review.tsx:293`: `border-[var(--lms-canvas-border)] rounded-[var(--lms-canvas-radius)] bg-[var(--lms-surface)]`; tokens `globals.css:329,335,71` resolve #e5e9f0, 12px, #fff | Exact source token match |
| Internal padding | `components___variables.scss:119`: `$space-4:16px` | `faculty-assignment-review.tsx:293`: `p-[var(--lms-space-4)]`, `globals.css:343` =16px | Match |
| Form grouping gap | `components___variables.scss:118`: `$space-3:12px` | `faculty-assignment-review.tsx:351`: `gap-[var(--lms-space-3)]`; `globals.css:342` =12px | Match |
| Input/textarea typography + focus/error | `legacy-styles/components___form.scss:111-141`: 13px label, 14px normal entry, teal focus shadow, red error border | `faculty-assignment-review.tsx:354-390` delegates to shared `Input`/`Textarea`; `legacy-skin.css:103-175` owns font, focus and invalid state | Inherited; browser cascade not verified |
| Primary/secondary action skin | Owner north star `old-lms-pages.md:7` + `master-queue.md`: 14px/650, #0a7c88 white, 9px radius, outlined secondary, 36px desktop | `faculty-assignment-review.tsx:394-420` uses shared Button, `ui/button.tsx:11-28`, `globals.css:21-25,331,333` | Default/hover/focus/disabled token mapping verified; shared size=`sm` uses 13px (`button.tsx:18`), not 14px; do not claim full visual equality |
| Phone hit area and form columns | `components___variables.scss:139,148`: 44px target, 767px cutoff; `pages___admin-list-pages.scss:209-215` also 44px phone actions | `faculty-assignment-review.tsx:394,401,410,543,621,629,658,660`: `min-h-11 md:min-h-[var(--lms-control-height)]`; `md:` activates at 768px; `351` has one column below 768px, 2 above | Static breakpoint match; screenshot outstanding |
| Student navigation wrapping | `pages___admin-list-pages.scss:193-215`: narrow 767px layout, touch actions | `faculty-assignment-review.tsx:612-630`: 2-column phone grid and `md:flex` tablet toolbar; same filter and selection handlers | Static phone/tablet proof |
| Selected grading filters | `pages___admin-list-pages.scss:236-242`: bottom rule 1px #e5e9f0, tabs font 0.875rem (14px) | `faculty-assignment-review.tsx:585` delegates to `ui/tabs.tsx:71-89`, which has 13px shared labels and focus/selection rules | Functional migration present; 1px font-size mismatch owned by shared Tabs |
| Confirmation for regrade/save+publish/publish | Native `window.confirm` had no legacy modal styling | `faculty-assignment-review.tsx:92,95-287,446-464` uses one shared `ConfirmDialog`; warning copy and versioned POST/PATCH receipts preserved; guarded in-flight `useRef` | Overlay implementation complete; shared Dialog visuals `ui/dialog.tsx:39-54` |
| Loading/empty/error/success | Legacy `components___form.scss:137-141` red error, neutral/success palette in `components___variables.scss` | `faculty-assignment-review.tsx:439,445,508,601,604,608`: shared `Alert`, `LoadingState`, `EmptyState`; no old raw error blocks | Shared states complete; visual comparison outstanding |
| IST date presentation | User project timezone rule is IST | `faculty-assignment-review.tsx:42-53` explicitly `Asia/Kolkata`; unchanged submission rows | Correct source formatting |

### 2. Faculty quiz review — implementation complete, visual verification pending

| Property/state | Legacy exact source | vNext implementation | Source result |
|---|---|---|---|
| Attempt card/background/border/radius | `components___variables.scss:30,134`: #e5e9f0, 12px | `faculty-quiz-review.tsx:334`: `--lms-canvas-border`, `--lms-canvas-radius`, `--lms-surface`; `globals.css:329,335,71` | Exact match for source values |
| Attempt spacing | `components___variables.scss:118-119`: 12px and 16px | `faculty-quiz-review.tsx:334,365`: `--lms-space-4` and `--lms-space-3`; `globals.css:342-343` | Match |
| Result badges | `pages___admin-list-pages.scss:138-141`: subtle neutral background, 12px | `faculty-quiz-review.tsx:354,374` uses shared `StatusBadge`; `ui/status-badge.tsx:9-18` defines 12px/700 and status tones | Token comparison, not full per-tone screenshot |
| Release/withhold button skin | Owner north star `master-queue.md`: primary #0a7c88, 9px radius, 36px desktop | `faculty-quiz-review.tsx:207-309` uses shared `Button`; `ui/button.tsx:11-28`, `globals.css:21-25,331,333` | Delegated token values; `size=sm` 13px vs owner 14px |
| Phone hit target | `components___variables.scss:139,148`: 44px <=767px; desktop 36px owner | `faculty-quiz-review.tsx:209,219,234,276,290,304`: `min-h-11 md:min-h-[var(--lms-control-height)]` | Static source match for six trigger buttons |
| Responsive drawer/scroll | `pages___admin-list-pages.scss:193-215`: phone treatment | `faculty-quiz-review.tsx:255` uses shared Drawer; `ui/drawer.tsx:37-51` supplies viewport sizing, overscroll, sticky header/footer | Shared behavior; rendered widths not verified |
| Confirmation states | Browser-native confirmation did not match LMS modal skin | `faculty-quiz-review.tsx:106,153-198,439-450`: shared `ConfirmDialog` for publish/hide in both button placements, original warnings and `expectedUpdatedAt` preserved; `resultUpdatePending` ref prevents simultaneous mutation | Source implementation complete |
| Loading/error/empty/success | Legacy messages/palette per `components___form.scss:137-141` and `components___variables.scss:31` | `faculty-quiz-review.tsx:205,317,320,324`: shared Alert/LoadingState/EmptyState with unchanged visible messages | Shared state migration complete |
| Reduced-motion/focus | `components___form.scss:23-32`: keyboard focus distinguished from pointer focus | Inherited `ui/button.tsx:28`, `ui/dialog.tsx:39-54`, `globals.css:193-246` | Source mapping, computed proof pending |

### 3. Super Admin membership actions — implementation complete, visual verification pending

| Property/state | Legacy exact source | vNext implementation | Source result |
|---|---|---|---|
| Action bar and gap | `components___variables.scss:117`: `$space-2=8px` | `person-membership-actions.tsx:202` uses `flex-wrap` and `gap-[var(--lms-space-2)]` | Match to 8px token |
| Action buttons | Owner north star `master-queue.md`: 9px radius, primary #0a7c88, 36px desktop, white on-primary, outlined secondary | `person-membership-actions.tsx:210-258,309-329` uses shared `Button`, `globals.css:21-25,331,333`, `ui/button.tsx:11-28` | Delegated; no local bespoke pill |
| Mobile action height | `legacy-styles/components___variables.scss:139,148`; `pages___admin-list-pages.scss:209-215`: 44px to 767px | `person-membership-actions.tsx:213,224,236,252,311,319` uses `min-h-11 md:min-h-[var(--lms-control-height)]` | Exact static breakpoint comparison |
| Role row minimum height | Same 44px through 767px | `person-membership-actions.tsx:277`: 44px base, 36px from `md`; labels wrap within flex row | Match |
| Role row hover and keyboard focus | `components___variables.scss:13`: subtle teal `#eff8fa`; `components___form.scss:23-32` keyboard-only focus treatment | `person-membership-actions.tsx:277`: hover/focus-within `var(--lms-primary-subtle)`, 150ms `--lms-motion-fast`; Checkbox has 2px keyboard focus outline in `ui/checkbox.tsx:10` | Source color/transition match, outline runtime not verified |
| Checked/disabled checkbox | `components___variables.scss:10,13`: teal accent and subtler background | `person-membership-actions.tsx:282-290` shared Checkbox; `ui/checkbox.tsx:7-10` defines teal checked, disabled, focus and reduced-motion | Shared state present |
| Row hairlines | `components___variables.scss:30`: #e5e9f0 | `person-membership-actions.tsx:269`: `border-[var(--lms-canvas-border)]`, `globals.css:329` #e5e9f0 | Exact token match |
| Role mutation feedback | 13px form label `components___form.scss:111-113`; status palettes in `components___variables.scss` | `person-membership-actions.tsx:292` has screen-reader live pending status; existing `showToast` success/error receipts stay unchanged | Behavior preserved, specific toast computed styling not verified |
| Suspend dialog | `pages___admin-list-pages.scss:193-215`: mobile action touch target | `person-membership-actions.tsx:301-352` uses shared Dialog/Textarea/Button; reason required; pending prevents dismissal; `ui/dialog.tsx:39-54` owns focus/trap/backdrop/footer | Shared modal, static source evidence |
| Terminal END confirmation | Old native prompts not present | `person-membership-actions.tsx:355-364` uses shared `ConfirmDialog`, terminal-warning copy unchanged, `verifiedMembershipLifecycleReceipt` still validates response | Source implementation complete |

### Source-scanned coverage / reproduction grep

The following **whole-file equivalent regex scans were actually evaluated** on the complete UTF-8 GitHub blobs at this lane head, not just search snippets. For reproducibility the shell equivalent is:

```sh
git grep -nE '<(button|input|select|textarea|table|dialog)([ >])|window[.]confirm[(]|#[0-9a-fA-F]{3,8}\\b|rounded-full|aria-pressed' -- \
  src/components/courses/faculty-assignment-review.tsx \
  src/components/courses/faculty-quiz-review.tsx \
  src/components/admin/person-membership-actions.tsx
```

Actual Code Mode full-file scan used the equivalent expression `/<(?:button|input|select|textarea|table|dialog)\\b|\\bwindow\\.confirm\\s*\\(|#[0-9a-fA-F]{3,8}\\b|rounded-full|aria-pressed/g` on each fetched blob. Result **0, 0, 0** respectively (the shell command is provided to reproduce, not claimed executed). Additional counters: assignment shared Button 11 / Alert 3 / EmptyState 2 / LoadingState 1 / ConfirmDialog 1 / Drawer 2; quiz Button 6 / Alert 2 / EmptyState 1 / LoadingState 1 / ConfirmDialog 1 / Drawer 1; membership Button 6 / Dialog 2 / ConfirmDialog 1 / Checkbox 1 / Textarea 1. No hard-coded hex and no hand-rolled tabs or toggles in these files.

The textual tag-pair scan found assignment `<Button>` **11/11** and `<Drawer>` **2/2**, quiz `<Button>` **6/6** and `<Drawer>` **1/1**, membership `<Button>` **6/6** and `<Dialog>` **2/2**; other listed shared components are self-closing as appropriate. Reviewed all changed file contents for stray quotes, malformed imports and mismatched explicitly paired JSX tags. This is not a parser/TS compile result.

### Responsive proof — source rules, not screenshots

Legacy breakpoint `components___variables.scss:148` and `pages___admin-list-pages.scss:193` applies phone treatment at viewport widths **<=767px**. Tailwind `md:` begins at **768px**. All three targeted files use base `min-h-11` (44px at standard 16px root), switching to `--lms-control-height=36px` at `md`; they have **zero `sm:` overrides** that would prematurely shrink controls between 640–767px. Assignment uses a phone 2-column student navigation grid switching to tablet flex (`faculty-assignment-review.tsx:612`), and one-column grading fields switching to 2-column grid at 768px (`351`); quiz action bars wrap (`faculty-quiz-review.tsx:205`) and shared Drawer scrolls (`255`); membership row/actions wrap and allow 44px touch targets (`person-membership-actions.tsx:202,277`). These are comparisons of CSS source branches, **not empirical viewport screenshots**.

### Final strict-tick boundary

The three requested **source files are completed** for native-control removal, modal conversion, shared-state handling, visual token use, and the source-responsive pass. **Do not tick pixel-level parity yet:** exact computed button font size for size=`sm` (13px versus north-star 14px), shared `ConfirmDialog` footer touch targets, full state-by-state rendered visual comparisons (hover/focus/disabled/error/empty), screenshots at 375px/767px/768px/1024px, and full portal-wide exhaustive category-H grep remain outside verifiable evidence. The shared-component owner must resolve any cross-component discrepancies; this lane must not edit `src/components/ui`.

**Next exact file outside this three-file request:** `src/components/courses/faculty-assessment-editor.tsx` — inspect assessment editor page-level responsive states and raw confirmation opportunities, then `src/components/admin/person-profile-dialog.tsx`.


## Next batch — Faculty assessment editor, Super Admin profile dialog, Quiz question editor (2026-10-19)

**Source-complete paths (not strict pixel parity):**

- [x] Source migration: `src/components/courses/faculty-assessment-editor.tsx` — existing update/archive/discard confirmation strings are preserved through shared `ConfirmDialog`; shared `Drawer`, `Banner`, `Alert`, `Input`, `Textarea`, and `Button` remain; no native confirm or raw controls. Save/archive version receipts, title-only rules, IST due-date conversion and unsaved-beforeunload logic retained.
- [x] Source migration: `src/components/admin/person-profile-dialog.tsx` — membership profile uses shared `Dialog`, `Input`, `Select`, `LoadingState`, `Alert`, `Button`; phone-safe button sizing, tablet grid switch, pending dismissal guard and network error toast. Both profile API PUT payloads are unchanged.
- [x] Source migration: `src/components/courses/faculty-quiz-question-editor.tsx` — native question-bank replacement prompt converted to shared `ConfirmDialog`; existing draft-only validation and `expectedUpdatedAt` PATCH retained; question/answer card tokens, shared loading/error states, phone-safe remove/add actions and responsive question/option grids updated.

These checks are **source-migration completions only**. The original strict parity queue items stay [ ] until computed-style and rendered responsive proof for every property/state is obtained.

### Legacy values vs current source

| Property and state | Legacy reference and exact value | vNext source and values | Assessment |
|---|---|---|---|
| Modal border | `docs/design/legacy-styles/components___variables.scss:30`: `#e5e9f0` | `ui/dialog.tsx:44`, `ui/drawer.tsx:42`, inherited `--lms-canvas-border` from `globals.css:339` = `#e5e9f0` | Exact token |
| Panel/card radius | `components___variables.scss:134`: `12px` | `faculty-quiz-question-editor.tsx:460`: `rounded-[var(--lms-canvas-radius)]`, `globals.css:345` = 12px; shared Dialog also uses it | Exact token |
| Card fill | `components___variables.scss:37`: `$white: #ffffff` | `faculty-quiz-question-editor.tsx:460`: `bg-[var(--lms-surface)]`; `globals.css:71` = white | Exact token, light theme |
| Card padding and form gaps | `components___variables.scss:119`: 16px, `:118` = 12px | Quiz question editor `:460` uses `p-[var(--lms-space-4)]` (16px); `:508` uses `gap-[var(--lms-space-3)]` (12px); `globals.css:352-353` | Exact token |
| Label/field typography | `components___form.scss:111-125`: label 13px/600, field 14px/400; `:130-142` teal focus, error ring | `faculty-assessment-editor.tsx:277-345`, `person-profile-dialog.tsx:252-345`, `faculty-quiz-question-editor.tsx:483-560` use shared field components, legacy skin in `styles/legacy-skin.css:103-175` | Inherited; computed-state proof not run |
| Primary action | Owner `master-queue.md` OWNER GOAL: 9px radius, 36px high, 14px/650, solid `#0a7c88` and white text | `ui/button.tsx:11,18-28` + `globals.css:24,341,343`; target components use shared `Button` | Default `md` token matches; shared `sm` font-size is 13px, so do **not** tick the full button value rule |
| Hover/disabled/focus/loading | `components___button.scss:23-49` + `components___form.scss:23-35` for hover, disabled and keyboard-only focus | `ui/button.tsx:11-28`, `ui/dialog.tsx:39-54`, `ui/confirm-dialog.tsx:15-19` centralize styles and pending disabled state | Owned by shared UI; rendered focus and hover proof pending |
| Mobile hit targets | `components___variables.scss:139`: 44px; `:148` threshold 767px | All action buttons in these three files use `min-h-11 md:min-h-[var(--lms-control-height)]`; `globals.css:341` =36px after 768px | Static source breakpoint match |
| Responsive profile form | `pages___admin-list-pages.scss:193-215`: phone layout at max 767px | `person-profile-dialog.tsx:248,288,292` uses single column on 375/767px, two columns from 768px, full-width department row | Static layout proof; screenshot pending |
| Responsive quiz question choices | Same legacy max-767px breakpoint | `faculty-quiz-question-editor.tsx:508` stacks type/points at 375/767px, `:564` displays option control+text in 2 columns and lets remove wrap; both switch at `md` | Source comparison only |
| Drawer phone/tablet treatment | `pages___admin-list-pages.scss:193-215`: mobile padding and control areas | `ui/drawer.tsx:37-51`: full-width phone, <=600px drawer desktop, scroll cue, padding and focus management | Shared implementation; different 640px breakpoint deserves rendered inspection |
| Save/archive/discard confirmation | Old native `window.confirm` is not a style-controlled LMS dialog | `faculty-assessment-editor.tsx:352-375` and `faculty-quiz-question-editor.tsx:690-702`: `ConfirmDialog` with warnings, pending guard, primary/danger variants | Native prompt removal verified; pixel comparison not possible from source alone |
| Loading, error, empty | `components___variables.scss:13,30` and form error `components___form.scss:137-142` | `faculty-assessment-editor.tsx:274,348`: shared Banner/Alert; `person-profile-dialog.tsx:242-244`: LoadingState/Alert; `faculty-quiz-question-editor.tsx:450,685`: LoadingState/Alert | Shared states complete; all rendered states still unverified |

### Full-file grep-equivalent evidence and tag-pair re-read

The file bodies were re-fetched after edits and scanned in their entirety via exact regex-equivalent counts:

| Path | Native `button/input/select/textarea/table/dialog` | `window.confirm` | Hex literals | `rounded-full` / `aria-pressed` | `sm:` | `md:` | Paired JSX |
|---|---:|---:|---:|---:|---:|---:|---|
| `faculty-assessment-editor.tsx` | 0 | 0 | 0 | 0 | 0 | 3 | Button 3/3; Drawer 1/1; Banner 1/1; Alert 1/1; labels 4/4; form 1/1 |
| `person-profile-dialog.tsx` | 0 | 0 | 0 | 0 | 0 | 6 | Button 3/3; Dialog 1/1; Select 1/1; fieldsets 2/2; labels 5/5 |
| `faculty-quiz-question-editor.tsx` | 0 | 0 | 0 | 0 | 0 | 8 | Button 6/6; Drawer 1/1; Select 1/1; form labels 3/3; section 1/1 |

`Input`, `Textarea`, `Radio`, `Checkbox`, `ConfirmDialog`, `LoadingState` are deliberately self-closing. The complete files also had no leading stray quote before `className`. The effective source scans correspond to:

```sh
git grep -nE '<(button|input|select|textarea|table|dialog)([ >])|window[.]confirm[(]|#[0-9a-fA-F]{3,8}|rounded-full|aria-pressed' -- \
  src/components/courses/faculty-assessment-editor.tsx \
  src/components/admin/person-profile-dialog.tsx \
  src/components/courses/faculty-quiz-question-editor.tsx
```

**The shell command above is reproducibility documentation; it was not executed.** The connector-backed scans were performed over full UTF-8 file blobs. JSX parsing/TypeScript compilation and CI were intentionally not run.

**Unresolved strict proof:** 375px/767px/768px/1024px rendered screenshots, actual focus/disabled/hover states, shared button `size=sm` font size vs legacy 14px, shared overlay phone breakpoint, and portal-wide transitive grep. Therefore category H route/component strict boxes remain open.

**Next exact unreviewed file:** `src/components/courses/faculty-lesson-authoring.tsx`; then `src/components/courses/faculty-content-editor.tsx`. Do not change shared `src/components/ui/*`.


## Replacement chat-3 bounded turn — next source files (2026-10-19)

**Branch synchronization:** \`chatgpt/chat-3-b\` was 1,259 commits behind main and had no lane-only commits (compare status \`behind\`). Fast-forwarded the lane ref without forcing or changing main; all writes below target only the lane ref. Previous source work was already included in main. GitHub Contents API updates are individual \`[chat-3]\` commits.

### Source-complete migrations (do NOT treat these as H strict ticks)

- [x] Source migration — \`src/components/courses/faculty-lesson-authoring.tsx\`: removed duplicated Checkbox/Radio imports; standardized primary/secondary action sizes; 13px/600/16px labels; canvas-radius authoring/question sections; phone hit area, two-column and option-breakpoint corrections; shared Alert feedback.
- [x] Source migration — \`src/components/courses/faculty-content-editor.tsx\`: replaced browser \`window.confirm\` with shared \`ConfirmDialog\`, preserved the save lock and guarded dismissal; aligned clean snapshot duration with initial/reset duration (so the form does not start spuriously dirty); shared phone targets, 13px field labels, responsive live session times.
- [x] Source migration — \`src/components/courses/faculty-quiz-learner-preview.tsx\`: removed duplicate/unused imports; shared Alert and EmptyState; 14px Button type, 44px phone target; 12px section radii; retained preview-only mode and correct-answer toggle.
- [x] Source migration — \`src/components/courses/faculty-live-class-editor.tsx\`: moved form columns and font-size reduction to 768px, inherited shared Input/Select skin; 13px labels, shared Alert for warnings/errors/success, 44px phone button and pending state, preserved confirmation and IST rules.
- [x] Source migration — \`src/components/courses/faculty-lesson-video-manager.tsx\`: replaced both native delete/replace prompts with one shared \`ConfirmDialog\` and explicit typed pending action; file replacement requires confirmation before any upload; pending lock maintained; video list loads/empties/feedback use LoadingState/EmptyState/Alert; labels, controls, panel radius and tablet/phone grid match legacy source breakpoints.

### Legacy source / vNext value matrix (source evidence, not computed styles)

| Property / state | Legacy source and target | vNext source evidence | Result |
|---|---|---|---|
| Form label type | \`components___form.scss:111-114\` 13px, weight 600, 16px line-height | \`faculty-lesson-authoring.tsx:65\`; \`faculty-content-editor.tsx:127-160\`; \`faculty-live-class-editor.tsx:108-137\`; \`faculty-lesson-video-manager.tsx:222-315\` use 13px and semibold; authored explicit 16px in lesson/content/video | Source type match for changed labels; live class inherits line height |
| White section/panel radius | \`components___variables.scss:134\` 12px | \`faculty-lesson-authoring.tsx:600,872\`; \`faculty-quiz-learner-preview.tsx:42,53\`; \`faculty-lesson-video-manager.tsx:252\` use \`--lms-canvas-radius\` (12px) | Token match |
| Compact buttons | Owner \`master-queue.md:5\`: 14px/650, 36px desktop, primary teal and white; shared \`ui/button.tsx:16-29\` delegates tone | Replaced 13px \`size=sm\` with 14px \`size=md\` in lesson authoring, quiz preview, video manager | Source sizing match; exact rendered variants require shared-component owner |
| Phone action targets | \`components___variables.scss:139,148\` 44px at <=767px; \`pages___admin-list-pages.scss:194-215\` | Lesson/video root \`max-[767px]:[&_button]:min-h-11\`; quiz preview/content editor/live editor buttons explicit 44px base, 36px from \`md\` | Source media/touch match |
| Phone forms | \`pages___admin-list-pages.scss:193-215\` single column <=767px | \`faculty-lesson-authoring.tsx:931,1018\`; \`faculty-content-editor.tsx:153\`; \`faculty-live-class-editor.tsx:107\` use \`md:\` not \`sm:\` | Single column through 767px; two columns at 768px, source proof |
| Larger screens | \`components___variables.scss:149-151\` tablet cutoff 991px | Video form \`faculty-lesson-video-manager.tsx:221\` adds third column only at 992px | Exact source breakpoint |
| Error, empty, loading | \`components___variables.scss:30,58-72\` neutral border/status tones; \`components___form.scss:137-142\` error treatment | Shared \`Alert\`, \`EmptyState\`, \`LoadingState\`, \`ConfirmDialog\` in all five files; default/disabled/loading inherited | Shared source contracts; computed colors/focus/hover unverified |
| Destructive and replace confirmation | Legacy modals per \`pages___admin-list-pages.scss:323-364\`: 12px corner and phone footer target | \`faculty-content-editor.tsx:169-179\` and \`faculty-lesson-video-manager.tsx:327-339\` use shared ConfirmDialog instead of \`window.confirm\` | Source migration; overlays require browser comparison |

### Whole-file coverage proof and JSX review

All five full UTF-8 blobs were fetched again after connector writes, and scanned with the regex equivalent to:

\`\`\`sh
git grep -nE '<(button|input|select|textarea|table|dialog)([ >])|window[.]confirm[(]|#[0-9a-fA-F]{3,8}|rounded-full|aria-pressed' -- \
  src/components/courses/faculty-lesson-authoring.tsx \
  src/components/courses/faculty-content-editor.tsx \
  src/components/courses/faculty-quiz-learner-preview.tsx \
  src/components/courses/faculty-live-class-editor.tsx \
  src/components/courses/faculty-lesson-video-manager.tsx
\`\`\`

**Actual per-file full-blob regex counts: 0 / 0 / 0 / 0 / 0** respectively, including zero native prompts and no hard-coded hex. The command above is provided for local reproduction, **not claimed as executed**. The lesson authoring file has 11 Button opening and 11 Button closing tags, 1 Select pair, 1 ConfirmDialog pair, and 2 Alert pairs; video manager has 11 Button opening and closing tags and one self-closing ConfirmDialog. No shared \`src/components/ui/*\` files edited.

Phone 375px and 767px, tablet 768px/991px, and 1024px classes were compared statically with the legacy media source. **No rendered screenshots, computed state values, JSX compiler, TypeScript typecheck, tests, lint, or CI were executed**, per lane constraints. The full portal-wide transitive scans, screenshot/focus/hover/disabled proof and shared-component gap resolution remain open. Therefore leave **all 94 original H Work queue boxes unchecked** under STRICT TICK RULE, even though the five source migrations above are completed.

**Next exact source file:** \`src/components/courses/faculty-course-home-signals.tsx\`; then \`src/components/courses/faculty-ist-quarter-hour-picker.tsx\`.


## Replacement chat-3 bounded turn — faculty course, assessment, links and roster source sweep (2026-10-19)

This is the second batch after the five-file video/authoring audit above. **All nine source files below were migrated and fetched again from the lane branch for full-blob scans.** These checkboxes record **source migration only**, not category-H pixel parity.

- [x] Source migration — \`src/components/courses/faculty-course-home-signals.tsx\`: moved incomplete-signals warning to shared Alert and score-range native \`details/summary\` to shared Disclosure; 14px/650 primary CTA, 44px phone target and responsive stat grid.
- [x] Source migration — \`src/components/courses/faculty-ist-quarter-hour-picker.tsx\`: calendar date spans the width on phones; hour, minute and AM/PM remain separate selectors, and full inline date/time grid starts at 768px; shared Alert warning and labels.
- [x] Source migration — \`src/components/courses/faculty-assignment-method-picker.tsx\`: deduplicated Checkbox import (previously TypeScript-invalid), 12px canvas radius, 13px legend, 44px phone choice rows, md two-column breakpoint.
- [x] Source migration — \`src/components/courses/faculty-assignment-material-links.tsx\`: shared ConfirmDialog instead of \`window.confirm\`; repaired duplicate \`variant\` props on both Buttons; LoadingState, EmptyState, responsive form and phone actions retained.
- [x] Source migration — \`src/components/courses/faculty-contacts-table.tsx\`: hand-written contact pager converted to shared Pagination while preserving URLSearchParams, search and page size, with 44px phone contact actions.
- [x] Source migration — \`src/components/courses/faculty-assessment-create.tsx\`: shared ConfirmDialog for discarding quiz or assignment drafts, retaining dirty guard, create workflow, and 44px phone buttons.
- [x] Source migration — \`src/components/courses/faculty-course-roster.tsx\`: stat grid at >=768px, 13px labels, phone row/contact action targets through 767px, shared button-size navigation; two intentional \`rounded-full\` occurrences are **avatar masks**, not status pills.
- [x] Source migration — \`src/components/courses/faculty-course-list.tsx\`: filters use 13px labels, no premature 640px typography or hit-target reduction, 44px actions at <=767px, data/cards and query behavior unchanged.
- [x] Source migration — \`src/components/courses/faculty-course-tab-navigation.tsx\`: selector and all three shortcut actions preserve 44px phone controls through 767px; switch to 36px desktop token at md.

### Legacy / vNext property mapping (source-checked only)

| Legacy property and precise reference | vNext value and implementation | Source result |
|---|---|---|
| 44px phone target, \`components___variables.scss:139\` and \`pages___admin-list-pages.scss:193-215\` | \`faculty-course-list.tsx\`, \`faculty-course-tab-navigation.tsx\`, \`faculty-course-roster.tsx\`, \`faculty-assessment-create.tsx\`, \`faculty-assignment-method-picker.tsx\` preserve min-height 44px until \`md\` / 768px; \`faculty-assignment-material-links.tsx\` uses max-width 767px action selector | Static breakpoint aligns |
| Admin phone one column at max 767px, \`pages___admin-list-pages.scss:193-215\`; tablets begin after | \`faculty-ist-quarter-hour-picker.tsx\` date spans all three phone columns, selector row stays usable; \`faculty-course-list.tsx\`, \`faculty-contacts-table.tsx\`, \`faculty-assignment-material-links.tsx\` use \`md:grid-cols-2\` | Source match; rendered overflow pending |
| 13px/600 form label, 16px line, \`components___form.scss:111-114\` | \`faculty-assignment-material-links.tsx\`, \`faculty-assignment-method-picker.tsx\`, \`faculty-ist-quarter-hour-picker.tsx\`, \`faculty-course-roster.tsx\`, \`faculty-course-list.tsx\` use 13px font size, 600 and explicit/inherited 16px line-height | Source typography mapping |
| 12px card radius, \`components___variables.scss:134\` | \`faculty-assignment-method-picker.tsx\` and shared form sections use \`--lms-canvas-radius\` | Token value match |
| Desktop primary buttons 36px, 14px/650, radius 9, teal, \`master-queue.md:5\`; focus/disabled in \`components___form.scss:23-35\` | All migrated actions use shared Button/Pagination/Disclosure/ConfirmDialog/Alert components, with inherited token styling; custom navigational Link retains required hover and focus classes | Shared component contract; pixel state unverified |
| Modal mobile body and footer, \`pages___admin-list-pages.scss:323-364\` | Discard and removal prompts moved to shared ConfirmDialog; no browser-native \`window.confirm\` remains in the nine source files | Source migration; exact rendered overlay parity unresolved |

### Reproducible grep-equivalent coverage and JSX

Full fetched UTF-8 blob scan regex for \`<(button|input|select|textarea|table|dialog)\b\`, \`window.confirm\`, hex literals \`#[a-fA-F0-9]{3,8}\b\`, and \`aria-pressed\` returned **zero for all nine files**. Additionally, \`rounded-full\` returned zero in eight files and exactly **two documented circular avatars** in \`faculty-course-roster.tsx\` (student initials avatar button and fallback profile photo). This count is not a claim of full portal-wide coverage.

Equivalent local reproduction command (not executed here):
\`\`\`sh
git grep -nE '<(button|input|select|textarea|table|dialog)([ >])|window[.]confirm[(]|#[0-9a-fA-F]{3,8}|aria-pressed|rounded-full' -- \
  src/components/courses/faculty-course-home-signals.tsx \
  src/components/courses/faculty-ist-quarter-hour-picker.tsx \
  src/components/courses/faculty-assignment-method-picker.tsx \
  src/components/courses/faculty-assignment-material-links.tsx \
  src/components/courses/faculty-contacts-table.tsx \
  src/components/courses/faculty-assessment-create.tsx \
  src/components/courses/faculty-course-roster.tsx \
  src/components/courses/faculty-course-list.tsx \
  src/components/courses/faculty-course-tab-navigation.tsx
\`\`\`

Full blob re-fetch confirmed \`<Button>\` vs \`</Button>\` counts: material links **2/2**; assessment create **2/2**; roster **4/4**; course list **1/1**; all other nine files **0/0**. Shared self-closing components use \`/>\`. There were no new line-leading \`as\` casts in these files.

**STRICT TICK RULE boundary:** All original **94 category-H Work queue items remain unchecked**: browser computed-state values, actual visual phone/tablet verification at 375/767/768/991/1024px, screenshots against old LMS and complete transitive portal grep have not been performed. No source execution, CI, typecheck, test, lint or local rendering was performed; no \`src/components/ui/*\` file was edited.

**Next exact source file:** \`src/components/courses/faculty-course-workspace.tsx\`; then \`src/components/courses/faculty-content-order-editor.tsx\`. Follow these with remaining Super Admin academic/people page list without taking ownership from other lanes.


## Replacement chat-3 — bounded-turn source sweep of 26 further files (2026-10-19)

Source-complete paths (not strict H checks):

| File (exactly under the Work queue folders) | Raw controls / native confirm / hex / aria-pressed count | Button opening/closing tag counts | Legacy value and responsive source mapping |
|---|---:|---:|---|
| `academics-actions.tsx` | 0 | 21/21 | 13px labels; md 36px action targets |
| `academics-create-panel.tsx` | 0 | 4/4 | 13px label; md 36px action targets |
| `section-operations.tsx` | 0 | 10/10 | 44px phone buttons; md table-actions/forms |
| `super-admin-attendance-settings-editor.tsx` | 0 | 1/1 | Alert success/error; 44px phone save |
| `super-admin-faculty-assignment-create.tsx` | 0 | 5/5 | shared validation alerts; 44px phone, 36px md |
| `super-admin-faculty-bulk-import.tsx` | 0 | 2/2 | shared Alert; 44px phone download/import |
| `super-admin-faculty-schedule-reassign-action.tsx` | 0 | 3/3 | shared Dialog/ConfirmDialog/Alert and responsive Select |
| `super-admin-people-csv-control.tsx` | 0 | 1/1 | shared error Alert; 14px/650 Button |
| `faculty-attendance-schedule-editor.tsx` | 0 | 1/1 | 13px form labels; 768px two-column; shared alerts |
| `faculty-attendance-workspace.tsx` | 2 toggles (exempt) | 14/14 | shared success Alert; md grid/sticky-action switch |
| `faculty-assessment-lifecycle.tsx` | 0 | 1/1 | 14px shared Button; Alert saved/error |
| `faculty-assessment-overview.tsx` | 0 | 2/2 | 13px labels, 14px link actions; one-column phone |
| `faculty-assignment-editor.tsx` | 0 | 4/4 | 13px labels; 768px field type; shared loading |
| `faculty-choice-quiz-builder.tsx` | 0 | 26/26 | 36 responsive modifiers moved to md; 13px labels; 12px panels |
| `faculty-content-order-editor.tsx` | 0 | 4/4 | 44px phone actions, 14px buttons; wrapping row |
| `faculty-course-workspace.tsx` | 0 | 0/0 | removed unsupported Disclosure props; md action targets; 12px empty panel |
| `faculty-report-csv-download.tsx` | 0 | 0/0 | 44px phone, 36px md download target |
| `faculty-report-download.tsx` | 0 | 1/1 | 44px phone, 36px md PDF action; ConfirmDialog unchanged |
| `faculty-report-student-table.tsx` | 0 | 2/2 | fixed duplicate Button import; EmptyState; 13px search label |
| `faculty-submission-file-review.tsx` | 0 | 1/1 | 12px file row; 44px phone and loading button |
| `faculty-video-preview.tsx` | 0 | 0/0 | 12px native-media viewport radius |
| `faculty-profile-editor.tsx` | 0 | 1/1 | shared Alert and LoadingState; existing anchor navigation preserved |
| `faculty-profile-metadata.tsx` | 0 | 5/5 | 13px labels; 12px row panel; shared errors |
| `faculty-profile-repeatable.tsx` | 0 | 9/9 | 13px labels; shared validation Alert; existing 768px layout |
| `faculty-profile-skills.tsx` | 0 | 7/7 | 13px labels; 12px row panel; md column switch |
| `faculty-profile-text-section.tsx` | 0 | 2/2 | shared validation Alert; 44px phone actions |

The count expression was evaluated on the **whole UTF-8 GitHub file** of each of the 26 paths after the individual `[chat-3]` commits. Query equivalent:

```sh
git grep -nE '<(button|input|select|textarea|table|dialog)([ >])|window[.]confirm[(]|#[0-9A-Fa-f]{3,8}|aria-pressed' -- \
  src/components/academics src/components/admin/super-admin-{attendance-settings-editor,faculty-assignment-create,faculty-bulk-import,faculty-schedule-reassign-action,people-csv-control}.tsx \
  src/components/attendance/faculty-attendance-{schedule-editor,workspace}.tsx \
  src/components/courses/faculty-*.tsx src/components/people/faculty-profile-*.tsx
```

The *printed shell command is not claimed as executed*, and its broad globs may return other existing transitive files not in this batch. **The actually evaluated 26 full-blob matches were 0 in 25 files and 2 in faculty-attendance-workspace.tsx**: both `aria-pressed` on the accessible Present/Absent two-state Buttons, at lines 963 and 984 in the before-rebase file. Those are deliberately exempted toggle states, not native controls; the action Button remains shared. Every scanned file has zero native `button/input/select/textarea/table/dialog` tags, zero `window.confirm`, zero hard-coded hex. JSX Button opening/closing counts match for every source file; remaining native `<option>` elements are valid children of shared Select. Full JSX parser/typecheck not run by owner constraint.

### Legacy property proof — selected properties only; do not tick strict item

| State/property | Legacy source (line and value) | Changed-file source / inherited token | Conclusion |
|---|---|---|---|
| Phone action minimum | `docs/design/legacy-styles/components___variables.scss:139`: 44px | `min-h-11` (44px standard root) or `max-[767px]:[&_button]:min-h-11`, across the file rows above | Source rule aligned; actual computed viewport pending |
| Phone/tablet cutover | `components___variables.scss:148-149`: phone max 767px, tablet 991px | Changed `sm:` to `md:` on applicable form, control height and column rules; all 26 fetched blobs had **0 remaining `sm:`**; existing `min-[768px]` also aligns | Static 375/767 phone, 768/991 tablet mapping; no browser screenshot |
| Field label | `components___form.scss:111-114`: 13px, weight 600, 16px leading | Updated form labels use `text-[13px]`, `font-semibold`, `leading-4` in assessment, teacher-scheduling, profiles and academia | Source declaration match for changed labels; shared field inherited values not computed |
| Card border/corners | `components___variables.scss:30,134`: #e5e9f0, 12px | `border-border` or `border-[var(--lms-canvas-border)]`, `rounded-[var(--lms-canvas-radius)]` in changed objects/fields | Source token match; nested-card layout not visually confirmed |
| Default buttons | `docs/orchestrator/queues/master-queue.md:5`: 36px, 14px/650, teal primary, white content, 9px radius | Shared `Button` with `size=md`; Link appearance still authored as token-mapped class | Inherited default/hover/focus; shared owner must verify computed skin |
| Disabled/loading/error | `components___form.scss:23-32,137-142`: keyboard focus, error treatment; controls must show disabled state | Shared Buttons/Alerts/LoadingState/ConfirmDialog now used in migrated paths, including prompt and network states | Code paths audited, rendered hover/focus/disabled/loading/error state comparisons pending |
| Narrow forms and table surfaces | `pages___admin-list-pages.scss:193-215`: one-column form/touch actions at max 767px | Faculty quiz builder, academic actions, course workspace, report tables and profile form explicitly align at 768px instead of 640px | Static source breakpoints checked; no actual 375px/767px/768px/991px/1024px viewports rendered |

**Critical existing JSX repair:** `faculty-course-workspace.tsx` passed unsupported `summaryAriaLabel`, `summaryClassName`, `preserveSummary` props to shared `Disclosure`; these were removed and the visible lesson title, description and count grouped inside its documented `title` prop. This is a source compatibility repair only, not a compilation claim. `faculty-report-student-table.tsx` had a duplicate Button import; it was removed. No code, tests, typecheck, lint, CI or screenshots executed. `src/components/ui/*` untouched.

**Strict H status:** The original 94 Work queue checkboxes remain `[ ]` because rendered computed-style comparison for default/hover/focus/disabled/empty/error/loading and portal-wide transitive coverage proof are not yet available. Do **not** claim pixel parity complete or tick them based on only source inspection.

**Next exact source file:** `src/components/academics/academics-overview.tsx`, then the 46 owned teacher/Super Admin route pages starting `src/app/(authenticated)/admin/academics/page.tsx` and their directly rendered components; preserve ownership boundaries.


## 2026-10-20 route sweep · part 1/3 — source proof, not strict parity

Fast-forwarded `chatgpt/chat-3-b` from `52a9f8e096c45e3e4767f833c84a27f64226df62` to fetched main `a7616350ee830c5e187533defabafb477a27172e` (branch compare: ahead 0, behind 1133 before fast-forward), then committed only to the lane branch. No local execution, lint, typecheck, tests, CI, browser, or screenshots.

| Full source file | Line examples for tokens/shared UI | Raw controls / native confirm / hex | `sm:` 640px variants after edit | JSX `Button` open/close |
|---|---|---:|---:|---:|
| `src/components/academics/academics-overview.tsx` | 342,358,374,390 | 0 | 0 | 0/0 |
| `src/app/(authenticated)/admin/academics/page.tsx` | 19,24,25,28 | 0 | 0 | 0/0 |
| `src/app/(authenticated)/admin/people/directory/[membershipId]/page.tsx` | 25,34,41 | 0 | 0 | 0/0 |
| `src/app/(authenticated)/admin/people/directory/page.tsx` | 33,41,59,63 | 1 (78:<input) | 0 | 1/1 |
| `src/app/(authenticated)/admin/people/page.tsx` | 112,117,122,143 | 0 | 0 | 1/1 |
| `src/app/(authenticated)/admin/people/unassigned/page.tsx` | 22,23,24,39 | 0 | 0 | 1/1 |
| `src/app/(authenticated)/teacher/courses/[deliveryId]/assessment-health/page.tsx` | 30,31,37,41 | 0 | 0 | 1/1 |
| `src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-participation/page.tsx` | 15,18,20,31 | 0 | 0 | 0/0 |
| `src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/[learnerMembershipId]/page.tsx` | 27,30,34,48 | 0 | 0 | 0/0 |
| `src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/page.tsx` | 33,36,48,54 | 0 | 0 | 1/1 |
| `src/app/(authenticated)/teacher/courses/[deliveryId]/reports/page.tsx` | 15,16,21,22 | 0 | 0 | 1/1 |
| `src/app/(authenticated)/teacher/courses/[deliveryId]/session-coverage/page.tsx` | 13,14,15,25 | 0 | 0 | 0/0 |

**Source regex actually evaluated on every full fetched blob above:** `<(button|input|select|textarea|table|dialog)\\b|window\\.confirm\\s*\\(|#[0-9a-fA-F]{3,8}\\b`. The audit table is generated from the whole UTF-8 content returned by GitHub. A shell `git grep` was not executed; the counts do not claim whole-portal coverage. Line examples show where shared elements or responsive rules were inspected; they are not rendered measurements. `sm:` is explicitly counted to distinguish the legacy phone (up to 767px) from tablet (768px+).


### Route sweep part 2/3 — faculty student, contacts, profile, reports and scheduling

| Full source file | Line examples for shared UI / value declarations | Raw control / confirm / hex hits | 640px `sm:` hits | Shared Button JSX open/close |
|---|---|---:|---:|---:|
| `src/app/(authenticated)/teacher/courses/[deliveryId]/students/[membershipId]/page.tsx` | 25,26,29,44 | 0 | 0 | 0/0 |
| `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx` | 53,55,76,80 | 0 | 0 | 1/1 |
| `src/app/(authenticated)/teacher/profile/contacts/page.tsx` | 9,11,14,25 | 0 | 0 | 0/0 |
| `src/app/(authenticated)/teacher/profile/page.tsx` | 21,25,27,31 | 0 | 0 | 0/0 |
| `src/app/(authenticated)/teacher/profile/teaching/page.tsx` | 25,26,33,36 | 0 | 0 | 1/1 |
| `src/app/(authenticated)/teacher/results/page.tsx` | 24,25,32,36 | 0 | 0 | 1/1 |
| `src/app/(authenticated)/teacher/response-followups/page.tsx` | 23,24,31,34 | 0 | 0 | 1/1 |
| `src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx` | 48,51,63,128 | 0 | 0 | 0/0 |
| `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx` | 50,53,56,63 | 0 | 0 | 0/0 |
| `src/app/(authenticated)/teacher/allAssignments/page.tsx` | 13,18 | 0 | 0 | 0/0 |
| `src/app/(authenticated)/teacher/allQuizzes/page.tsx` | 17,22 | 0 | 0 | 0/0 |
| `src/app/(authenticated)/teacher/calendar/page.tsx` | 31,32,49,52 | 0 | 0 | 1/1 |

Source query identical to part 1, applied to complete fetched GitHub files. Interactive contact pills replaced by shared linked `Tabs` (active value and original route href retained). `results` and `response-followups` previously referenced `Input` (both) and `Select` (results) without imports; imports were supplied. All recorded `Button` opening/closing counts balance. No browser parity claimed.


### Route/component sweep part 3/3 — remaining pages and assessment editor

| Full source file | Line examples for shared UI / value declarations | Raw control / confirm / hex hits | 640px `sm:` hits | Shared Button JSX open/close |
|---|---|---:|---:|---:|
| `src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-history/page.tsx` | 19,20,25,28 | 0 | 0 | 1/1 |
| `src/app/(authenticated)/teacher/courses/[deliveryId]/quizzes/manage/page.tsx` | 15,21 | 0 | 0 | 0/0 |
| `src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx` | 37,41 | 0 | 0 | 0/0 |
| `src/app/(authenticated)/teacher/courses/page.tsx` | 15,19,32 | 0 | 0 | 0/0 |
| `src/app/(authenticated)/teacher/live-classes/page.tsx` | 20,24,38,40 | 0 | 0 | 1/1 |
| `src/app/(authenticated)/teacher/notifications/page.tsx` | 73,95,98,112 | 0 | 0 | 0/0 |
| `src/app/(authenticated)/teacher/report/assignment/[contentId]/submissions/page.tsx` | 27,28,45,49 | 4 (53:<input, 54:<input, 55:<input, 56:<input) | 0 | 1/1 |
| `src/app/(authenticated)/teacher/report/quiz/[quizId]/attempts/page.tsx` | 27,28,41,44 | 3 (82:<input, 83:<input, 84:<input) | 0 | 1/1 |
| `src/app/(authenticated)/teacher/contacts/[contactsTab]/[membershipId]/page.tsx` | 31,34,46 | 0 | 0 | 0/0 |
| `src/app/(authenticated)/admin/people/directory/[membershipId]/audit/page.tsx` | 13,15,24 | 0 | 0 | 0/0 |
| `src/components/courses/faculty-assessment-editor.tsx` | 207,273,286,301 | 0 | 0 | 3/3 |

The only raw `<input>` instances in these 11 files are **4 invisible query-preservation inputs** in assignment submissions and **3 invisible query-preservation inputs** in Quiz attempts; no inline class/style. These intentionally retain native GET semantics and are exempted from a visible form-control audit. Two hand-built attempt navigation pill strips were replaced with the shared href-based `Tabs`. `faculty-assessment-editor.tsx` no longer calls `window.confirm`: save, archive and discard are guarded by a single shared `ConfirmDialog`, with explicit confirmed action dispatch and pending states. It preserves prior form values, unsaved-beforeunload guard, original REST requests and confirmed receipts. Only source verification—not executed interaction testing—is claimed.

### Legacy value proof matrix for this bounded turn

| Visual property and state | Legacy authoritative value | vNext mapped value and representative file:line | Source conclusion / gap |
|---|---|---|---|
| Primary/secondary button height on phone | `docs/design/legacy-styles/components___variables.scss:139` = 44px touch min; `pages___admin-list-pages.scss:193-213` phone max 767px | `min-h-11` = 44px applied to affected links/forms; `teacher/report/quiz/[quizId]/attempts/page.tsx` and `teacher/results/page.tsx` | Source declaration matches; default/hover/active/focus must still be rendered |
| Control desktop baseline | Owner's `docs/orchestrator/queues/master-queue.md:5`: 36px, text 14px/650, 9px radius | `md:min-h-[var(--lms-control-height)]`; shared Button where action is a button; `admin/academics/page.tsx`, `teacher/calendar/page.tsx` | Source resolves through shared token; token's computed value pending |
| 767px phone boundary | `components___variables.scss:148`: `$ssm:767px`; `pages___admin-list-pages.scss:193` max 767px | All changed grid/form rows shifted `sm:` (640px) to `md:` (768px); all **35** changed TSX files re-fetched have 0 remaining `sm:` | Responsive source mapping only; actual 375/767/768/991/1024px not rendered |
| Field labels | `components___form.scss:110-114`: 600, 13px, 16px line-height | `text-[13px] font-semibold leading-4` in `teacher/results/page.tsx`, `teacher/response-followups/page.tsx`, `admin/people/directory/page.tsx` | Applied to touched labels; all other labels/shared tokens require computed check |
| Canvas/list panels | `components___variables.scss:30,134`: #e5e9f0 border and 12px radius | `border-border`, `rounded-[var(--lms-canvas-radius)]` in `academics-overview.tsx` and report Disclosures | Token-based source match; inherited computed border/radius not verified |
| Active tabs | `docs/design/old-lms-pages.md:4`: teal underline directly on canvas | `<Tabs renderPanel={false} ...>` in Contacts tabs and Quiz attempt filters | Shared Tab skin now in charge; actual active/hover focus pending |
| Empty/error/confirm | Legacy shared skin; modal state requires disabled/loading/focus | `EmptyState` in four AcademicsOverview tables and membership audit; `Alert` in notifications and assessment editor; `ConfirmDialog` in assessment editor | Shared components used, but side-by-side rendered states and interaction testing pending |

**Coverage proof scope:** Whole-file GitHub reads and exact regex counts recorded in three preceding tables (12 + 12 + 11 = **35 changed TSX files**). The scripted query equivalent is `git grep -nE '<(button|input|select|textarea|table|dialog)([ >])|window[.]confirm[(]|#[0-9A-Fa-f]{3,8}' -- <35-listed-paths>`, not executed as a shell command; entire H portal/transitive coverage remains incomplete. **No lint/typecheck/tests/CI or browser run** per owner direction. 94 strict work-queue items remain unchecked; do not tick solely from source values. The 35 files are source-migrated, not pixel-certified.

**Next exact queue file:** `src/components/courses/faculty-assignment-review.tsx`; thereafter `src/components/courses/faculty-quiz-question-editor.tsx` and Faculty/Teacher delegated routes with newly discovered exception cases, before demanding full-category strict tick proof.


### 2026-10-20 supplemental four component passes

| Full source file | Representative changed source lines | Native controls/confirm/hex (whole-blob regex) | `sm:` variants | Button opening/closing |
|---|---|---:|---:|---:|
| `src/components/courses/faculty-assignment-review.tsx` | 351,394,401,408,439 | 0 | 0 | 11/11 |
| `src/components/courses/faculty-quiz-question-editor.tsx` | 414,440,460,497,616 | 0 | 0 | 6/6 |
| `src/components/courses/faculty-item-actions.tsx` | 89,114 | 0 | 0 | 1/1 |
| `src/components/courses/faculty-quiz-review.tsx` | 206,209,219,234,276 | 0 | 0 | 6/6 |

In `faculty-assignment-review.tsx`, all ten `size="sm"` 13px review and pagination actions were converted to `size="md"` 14px shared buttons; the file's single 40px phone link is now 44px until 767px and 40px at 768px+. Its student-picker label maps to legacy 13px/600/16px. `faculty-quiz-question-editor.tsx` replaces the last browser-native replacement `window.confirm` with shared `ConfirmDialog`, and substitutes shared `LoadingState` and `Alert`; its four small action Buttons use the shared 14px size, with the two-column numeric edit starting at 768px. `faculty-item-actions.tsx` has a 14px Button and phone/tablet height boundary; `faculty-quiz-review.tsx` uses 14px shared Buttons in review actions/navigation. No old value was guessed; the source rules use `components___variables.scss:139,148,183` and `components___form.scss:110-114`.

**Bounded turn total so far: 39 distinct TSX files plus this audit**, all pushed only to `chatgpt/chat-3-b`. Visible source scans recorded 0 unexempted native controls/confirm/hex, 0 640px `sm:` variants in those 39 touched files; the seven invisible GET preservation input tags on two report routes, and one on the Super Admin directory, are explicitly exempt. The scan does not cover every descendant outside these files. Responsive **source-code** mapping is checked; rendered 375/767/768/991/1024 widths and default/hover/focus/loading/error state comparison remain unexecuted. No typecheck/tests/CI, per owner.

**Exact next file after this turn:** `src/components/courses/faculty-assessment-create.tsx` (revisit its entire rendered form state against the current global skin and legacy SCSS), followed by `src/components/academics/academics-section-page.tsx`. Work queue H remains strictly unchecked pending full portal grep and rendered property proof.


### 2026-10-20 next bounded sweep — ten source-migrated components

All counts below came from entire current GitHub UTF-8 file blobs at the pushed lane head, **not a shell command**. Zero means the full blob had no source matches for native visible controls, native confirm, or hard-coded hex. Shared Button open/close counts are an approximate JSX tag-balance check (not a TypeScript compile). Native `Checkbox` and `Radio` are imported, not hand-rolled.

| File | Lines | Raw control/confirm/hex matches (line:match or 0) | `sm:` 640px modifiers | `Button` opening/closing | Sample lines for token/shared-UI proof |
|---|---:|---|---:|---:|---|
| `src/components/courses/faculty-assessment-create.tsx` | 88 | 0 | 0 | 2/2 | 45,47,52,58,65 |
| `src/components/academics/academics-section-page.tsx` | 90 | 0 | 0 | 0/0 | 42 |
| `src/components/academics/academics-actions.tsx` | 947 | 0 | 0 | 21/21 | 144,152,215,227,239 |
| `src/components/academics/section-operations.tsx` | 992 | 0 | 0 | 10/10 | 272,291,350,369,813 |
| `src/components/attendance/faculty-attendance-workspace.tsx` | 1284 | 0 | 0 | 14/14 | 491,493,549,680,802 |
| `src/components/courses/faculty-choice-quiz-builder.tsx` | 442 | 0 | 0 | 26/26 | 207,209,211,213,215 |
| `src/components/courses/faculty-lesson-authoring.tsx` | 1173 | 0 | 0 | 11/11 | 65,600,664,673,816 |
| `src/components/courses/faculty-quiz-question-editor.tsx` | 687 | 0 | 0 | 6/6 | 415,479,499,522,671 |
| `src/components/courses/faculty-lesson-video-manager.tsx` | 341 | 0 | 0 | 11/11 | 218,222,225,228,232 |
| `src/components/courses/faculty-course-home-signals.tsx` | 262 | 0 | 0 | 0/0 | 38,42,83,159,183 |

**Values, legacy-to-vNext declaration mapping (selected migrated properties, not all computed properties):**

| Legacy file:line and precise value | vNext file/prop | Source check |
|---|---|---|
| `docs/design/legacy-styles/components___variables.scss:139` 44px phone touch target and `:148` phone up to 767px | `src/components/academics/academics-actions.tsx`, `section-operations.tsx`, `attendance/faculty-attendance-workspace.tsx`, `courses/faculty-quiz-question-editor.tsx`: `min-h-11`/shared Button, `md:min-h-[var(--lms-control-height)]` switch at 768px | Phone action height declaration mapped to 44px; browser/computed-state proof pending |
| `docs/orchestrator/queues/master-queue.md:5` default button 36px high, 14px/650, control radius 9px | 13 academic action and six Section-operation buttons, eight attendance buttons switched from `size="sm"` (13px) to shared `size="md"` (14px); existing 44px phone constraints retained | Static dimensions checked via shared Button props; emitted CSS pending |
| `docs/design/legacy-styles/components___form.scss:110-114` form label 13px, 600, 16px leading | `section-operations.tsx`, `faculty-attendance-workspace.tsx`, `faculty-quiz-question-editor.tsx`: `text-[13px] font-semibold leading-4` | Source value aligned for touched labels |
| `docs/design/legacy-styles/components___variables.scss:30,134` 1px `#e5e9f0` border and 12px card radius | `faculty-assessment-create.tsx`, `academics-section-page.tsx`, `faculty-course-home-signals.tsx`: border-border / canvas-radius tokens and one un-nested layout width; shared state surfaces via `Alert`/`EmptyState` | Inherited token use checked; no computed canvas screenshot |
| `docs/design/old-lms-pages.md:7` slim alert/banner instead of custom notice | `faculty-lesson-authoring.tsx`: quarter-hour validation -> `Alert tone="warning"`; `faculty-choice-quiz-builder.tsx`: shared error/success Alerts; `faculty-lesson-video-manager.tsx`: readonly/info and processing/warning Alerts | Structural shared-component proof; pending hover/focus/error browser comparison |
| `docs/design/old-lms-pages.md:4` small teal selected controls, old LMS consistent input skins | `faculty-choice-quiz-builder.tsx`: `NativeCheckbox` kept for form-inside-`label` preview choice, `Checkbox` with `label` from shared selection-controls for interactive authoring | Removed duplicate Checkbox name binding; no inferred behavior or grading change |

The direct whole-blob regex equivalent is `<(button|input|select|textarea|table|dialog)\\b|window\\.confirm\\s*\\(|#[0-9a-fA-F]{3,8}\\b`. This was evaluated in GitHub connector response text on exactly the ten files above. **No `git grep` shell, no JSX parser, no responsive screenshots, no typecheck/tests/CI** were executed. The strict 94-work-item H queue remains unchecked because full visual/default/hover/focus/disabled/loading and transitive coverage conditions are not proven. These ten files are source-updated only. Next target: `src/components/courses/faculty-course-list.tsx` and `src/components/courses/faculty-assessment-overview.tsx`, followed by remaining unreviewed delegated teacher pages.


## Full 94-item H path inventory — source-only coverage pass, 2026-10-20

This inventory reads every named queued file through the connected GitHub repository branch; counts are computed over **entire returned UTF-8 file content**, not terminal `grep`. The exact query equivalent is `git grep -nE '<(button|input|select|textarea|table|dialog)([ >])|window[.]confirm[(]|#[0-9A-Fa-f]{3,8}' -- <each-listed-path>` (shell **not run**). `sm:` count detects 640px modifiers that violate the 767px legacy phone boundary when used for a responsive switch. `Button` counts reflect source JSX opening vs closing and are **not** a JSX parser. Native hidden GET inputs are listed separately because they are semantically required, invisible, and style-free. Line examples are first 44px/13px/PageHeader visual declarations. Remaining unrendered states, full transitive dependency grep and computed-style comparisons block all strict H ticks.

### Source inventory routes, part 1/4 (1–12 of 46)

| Path | Lines | Native/confirm/hex hits (hidden) | `sm:` | Shared Button open/close | Source value example lines |
|---|---:|---:|---:|---:|---|
| `src/app/(authenticated)/admin/academics/page.tsx` | 68 | 0 (0 hidden) | 0 | 0/0 | 19,24,25 |
| `src/app/(authenticated)/admin/academics/sections/[sectionId]/page.tsx` | 31 | 0 (0 hidden) | 0 | 0/0 | delegated |
| `src/app/(authenticated)/admin/people/directory/[membershipId]/audit/page.tsx` | 27 | 0 (0 hidden) | 0 | 0/0 | 13,15 |
| `src/app/(authenticated)/admin/people/directory/[membershipId]/page.tsx` | 48 | 0 (0 hidden) | 0 | 0/0 | 25,41 |
| `src/app/(authenticated)/admin/people/directory/page.tsx` | 128 | 1 (1 hidden) | 0 | 1/1 | 33,41,59 |
| `src/app/(authenticated)/admin/people/page.tsx` | 184 | 0 (0 hidden) | 0 | 1/1 | 112,122,143 |
| `src/app/(authenticated)/admin/people/unassigned/page.tsx` | 80 | 0 (0 hidden) | 0 | 1/1 | 22,24,39 |
| `src/app/(authenticated)/admin/recruiters/page.tsx` | 7 | 0 (0 hidden) | 0 | 0/0 | delegated |
| `src/app/(authenticated)/teacher/allAssignments/page.tsx` | 26 | 0 (0 hidden) | 0 | 0/0 | 13,18 |
| `src/app/(authenticated)/teacher/allQuizzes/page.tsx` | 30 | 0 (0 hidden) | 0 | 0/0 | 17,22 |
| `src/app/(authenticated)/teacher/calendar/page.tsx` | 133 | 0 (0 hidden) | 0 | 1/1 | 31,32,49 |
| `src/app/(authenticated)/teacher/contacts/[contactsTab]/[membershipId]/page.tsx` | 58 | 0 (0 hidden) | 0 | 0/0 | 31,34 |


### Source inventory routes, part 2/4 (13–24 of 46)

| Path | Lines | Native/confirm/hex hits (hidden) | `sm:` | Shared Button open/close | Source value example lines |
|---|---:|---:|---:|---:|---|
| `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx` | 159 | 0 (0 hidden) | 0 | 1/1 | 53,55,76 |
| `src/app/(authenticated)/teacher/contacts/page.tsx` | 6 | 0 (0 hidden) | 0 | 0/0 | delegated |
| `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx` | 44 | 0 (0 hidden) | 0 | 0/0 | delegated |
| `src/app/(authenticated)/teacher/courses/[deliveryId]/assessment-health/page.tsx` | 118 | 0 (0 hidden) | 0 | 1/1 | 30,31,37 |
| `src/app/(authenticated)/teacher/courses/[deliveryId]/assignments/manage/page.tsx` | 27 | 0 (0 hidden) | 0 | 0/0 | 16,24 |
| `src/app/(authenticated)/teacher/courses/[deliveryId]/attendance-corrections/page.tsx` | 16 | 0 (0 hidden) | 0 | 0/0 | delegated |
| `src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx` | 107 | 0 (0 hidden) | 0 | 0/0 | 78,84 |
| `src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-history/page.tsx` | 74 | 0 (0 hidden) | 0 | 1/1 | 19,20,25 |
| `src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-participation/page.tsx` | 49 | 0 (0 hidden) | 0 | 0/0 | 15,18 |
| `src/app/(authenticated)/teacher/courses/[deliveryId]/discussions/page.tsx` | 41 | 0 (0 hidden) | 0 | 0/0 | 24,28 |
| `src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/[learnerMembershipId]/page.tsx` | 67 | 0 (0 hidden) | 0 | 0/0 | 27,30 |
| `src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/page.tsx` | 150 | 0 (0 hidden) | 0 | 1/1 | 33,36,48 |
