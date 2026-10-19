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
- [ ] `src/app/(authenticated)/teacher/allAssignments/error.tsx`
- [ ] `src/app/(authenticated)/teacher/allAssignments/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/allAssignments/page.tsx`
- [ ] `src/app/(authenticated)/teacher/allQuizzes/error.tsx`
- [ ] `src/app/(authenticated)/teacher/allQuizzes/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/allQuizzes/page.tsx`
- [ ] `src/app/(authenticated)/teacher/calendar/error.tsx`
- [ ] `src/app/(authenticated)/teacher/calendar/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/calendar/page.tsx`
- [ ] `src/app/(authenticated)/teacher/contacts/[contactsTab]/[membershipId]/error.tsx`
- [ ] `src/app/(authenticated)/teacher/contacts/[contactsTab]/[membershipId]/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/contacts/[contactsTab]/[membershipId]/page.tsx`
- [ ] `src/app/(authenticated)/teacher/contacts/[contactsTab]/error.tsx`
- [ ] `src/app/(authenticated)/teacher/contacts/[contactsTab]/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx`
- [ ] `src/app/(authenticated)/teacher/contacts/error.tsx`
- [ ] `src/app/(authenticated)/teacher/contacts/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/contacts/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/error.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/assessment-health/error.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/assessment-health/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/assessment-health/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/assignments/manage/error.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/assignments/manage/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/assignments/manage/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/attendance-corrections/error.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/attendance-corrections/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/attendance-corrections/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/error.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-history/error.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-history/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-history/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-participation/error.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-participation/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-participation/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussions/error.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussions/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussions/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/error.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/[learnerMembershipId]/error.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/[learnerMembershipId]/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/[learnerMembershipId]/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/error.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/layout.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/notices/error.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/notices/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/notices/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/quizzes/manage/error.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/quizzes/manage/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/quizzes/manage/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/reports/error.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/reports/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/reports/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/session-coverage/error.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/session-coverage/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/session-coverage/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/students/[membershipId]/error.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/students/[membershipId]/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/students/[membershipId]/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/students/error.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/students/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/error.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/page.tsx`
- [ ] `src/app/(authenticated)/teacher/error.tsx`
- [ ] `src/app/(authenticated)/teacher/layout.tsx`
- [ ] `src/app/(authenticated)/teacher/live-classes/error.tsx`
- [ ] `src/app/(authenticated)/teacher/live-classes/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/live-classes/page.tsx`
- [ ] `src/app/(authenticated)/teacher/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/not-found.tsx`
- [ ] `src/app/(authenticated)/teacher/notifications/error.tsx`
- [ ] `src/app/(authenticated)/teacher/notifications/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/notifications/page.tsx`
- [ ] `src/app/(authenticated)/teacher/profile/contacts/error.tsx`
- [ ] `src/app/(authenticated)/teacher/profile/contacts/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/profile/contacts/page.tsx`
- [ ] `src/app/(authenticated)/teacher/profile/details/error.tsx`
- [ ] `src/app/(authenticated)/teacher/profile/details/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/profile/details/page.tsx`
- [ ] `src/app/(authenticated)/teacher/profile/error.tsx`
- [ ] `src/app/(authenticated)/teacher/profile/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/profile/page.tsx`
- [ ] `src/app/(authenticated)/teacher/profile/teaching/error.tsx`
- [ ] `src/app/(authenticated)/teacher/profile/teaching/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/profile/teaching/page.tsx`
- [ ] `src/app/(authenticated)/teacher/report/assignment/[contentId]/error.tsx`
- [ ] `src/app/(authenticated)/teacher/report/assignment/[contentId]/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx`
- [ ] `src/app/(authenticated)/teacher/report/assignment/[contentId]/submissions/error.tsx`
- [ ] `src/app/(authenticated)/teacher/report/assignment/[contentId]/submissions/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/report/assignment/[contentId]/submissions/page.tsx`
- [ ] `src/app/(authenticated)/teacher/report/quiz/[quizId]/attempts/error.tsx`
- [ ] `src/app/(authenticated)/teacher/report/quiz/[quizId]/attempts/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/report/quiz/[quizId]/attempts/page.tsx`
- [ ] `src/app/(authenticated)/teacher/report/quiz/[quizId]/error.tsx`
- [ ] `src/app/(authenticated)/teacher/report/quiz/[quizId]/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx`
- [ ] `src/app/(authenticated)/teacher/response-followups/error.tsx`
- [ ] `src/app/(authenticated)/teacher/response-followups/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/response-followups/page.tsx`
- [ ] `src/app/(authenticated)/teacher/results/error.tsx`
- [ ] `src/app/(authenticated)/teacher/results/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/results/page.tsx`


### Faculty /teach routes (10)
- [ ] `src/app/(authenticated)/teach/courses/[deliveryId]/error.tsx`
- [ ] `src/app/(authenticated)/teach/courses/[deliveryId]/loading.tsx`
- [ ] `src/app/(authenticated)/teach/courses/[deliveryId]/page.tsx`
- [ ] `src/app/(authenticated)/teach/courses/error.tsx`
- [ ] `src/app/(authenticated)/teach/courses/loading.tsx`
- [ ] `src/app/(authenticated)/teach/courses/page.tsx`
- [ ] `src/app/(authenticated)/teach/error.tsx`
- [ ] `src/app/(authenticated)/teach/layout.tsx`
- [ ] `src/app/(authenticated)/teach/loading.tsx`
- [ ] `src/app/(authenticated)/teach/not-found.tsx`


### Super Admin /admin/academics routes (6)
- [ ] `src/app/(authenticated)/admin/academics/error.tsx`
- [ ] `src/app/(authenticated)/admin/academics/loading.tsx`
- [ ] `src/app/(authenticated)/admin/academics/page.tsx`
- [ ] `src/app/(authenticated)/admin/academics/sections/[sectionId]/error.tsx`
- [ ] `src/app/(authenticated)/admin/academics/sections/[sectionId]/loading.tsx`
- [ ] `src/app/(authenticated)/admin/academics/sections/[sectionId]/page.tsx`


### Super Admin /admin/people routes (15)
- [ ] `src/app/(authenticated)/admin/people/directory/[membershipId]/audit/error.tsx`
- [ ] `src/app/(authenticated)/admin/people/directory/[membershipId]/audit/loading.tsx`
- [ ] `src/app/(authenticated)/admin/people/directory/[membershipId]/audit/page.tsx`
- [ ] `src/app/(authenticated)/admin/people/directory/[membershipId]/error.tsx`
- [ ] `src/app/(authenticated)/admin/people/directory/[membershipId]/loading.tsx`
- [ ] `src/app/(authenticated)/admin/people/directory/[membershipId]/page.tsx`
- [ ] `src/app/(authenticated)/admin/people/directory/error.tsx`
- [ ] `src/app/(authenticated)/admin/people/directory/loading.tsx`
- [ ] `src/app/(authenticated)/admin/people/directory/page.tsx`
- [ ] `src/app/(authenticated)/admin/people/error.tsx`
- [ ] `src/app/(authenticated)/admin/people/loading.tsx`
- [ ] `src/app/(authenticated)/admin/people/page.tsx`
- [ ] `src/app/(authenticated)/admin/people/unassigned/error.tsx`
- [ ] `src/app/(authenticated)/admin/people/unassigned/loading.tsx`
- [ ] `src/app/(authenticated)/admin/people/unassigned/page.tsx`


### Super Admin /admin/recruiters routes (3)
- [ ] `src/app/(authenticated)/admin/recruiters/error.tsx`
- [ ] `src/app/(authenticated)/admin/recruiters/loading.tsx`
- [ ] `src/app/(authenticated)/admin/recruiters/page.tsx`


### Faculty UI components (38)
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


### Admin academics/people UI components (26)
- [ ] `src/components/academics/academics-actions.tsx`
- [ ] `src/components/academics/academics-create-panel.tsx`
- [ ] `src/components/academics/academics-overview.tsx`
- [ ] `src/components/academics/academics-section-page.tsx`
- [ ] `src/components/academics/section-operations.tsx`
- [ ] `src/components/admin/academic-directory-refresh.tsx`
- [ ] `src/components/admin/academic-module-scope-inventory.tsx`
- [ ] `src/components/admin/academic-setup-steps.tsx`
- [ ] `src/components/admin/admin-program-directory.tsx`
- [ ] `src/components/admin/department-actions.tsx`
- [ ] `src/components/admin/department-create-form.tsx`
- [ ] `src/components/admin/department-directory.tsx`
- [ ] `src/components/admin/people-pagination.tsx`
- [ ] `src/components/admin/person-membership-actions.tsx`
- [ ] `src/components/admin/person-onboard-dialog.tsx`
- [ ] `src/components/admin/person-profile-dialog.tsx`
- [ ] `src/components/admin/scoped-membership-lifecycle-actions.tsx`
- [ ] `src/components/admin/super-admin-batch-roster-manager.tsx`
- [ ] `src/components/admin/super-admin-faculty-assignment-create.tsx`
- [ ] `src/components/admin/super-admin-faculty-bulk-import.tsx`
- [ ] `src/components/admin/super-admin-faculty-schedule-reassign-action.tsx`
- [ ] `src/components/admin/super-admin-learning-filter-fields.tsx`
- [ ] `src/components/admin/super-admin-legacy-group-tabs.tsx`
- [ ] `src/components/admin/super-admin-people-csv-control.tsx`
- [ ] `src/components/admin/super-admin-student-bulk-access.tsx`
- [ ] `src/components/admin/super-admin-student-import-history.tsx`

## Sweep notes
- Treat `page.tsx` and its imported client component as one rendered surface; thin server route wrappers may need no edits after inspection.
- Check contrast, hover/focus, tables, tabs, form controls, dialogs, alerts, empty/error/loading screens and mobile layouts.
- Commit updates in themed batches and mark reviewed files as complete or no-change after an actual inspection.
