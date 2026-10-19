# H — Learner / Courses / Super Admin course-content clone audit

Owner lane: `chat-7` · Branch: `chatgpt/chat-7-b` · Status: IN PROGRESS
Baseline: `origin/main` commit `55a3efe0a5917631ab26e17e158a29f6e5282e25` (2026-10-19); branch fast-forwarded from `9b714ab008909e3645c31faa12534d3db3355d59` before source edits.
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
- [ ] `src/components/courses/learner-course-discussion.tsx:113,313,494,499,573,649-667` — **ref compatibility corrected** (`13bf70e`): shared `Textarea` remains in place, with `focusComposer()` resolving the labeled DOM control by stable id and preserving keyboard submit/focus; full legacy style and interaction-state proof for H2 remains open.
- [ ] `src/components/courses/learner-quiz-attempt.tsx:348,363-368,446-452` — source inspected: title h1 comes from shared `PageHeader`, review and active-attempt back actions now live in header; entire route / responsive and state proof remains open (`727e20e`, `498704a`, `122edca`).
- [ ] `src/components/courses/admin-course-actions.tsx` and `admin-course-create-panel.tsx` — current main source no longer has a literal `#1677FF` fallback (inspected both complete files). `cardColor` is persisted data and editable as `#RRGGBB`; do not turn it into a CSS variable without API review. Global course-scope hex grep and H6 coverage still open.
- [ ] `src/components/courses/college-learner-progress-report.tsx:25-87` — current outer section is a flat divider (not a second canvas), summary stat cards now use shared `StatTile` and progress uses shared `MetricBar`; clear/export actions use control-radius tokens (`74a4d8b`, `5aca112`, `a6887a7`, `5507bbc`). Full contextual and responsive proof still open.
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

## 2026-10-19 bounded continuation — source-only parity and judgement cases

**Branch sync:** `chatgpt/chat-7-b` was 1,193 commits behind `main` and had no divergent commits; successfully fast-forwarded to `55a3efe0a5917631ab26e17e158a29f6e5282e25` through the branch ref before writing. All writes remained on `chatgpt/chat-7-b`.

**Eleven file commits (pushed via GitHub contents API, no CI, tests, local server, screenshots, or repository code execution):** `13bf70e` discussion focus; `084dc65` shared segmented course filter; `727e20e` review PageHeader; `498704a` timed PageHeader actions; `122edca` full-width timed header; `24abd1c` accessible assessment filter group; `74a4d8b` progress Clear link; `5aca112` progress MetricBar; `a6887a7` progress Export link; `5507bbc` shared progress StatTiles; `544f688` accessible labelled progress-stat group.

### Value and state evidence for edited surfaces (source comparison, not an H tick)

| Property or state | Old LMS source:line and value | vNext source:line and value | Result |
|---|---|---|---|
| Header desktop layout | `legacy-styles/components___listing-page-header.scss:26-35` flex, start, space-between, 24px gap, border-bottom | `src/components/ui/page-header.tsx:25-29` md:flex row/space-between/gap-6; border-bottom | Layout match at md+; desktop heading font mismatch noted below |
| Header mobile layout | `legacy-styles/components___listing-page-header.scss:130-154` <=767px column, gap8, actions column | `src/components/ui/page-header.tsx:28-49` column until md=768, gap-2, full-width actions | Source-rule match; viewport render not checked |
| Header title font mobile | `legacy-styles/components___listing-page-header.scss:137` 20px | `src/components/ui/page-header.tsx:28,31-34` 20px via scoped CSS variable | Match by source |
| Header title font desktop | `legacy-styles/components___listing-page-header.scss:52-59` 28px/600, line-height1.3 | `src/components/ui/page-header.tsx:28,31-34` 30px/600, line-height1.35 | **Not identical;** shared PageHeader owned by chat-9/chat-17, no modification in this lane |
| Page shell background | `legacy-styles/components___variables.scss:31,52` #f1f4f9 | `src/app/globals.css:33,63` #f1f4f9 via --lms-neutral-100 | Match in light theme |
| Canvas border, radius, padding | `old-lms-pages.md:7` #e5e9f0, 12px, 24px | `src/components/ui/page-canvas.tsx:17-22` plus `src/app/globals.css:322,327-328` #e5e9f0/12px/24px | Source-rule match, outer layout owned by chat-9 |
| Course filter radius and border | `legacy-styles/components___variables.scss:30` #e5e9f0; `old-lms-pages.md:8` teal filter state | `src/components/ui/segmented-control.tsx:17-24` shared border token, control radius; `learner-course-list.tsx:214-227` now consumes it | Partial, exact active background mismatch below |
| Segmented selected color | `legacy-styles/components___variables.scss:10,13` #26bac7 primary, #eff8fa subtle | `src/components/ui/segmented-control.tsx:23` --lms-button-primary, `src/app/globals.css:17` #0a7c88 | **Different teal**; shared skin owned by chat-17, H2/H3 open |
| Teal progress fill and track | `legacy-styles/components___variables.scss:10,14` #26bac7 and #9ee4e8 | `src/components/ui/metric-bar.tsx:31,37`, `globals.css:14,24`, used `college-learner-progress-report.tsx:87` | Source-token match |
| Course progress stat card border | `legacy-styles/components___variables.scss:30` #e5e9f0 | `src/components/ui/stat-tile.tsx:31-34` border --lms-canvas-border, consumed at `college-learner-progress-report.tsx:69` | Source-token match; tile sizes/phone proof open |
| Course progress links radius | `old-lms-pages.md:7` white canvas and standard controls; `legacy-styles/components___listing-page-header.scss:106-127` outlined, hover teal | `college-learner-progress-report.tsx:56,74` border, control radius, hover/focus tokens | Interactions explicitly represented; computed source value/state proof incomplete |
| Discussion form keyboard behavior | `legacy-styles/components___form.scss:23-36` only :focus-visible retains keyboard outline | `src/components/ui/textarea.tsx:6-9` focus-visible outline, `learner-course-discussion.tsx:113,649-667` ref-free focus + unchanged Enter/Shift+Enter | Semantic contract fixed; responsive/style full comparison open |

**Edited-source inspection** (without running requested no-code/no-CI checks): scoped `learner-course-list.tsx` no longer contains its former three-button course-type control; it imports `SegmentedControl`. Scoped `learner-course-discussion.tsx` contains zero `composerRef` references after migration. `learner-quiz-attempt.tsx` has matching opening and closing tags in the two edited header blocks, by source re-read. Both course admin card-color files were inspected and contain no `#1677FF` literal. These are **not** replacement evidence for whole-scope `rg` output counts.

**Remaining strict proof:** run the commands in Coverage inventory on ALL 247 TSX paths, record actual result counts/paths for raw JSX controls, modals/tables/hex/title blocks, compare every affected state and phone/tablet behavior to legacy SCSS, confirm single canvas within authenticated layout and obtain orchestrator viewport verification. Do not tick H1-H6 until all four strict requirements hold. Next: `src/components/courses/learner-assessment-overview.tsx` for the assessment quick-view value/state sweep, then `src/components/courses/learner-course-workspace.tsx` and Super Admin content routes.

## 2026-10-19 SMARTER PLAN continuation — batch 2 (chat-7)

**Branch:** `chatgpt/chat-7-b` fast-forwarded from `f7b56f9fff1ee03b2ca6a15e69702592c81c381c` to `main@5a2abb4bba7e3bcfcf7523ffde18a0346e3590ed` (464 new main commits; zero lane-only commits before sync). Following `docs/orchestrator/queues/master-queue.md` SMARTER PLAN, shared/global skins are owned by chat-17 and the orchestrator owns computed-style diffs. **No `docs/audit/ux/parity-report.md` existed at this branch baseline**, so this turn handled only demonstrable judgement cases and targeted source style bypasses. No local app/code execution, screenshots, TypeScript run, tests or CI.

**29 UI commits were pushed by GitHub content writes on this lane; this audit update makes 30 turn commits.** Work grouped by affected files:

- **Learner assignment/quiz quick views:** `learner-assessment-overview.tsx` now uses shared `NeedsDoingChips`, maintaining toggling-off of the selected quick filter and page reset; direct shared `StatTile` replaces the trivial metric wrapper (`4fe0e0d`, `cbda729`).
- **Learner course/learning path:** `learner-course-workspace.tsx` renders route-backed shared `Tabs` with counts and `StatTile` summaries (`0e0b4ff`, `5a03440`). `learner-course-overview.tsx` renders direct `StatTile` instead of wrapper (`27756c2`).
- **Super Admin course directories:** `admin/courses/page.tsx` replaces two handwritten link navigation strips with shared underlined `Tabs` (`a419c8c`), retaining directory targets and condition-specific labels. `admin/lessons/page.tsx` and `admin/course-progress/page.tsx` put their existing export controls in `PageHeader.actions` (`c6b31e0`, `743efb2`). `admin/course-progress/students/page.tsx` moves Back + CSV export to `PageHeader.actions` and corrects JSX attribute spacing (`2fda31f`, `9ede0c8`).
- **Shared course component library:** `admin-course-overview.tsx` uses direct `StatTile` (`91d960d`); `faculty-assignment-review.tsx` uses controlled shared `Tabs` for remote grading filters (`c81440a`); `faculty-course-workspace.tsx` uses shared navigation `Tabs`, moves overview links into header actions, and retains phone-sized touch targets (`7dd7d83`, `dd845da`, `77cd9c6`).
- **Uploads / native progress:** `faculty-lesson-video-manager.tsx` removes a pre-existing duplicate `Input` import and uses `MetricBar` for upload status (`562b4a4`, `de7a26e`); `assignment-file-submission-control.tsx` uses `MetricBar` for upload status (`bdba932`). Upload/cancel semantics were left unchanged.
- **College course page-canvas compatibility:** `college-content-aggregate.tsx` removes the independent outer filter card while keeping forms and sections, and normalizes header, pagination and Clear link skins (`3c2031a`, `c830d4f`, `744f6df`, `5b6f699`). `college-learning-directory.tsx` inherits shared button skin rather than a hard-coded variant, and normalizes header, pagination and Clear controls (`0ae8b3a`, `a6062cd`, `fb5707d`, `14ada11`). `college-live-classes-directory.tsx` removes manual styles from two `Input` and two `DateInput` controls and normalizes pagination/Clear links (`3fa0fe3`, `2973358`, `aa2fd67`).

**Source checks re-read:** Every edited path was fetched again following its update, verifying edited opening/closing tags or bounded class replacements and visible avoidance of stray quotes. Reviewed 16 core learner and Super Admin course page modules by source: 15 had `PageHeader` in the route source, and the Super Admin offering detail route delegated/redirected to its course component. None of these 16 source files contained a raw styled `button/select/input/textarea` or six-digit hex literal. This is a **partial scoped source observation**, not an exhaustive count over 247 TSX or a browser proof.

**Legacy references checked:** `docs/design/legacy-styles/components___listing-page-header.scss:26-35,130-154,167-194` for one header row, phone stacking and pill dimensions; `components___variables.scss:10-14,29-32` for teal/neutral values; `docs/design/old-lms-pages.md:5-11` for one canvas, underlined tabs, summary tiles and action placement. Shared `Tabs`, `NeedsDoingChips`, `MetricBar`, `StatTile` and `PageHeader` own skin values, so no local hex hacks were introduced. **Not signed off:** shared selected-state teal and desktop title measurements, phone/tablet runtime proof, the remaining in-page anchor navigation, and whole-path coverage greps; computed-style parity-report evidence is still needed. H1–H6 remain unchecked.

**Exact next file:** `src/components/courses/admin-offering-learning-page.tsx` — evaluate the four in-page anchor links (must preserve hash scrolling) against old LMS tabs, then continue `src/components/courses/college-live-classes-directory.tsx` for remaining body/canvas and status display details. Do not run CI or re-migrate codemodded raw controls.

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

## 2026-10-19 replacement chat-7 — bounded source-judgement batch 3

**Branch synchronization:** live GitHub comparison found `main@12ee0a58fd9af5e0e1f1ad975155f864966cb6c0` ahead of `chatgpt/chat-7-b@0133c651f849492ab7441ce5520491a87942c888` by 1,611 commits and branch-only ahead count zero. Branch ref fast-forwarded with an expected-SHA lease before writes; no commits were discarded.

**10 source commits pushed to `chatgpt/chat-7-b`, plus this audit commit. Eight distinct owned TSX files received changes** (the first two files each had multiple commits):

| Source file | Judgment-case outcome | Commit(s) |
| --- | --- | --- |
| `src/components/courses/admin-offering-learning-page.tsx` | Added matching anchor scroll offset/heading text token and shared `PageBackLink`; removed handmade Back link. Hash anchor targets remain unchanged. | `c637742`, `cd8c4f5` |
| `src/components/courses/college-live-classes-directory.tsx` | Restored missing Button import; moved original CSV action into shared page header; replaced raw uppercase status text with shared StatusBadge; flattened list surface; migrated manual Previous/Next to shared Pagination. | `c3eb8ab`, `fc5204c` |
| `src/components/courses/super-admin-lesson-bulk-visibility.tsx` | Removed duplicate Checkbox import and aligned heading token; retained native Checkbox selection behavior. | `17ef188` |
| `src/components/courses/super-admin-course-bulk-visibility.tsx` | Removed variant-overriding secondary styles and primary `text-primary-text` class that conflicted with the shared button's white text; preserved all bulk action handlers, pending and disabled states. | `9da1499` |
| `src/components/courses/admin-assessment-read-directory.tsx` | Replaced local prev/next buttons with shared Pagination; retained query, 25-per-page label, and destination. | `7165b0e` |
| `src/components/courses/admin-course-overview.tsx` | Replaced course catalogue pager for admin and college contexts; preserved search/query/page-size and route base. | `a838eeb` |
| `src/components/courses/college-content-aggregate.tsx` | Replaced custom resources/videos pager; preserved 25-per-page label and current filter values. | `a4b84e1` |
| `src/components/courses/college-learning-directory.tsx` | Replaced custom lesson/progress prev/next pager while preserving all query parameters and the separate lesson Jump to page form; removed `Go` button's primary contrast override. | `a71835b` |

### Source value/state/responsive evidence (not whole-area H sign-off)

| Property / state | Old LMS source + exact rule | vNext reference / inspected outcome | Qualification |
| --- | --- | --- | --- |
| Pagination active border/hover | `legacy-styles/components___antddesign.scss:233-239` `$clrThird` for active, border and hover; `components___variables.scss:10` `#26bac7` | `src/components/ui/pagination.tsx:68-75` active border/hover on `--lms-primary`; consuming pages listed above use shared Pagination | CSS variable resolved value and real viewport not measured |
| Pagination mobile target | `components___antddesign.scss:242-262` at <=767px min 44×44 px, radius 8px, centred | `src/components/ui/pagination.tsx:53-57` min-h-11/min-w-11/rounded-[8px], md:min-h-9, flex-wrap | Source-rule width/height/radius match; screenshot and focus order pending |
| Pagination mobile simplified links | `components___antddesign.scss:268-280` hide options and inactive numbers/jump shortcuts | `src/components/ui/pagination.tsx:60-85` mobile `hidden md:inline-flex` for inactive numbers; previous/next persist, current persists | Source conditional paths inspected, not browser-tested |
| Course back mobile target | `components___learn-layout.scss:361-383` minimum 44px, icon and mobile label hidden below 768px; hover `$clrThird` | `src/components/ui/page-back-link.tsx:16-30` min-h-11/min-w-11, hidden md:inline label with aria-label, token hover; `admin-offering-learning-page.tsx:77` consuming | Source match for target and label; runtime focus/state proof pending |
| Course tabs deep anchors | `components___learn-layout.scss:361-383,484-512` accessible touch/scroll rules; header offset | `admin-offering-section-tabs.tsx` remains route/hash-backed shared Tabs; `admin-offering-learning-page.tsx:81,105` course-home/course-syllabus both scroll-mt-24; two child sections already scroll-mt-24 | Anchor continuity checked in source; active indicator after hash change not browser-tested |
| Live session publication badge | `components___variables.scss:63+` status color palette; `old-lms-pages.md:10` compact status pills | `college-live-classes-directory.tsx:87` shared StatusBadge tone for published/archived/draft; `src/components/ui/status-badge.tsx:9-17` token tones, 22px+ height | Shared component matches intended pill treatment, exhaustive state/value table not yet measured |
| Bulk action states | `docs/design/ui-clone-checklist.md:D` primary #0a7c88/white and secondary outlined, hover/focus/disabled | `super-admin-course-bulk-visibility.tsx:67-82` now inherits `Button` variant classes without local foreground/background override | Native `Button` owned by chat-17; exact desktop hover/focus disabled computed values not verified |

**Scoped source-probe record:** fetched and re-read complete latest GitHub file contents for all eight TSX paths after writes. In these eight files only, text-pattern equivalents of `<button([[:space:]>])`, `<select([[:space:]>])`, `<input([[:space:]>])`, `<textarea([[:space:]>])`, six-digit CSS hex literals and `<nav>` mismatch found **0 matches** for each raw control or hex category, and **0 native nav openings / 0 native nav closings** (all shared pagination components are self-closing JSX). Checked shared `Button` open/close tag counts in all edited files; each count matched. All five new `Pagination` uses are self-closing. This is connector source inspection, **not** a local `rg` run and **not** a statement of whole-area zero coverage.

**STRICT TICK:** H1–H6 remain **unticked**. Work-queue paths were source-edited but cannot be marked parity-complete without exhaustive 247-file path coverage, all-property source/value+state proofs, and phone/tablet side-by-side computed verification. No app code, tests, typecheck, lint, screenshots, or CI were executed. The legacy-selected color mismatch noted in batch 1 is still owned by shared-skin chat-17.

**Exact next file:** `src/components/courses/learner-course-overview.tsx` — review the mobile section-jump nav and Recent updates category links for shared chip/tab and focus styles, then `src/components/courses/learner-course-discussion.tsx` for focus/status source review.

### Batch 3 addendum: learner overview mobile anchors

`08ad916` changed `src/components/courses/learner-course-overview.tsx:233-239` only: the mobile section-jump bar now offsets the 68px legacy top bar (previously 64px), stays visible below 768px instead of 640px, and its links have the tokenised hover, focus-visible offset and motion-reduction rules. The anchor IDs and existing scroll margins were not changed. Source-responsive rationale: `docs/design/old-lms-shell.css` 68px header; `docs/design/legacy-styles/components___learn-layout.scss:34,379,419,450` 767px phone treatment. Runtime measured focus and scroll position still unverified, so H3 remains open.

**Next exact file after this commit:** `src/components/courses/learner-course-discussion.tsx`, followed by `src/components/courses/learner-quiz-attempt.tsx`; inspect the keyboard focus/fixed message composer and review state against the legacy SCSS. There are 11 source commits and two audit commits in this bounded batch; no H1–H6 item newly satisfies the strict all-states/all-pages proof.

## 2026-10-19 replacement lane continuation — discussion, quiz and small course components

**Branch sync:** GitHub compare immediately before edits showed `chatgpt/chat-7-b` had **0 ahead, 687 behind** `main@2808e32a641e1e35f513755b840b6ef892c61163`. With an expected-head lease, fast-forwarded `chatgpt/chat-7-b@9ba9689dbabf5f8aa93723722b55f253cfb7279a` to current main. All following writes targeted **only `chatgpt/chat-7-b`**.

### Files reviewed and fixed in this source batch

| File | Finished source changes / behavior preserved | Remaining before a STRICT TICK |
| --- | --- | --- |
| `src/components/courses/learner-course-discussion.tsx` | Shared `Alert` for refresh failure, responsive 44px action targets through 767px, 768px desktop breakpoint in composer/scroll region, mutual exclusion of overlapping Jump to latest and unseen-messages controls; Enter/Shift+Enter guard, reply focus, polling, permission checks, moderated pin/delete, earlier-history cursor and unsent-draft leave-confirmation retained | No original discussion-specific SCSS with all chat bubble dimensions in supplied `legacy-styles`; rendered hover/focus/scroll/keyboard comparison not completed |
| `src/components/courses/learner-quiz-attempt.tsx` | Replaced hand-rolled progress track with labelled shared `MetricBar` (`role=progressbar`); shared `Alert` for missing deadline, receipt and deadline warning; all question/review/navigation buttons have 44px phone targets, option labels tokenized hover and focus-within ring, review wraps content; option state, deadline lock, modal confirmations, scoring/answer disclosure and draft restore retained | No specific original quiz-attempt SCSS matching all question/choice dimensions; runtime keyboard/radio, timer and tablet behavior not verified |
| `src/components/courses/college-learner-progress-report.tsx` | Responsive `md:grid-cols-4` tiles and `min-h-11 md:min-h-9` filters, primary submit and export/reset link heights; existing shared `Select`, `Input`, `StatTile`, `MetricBar`, `DataTable`, and export preserved; removed redundant tile class | Full DataTable/StatTile visual comparison at phone/tablet and exact all-state field values pending shared-owner verification |
| `src/components/courses/learner-course-state-retry.tsx` | Shared secondary `Button`, `router.refresh()` unchanged, 44px phone / 36px desktop hit target, no local custom colors | Shared secondary button global hover/focus/disabled pixels still need final computed parity confirmation |
| `src/components/courses/learner-live-session-status.tsx` | All timestamp states remain derived from original IST/ISO date arithmetic; display uses shared `StatusBadge` tone success (Live now), warning (unavailable), neutral (scheduled/ended), info (countdown); existing 30s timer, cleanup and `role=status` retained | Exact legacy badge value states and browser layout not independently verified |
| `src/components/courses/learner-course-tabs.tsx` | Source-reviewed; existing shared route-backed `Tabs` already preserves Overview, Learning Path, Attendance, Discussions, deliveryId encoding and persistent query. No code change warranted. | Shared Tabs owner still needs rendered tab height/ink bar computed parity on phones and tablets |

### Element property and state ledger — source values versus legacy

| Element/property/state | Old LMS reference and value | Current vNext source/value | Comparison |
| --- | --- | --- | --- |
| Brand primary/accent (tabs, bar, focus) | `legacy-styles/components___variables.scss:10` `#26bac7` | `src/app/globals.css:20-21` `--lms-primary:#26bac7`; shared Tabs/MetricBar/Checkbox/Radio use it | MATCH source token |
| Active tab text/underline | `legacy-styles/components___common.scss:365-407` 13px/600/16px, 3px `#26bac7` underline with 0.2s width/opacity | `src/components/ui/tabs.tsx:70-83` text13/600/16, 3px `--lms-primary`, 200ms transition | MATCH source values; responsive rendering pending |
| Tab hover and selected color | `components___common.scss:399-410` `$clrThird` | `src/components/ui/tabs.tsx:75-83` `--lms-primary-text` (#1a95a1) | **MISMATCH** exact teal shade, shared Tabs owned outside chat-7 |
| Discussion / quiz keyboard focus | `legacy-styles/components___form.scss:23-28` suppress mouse ring on `:focus:not(:focus-visible)`, keep keyboard focus | `src/components/ui/textarea.tsx:7-10`, `src/components/ui/button.tsx:30-36`; discussion composer `learner-course-discussion.tsx:647-668`, quiz answer label `learner-quiz-attempt.tsx:509` have `focus-visible` / `focus-within` | MATCH focus intention; exact browser visual needs verification |
| Form font / tracking / line | `legacy-styles/components___form.scss:102-126` 14px/400, line20px, tracking .2px | `src/components/ui/textarea.tsx:7-10` `--lms-font-base` 14px; 400/20px/.2px | MATCH source |
| Form error fill / focus | `legacy-styles/components___form.scss:123-138` `rgba($status-error,.06)`, error border, focus ring .2 alpha | `src/components/ui/textarea.tsx:7-10` error fill 239,68,68 .06; error ring .2 alpha | MATCH source; inherited form skin applies |
| Standard control radius / desktop height | Owner spec `docs/design/ui-clone-checklist.md:D` 9px/36px; `src/app/globals.css:341-343` resolved values | `Button` / `Select` share `--lms-control-height=36px`, `--lms-control-radius=9px`; consumer overrides `md:min-h-9` | MATCH source owner spec |
| Mobile action target | `legacy-styles/components___learn-layout.scss:361-383`, `docs/design/old-lms-shell.css:21-28` 44px touch minimum below 768px | `learner-course-discussion.tsx:410,432,482,492,497,514,571,588,601,621,629,644,675`; `learner-quiz-attempt.tsx:353,368,453,463,486,524,533,543,550,558-564`; `learner-course-state-retry.tsx:8` `min-h-11 md:min-h-9` | MATCH source mobile vs desktop break |
| Responsive cutoff | `legacy-styles/components___learn-layout.scss:34,379,419,450`, `components___listing-page-header.scss:130-154`: mobile <=767px; tablet/desktop >=768px | Modified discussion `md:` mobile/desktop composer controls and scroll heights; quiz `md:p-7, md:grid-cols-2`; progress `md:grid-cols-4` | MATCH breakpoint source; no screenshot |
| Warning state | `legacy-styles/components___variables.scss:63-78` status warning `#d97706`, bg alpha .1 | `src/components/ui/alert.tsx:8-12` shared warning surface/border/tone; `learner-course-discussion.tsx:405-413`, `learner-quiz-attempt.tsx:382-384,457` | Partial: old warning background and new `--lms-warning-surface` differ by design-system implementation |
| Error state | `legacy-styles/components___variables.scss:73-78` error `#ef4444` / bg 10%; `components___form.scss:130-138` error ring | Discussion `Alert tone=error`; quiz inline role alert; shared `Alert`/form tokens use `--lms-error` | MATCH base error token; component particulars pending |
| Success state | `legacy-styles/components___variables.scss:63-66` success `#059669` / bg 10% | Quiz submission uses `Alert tone=success`; live session uses `StatusBadge tone=success`; shared color variables in globals | MATCH base status token |
| Quiz proportional track | `legacy-styles/components___variables.scss:10,14` teal `#26bac7`, light cyan `#9ee4e8` | `src/components/ui/metric-bar.tsx:19-40` teal fill and light cyan track, percent width; `learner-quiz-attempt.tsx:468-469` semantic role/value/maximum | MATCH source values, improved ARIA semantics |
| Empty/loading/error | Owner `old-lms-pages.md:6-10` flat canvas; shared components needed | Quiz `PageLoading`, `PageHeader`, `Alert`; discussion `EmptyState`, `Alert`, `ConfirmDialog`; progress `DataTable` empty shared `EmptyState` | Shared primitive consumption; pixel measurement pending |
| Discussion Enter/Shift+Enter vs touch | `legacy-styles/components___form.scss:23-28` keyboard focus allowed; no provided original chat-specific hotkey rule | `learner-discussion-mobile-model` checked via source use; composer text shows touch help below 768, desktop Enter/Shift+Enter at >=768 | Behavior preserved by source; cannot assert parity absent legacy keyboard spec |
| No nested outer canvas | `docs/design/old-lms-pages.md:7` one page canvas; distinct objects may use cards | Discussion conversation is one bordered region, pinned message a distinct object; quiz distinct question rows; progress section flat with shared stats/table | Source layout consistent; parent route ownership/rendering needs inspection |

### Reproducible source grep proof — six files only

The exact file set inspected by fetching current branch source after each push:

`src/components/courses/learner-course-discussion.tsx`; `learner-quiz-attempt.tsx`; `college-learner-progress-report.tsx`; `learner-course-state-retry.tsx`; `learner-live-session-status.tsx`; `learner-course-tabs.tsx`.

Commands to reproduce locally (substitute these six paths for `$paths`):

```bash
rg -n '<button([[:space:]>])|<select([[:space:]>])|<input([[:space:]>])|<textarea([[:space:]>])' $paths
rg -n '<table([[:space:]>])|role="dialog"|fixed inset-0' $paths
rg -n '#[[:xdigit:]]{6}' $paths
rg -n '<h1([[:space:]>])' $paths
```

**Observed via complete GitHub source-file text scans, not locally executed `rg`:** raw button 0, select 0, input 0, textarea 0, raw table 0, custom overlay 0, CSS six-digit hex 0, local `h1` 0. Both HTML forms (`learner-course-discussion`, `college-learner-progress-report`) have one opening and one closing form tag. Shared `Button` tags were recounted: discussion 13 opening / 13 closing; quiz 12/12; progress 1/1; retry 1/1. Shared `Alert` tags: discussion 2/2; quiz 3/3. All added MetricBar usages are JSX self-closing. Existing `ConfirmDialog`, `Textarea`, `Select`, `Input`, `StatTile`, `DataTable`, `Tabs` self-closing or paired as appropriate. No global-area zero coverage or rendered proof is claimed.

**STRICT TICK status: H1–H6 still UNCHECKED** because the source-derived matrix above contains explicitly unresolved shared-tabs color and warning-style differences, user-visible rendered phone/tablet and interaction checks were not possible under lane's do-not-run rule, and remaining 247-file inventory has not been exhausted. Do not reinterpret six inspected files as six final pixel-parity closures. All source work was pushed to the lane branch; no tests, CI, local app or TypeScript execution.

**Next exact unticked file:** `src/components/courses/learner-course-overview.tsx` (remaining category anchor chips and state visuals), then `src/components/courses/learner-course-workspace.tsx` (resource and assignment/quiz content item treatment).

### Continuation addendum — overview and roadmap whole-source sweep

Following the previous six-file source audit, the next two queue files were read end-to-end, edited and re-read on the pushed chat-7 branch:

- `src/components/courses/learner-course-overview.tsx`: five anchor targets now `scroll-mt-24` (96px), clearing the legacy 68px top bar with an additional 28px scroll margin; the pre-existing phone section-jump navigation stays sticky `top-[68px]` and `md:hidden`. All course/about/path/updates/next-action breakpoints now align at 768px (`md:`), card previews no longer become two columns at 640px, and section/lesson/action/quick-filter/update-arrow links have at least 44px mobile touch targets. Original links, route queries and content/wording retained.
- `src/components/courses/learner-course-workspace.tsx`: four independent hand-built warnings/errors replaced by appropriately toned shared `Alert` (warning for partial state and filter notice, error for absent focused lesson/content), retaining original copy, `role=alert` for the partial state, retry control, and mutual exclusion of lesson-not-found/content-unavailable. The lesson index now stays visible as mobile `details` below 768px, and the summary grid/remaining five phone-vs-desktop touch/padding overrides use `md:`. Original student scope, Tabs, content, submissions, video/resource actions, buttons and links retained.

| Property / responsive state | Exact legacy source | Current vNext source and value | Match? |
| --- | --- | --- | --- |
| Top bar offset | `docs/design/old-lms-shell.css:55-60` `height=68px` | `learner-course-overview.tsx:232-236` sticky `top-[68px]`; targets `scroll-mt-24` (96px), all five anchors | Bar height matches; 28px gap is an authored accommodation, not exact old scroll proof |
| Phone/tablet breakpoint | `legacy-styles/components___learn-layout.scss:34,379,419,450` media <=767px; desktop starts at 768px | Overview `md:grid-cols-2`, `md:flex-row`, `md:min-h-9`, `md:hidden`; workspace summary `md:grid-cols-2` and mobile index `md:hidden` | Source breakpoint matches |
| Standard phone link/action hit box | `legacy-styles/components___learn-layout.scss:361-383` back target min 44px and phone label hiding; shared owner minimum phone action | Overview path lesson and update links `min-h-11`, update arrow `min-h-11 min-w-11`; workspace links `min-h-11 md:min-h-9` | Source touch target matches |
| Alert warning palette | `legacy-styles/components___variables.scss:67-69` warning `#d97706`, background alpha .10 | `learner-course-workspace.tsx:696-710` `Alert tone=warning`; `src/components/ui/alert.tsx:6-19` uses legacy warning surface variable | Warning surface still needs global skin visual comparison |
| Alert error palette | `legacy-styles/components___variables.scss:73-78` `#ef4444`, rgba .10 | `Alert tone=error` from shared component for unavailable lesson/content, inherited `--lms-error` | Base token match; rendered border/text proof missing |
| Alert spacing | `legacy-styles/components___variables.scss` canonical spacing / visual source | Shared `Alert` uses `--lms-space-4` left/right and `--lms-space-3` vertical; `globals.css:353` space4 = 16px | Shared-token based, exact old warning box spacing not proved |
| Responsive grids | `legacy-styles/components___learn-layout.scss:189-217` width/padding on phone vs desktop | Overview cards single-column under 768, two-column md and four-column xl summary; roadmap single-column until md | Source-only responsive layout comparison; no viewport screenshots |
| Shared tabs/controls | `legacy-styles/components___common.scss:359-410` underlined tabs, 13px/600/3px active bar | Roadmap's shared Tabs retained and no handmade tabs added; original aria and route links preserved | Shared tab hover color mismatch from preceding ledger remains |

**Scoped grep proof (source fetch, not local `rg` execution)** for these TWO paths: raw `<button>` 0, `<select>` 0, `<input>` 0, `<textarea>` 0, `<table>` 0, direct `role="dialog"` / `fixed inset-0` 0, hard-coded six-digit hex 0, raw `h1` 0. Navigation JSX pairs: overview 2 `<nav>` / 2 `</nav>`; workspace 2/2. Workspace shared `Alert` 4 opening / 4 closing tags. Breakpoint scan immediately after final workspace patch: remaining standalone `sm:` utility instances are zero in workspace; note shared children own independent responsive values. No contradictory opening/closing tag names observed in edited blocks. This is eight total paths source-reviewed in the current batch, **seven paths edited and one (`learner-course-tabs.tsx`) reviewed/no change**, not eight fully pixel-verified files.

**STRICT TICK RULE:** No H-category tick claimed. The old LMS source does not provide element-by-element discussion/quiz card geometry, and actual tablet/phone computed values and interaction regression checks remain unperformed under the owner's no-app/no-tests rule. Outstanding shared Tabs active/hover shade also prevents a full exact-value match. Section J remains the orchestrator's visual comparison. Do not mark H1–H6 or all 247 pages complete.

**Next exact unticked source:** `src/components/courses/learner-course-list.tsx` (course filter pills, semester/program chips, list card states); then `src/components/courses/learner-course-attendance.tsx`.
