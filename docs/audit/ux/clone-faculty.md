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
