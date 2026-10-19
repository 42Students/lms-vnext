# H — Learner / Courses / Super Admin course-content clone audit

Owner lane: `chat-7` · Branch: `chatgpt/chat-7-b` · Status: IN PROGRESS
Baseline: `origin/main` commit `fa87ca9ad870d63fafab0200e8b6f4d16b568c58` (2026-10-19); branch fast-forwarded from `36399005c0b87aa0f8bbbd5563581c653b881a52`.
Rules: `docs/design/ui-clone-checklist.md` WORK STYLE and STRICT TICK RULE.
Legacy sources: `docs/design/legacy-styles/`, `docs/design/old-lms-shell.css`, `docs/design/old-lms-pages.md`.

## Coverage inventory and grep plan

Repository tree inventory from GitHub (recursive, not truncated): 99 TSX in `src/components/courses/`, 135 TSX under `src/app/(authenticated)/learn/`, and 13 TSX in `src/app/(authenticated)/admin/{courses,course-progress,lessons}` = **247 TSX paths**. This does not assert that all nested learner widgets outside `components/courses` have been reviewed; those are another explicit search step.

Source check commands (record actual resulting match counts and paths after each sweep; do not count component imports as migration):

```bash
rg -l '<button([[:space:]>])' src/components/courses 'src/app/(authenticated)/learn' 'src/app/(authenticated)/admin/courses' 'src/app/(authenticated)/admin/course-progress' 'src/app/(authenticated)/admin/lessons' --glob '*.tsx'
rg -l '<select([[:space:]>])' src/components/courses 'src/app/(authenticated)/learn' 'src/app/(authenticated)/admin/courses' 'src/app/(authenticated)/admin/course-progress' 'src/app/(authenticated)/admin/lessons' --glob '*.tsx'
rg -l '<input([[:space:]>])' src/components/courses 'src/app/(authenticated)/learn' 'src/app/(authenticated)/admin/courses' 'src/app/(authenticated)/admin/course-progress' 'src/app/(authenticated)/admin/lessons' --glob '*.tsx'
rg -l '<textarea([[:space:]>])' src/components/courses 'src/app/(authenticated)/learn' 'src/app/(authenticated)/admin/courses' 'src/app/(authenticated)/admin/course-progress' 'src/app/(authenticated)/admin/lessons' --glob '*.tsx'
rg -l '#[[:xdigit:]]{6}([[:space:]"';]|$)' src/components/courses 'src/app/(authenticated)/learn' 'src/app/(authenticated)/admin/courses' 'src/app/(authenticated)/admin/course-progress' 'src/app/(authenticated)/admin/lessons' --glob '*.tsx'
rg -l '<table([[:space:]>])|role="dialog"|fixed inset-0' src/components/courses 'src/app/(authenticated)/learn' 'src/app/(authenticated)/admin/courses' 'src/app/(authenticated)/admin/course-progress' 'src/app/(authenticated)/admin/lessons' --glob '*.tsx'
rg -l '<h1([[:space:]>])' 'src/app/(authenticated)/learn' 'src/app/(authenticated)/admin/courses' 'src/app/(authenticated)/admin/course-progress' 'src/app/(authenticated)/admin/lessons' --glob '*.tsx'
```

Native hidden inputs without styling, and textarea DOM refs that depend on selection/focus are *not* yet accepted exemptions under the owner's strict rule. They remain open until migrated safely or documented with a concrete behavioral necessity and approved policy.

## Work queue (tree-verified, 2026-10-19, branch based on `fa87ca9ad870d63fafab0200e8b6f4d16b568c58`)

Source: GitHub recursive trees on the branch base (not a local `rg` run). Files were enumerated exhaustively for these five directory roots; source-tag grep equivalents were inspected for all 99 `src/components/courses` TSX and an initial set of route pages. Replicate the commands above with `rg` before ticking. Keep rows pending until per-page responsive and legacy value/state proofs are complete. UI files remain owned by chat-17; do not edit them.

### Direct raw-control / skin findings (priority order)

- [x] `src/components/courses/college-quiz-questions-editor.tsx` — migrated 1 raw select, 1 textarea, 3 inputs (including the dynamic radio/checkbox choice) to shared controls; verified matching `<Select>` / `</Select>` names by source inspection. Commit `911e8106e4cc23f1e9060eac30387880fb076847`; value/state proof and responsive proof still open for overall H5.
- [x] `src/components/courses/college-learner-progress-report.tsx` — replaced raw hidden input with shared `Input`, removed duplicate Button import. Commit `62a70dc724622438e79c115c3426a33731549edb`.
- [ ] `src/components/courses/learner-course-discussion.tsx:647-666` — raw textarea with `composerRef` controls focus and Enter/Shift+Enter. Shared `TextareaProps` currently lacks a `ref` prop (`src/components/ui/textarea.tsx:4`); needs compatible ref contract from chat-17 before replacement without breaking behavior.
- [ ] `src/components/courses/learner-quiz-attempt.tsx:349,367,455` — internal h1 headings: review whether they are page headings or quiz content before migrating; preserve semantics.
- [ ] `src/components/courses/admin-course-actions.tsx` and `admin-course-create-panel.tsx` — `#1677FF` stored course card color fallback; check color API invariant / central course card default before changing data semantics. Do not replace a persisted hex value with a CSS variable string without API proof.
- [ ] `src/components/courses/college-learner-progress-report.tsx` — wrapper `rounded-xl border ... p-5` and nested stat tile wrappers require page-canvas context review, no content restructure.
- [ ] All learner route pages — check shared `PageHeader`, one canvas, no extra nested outer card, phone/tablet response, raw controls and theme token exceptions; prioritize courses, quizzes, assignments, lessons, discussion and attendance, then placement and account pages.
- [ ] Super Admin courses / course-progress / lessons routes — verify page head and form/table shared primitives against old LMS.

### src/components/courses/ (99 TSX)

- `src/components/courses/admin-assessment-read-directory.tsx` [pending parity review]
- `src/components/courses/admin-course-actions.tsx` [pending parity review]
- `src/components/courses/admin-course-create-panel.tsx` [pending parity review]
- `src/components/courses/admin-course-display-editor.tsx` [pending parity review]
- `src/components/courses/admin-course-overview.tsx` [pending parity review]
- `src/components/courses/admin-learning-structure-actions.tsx` [pending parity review]
- `src/components/courses/admin-offering-learning-overview.tsx` [pending parity review]
- `src/components/courses/admin-offering-learning-page.tsx` [pending parity review]
- `src/components/courses/admin-offering-section-preview.tsx` [pending parity review]
- `src/components/courses/admin-offering-teachers-panel.tsx` [pending parity review]
- `src/components/courses/assignment-file-open-control.tsx` [pending parity review]
- `src/components/courses/assignment-file-submission-control.tsx` [pending parity review]
- `src/components/courses/assignment-multipart-parts-editor.tsx` [pending parity review]
- `src/components/courses/assignment-submission-control.tsx` [pending parity review]
- `src/components/courses/assignment-submission-links.tsx` [pending parity review]
- `src/components/courses/college-archived-lesson-restore.tsx` [pending parity review]
- `src/components/courses/college-assessment-aggregate.tsx` [pending parity review]
- `src/components/courses/college-assignment-actions.tsx` [pending parity review]
- `src/components/courses/college-assignment-create.tsx` [pending parity review]
- `src/components/courses/college-assignment-review.tsx` [pending parity review]
- `src/components/courses/college-content-aggregate.tsx` [pending parity review]
- `src/components/courses/college-content-authoring-control.tsx` [pending parity review]
- `src/components/courses/college-content-csv-export.tsx` [pending parity review]
- `src/components/courses/college-content-preview.tsx` [pending parity review]
- `src/components/courses/college-course-missing-scope.tsx` [pending parity review]
- `src/components/courses/college-learner-progress-report.tsx` [partial migration; parity pending]
- `src/components/courses/college-learning-directory.tsx` [pending parity review]
- `src/components/courses/college-lesson-create-control.tsx` [pending parity review]
- `src/components/courses/college-lesson-drag-order.tsx` [pending parity review]
- `src/components/courses/college-lesson-reorder-actions.tsx` [pending parity review]
- `src/components/courses/college-lesson-visibility-controls.tsx` [pending parity review]
- `src/components/courses/college-live-classes-directory.tsx` [pending parity review]
- `src/components/courses/college-quiz-actions.tsx` [pending parity review]
- `src/components/courses/college-quiz-attempts.tsx` [pending parity review]
- `src/components/courses/college-quiz-create.tsx` [pending parity review]
- `src/components/courses/college-quiz-questions-editor.tsx` [partial migration; parity pending]
- `src/components/courses/college-student-visibility-control.tsx` [pending parity review]
- `src/components/courses/course-choice-control.tsx` [pending parity review]
- `src/components/courses/course-display-read-only.tsx` [pending parity review]
- `src/components/courses/expandable-course-description.tsx` [pending parity review]
- `src/components/courses/expandable-course-update.tsx` [pending parity review]
- `src/components/courses/faculty-assessment-create.tsx` [pending parity review]
- `src/components/courses/faculty-assessment-editor.tsx` [pending parity review]
- `src/components/courses/faculty-assessment-lifecycle.tsx` [pending parity review]
- `src/components/courses/faculty-assessment-overview.tsx` [pending parity review]
- `src/components/courses/faculty-assignment-editor.tsx` [pending parity review]
- `src/components/courses/faculty-assignment-material-links.tsx` [pending parity review]
- `src/components/courses/faculty-assignment-method-picker.tsx` [pending parity review]
- `src/components/courses/faculty-assignment-review.tsx` [pending parity review]
- `src/components/courses/faculty-choice-quiz-builder.tsx` [pending parity review]
- `src/components/courses/faculty-contacts-table.tsx` [pending parity review]
- `src/components/courses/faculty-content-editor.tsx` [pending parity review]
- `src/components/courses/faculty-content-order-editor.tsx` [pending parity review]
- `src/components/courses/faculty-course-filter-auto-submit.tsx` [pending parity review]
- `src/components/courses/faculty-course-home-signals.tsx` [pending parity review]
- `src/components/courses/faculty-course-list.tsx` [pending parity review]
- `src/components/courses/faculty-course-roster.tsx` [pending parity review]
- `src/components/courses/faculty-course-tab-navigation.tsx` [pending parity review]
- `src/components/courses/faculty-course-workspace.tsx` [pending parity review]
- `src/components/courses/faculty-ist-quarter-hour-picker.tsx` [pending parity review]
- `src/components/courses/faculty-item-actions.tsx` [pending parity review]
- `src/components/courses/faculty-lesson-authoring.tsx` [pending parity review]
- `src/components/courses/faculty-lesson-video-manager.tsx` [pending parity review]
- `src/components/courses/faculty-live-class-editor.tsx` [pending parity review]
- `src/components/courses/faculty-quiz-learner-preview.tsx` [pending parity review]
- `src/components/courses/faculty-quiz-question-editor.tsx` [pending parity review]
- `src/components/courses/faculty-quiz-review.tsx` [pending parity review]
- `src/components/courses/faculty-report-csv-download.tsx` [pending parity review]
- `src/components/courses/faculty-report-download.tsx` [pending parity review]
- `src/components/courses/faculty-report-student-table.tsx` [pending parity review]
- `src/components/courses/faculty-submission-file-review.tsx` [pending parity review]
- `src/components/courses/faculty-video-preview.tsx` [pending parity review]
- `src/components/courses/learner-assessment-overview.tsx` [pending parity review]
- `src/components/courses/learner-course-attendance.tsx` [pending parity review]
- `src/components/courses/learner-course-card-image.tsx` [pending parity review]
- `src/components/courses/learner-course-discussion.tsx` [pending parity review]
- `src/components/courses/learner-course-document-title.tsx` [pending parity review]
- `src/components/courses/learner-course-list.tsx` [pending parity review]
- `src/components/courses/learner-course-overview.tsx` [pending parity review]
- `src/components/courses/learner-course-state-retry.tsx` [pending parity review]
- `src/components/courses/learner-course-tabs.tsx` [pending parity review]
- `src/components/courses/learner-course-workspace.tsx` [pending parity review]
- `src/components/courses/learner-formatted-response.tsx` [pending parity review]
- `src/components/courses/learner-live-class-link.tsx` [pending parity review]
- `src/components/courses/learner-live-session-status.tsx` [pending parity review]
- `src/components/courses/learner-quiz-attempt.tsx` [pending parity review]
- `src/components/courses/learner-rich-response-editor.tsx` [pending parity review]
- `src/components/courses/learner-roadmap-item-dialog.tsx` [pending parity review]
- `src/components/courses/learner-video-player.tsx` [pending parity review]
- `src/components/courses/learner-youtube-player.tsx` [pending parity review]
- `src/components/courses/lesson-resource-materials-control.tsx` [pending parity review]
- `src/components/courses/quiz-attempt-control.tsx` [pending parity review]
- `src/components/courses/resource-progress-control.tsx` [pending parity review]
- `src/components/courses/super-admin-content-actions.tsx` [pending parity review]
- `src/components/courses/super-admin-content-authoring.tsx` [pending parity review]
- `src/components/courses/super-admin-content-directory-page.tsx` [pending parity review]
- `src/components/courses/super-admin-course-bulk-visibility.tsx` [pending parity review]
- `src/components/courses/super-admin-lesson-bulk-visibility.tsx` [pending parity review]
- `src/components/courses/super-admin-lesson-create.tsx` [pending parity review]

### src/app/(authenticated)/learn/ (135 TSX)

- `src/app/(authenticated)/learn/allAssignments/[assignmentId]/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/allAssignments/[assignmentId]/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/allAssignments/[assignmentId]/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/allAssignments/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/allAssignments/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/allAssignments/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/allQuizzes/[quizId]/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/allQuizzes/[quizId]/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/allQuizzes/[quizId]/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/allQuizzes/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/allQuizzes/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/allQuizzes/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/assignments/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/assignments/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/assignments/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/attendance/calendar/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/attendance/calendar/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/attendance/calendar/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/attendance/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/attendance/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/attendance/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/calendar/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/calendar/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/calendar/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/not-found.tsx` [pending parity review]
- `src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/courses/[deliveryId]/attendance-summary/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/courses/[deliveryId]/attendance-summary/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/courses/[deliveryId]/attendance-summary/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/courses/[deliveryId]/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/courses/[deliveryId]/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/courses/[deliveryId]/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/courses/[deliveryId]/progress/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/courses/[deliveryId]/progress/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/courses/[deliveryId]/progress/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/courses/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/courses/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/courses/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/layout.tsx` [pending parity review]
- `src/app/(authenticated)/learn/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/announcements/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/announcements/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/announcements/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/company/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/company/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/company/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/applications/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/applications/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/applications/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/assessments/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/assessments/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/assessments/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/assessments/results/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/assessments/results/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/assessments/results/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/calendar/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/calendar/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/calendar/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/interviews/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/interviews/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/interviews/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/jobs/[jobId]/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/jobs/[jobId]/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/jobs/[jobId]/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/jobs/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/jobs/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/jobs/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/layout.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/notification-preferences/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/notification-preferences/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/notification-preferences/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/offers/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/offers/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/offers/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/placement/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/placement/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/placement/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/preparation/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/preparation/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/preparation/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/rules/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/rules/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/rules/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/schedule/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/schedule/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/schedule/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/support/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/support/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/my-placements/support/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/not-found.tsx` [pending parity review]
- `src/app/(authenticated)/learn/notifications/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/notifications/history/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/notifications/history/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/notifications/history/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/notifications/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/notifications/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/placements/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/placements/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/placements/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/profile/academic-record/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/profile/academic-record/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/profile/academic-record/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/profile/completeness/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/profile/completeness/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/profile/completeness/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/profile/data-access/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/profile/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/profile/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/profile/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/profile/verification/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/profile/verification/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/profile/verification/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/projects/[projectId]/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/projects/[projectId]/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/projects/[projectId]/not-found.tsx` [pending parity review]
- `src/app/(authenticated)/learn/projects/[projectId]/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/projects/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/projects/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/projects/page.tsx` [pending parity review]
- `src/app/(authenticated)/learn/quizzes/error.tsx` [pending parity review]
- `src/app/(authenticated)/learn/quizzes/loading.tsx` [pending parity review]
- `src/app/(authenticated)/learn/quizzes/page.tsx` [pending parity review]

### src/app/(authenticated)/admin/courses/ (6 TSX)

- `src/app/(authenticated)/admin/courses/error.tsx` [pending parity review]
- `src/app/(authenticated)/admin/courses/loading.tsx` [pending parity review]
- `src/app/(authenticated)/admin/courses/offerings/[offeringId]/error.tsx` [pending parity review]
- `src/app/(authenticated)/admin/courses/offerings/[offeringId]/loading.tsx` [pending parity review]
- `src/app/(authenticated)/admin/courses/offerings/[offeringId]/page.tsx` [pending parity review]
- `src/app/(authenticated)/admin/courses/page.tsx` [pending parity review]

### src/app/(authenticated)/admin/course-progress/ (4 TSX)

- `src/app/(authenticated)/admin/course-progress/error.tsx` [pending parity review]
- `src/app/(authenticated)/admin/course-progress/loading.tsx` [pending parity review]
- `src/app/(authenticated)/admin/course-progress/page.tsx` [pending parity review]
- `src/app/(authenticated)/admin/course-progress/students/page.tsx` [pending parity review]

### src/app/(authenticated)/admin/lessons/ (3 TSX)

- `src/app/(authenticated)/admin/lessons/error.tsx` [pending parity review]
- `src/app/(authenticated)/admin/lessons/loading.tsx` [pending parity review]
- `src/app/(authenticated)/admin/lessons/page.tsx` [pending parity review]

### Initial partial source-grep results (not a tick)

Checked full contents of 99 course TSX files using tag-pattern equivalents of the above `rg` commands; initial findings: 1 unconverted focus-ref textarea, 3 quiz-attempt `h1`, 2 stored `#1677FF` card-color fallbacks. The quiz-editor raw controls and course-progress hidden input were converted on this branch. Learner page scan is not yet exhaustive; no zero count is claimed across 247 files. `role="dialog"`, `fixed inset-0`, tabling and nested wrappers remain pending an all-path exhaustive scan. Legacy listing header `components___listing-page-header.scss:53-59` uses a 28px/600 title while the cross-portal PageHeader currently sets 30px on md+ (`src/components/ui/page-header.tsx:34-39`), so global header parity cannot be signed here.

## Items — STRICT TICK RULE

- [ ] H1 learner route headings / shared PageHeader / one canvas (missing: complete page-wise comparison, source-line value table, phone/tablet proof, and final grep counts)
- [ ] H2 learner assignment / quiz / discussion controls (missing: exhaustive control enumeration, zero raw styled instances, full legacy property-state parity table)
- [ ] H3 course list, lessons, roadmap, video, resource, attendance and progress UI (missing: exhaustive UI instances, responsive proof and value table)
- [ ] H4 Super Admin course, lessons, content authoring and progress UI (missing: source grep zero and value/state proof)
- [ ] H5 shared course component library across faculty/college/learner (missing: all 98 files reviewed against legacy source and all raw controls migrated)
- [ ] H6 no raw tables, custom overlays, hard-coded hex or nested outer canvas (missing: complete grep and documented exception review)

## Property/state comparison ledger (not yet signable)

| Element / property / state | Legacy file:line / value | vNext file:line / value | Result |
|---|---|---|---|
| Primary button default height/radius/colour | `docs/design/ui-clone-checklist.md` D: 36px / 9px / #0a7c88 (legacy SCSS per owner) | `src/components/ui/button.tsx` (shared skin maintained by chat-17; verify exact lines and states) | OPEN |
| Page head title font / colour | `docs/design/ui-clone-checklist.md` B5: shared head; `old-lms-pages.md` for exact values | `src/components/ui/page-header.tsx` (chat-9) | OPEN |
| Canvas background / padding / border | `docs/design/ui-clone-checklist.md` B5: white, radius 12px, padding 24px | Authenticated page canvas (chat-9) | OPEN |
| Form focus / invalid / disabled / readonly | `docs/design/legacy-styles/` forms SCSS (exact lines pending) | shared `Input`, `Select`, `Textarea` (chat-17) | OPEN |
| Mobile/tablet page layout, focus order, touch targets | `docs/design/old-lms-pages.md` + legacy rules (comparison pending) | Each learner and admin page (screenshots pending) | OPEN |

Do not tick any item until each value and state has exact legacy/vNext file:line proof and match; record negative findings as missing, not as completed. Pixel screenshots are orchestrator's separate section J.
