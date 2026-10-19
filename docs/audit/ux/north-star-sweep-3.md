# NORTH STAR — chat-3 faculty + Super Admin academics/people sweep

Date: 2026-10-19. Working branch: `chatgpt/chat-3-b` (updated to latest main before this inventory). Source: `docs/orchestrator/queues/master-queue.md` NORTH STAR; `docs/design/{old-lms-shell-spec.md,old-lms-shell.css,old-lms-pages.md,vnext-vs-old-lms-gap.md}`; `docs/design/legacy-styles/` for exact SCSS values.

## Boundaries and acceptance
- **Only global/shell look:** keep sections, fields, actions, tables, flows, copy and functionality unchanged. No page-content redesign.
- Shared shell sidebar, top bar, global CSS and `src/components/ui/**` are owned by chats 19, 13 and 17; do not alter those.
- Use Inter, headings h1 30px/600 `#172033`, `var(--lms-button-primary)` (`#0a7c88`) with white text, 36px buttons/controls, 9px control radius, `var(--lms-border)` hairlines, `var(--lms-surface)` white, muted/body tokens and shared control components. Prefer `var(--lms-*)` or utility classes tied to semantic tokens over literal hex values.
- Existing shared authenticated page canvas is white, 1px border, radius 12, padding 24 on `#f1f4f9`: remove redundant **outer** wrappers only, preserve genuinely separate content cards.
- Inventory covers page, loading, error and nested route TSX files and page-specific UI components; revisit each for hard-coded typography, colors, borders, radii, shadow, spacing and redundant canvas.
- Do not run application, tests, typecheck or CI in this dev-only lane. Keep TypeScript/TSX syntax valid and no newline before `as` casts. Commit with `[chat-3]`, push only to `chatgpt/chat-3-b`.

## File-by-file inventory (211 UI files)

### Faculty /teacher routes (113)
- [x] `src/app/(authenticated)/teacher/allAssignments/error.tsx`
- [x] `src/app/(authenticated)/teacher/allAssignments/loading.tsx`
- [x] `src/app/(authenticated)/teacher/allAssignments/page.tsx`
- [x] `src/app/(authenticated)/teacher/allQuizzes/error.tsx`
- [x] `src/app/(authenticated)/teacher/allQuizzes/loading.tsx`
- [x] `src/app/(authenticated)/teacher/allQuizzes/page.tsx`
- [x] `src/app/(authenticated)/teacher/calendar/error.tsx`
- [x] `src/app/(authenticated)/teacher/calendar/loading.tsx`
- [x] `src/app/(authenticated)/teacher/calendar/page.tsx`
- [x] `src/app/(authenticated)/teacher/contacts/[contactsTab]/[membershipId]/error.tsx`
- [x] `src/app/(authenticated)/teacher/contacts/[contactsTab]/[membershipId]/loading.tsx`
- [x] `src/app/(authenticated)/teacher/contacts/[contactsTab]/[membershipId]/page.tsx`
- [x] `src/app/(authenticated)/teacher/contacts/[contactsTab]/error.tsx`
- [x] `src/app/(authenticated)/teacher/contacts/[contactsTab]/loading.tsx`
- [x] `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx`
- [x] `src/app/(authenticated)/teacher/contacts/error.tsx`
- [x] `src/app/(authenticated)/teacher/contacts/loading.tsx`
- [x] `src/app/(authenticated)/teacher/contacts/page.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/error.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/loading.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/assessment-health/error.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/assessment-health/loading.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/assessment-health/page.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/assignments/manage/error.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/assignments/manage/loading.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/assignments/manage/page.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/attendance-corrections/error.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/attendance-corrections/loading.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/attendance-corrections/page.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/error.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/loading.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-history/error.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-history/loading.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-history/page.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-participation/error.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-participation/loading.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-participation/page.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussions/error.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussions/loading.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussions/page.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/error.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/[learnerMembershipId]/error.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/[learnerMembershipId]/loading.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/[learnerMembershipId]/page.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/error.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/loading.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/page.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/layout.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/loading.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/notices/error.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/notices/loading.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/notices/page.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/page.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/quizzes/manage/error.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/quizzes/manage/loading.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/quizzes/manage/page.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/reports/error.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/reports/loading.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/reports/page.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/session-coverage/error.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/session-coverage/loading.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/session-coverage/page.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/students/[membershipId]/error.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/students/[membershipId]/loading.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/students/[membershipId]/page.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/students/error.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/students/loading.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx`
- [x] `src/app/(authenticated)/teacher/courses/error.tsx`
- [x] `src/app/(authenticated)/teacher/courses/loading.tsx`
- [x] `src/app/(authenticated)/teacher/courses/page.tsx`
- [x] `src/app/(authenticated)/teacher/error.tsx`
- [x] `src/app/(authenticated)/teacher/layout.tsx`
- [x] `src/app/(authenticated)/teacher/live-classes/error.tsx`
- [x] `src/app/(authenticated)/teacher/live-classes/loading.tsx`
- [x] `src/app/(authenticated)/teacher/live-classes/page.tsx`
- [x] `src/app/(authenticated)/teacher/loading.tsx`
- [x] `src/app/(authenticated)/teacher/not-found.tsx`
- [x] `src/app/(authenticated)/teacher/notifications/error.tsx`
- [x] `src/app/(authenticated)/teacher/notifications/loading.tsx`
- [x] `src/app/(authenticated)/teacher/notifications/page.tsx`
- [x] `src/app/(authenticated)/teacher/profile/contacts/error.tsx`
- [x] `src/app/(authenticated)/teacher/profile/contacts/loading.tsx`
- [x] `src/app/(authenticated)/teacher/profile/contacts/page.tsx`
- [x] `src/app/(authenticated)/teacher/profile/details/error.tsx`
- [x] `src/app/(authenticated)/teacher/profile/details/loading.tsx`
- [x] `src/app/(authenticated)/teacher/profile/details/page.tsx`
- [x] `src/app/(authenticated)/teacher/profile/error.tsx`
- [x] `src/app/(authenticated)/teacher/profile/loading.tsx`
- [x] `src/app/(authenticated)/teacher/profile/page.tsx`
- [x] `src/app/(authenticated)/teacher/profile/teaching/error.tsx`
- [x] `src/app/(authenticated)/teacher/profile/teaching/loading.tsx`
- [x] `src/app/(authenticated)/teacher/profile/teaching/page.tsx`
- [x] `src/app/(authenticated)/teacher/report/assignment/[contentId]/error.tsx`
- [x] `src/app/(authenticated)/teacher/report/assignment/[contentId]/loading.tsx`
- [x] `src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx`
- [x] `src/app/(authenticated)/teacher/report/assignment/[contentId]/submissions/error.tsx`
- [x] `src/app/(authenticated)/teacher/report/assignment/[contentId]/submissions/loading.tsx`
- [x] `src/app/(authenticated)/teacher/report/assignment/[contentId]/submissions/page.tsx`
- [x] `src/app/(authenticated)/teacher/report/quiz/[quizId]/attempts/error.tsx`
- [x] `src/app/(authenticated)/teacher/report/quiz/[quizId]/attempts/loading.tsx`
- [x] `src/app/(authenticated)/teacher/report/quiz/[quizId]/attempts/page.tsx`
- [x] `src/app/(authenticated)/teacher/report/quiz/[quizId]/error.tsx`
- [x] `src/app/(authenticated)/teacher/report/quiz/[quizId]/loading.tsx`
- [x] `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx`
- [x] `src/app/(authenticated)/teacher/response-followups/error.tsx`
- [x] `src/app/(authenticated)/teacher/response-followups/loading.tsx`
- [x] `src/app/(authenticated)/teacher/response-followups/page.tsx`
- [x] `src/app/(authenticated)/teacher/results/error.tsx`
- [x] `src/app/(authenticated)/teacher/results/loading.tsx`
- [x] `src/app/(authenticated)/teacher/results/page.tsx`


### Faculty /teach routes (10)
- [x] `src/app/(authenticated)/teach/courses/[deliveryId]/error.tsx`
- [x] `src/app/(authenticated)/teach/courses/[deliveryId]/loading.tsx`
- [x] `src/app/(authenticated)/teach/courses/[deliveryId]/page.tsx`
- [x] `src/app/(authenticated)/teach/courses/error.tsx`
- [x] `src/app/(authenticated)/teach/courses/loading.tsx`
- [x] `src/app/(authenticated)/teach/courses/page.tsx`
- [x] `src/app/(authenticated)/teach/error.tsx`
- [x] `src/app/(authenticated)/teach/layout.tsx`
- [x] `src/app/(authenticated)/teach/loading.tsx`
- [x] `src/app/(authenticated)/teach/not-found.tsx`


### Super Admin /admin/academics routes (6)
- [x] `src/app/(authenticated)/admin/academics/error.tsx`
- [x] `src/app/(authenticated)/admin/academics/loading.tsx`
- [x] `src/app/(authenticated)/admin/academics/page.tsx`
- [x] `src/app/(authenticated)/admin/academics/sections/[sectionId]/error.tsx`
- [x] `src/app/(authenticated)/admin/academics/sections/[sectionId]/loading.tsx`
- [x] `src/app/(authenticated)/admin/academics/sections/[sectionId]/page.tsx`


### Super Admin /admin/people routes (15)
- [x] `src/app/(authenticated)/admin/people/directory/[membershipId]/audit/error.tsx`
- [x] `src/app/(authenticated)/admin/people/directory/[membershipId]/audit/loading.tsx`
- [x] `src/app/(authenticated)/admin/people/directory/[membershipId]/audit/page.tsx`
- [x] `src/app/(authenticated)/admin/people/directory/[membershipId]/error.tsx`
- [x] `src/app/(authenticated)/admin/people/directory/[membershipId]/loading.tsx`
- [x] `src/app/(authenticated)/admin/people/directory/[membershipId]/page.tsx`
- [x] `src/app/(authenticated)/admin/people/directory/error.tsx`
- [x] `src/app/(authenticated)/admin/people/directory/loading.tsx`
- [x] `src/app/(authenticated)/admin/people/directory/page.tsx`
- [x] `src/app/(authenticated)/admin/people/error.tsx`
- [x] `src/app/(authenticated)/admin/people/loading.tsx`
- [x] `src/app/(authenticated)/admin/people/page.tsx`
- [x] `src/app/(authenticated)/admin/people/unassigned/error.tsx`
- [x] `src/app/(authenticated)/admin/people/unassigned/loading.tsx`
- [x] `src/app/(authenticated)/admin/people/unassigned/page.tsx`


### Super Admin /admin/recruiters routes (3)
- [x] `src/app/(authenticated)/admin/recruiters/error.tsx`
- [x] `src/app/(authenticated)/admin/recruiters/loading.tsx`
- [x] `src/app/(authenticated)/admin/recruiters/page.tsx`


### Faculty UI components (38)
- [x] `src/components/attendance/faculty-attendance-schedule-editor.tsx`
- [x] `src/components/attendance/faculty-attendance-workspace.tsx`
- [x] `src/components/courses/faculty-assessment-create.tsx`
- [x] `src/components/courses/faculty-assessment-editor.tsx`
- [x] `src/components/courses/faculty-assessment-lifecycle.tsx`
- [x] `src/components/courses/faculty-assessment-overview.tsx`
- [x] `src/components/courses/faculty-assignment-editor.tsx`
- [x] `src/components/courses/faculty-assignment-material-links.tsx`
- [x] `src/components/courses/faculty-assignment-method-picker.tsx`
- [x] `src/components/courses/faculty-assignment-review.tsx`
- [x] `src/components/courses/faculty-choice-quiz-builder.tsx`
- [x] `src/components/courses/faculty-contacts-table.tsx`
- [x] `src/components/courses/faculty-content-editor.tsx`
- [x] `src/components/courses/faculty-content-order-editor.tsx`
- [x] `src/components/courses/faculty-course-filter-auto-submit.tsx`
- [x] `src/components/courses/faculty-course-home-signals.tsx`
- [x] `src/components/courses/faculty-course-list.tsx`
- [x] `src/components/courses/faculty-course-roster.tsx`
- [x] `src/components/courses/faculty-course-tab-navigation.tsx`
- [x] `src/components/courses/faculty-course-workspace.tsx`
- [x] `src/components/courses/faculty-ist-quarter-hour-picker.tsx`
- [x] `src/components/courses/faculty-item-actions.tsx`
- [x] `src/components/courses/faculty-lesson-authoring.tsx`
- [x] `src/components/courses/faculty-lesson-video-manager.tsx`
- [x] `src/components/courses/faculty-live-class-editor.tsx`
- [x] `src/components/courses/faculty-quiz-learner-preview.tsx`
- [x] `src/components/courses/faculty-quiz-question-editor.tsx`
- [x] `src/components/courses/faculty-quiz-review.tsx`
- [x] `src/components/courses/faculty-report-csv-download.tsx`
- [x] `src/components/courses/faculty-report-download.tsx`
- [x] `src/components/courses/faculty-report-student-table.tsx`
- [x] `src/components/courses/faculty-submission-file-review.tsx`
- [x] `src/components/courses/faculty-video-preview.tsx`
- [x] `src/components/people/faculty-profile-editor.tsx`
- [x] `src/components/people/faculty-profile-metadata.tsx`
- [x] `src/components/people/faculty-profile-repeatable.tsx`
- [x] `src/components/people/faculty-profile-skills.tsx`
- [x] `src/components/people/faculty-profile-text-section.tsx`


### Admin academics/people UI components (26)
- [x] `src/components/academics/academics-actions.tsx`
- [x] `src/components/academics/academics-create-panel.tsx`
- [x] `src/components/academics/academics-overview.tsx`
- [x] `src/components/academics/academics-section-page.tsx`
- [x] `src/components/academics/section-operations.tsx`
- [x] `src/components/admin/academic-directory-refresh.tsx`
- [x] `src/components/admin/academic-module-scope-inventory.tsx`
- [x] `src/components/admin/academic-setup-steps.tsx`
- [x] `src/components/admin/admin-program-directory.tsx`
- [x] `src/components/admin/department-actions.tsx`
- [x] `src/components/admin/department-create-form.tsx`
- [x] `src/components/admin/department-directory.tsx`
- [x] `src/components/admin/people-pagination.tsx`
- [x] `src/components/admin/person-membership-actions.tsx`
- [x] `src/components/admin/person-onboard-dialog.tsx`
- [x] `src/components/admin/person-profile-dialog.tsx`
- [x] `src/components/admin/scoped-membership-lifecycle-actions.tsx`
- [x] `src/components/admin/super-admin-batch-roster-manager.tsx`
- [x] `src/components/admin/super-admin-faculty-assignment-create.tsx`
- [x] `src/components/admin/super-admin-faculty-bulk-import.tsx`
- [x] `src/components/admin/super-admin-faculty-schedule-reassign-action.tsx`
- [x] `src/components/admin/super-admin-learning-filter-fields.tsx`
- [x] `src/components/admin/super-admin-legacy-group-tabs.tsx`
- [x] `src/components/admin/super-admin-people-csv-control.tsx`
- [x] `src/components/admin/super-admin-student-bulk-access.tsx`
- [x] `src/components/admin/super-admin-student-import-history.tsx`

## Sweep notes
- Treat `page.tsx` and its imported client component as one rendered surface; thin server route wrappers may need no edits after inspection.
- Check contrast, hover/focus, tables, tabs, form controls, dialogs, alerts, empty/error/loading screens and mobile layouts.
- Commit updates in themed batches and mark reviewed files as complete or no-change after an actual inspection.

## Completed source sweep (2026-10-19)
- Reviewed **211** inventoried TSX/CSS files. **78** received presentation-only changes on this branch; **133** were left as inherited/shared-skin compliant or did not need a safe local override.
- Removed redundant filter-panel borders/background/padding from faculty course filters and Super Admin people filters, restoring the single white canvas; preserved their forms and query behavior.
- Normalized interactive control radii/heights/text size using existing `--lms-*` tokens and updated route-level error title/retry states. Primary actions continue to use `bg-primary`/white via the shared globals.
- **Not run:** Next.js dev server, TypeScript compiler, tests, CI and browser pixel-diff (per owner directive). Final visual parity against the running legacy LMS requires the orchestrator's screenshot pass.

## Follow-on portal: Super Admin academic structure + student/faculty directories (2026-10-19)
The initial 211-file sweep was marked completed, so this extension continues the same NORTH STAR skin in adjacent Super Admin academic/people routes that were outside the original literal URL prefixes. This is a presentation-only follow-on: never change content or behavior, and do not touch shell/shared UI ownership.

- [x] `src/app/(authenticated)/admin/batch-promotion/page.tsx`
- [x] `src/app/(authenticated)/admin/batches/[batchId]/students/page.tsx`
- [x] `src/app/(authenticated)/admin/batches/page.tsx`
- [x] `src/app/(authenticated)/admin/classes/page.tsx`
- [x] `src/app/(authenticated)/admin/departments/page.tsx`
- [x] `src/app/(authenticated)/admin/electives/page.tsx`
- [x] `src/app/(authenticated)/admin/faculty-assignment/page.tsx`
- [x] `src/app/(authenticated)/admin/faculty/page.tsx`
- [x] `src/app/(authenticated)/admin/lecture-halls/[hallId]/page.tsx`
- [x] `src/app/(authenticated)/admin/lecture-halls/page.tsx`
- [x] `src/app/(authenticated)/admin/programs/page.tsx`
- [x] `src/app/(authenticated)/admin/semester-courses/page.tsx`
- [x] `src/app/(authenticated)/admin/semesters/page.tsx`
- [x] `src/app/(authenticated)/admin/students/page.tsx`

### Follow-on sweep status
- Reviewed 14 adjacent Super Admin academic/people route files; applied page-only token/radius/height and single-canvas filter/list wrapper changes in 12, with 2 thin wrappers left unchanged.
- Continued use of shared `Input`, `Select`, `Button`, `PageHeader` and `DataTable`; no route permissions, queries, copy, or business actions changed.
- Visual screenshot and CI verification intentionally deferred per lane instructions.

## Follow-on portal: Super Admin attendance
Continue legacy-shell skin in the attendance portion of Super Admin academic operations, which shares read-only widgets with College Admin. Keep service calls, table structure, action flows and page content as-is. Table grids may retain their hairline table container; metric and filter-card wrappers should flatten onto the page canvas.

- [x] `src/app/(authenticated)/admin/attendance/page.tsx`
- [x] `src/components/attendance/admin-attendance-workspace.tsx`
- [x] `src/components/admin/super-admin-attendance-settings-editor.tsx`

### Attendance pass result
- Reviewed all three source files; flattened policy metrics and monthly-health block separators in `admin-attendance-workspace.tsx` while retaining the hairline table boundary.
- Server route and settings editor inherit the shared UI tokens and require no presentation-only changes. No code, tests, typecheck or CI executed.

## Follow-on portal: Super Admin recruiter accounts
The `/admin/recruiters` route in the original 211-file inventory is a compatibility export of `../hr/page`; therefore the actual UI is implemented in the files below. Include these to fulfill the explicitly owned recruiter directory surface without changing any HR/recruiter portal routes.

- [x] `src/app/(authenticated)/admin/hr/page.tsx`
- [x] `src/components/admin/super-admin-hr-accounts.tsx`
- [x] `src/components/admin/super-admin-hr-account-dialog.tsx`
- [x] `src/components/admin/super-admin-hr-detail-drawer.tsx`

### Recruiter and people-directory verification notes
- `/admin/recruiters` reexports `/admin/hr/page.tsx`; the live Super Admin account list, form and drawer were inspected through their real imported components. Updated three presentation sources and left the existing dialog on shared styles.
- Second-pass people directory: flattened GET filter forms, repeated user tiles, and membership summary border cards to preserve the one-canvas page hierarchy; kept platform-wide block security controls visually distinct.
- No behavioural changes, copy edits, service changes or test/CI execution.

## Follow-on value-by-value pass — 2026-10-19

After the initial 211-file sweep, this lane revisited the high-density teaching and Super Admin forms against the same old-LMS references. The follow-on pass pushed **33 incremental presentation-only commits** (plus a safe merge of the latest `main` with disjoint changes). Changes stay on `chatgpt/chat-3-b`.

- **Faculty quiz builder:** removed an unnecessary outer boxed canvas; normalized quiz/answer/input buttons to 9px, 36px desktop height (retaining 44px mobile touch targets); fixed the two explicit dark-on-teal primary buttons to `text-on-primary`; aligned the draft review surface and headings.
- **Faculty course pages:** revised list-filter control typography, clear-filter action, course card hover treatment, workspace headings, home headings and related lesson controls without changing data, flow or item structure.
- **Faculty attendance/authoring:** flattened nested filter/scheduling wrappers, adjusted table header tint/sticky header, removed excess sticky toolbar shadow, normalized assignment and submission navigation styles, and aligned content ordering, video-manager and report-table shells.
- **Super Admin academics/people:** converted directory tab pills to the legacy underline treatment, changed hard-coded 9px/12px radius values to shared CSS tokens, normalized faculty bulk-registration/teaching-assignment actions, aligned section and dialog heading colors, and preserved all memberships/roster operations.
- **Scope coordination:** merged `main` into the lane using a branch-only merge; the 29 files independently changed since the merge base had no path overlap with the 132-file main-side change list. No files owned by the shared token/sidebar/topbar lanes were edited here.

**Validation boundary:** Source-only edits and connector-level review; no application execution, TypeScript build, tests, CI or screenshot/pixel-diff were run, per owner instruction. Browser comparison against the legacy LMS remains the final validation gate.

## Incremental north-star value pass — 2026-10-19, chat-3 continuation

After fast-forwarding `chatgpt/chat-3-b` to current `main` (main commit `a98732e8ad1845a88229c57ba38c4a90f02eca77`), this continuation produced **20 additional [chat-3] commits** on the lane branch. The checked initial inventory remains complete; these are a deeper appearance-only pass, not behavioural changes.

- **Faculty courses and assessments:** replaced lingering standalone `rounded-lg`/`rounded-xl` card, filter, notice and lesson styles with the existing 9px control / 12px canvas tokens; aligned course signal cards, quiz-review cards, assessment overview cards, assignment review panels, video resource previews and faculty contacts navigation.
- **Faculty attendance and authoring:** normalized attendance tab/group corners and row treatments, faculty profile editor alerts and secondary actions, lesson-authoring resource panels and IST scheduling inputs. Controls keep 44px mobile touch targets with 36px desktop minimum height where explicitly set.
- **Super Admin academics and people:** removed an accidental stray `-` utility class in section summary grid, aligned people-directory desktop link heights, and corrected the faculty-assignment create action's mobile touch target while keeping white-on-teal primary style.
- **Syntax-preserving approach:** each edit was scoped to literal presentation class attributes and verified to preserve the ordered JSX closing-tag sequence. No JSX structure, data logic, routes, services, query parsing, copy or feature behavior was changed.
- **Execution boundary:** did **not** run the app, TypeScript compiler, tests, lint, CI or pixel comparison per owner direction. Actual old-LMS visual parity still requires the final screenshot check by the orchestrator.

## Incremental canvas/controls follow-on — 2026-10-19 (chat-3)

Rebased the active lane context onto current `main` with a branch-only, two-parent merge (`dc96255b`): 74 main-side changed paths and 21 lane-side paths since their common base had no overlap. Retained all lane commits without updating `main`.

Five further `[chat-3]` commits covered **23 presentation files** linked to the faculty and Super Admin academic/people surfaces:

- **Faculty:** removed a nested outline from the in-course metadata strip; flattened attendance grid's outer card while retaining a hairline table boundary; resolved a contradictory foreground utility on the primary assessment-results action; standardized roster media corner radius.
- **Super Admin academic directories:** flattened redundant batch/class no-scope status cards and batch roster guidance; normalized faculty registration, teaching-assignment, departments, semesters, and academics links to 44px mobile/36px desktop treatment and keyboard focus affordances.
- **Connected academic portal:** normalized electives, lecture halls, batch promotion, academic setup steps, student directory shortcuts and semester-mapping warning strip; converted repeated elective/batch-preview tiles to canvas-aligned separated rows where appropriate.
- **Shared read surfaces within lane scope:** normalized desktop navigation links, recruiter-account disabled action placeholders, and removed stale radius fallbacks while retaining original copy, routes, query handling, sections and form behavior.
- All edits changed literal presentational class names only. The ordered JSX closing-tag sequences were checked against their originals before each commit, including full `</Select>` closures. No app run, typecheck, lint, tests, CI or screenshot comparison, per the lane instruction.

## 2026-10-19 — north-star control parity continuation (chat-3)

- Advanced lane from the inherited conflict-free ancestor to `main` at `3de1481` before editing, preserving the previous swept inventory. New commits touch **faculty teacher pages**, **faculty course/quiz/gradebook/report widgets**, **Super Admin academic/people controls**, and **college academic attendance/assessment read surfaces**. No page contents, forms, wording, APIs, permission checks, or routes were reorganised.
- Migrated native text/search/date inputs and selects plus explicit-type buttons where safe to shared `Input`, `Select` and `Button`; selected native checkboxes, file inputs and dynamic input types remain native to preserve their specialized behavior. Replaced remaining self-closing native textarea editors with `Textarea`.
- Resolved stale `rounded-md`, `rounded-lg`, `rounded-xl` and neutral literal overrides to control/canvas semantic radius, surface/border/body tokens. A second pass removed redundant literal classes from converted controls and restored `variant="secondary"` on outlined actions.
- Reconciled the department archive retry control with the newer `main` implementation (`Button variant="ghost"`), rather than overriding that parallel lane's improvement.
- Mentor-facing pages are being swept by their owning chat-14 lane; this continuation intentionally did not edit those pages to avoid conflicting same-file writers. Shell/topbar/sidebar and shared UI component implementations remain under their designated owners.
- Static source-oriented tag/import spot checks only. **No runtime execution, TypeScript check, lint, tests, CI, or screenshot visual comparison**; the owner/orchestrator retains final render and accessibility verification. Source textual conversions cannot establish pixel-level parity without that visual pass.
