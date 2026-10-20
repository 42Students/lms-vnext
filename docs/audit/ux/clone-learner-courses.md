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

## 2026-10-19 chat-7 continuation — next 18-file source sweep (batch 5)

**Scope:** learner course cards and attendance, assessment summary, quiz and media helpers, Super Admin course/content screens and shared college course-directory surfaces. Live GitHub tree/contents used for inspection. Changes are pushed to `chatgpt/chat-7-b` with `[chat-7]` commit prefixes; no local application, TypeScript compiler, build, tests, CI, browser or screenshot was run. **Source-audited means the file's changes and source checks are complete, not pixel-perfect sign-off.**

### File-level work queue and completed source edits

| Reviewed file under `src/components/courses/` | Changes to close in this batch | Legacy-responsive source proof |
| --- | --- | --- |
| `learner-course-list.tsx` | Course-type `SegmentedControl`, filter grid and pill hit targets align with desktop transition; warning uses shared `Alert` with responsive Retry; overdue and continue links gain phone 44px targets, keyboard outlines; `Badge` JSX normalized | `md:grid-cols-2`, `md:[&>label>span]:min-h-9`, default `min-h-11`; `old-lms-pages.md:7-10`, `listing-page-header.scss:130-154` |
| `learner-course-attendance.tsx` | Month-arrow controls, This month, month input and three-column stats use 44px phone actions, wrap and mobile gap; Attendance History heading tokenized | `min-h-11 md:min-h-9`, `w-full md:w-auto`, `md:py-5`; `learn-layout.scss:34,361-383` |
| `learner-assessment-overview.tsx` | All 24 previous `sm:` form/filter/list/action/state-layout occurrences replaced by 768px `md:` rules; corrected contradictory duplicate mobile height utilities; quiz/assignment route semantics preserved | `md:grid-cols-2`, `md:hidden`, `min-h-11 md:min-h-9`; `listing-page-header.scss:130-154` |
| `learner-rich-response-editor.tsx` | Three formatting controls now meet phone 44px target; removed unsupported ref prop on shared `Textarea` while preserving toolbar text selection/focus using a unique `useId` DOM target | `min-h-11 md:min-h-9`, shared `Textarea` focus outline; `form.scss:23-28,102-138` |
| `learner-roadmap-item-dialog.tsx` | Long item names wrap instead of hiding; shared `Dialog` close control reaches 44px on phone; native shared Dialog keyboard/focus remains | `min-h-11 md:min-h-9` on Close, opener `min-h-14`; `learn-layout.scss:361-383` |
| `learner-video-player.tsx` | Shared speed selector and failed-grant Retry are 44px on phone, 36px at desktop; secure playback grant/position/save logic left untouched | `min-h-11 md:min-h-9`; `learn-layout.scss:34,361-383` |
| `learner-youtube-player.tsx` | Two recovery/open links' 44px phone targets now persist through 767px; video player playback code untouched | `min-h-11 md:min-h-9`; `learn-layout.scss:34,361-383` |
| `quiz-attempt-control.tsx` | Missed-review close and question progress links use 44px phone target; answer-option label gets focus-within teal ring and motion-reduced hover transition; quiz logic untouched | `md:min-h-9`, `focus-within:ring-2` `--lms-focus-ring`; `form.scss:23-28` |
| `super-admin-content-actions.tsx` | Removed primary-button `text-primary-text` overrides that could clash with white foreground; all edit, publish, archive, save actions retain handlers; field controls switched to 768px breakpoint; editing fieldset uses control radius token | `min-h-11 md:min-h-9`; `master-queue.md` owner buttons #0a7c88/white/9px, `form.scss:102-138` |
| `super-admin-lesson-create.tsx` | Shared offering picker, name/description and submit controls keep phone 44px; submission/validation/error retained | `min-h-11 md:min-h-9`; `learn-layout.scss:34` |
| `super-admin-content-authoring.tsx` | Adds explicit shared heading foreground; shared lesson picker minimum touch size 44px on phone; authoring service and selection unchanged | `min-h-11 md:min-h-9`; `variables.scss:25-32` |
| `admin-course-create-panel.tsx` | Four setup anchor links gain 44px phone target, hover/focus styles; course/offering/delivery/faculty grids move from 640px to legacy 768px breakpoint | `md:grid-cols-2`, `md:col-span-2`; `learn-layout.scss:34` |
| `super-admin-content-directory-page.tsx` | Filter grid, every shared input/select, edit and back link switch to legacy <=767px phone versus >=768px tablet | `md:grid-cols-2`, `min-h-11 md:min-h-9`; `listing-page-header.scss:130-154` |
| `admin-assessment-read-directory.tsx` | Assessment-directory filter grid now switches at 768px while retaining result columns and shared Pagination from previous batches | `md:grid-cols-2`; `listing-page-header.scss:130-154` |
| `college-content-aggregate.tsx` | Resource/video controls and phone-only layout switch at 768px; removed extra rounded card-like catalogue wrapper so hairline records sit in one canvas; no query or export changes | `md:hidden` /`md:block`, `border-y border-border`; `old-lms-pages.md:7,12` |
| `college-learning-directory.tsx` | Filter buttons/pagination change at legacy 768px; removed outer catalogue card shell, preserving all filters, entries, and Jump to page | `md:min-h-9`, `border-y border-border`; `old-lms-pages.md:7,12` |
| `admin-course-overview.tsx` | Four summary tiles on one column phone, two on tablet, four on XL; filter/search/export/reset/link touch heights now preserve phone 44px through 767px; existing DataTable/Pagination retained | `md:grid-cols-2`, `min-h-11 md:min-h-9`; `listing-page-header.scss:130-154` |
| `super-admin-lesson-bulk-visibility.tsx` | Replaces unlabelled `overflow-y-auto` bulk lesson selection with shared accessible `ScrollCue`; checkbox row labels and bulk buttons get 44px phone targets; preserved confirm and mutation guards | `ScrollCue axis=y viewportClassName=max-h-48`, `min-h-11 md:min-h-10`, `min-h-11 md:min-h-9`; `learn-layout.scss:34,361-383` |

### Legacy CSS value + interaction-state matrix

| Element and state | Old LMS value, source | vNext source rule (actual token value) | Verdict |
| --- | --- | --- | --- |
| Interactive brand colour | `legacy-styles/components___variables.scss:10-14` primary `#26bac7`, hover `#1e9aa8`, readable text `#1a95a1`, tinted `#eff8fa` | `src/app/globals.css:20-30` same four resolved token literals; all touched links/FilterChip/MetricBar use tokens | Source **MATCH** |
| Primary action default, hover | `master-queue.md:4-9` owner #0a7c88/white; hover #086873, 9px radius, 36px height, 14px weight650 | `src/app/globals.css:23-28,341-343` + `src/components/ui/button.tsx` shared primary variant; removed local text-primary-text overrides in `super-admin-content-actions.tsx:120-126` | Source **MATCH** for inherited shared-skin; browser unverified |
| Secondary action default, hover, disabled | `legacy-styles/components___button.scss:39-66` outlined primary; hover fills teal/white; disabled half opacity | Shared `Button variant=secondary` in learner actions and Super Admin; disabled props/pending guards unchanged; local `min-h-11 md:min-h-9` only alters phone height | Source token path; exact disabled opacity differs by button implementation, **OPEN** |
| Form basic role | `legacy-styles/components___form.scss:102-138` 14px normal, 20px line, 0.2px tracking, `#fbfcfd` bg, error `rgba(239,68,68,0.06)` | `src/components/ui/input.tsx`, `select.tsx`, `textarea.tsx` tokenized; source `globals.css:843-866` `--lms-font-base=14px`, `--lms-form-bg=#fbfcfd` | Shared component / base token source match; full computed states **OPEN** |
| Focus-visible versus pointer | `legacy-styles/components___form.scss:23-28` pointer-only focus suppresses outline, keyboard remains visible | Shared `Button`/Select/Input/Checkbox/Textarea focus-visible classes; `quiz-attempt-control.tsx` uses focus-within teal ring, modified anchors with keyboard outline | Source intent **MATCH**, browser focus sequence **OPEN** |
| Phone/tablet width cut | `legacy-styles/components___learn-layout.scss:34,379,419,450` and `listing-page-header.scss:130-154` <=767 phone, >=768 desktop | All 18 audited files report **zero `sm:` occurrences**, 120 `md:` occurrences; responsive grid/form/link selectors now start at 768 | Breakpoint **MATCH** at source level; no viewport render |
| Phone tap height | `learn-layout.scss:361-383`, `old-lms-shell.css:21-28`: 44px minimum | Link/command/copy/retry/selector controls use `min-h-11` = 44px through 767px; `md:min-h-9` =36px on tablet; shared primitives | Source height **MATCH** for specifically edited controls, remaining uncontrolled UI instances **OPEN** |
| Pill states | `old-lms-pages.md:10-12` compact status pills and counts on one canvas; legacy teal + semantic state fills | `Badge`/ `StatusBadge` used for course, read-only, elective, quiz, attendance; `FilterChip aria-pressed` for Continue learning | Shared primitive, dynamic state retained; per-pill calculated sizes **OPEN** |
| Progress bar colour | `legacy-styles/components___variables.scss:10,14` `#26bac7` fill / `#9ee4e8` track | `src/components/ui/metric-bar.tsx:22-38` via `--lms-primary` / `--lms-primary-light`; course card uses progressbar | Source **MATCH** |
| Page canvas/list containment | `old-lms-pages.md:7-12` one white canvas; table hairline; no ordinary section card-in-card | Resource/video and learning directory catalogue wrappers now `border-y border-border` without own rounded card/bg, course objects deliberately remain separate cards | Source layout **MATCH** for modified wrappers; other portal parts **OPEN** |
| Truncated/empty/error/loading | `old-lms-pages.md:7-10` empty text and inline slim notices; `legacy-styles/components___variables.scss:63-78` status colours | Learner course list uses `EmptyState`/warning `Alert`; assessments keep table empty/retry; Admin actions and lessons use `Alert`; pending/disabled remain from service | Semantics retained, full pixel/state parity **OPEN** |

### Scoped coverage, grep and source-responsive evidence

The 18 paths in the table above were read **again from the branch after their last writes**. Programmatic source regex scans were run on their returned text; this is not a local shell `rg` execution. The zeroes apply **only** to those 18 files:

| Probe | Regex used on source | Hits |
| --- | --- | ---: |
| Raw button | `/<button(?=[\\s>])/g` | 0 |
| Raw input | `/<input(?=[\\s>])/g` | 0 |
| Raw select | `/<select(?=[\\s>])/g` | 0 |
| Raw textarea | `/<textarea(?=[\\s>])/g` | 0 |
| Raw table | `/<table(?=[\\s>])/g` | 0 |
| Hand-made dialog/overlay | `/role=["']dialog["']\\|fixed inset-0/g` | 0 |
| Six-digit hardcoded hex | `/#[0-9A-Fa-f]{6}\\b/g` | 0 |
| Local h1 outside PageHeader | `/<h1(?=[\\s>])/g` | 0 |
| Old 640px `sm:` utility | `/\\bsm:/g` | 0 |
| Current `md:` responsive utility | `/\\bmd:/g` | 120 |

Reproduce locally if authorized (not executed by this lane):

```bash
rg -n '<(button|input|select|textarea|table)([[:space:]>])' src/components/courses/{learner-course-list,learner-course-attendance,learner-assessment-overview,learner-rich-response-editor,learner-roadmap-item-dialog,learner-video-player,learner-youtube-player,quiz-attempt-control,super-admin-content-actions,super-admin-lesson-create,super-admin-content-authoring,admin-course-create-panel,super-admin-content-directory-page,admin-assessment-read-directory,college-content-aggregate,college-learning-directory,admin-course-overview,super-admin-lesson-bulk-visibility}.tsx
rg -n '#[0-9A-Fa-f]{6}|fixed inset-0|role="dialog"|<h1([[:space:]>])' src/components/courses/{learner-course-list,learner-course-attendance,learner-assessment-overview,learner-rich-response-editor,learner-roadmap-item-dialog,learner-video-player,learner-youtube-player,quiz-attempt-control,super-admin-content-actions,super-admin-lesson-create,super-admin-content-authoring,admin-course-create-panel,super-admin-content-directory-page,admin-assessment-read-directory,college-content-aggregate,college-learning-directory,admin-course-overview,super-admin-lesson-bulk-visibility}.tsx
```

Paired tag checks from complete source text: `learner-course-list.tsx` Button 3/3, Alert 1/1, Badge 8/8, Disclosure 3/3; `learner-course-attendance.tsx` Button 3/3; `learner-assessment-overview.tsx` Button 5/5, nav 1/1; `learner-rich-response-editor.tsx` Button 3/3 (Textarea self-closing); `learner-roadmap-item-dialog.tsx` Button 2/2, Dialog 1/1; `learner-video-player.tsx` Alert 2/2, Button 1/1; `quiz-attempt-control.tsx` Button 6/6, nav 1/1; `super-admin-lesson-create.tsx` form 1/1; `admin-course-create-panel.tsx` form 4/4 and nav 1/1; `college-learning-directory.tsx` form 2/2; `super-admin-lesson-bulk-visibility.tsx` Alert 1/1 and Button 2/2, `ScrollCue` opening/closing verified in updated block. All other scanned HTML form/nav counts balanced. This is a source check, **not** TypeScript parse or UI interaction proof.

**Outstanding STRICT TICK:** H1–H6 remain `[ ]`. Even with the scoped zero-grep and legacy breakpoint proof, no live phone/tablet computed styles or screenshot comparisons were possible; disabled/focus states and UI-owned Tabs/Badge/Table skin mismatches need authoritative verification, and the 247-file area inventory is not globally zero. Do not mark any whole-area H category complete. The source-level edits above are delivered, with full parity pending orchestrator section J.

**Next exact source file:** `src/components/courses/learner-course-card-image.tsx` (thumbnail ratio, opacity and fallback against legacy cards), then `src/components/courses/learner-live-class-link.tsx` (external action semantics and responsive target), then scan remaining Super Admin authored lessons/content files.

### Batch 5 source audit addendum — card media, live meeting and concurrent-main reconciliation

- `src/components/courses/learner-course-card-image.tsx`: retained both existing decorative `Next/Image` presentations, fallback, `onError` and 20% media opacity; changed only the `sizes` hint to `(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw`. This exactly follows the `learner-course-list.tsx` source layout: mobile single column, `md:grid-cols-2` from 768px, `xl:grid-cols-3` from 1280px. This is media-fetch sizing and preserves image layout. Legacy `learn-layout.scss:34` uses <=767px phone.
- `src/components/courses/learner-live-class-link.tsx`: standalone `Copy meeting link` shared secondary Button is now `min-h-11 md:min-h-9` (44px phone, 36px desktop). The pre-existing ended-state denial, copy error/success message, 15-second visibility update and `ThirdPartyLink` are unchanged. **Residual shared dependency:** `src/components/ui/third-party-link.tsx` has a `sm:` 640px cutoff in its child link controls. Chat-7 does not own or modify shared UI, so this exact 640–767px hit-target issue is referred to chat-17 and H3 remains unticked.

| Checked file | Raw button/input/select/textarea/table, hex, manual dialog, h1 source hits | Local responsive source | Source-only outcome |
| --- | --- | --- | --- |
| `learner-course-card-image.tsx` | 0 for all named patterns | `Next/Image sizes` 767px/1279px following existing `md`/ `xl` grid | Completed source-specific media sizes; original legacy card opacity not independently documented |
| `learner-live-class-link.tsx` | 0 for all named patterns | `Button min-h-11 md:min-h-9`, shared ThirdPartyLink external action | Copy control source matching; shared-link breakpoint not resolved |

Two concurrent source conflicts were reconciled against `main@6807f03ba77e54396d6bbd66b9052dcc565da262`, not overwritten:
- `college-content-aggregate.tsx`: kept upstream `print:hidden` filters, `print:overflow-visible` on the flattened catalogue, `print:hidden` phone grid, `print:block` desktop grid, and focus outline offset/style plus `md:min-h-9` inputs. Retained our `md:hidden/md:block` 767px breakpoint and one-canvas `border-y` presentation.
- `quiz-attempt-control.tsx`: kept upstream shared `Disclosure` substitution for the quiz question selector (opening and closing tags both preserved); retained our 44px phone links, missed-review Close control and answer-label focus-within ring.
These resolved files were committed again before main sync. No local build or CI performed.

**Strict H1–H6:** unchecked. Remaining proof: computed keyboard/mouse/touch and screen widths against legacy, full shared Tabs/Button/StatusBadge/DataTable parity, and complete 247-path inventory; no final all-area grep claim. **Next:** `src/components/courses/college-quiz-attempts.tsx` for Super Admin/College Admin quiz review list and action state parity, followed by `src/components/courses/college-quiz-actions.tsx`.

### Batch 5 extension — five college/admin assessment authoring and review files

The next five owned modules were source-audited, modified, pushed and re-read:

| File | Default/hover/focus/state work | Phone and tablet source proof |
| --- | --- | --- |
| `college-quiz-attempts.tsx` | Restored native shared `Select` and `Input` skins by removing local border/padding overrides; hand-built fetch failure row migrated to shared `Alert tone=error` with Retry; Submission, Previous and Next use secondary button colors without local teal foreground; kept open/close, section, pagination and server-state logic | Shared inputs/actions `min-h-11 md:min-h-9`; nav flex-wrap; scrollable region retains `tabIndex=0`/focus-visible outline |
| `college-quiz-actions.tsx` | Metadata Edit, danger Delete and Save now 44px mobile via shared variants; shuffled-question and shuffled-option labels have 44px click target; removed editing fieldset's extra rounded-card frame; existing `Alert` success/error and mutation flow retained | `min-h-11 md:min-h-9` action buttons, default checkbox labels `min-h-11` |
| `college-quiz-create.tsx` | Authoring heading foreground token, shared Select/Input/Textarea field skins for points and question prompt; secondary create and add-question buttons inherit correct foreground; option/quiz movement/delete, Create draft and Cancel controls gain 44px phone targets; retained dynamic enabled/disabled, choice state and destructive confirmation | `md:grid-cols-2`, `md:col-span-2`, `min-h-11 md:min-h-9`, correct-answer option labels `min-h-11` |
| `college-quiz-questions-editor.tsx` | Edit questions, add/remove question/option, Save controls and correct-answer labels are 44px phone targets; Select/Input now shared field skins without ad-hoc 40px input/selector dimensions; error/success messages now shared `Alert`; kept draft confirm, grade/choice logic and scroll region | Shared `min-h-11` fields/buttons with `md:min-h-9` where compact desktop; `Alert` shared state skins |
| `college-assessment-aggregate.tsx` | Flattened ordinary directory filter and records into one canvas with hairline boundaries; shared primary filter Button no longer has a local `bg-primary`/radius override; top actions/pagination links 44px phone, and responsive cards/table switch at 768px; three distinct metrics remain separate report tiles | `md:grid-cols-3`, `md:hidden`, `md:block`, `min-h-11 md:min-h-9` and `border-y border-border` |

| State/property | Legacy source/value | vNext property and mapping | Status |
| --- | --- | --- | --- |
| Authoring form text | `legacy-styles/components___form.scss:102-126`: 14px, 20px, 0.2px, `#fbfcfd` | `Input`/`Select`/`Textarea` components inherit `globals.css:843-866` font/base and form fill | SOURCE MATCH for shared primitives; rendered states untested |
| Selection focus, hover, error | `legacy-styles/components___form.scss:23-28,123-138` visible keyboard-only focus, teal/error ring | CorrectAnswerInput composes shared `Checkbox`/`Radio`, shared Select/Input focus; state-dependent Button disabled untouched | SOURCE MATCH for underlying primitives; runtime interaction untested |
| Primary and secondary Button variants | `master-queue.md:4-9`, `legacy-styles/components___button.scss:39-66` primary solid dark teal/white, secondary outlined + hover | `college-assessment-aggregate.tsx` removes page-local forced primary bg/radius; content actions remove local teal foreground override; shared `Button` owns colors | SOURCE MATCH inherited variants; exact hover/disabled visual still shared-owner work |
| Phone hit area / breakpoint | `legacy-styles/components___learn-layout.scss:34,361-383`: <=767px, target 44px | Quiz actions/authoring/review `min-h-11 md:min-h-9` default/secondary/danger/ghost, `md:grid-cols-2` and `md:grid-cols-3` | SOURCE MATCH; browser viewport check pending |
| In-page cards | `old-lms-pages.md:7-12`: one canvas, tables hairline borders, only distinct report tiles separate | College assessment filters `border-b`, records `border-y`; metric tiles retained for summary only; quiz editor distinct questions in fieldsets | SOURCE MATCH for affected containers |
| Notice states | `legacy-styles/components___variables.scss:63-78` warning/error/success statuses | `Alert tone=error/success` for quiz editor notices and attempts load failures | SOURCE semantic match; exact notice geometry remains shared |
| History navigation and query state | Existing vNext behavior must be retained | Quiz attempts `Page N`, Previous/Next click handlers unchanged; assessment export links, filter values, selected section and error reset retained | Source checked, no live regression run |

**Scope-probe source regex verification** (the five new TSX files, plus `learner-course-card-image.tsx` and `learner-live-class-link.tsx`, current pushed branch): raw `<button>`, `<input>`, `<select>`, `<textarea>`, `<table>`, hard-coded six-digit hex, `fixed inset-0` and `role=dialog` = **zero each across all 7 files**; `sm:` = 0; `md:` = 40 occurrences. The form/nav and JSX tag counts are balanced: `college-quiz-attempts` nav 1/1, Button 4/4, Alert 1/1, Disclosure 1/1; `college-quiz-actions` Button 3/3 and Alert 2/2; `college-quiz-create` Button 9/9, Alert 2/2; `college-quiz-questions-editor` Button 6/6, Alert 2/2; `college-assessment-aggregate` form 1/1, nav 1/1, Button 1/1; `learner-live-class-link` Button 1/1. This is fetched-source regex, not a local `rg` command or executed JSX parser. All dynamic control handlers/validation still exist in source; **not a runtime behavior test**.

**Work done this batch:** 25 distinct TSX files were updated and source-probed across learner/course, college assessment and Super Admin pages, plus this audit documentation. These are file-level code changes; H1–H6 remain **open** under STRICT TICK pending the 247-path complete inventory and exact visual/focus/disabled phone/tablet evidence. No build, TypeScript check, tests, CI or screenshots run.

**Next exact unticked file:** `src/components/courses/college-assignment-review.tsx` (college assessment published grade visibility/disabled/empty and responsive source check), then `src/components/courses/college-quiz-create.tsx` only if the orchestrator returns a concrete computed-style diff.

## 2026-10-20 chat-7 continuation — college courses, assignment and lessons (batch 6)

**Source-check method:** Each changed file was fetched again by its exact GitHub branch path after the write and inspected as complete UTF-8 text. No application build, compiler, static analyzer, browser or CI ran (lane constraint). A path passing these source probes is *not automatically a strict visual parity tick*. Changes preserve routes, service calls, confirmation flows, state guards, saved versions and user-facing copy unless specifically noted.

### 19 inspected and updated TSX files — work ledger

| Path below `src/components/courses/` | Concrete judgement-case change | Responsive and state evidence |
| --- | --- | --- |
| `college-assignment-review.tsx` | Partial, pending, successful and retryable grade publication now use shared `Alert` with status, success or warning tone; section selector and Publish/Retry controls sized | `min-h-11 md:min-h-9`, retains disabled-while-pending, result counters and refresh |
| `super-admin-course-bulk-visibility.tsx` | Three old `sm:` overrides changed to `md:`; existing `ScrollCue`, checkbox selection, failure retry and status `Alert` untouched | Breakpoint >=768, selected row 44px, secondary and primary buttons 44px phone |
| `college-course-missing-scope.tsx` | Shared `PageHeader` stays outside and above shared `Alert tone=error`; no bespoke error typography | Page title shared; alert's default role/typography/spacing inherited; missing-scope copy untouched |
| `college-content-preview.tsx` | Shared preview `Dialog` open and Close controls now 44px phone/36px desktop; privacy-safe summary retained | `min-h-11 md:min-h-9`; focus-trapping/backdrop owned by shared Dialog |
| `college-student-visibility-control.tsx` | Student visibility toggle preserves `aria-pressed`, confirmation, stale-version handling, pending disable and error alert, with 36px desktop reduction | `min-h-11 md:min-h-9` |
| `college-lesson-create-control.tsx` | All picker/form/action controls now 44px until 768; Create Another and Cancel use outlined secondary, not local teal-on-primary overrides; 13px semibold labels | `min-h-11 md:min-h-9`, labels `text-xs font-semibold text-body`; authoring, validation and toast states unchanged |
| `admin-offering-section-preview.tsx` | Section selector/submit 44px phone and 36px desktop, lesson/item headings explicit foreground | `min-h-11 md:min-h-9`; metadata-only section audience semantics unchanged |
| `resource-progress-control.tsx` | Completion action responsive and error result now shared `Alert tone=error`; `Badge` success and `ConfirmDialog` retained | `min-h-11 md:min-h-9`; pending, confirmed, complete/disabled and error states preserved |
| `admin-course-actions.tsx` | All six small Edit/Archive/End lifecycle buttons given 44px phone targets; duplicate link breakpoint from 640 to 768; existing dialogs/confirmation unchanged | `min-h-11 md:min-h-9`, `md:min-h-9`; preserved course, delivery and faculty assignment scope |
| `admin-learning-structure-actions.tsx` | Switched two learning path/ordering grid breakpoints from `sm:` to `md:` | `md:grid-cols-[1fr_2fr_auto]`, `md:items-end`; all mutation/disabled states preserved |
| `admin-offering-learning-overview.tsx` | Four content links/lesson panel responsive modifiers now `md:`, badge JSX normalized, removed redundant duplicated `md:p-3` tile override | `min-h-11 md:min-h-9` link controls; distinct Lesson cards kept (not flattened) |
| `admin-course-display-editor.tsx` | Shared Input and Save action now 44px phone/36px tablet; 13px semibold field labels; rich description and thumbnail fields preserved | `min-h-11 md:min-h-9`; migration-disabled warning status and pending save untouched |
| `college-content-authoring-control.tsx` | Removed extra ordinary outer card, tokens for heading, 13px/600 labels; 44px phone New/Save/filer/Order/external-link controls, removed local input border/bg/40px overrides; error and success now shared `Alert` | `border-b border-border pb-5`, `md:grid-cols-2`, `min-h-11 md:min-h-9`; timezone conversions/filters/link material state preserved |
| `college-lesson-visibility-controls.tsx` | Page-scoped selection list uses 768px two-column breakpoint and >=44px checkbox labels/buttons; Show/Hide/Retry remain shared secondary | `md:grid-cols-2`; existing shared `ScrollCue`, optimistic timestamps, failure report and retry retained |
| `college-lesson-drag-order.tsx` | Reorder heading foreground; drag-sort fallback Move up/Move down buttons 44px phone | `min-h-11 md:min-h-9`; actual drag and persistent sort logic retained |
| `college-lesson-reorder-actions.tsx` | Compact lesson sequence arrows have 44px phone targets | `min-h-11 md:min-h-9`; up/down disable and pending confirmation preserved |
| `college-archived-lesson-restore.tsx` | Restore action remains shared ghost/link with responsive size | `min-h-11 md:min-h-9`; existing confirmation and error inline retained |
| `college-assignment-create.tsx` | **Fixed a real duplicated JSX `variant` prop** on Create New Assignment; removed extra form canvas; converted all 6 grid breakpoints to `md:`, shared Input/Select/Textarea skins and 13px labels, 44px controls | `md:grid-cols-2`, `md:col-span-2`, `min-h-11 md:min-h-9`; dual create/discard `ConfirmDialog` and submission methods retained |
| `college-assignment-actions.tsx` | Edit/Publish use secondary variant, Delete danger, Save primary without ad hoc border/bg overrides; shared Input/Textarea, flat edit area and success/error Alerts | `min-h-11 md:min-h-9`; API concurrency, archive/publish and no-edit-after-submission guards untouched |

### Legacy value table — checked properties and supported states

| Property and state | Legacy/owner source and expected value | Changed source and resolved value | Source result |
| --- | --- | --- | --- |
| Text/form labels | `legacy-styles/components___form.scss:102-126` 14px input text/20px/0.2px and `components___form.scss:107-111` 13px semibold labels | `admin-course-display-editor.tsx`, `college-lesson-create-control.tsx`, `college-content-authoring-control.tsx`, `college-assignment-create.tsx`: `text-xs font-semibold text-body` (13px/600 token), shared Input/Select font14px | Label role source MATCH; per-font visual no rendering |
| Form default/focus/error | `components___form.scss:102-138` #fbfcfd, teal focus rgba(38,186,199,.15), error border #ef4444, error fill .06 | All migrated inputs use `src/components/ui/{input,select,textarea}.tsx`; inherited globals `--lms-form-bg:#fbfcfd`, focus shadow and error from shared skin; no local rounded/border override in modified assignment/content controls | Source token path MATCH, computed disabled/error states need shared-owner review |
| Accent default and hover | `legacy-styles/components___variables.scss:10-14` teal #26bac7, hover #1e9aa8, text #1a95a1, subtle #eff8fa | Shared `Button`, `Badge`, `StatusBadge`, `Alert`; remaining dynamic class colors use `--lms-*` tokens | MATCH resolved brand tokens; hover pixel comparison pending |
| Primary/secondary/danger | `master-queue.md:4-9` revised binding owner spec primary #0a7c88 white/36px/9px/14px/650 and outlined secondary; legacy `components___button.scss:1-90` older `.ln-btn` family variants include 8px/40px exceptions | `college-assignment-actions`, `college-lesson-create`, `college-quiz-actions` now use shared variants instead of forced page bg/teal text; `--lms-control-height=36px`, radius9px in `globals.css:341-343` | MATCH newer owner spec via shared button, **historical legacy `.ln-btn` variation remains non-identical**, so no strict global-button tick |
| Phone action target | `legacy-styles/components___learn-layout.scss:361-383` min 44px for back and other mobile actions; `old-lms-shell.css` phone touch spec | Targeted buttons, selectors and section links `min-h-11` (44px) until >=768px; `md:min-h-9`=36px from tablet | MATCH source sizing for touched controls, not all descendants |
| Phone/tablet breakpoint | `legacy-styles/components___learn-layout.scss:34,379,419,450` at max-width:767px | **All 19 re-fetched TSX have zero `sm:` occurrences**, 75 `md:` occurrences; responsive selectors now switch at 768px | Source breakpoint MATCH; physical viewport proof open |
| Flat ordinary page and divider | `docs/design/old-lms-pages.md:7-12` one white 12px-radius canvas, ordinary lists/filters hairlines, separate report tile cards only | Course/assignment authoring ordinary wrappers `border-b` or `border-y`; genuine lessons retain separate card semantics | Source layout MATCH in modified files |
| Error, empty, loading, success | `variables.scss:63-78` error #ef4444, warning #d97706, success #059669, info #26bac7 | `Alert tone=error/warning/success/info` in course scope, grade publication, authoring, resource progress; no changes to EmptyState/service state guards | State token source MATCH; exact alert surface differ with shared `--lms-warning-surface`, browser proof OPEN |
| Page title/header | `old-lms-pages.md:7-10` one row page head above content | Missing college scope now one `PageHeader` OUTSIDE one semantic `Alert`, rather than nesting header in banner; other shared heads retained | MATCH source placement |

### Coverage and JSX proof — exact scope 19 files

Post-write, fetched every file named in the preceding 19-row table, and counted the following regex matches on complete source:

| Source regex probe | Count across these 19 TSX |
| --- | ---: |
| `/<(button\\|input\\|select\\|textarea\\|table)(?=[\\s>])/g` (raw controls/table) | **0** |
| `/#[a-f0-9]{6}\\b/gi` (six-digit hex) | **0** |
| `/fixed inset-0\\|role=["']dialog["']/g` (handmade overlay) | **0** |
| `/<h1(?=[\\s>])/g` (local competing page title) | **0** |
| `/\\bsm:/g` (premature 640px breakpoint) | **0** |
| `/\\bmd:/g` (>=768px breakpoint use) | **75** |

Paired JSX tag checks across each source: Button and Alert openings/closings are balanced; `admin-course-actions` 10 Button pairs; `admin-learning-structure-actions` 13 Button pairs and 2 form pairs; `college-content-authoring-control` 8 Button and 2 Alert pairs; `college-assignment-actions` 4 Button pairs; `college-assignment-create` 3 Button pairs and both existing ConfirmDialog usages; `college-course-missing-scope` one Alert pair outside one `PageHeader`; `resource-progress-control` one Button/Alert pair and one ConfirmDialog usage. The other 12 scoped paths also have balanced form/button/alert tags; shared inputs can self-close. **The scan was executed over fetched source strings, NOT via local `rg` or compiler.**

Reproducible local search, when orchestrator runs it:
```bash
rg -n '<(button|input|select|textarea|table)([[:space:]>])|#[0-9A-Fa-f]{6}|fixed inset-0|role="dialog"|<h1([[:space:]>])' src/components/courses/{admin-course-actions,admin-course-display-editor,admin-learning-structure-actions,admin-offering-learning-overview,admin-offering-section-preview,college-archived-lesson-restore,college-assignment-actions,college-assignment-create,college-assignment-review,college-content-authoring-control,college-content-preview,college-course-missing-scope,college-lesson-create-control,college-lesson-drag-order,college-lesson-reorder-actions,college-lesson-visibility-controls,college-student-visibility-control,resource-progress-control,super-admin-course-bulk-visibility}.tsx
```

**Strict ticks:** H1–H6 remain **[ ]**, because full 247-file inventory + computed style/interaction states of all shared Button/Dialog/Alert/Checkbox etc and phone/tablet visual comparison still lack proof; do not claim that changes alone certify pixel-level parity. Sources do confirm no raw controls/hex/overlays and valid balanced known JSX tag pairs for the exact 19 files above. Next owner stage is orchestrator side-by-side screenshot verification per checklist J; no tests or CI in chat-7.

**Next exact unticked file:** `src/components/courses/college-content-csv-export.tsx` (export link token, loading and mobile hit area), followed by `src/components/courses/assignment-file-open-control.tsx` and its learner submission adjacent controls.

## 2026-10-20 chat-7 continuation — learner assignment/course routes and file submissions (batch 7)

**Scope:** 24 re-read complete TypeScript/TSX source files after direct branch writes (15 learner route pages, 9 course components). No tests, compiler, browser, app process, CI or screenshots used, per lane instructions. Protected file transfers and persistence logic were not changed; visual render-level final proof remains open.

### Source-reviewed and edited file inventory — relative paths

**Under `src/components/courses/`**

| TSX file | Source fixes and state preservation |
| --- | --- |
| `assignment-file-open-control.tsx` | Submitted-file Download stays shared secondary with 44px phone target / 36px desktop. Preserved private file grant flow, loading `PageLoading`, `EmptyState`, per-file `StatusBadge`, and `Alert` error. |
| `assignment-file-submission-control.tsx` | Responsive 44px Upload/Cancel/Check file/Remove/Submit and file picker, 13px semibold label, upload progress in shared `MetricBar`, error migrated to shared `Alert`. Preserved pending/disabled while upload, cancel `AbortController`, storage checks, final submission confirmation. |
| `assignment-multipart-parts-editor.tsx` | Standard 13px semibold labels for link kind/HTTPS URL/caption; shared controls 44px phone/36px desktop and labelled remove/add actions. Kept up to 20 links, user-authored rich-text editor, and disabled propagation. |
| `assignment-submission-control.tsx` | All 3 shared `FilterChip` type selectors and submit/discard actions 44px phone; shared `Alert` handles success, methods-load error, missing file storage warning/error, and failed submission. Discard uses shared danger (destructive) Button; confirmation dialog, submit flight guard, copy and route state preserved. |
| `assignment-submission-links.tsx` | Submitted HTTPS link gains keyboard outline, hover and 44px phone click target. Preserved URL validation, archived links, fetch-error shared `Alert`, and kind `Badge`. |
| `lesson-resource-materials-control.tsx` | Resource external link and all add/edit/remove/save controls respect 767px mobile target, titles foreground, shared success/error `Alert`. Kept editable permission, external HTTPS link handling, draft notes, materials loading and optimistic control state. |
| `course-display-read-only.tsx` | Takeaway text grid remains one column through 767px, two-column from 768. Existing sanitized HTML, fallback and no-data behavior untouched. |
| `expandable-course-description.tsx` | `Read more/Show less` toggle 44px phone/36px tablet; `aria-expanded`, `aria-controls`, escaped/sanitized text path untouched. |
| `expandable-course-update.tsx` | Identical `Read more/Show less` responsive change on course announcements; no text truncation or expanded state change. |

**Under `src/app/(authenticated)/learn/`**

| TSX route | Source fixes, visual and state mapping |
| --- | --- |
| `courses/error.tsx` | Shared `PageHeader` above `Alert tone=error`, 44px phone Retry and Back to Courses actions, no centered extra canvas. |
| `allAssignments/error.tsx` | Same error banner and controls; retained loading-not-empty wording. |
| `allQuizzes/error.tsx` | Moved status role to semantic shared `Alert`, leaving `PageHeader` outside banner. Retry and return 44px phone. |
| `attendance/error.tsx` | Shared `PageHeader` outside shared error banner; retry phone 44px. |
| `courses/[deliveryId]/[...courseTab]/page.tsx` | All three header actions now use `md:min-h-9` rather than premature `sm:min-h-9`. `PageHeader`, course-detail Tabs, roster and historical/read-only view unaffected. |
| `courses/[deliveryId]/[...courseTab]/not-found.tsx` | Shared `PageHeader` above `Alert tone=warning`; Back link preserves 44px phone/36px tablet. |
| `courses/[deliveryId]/attendance-summary/page.tsx` | Return link 44px phone, summary/month/item grids and month card padding move from 640px to 768px cutoff. |
| `courses/[deliveryId]/attendance-summary/error.tsx` | Shared `ErrorState` preserved; Retry and Attendance navigation 44px phone/36px tablet. |
| `courses/[deliveryId]/progress/page.tsx` | Course progress summary, lesson rows and detail links now stack through 767px; summary `MetricBar` kept with ARIA progressbar. |
| `courses/[deliveryId]/progress/error.tsx` | Preserved shared `ErrorState`, aligned Retry and Courses controls to phone 44px. |
| `allAssignments/[assignmentId]/page.tsx` | Assignment selector and resource links, header back action, due/points/notes grid and disabled submission action get 767px break; flattened chooser list to hairline rows; shared `Alert tone=warning` for closed or missing-deadline submissions; no student URL leak/permission changes. |
| `allAssignments/[assignmentId]/error.tsx` | Shared PageHeader then error Alert; Retry and back links use 44px phone. |
| `allQuizzes/[quizId]/page.tsx` | Quiz attempt history grid and links, chooser list, Close detail action, heading and review layout switch at 768px; no grading or answer-disclosure changes. |
| `allQuizzes/[quizId]/error.tsx` | Shared banner for load failure with 44px Retry and All Quizzes navigation. |
| `attendance/calendar/page.tsx` | Removed hand-written semantic status pill skins; shared `StatusBadge` has success=PRESENT, error=ABSENT, warning=EXCUSED/MEDICAL/LATE, neutral=NOT_MARKED, info=SCHEDULED. Invalid filter screen now PageHeader outside `Alert tone=error`; form labels 13px/600; 44px phone Clear/Filter. Preserved IST date rendering, calendar grid, filters, monthly classes and authorization. |

### Legacy value and interaction proof

| Property/state/edge | Legacy reference and expectation | vNext source property, value and evidence | Outcome |
| --- | --- | --- | --- |
| Primary/default CTA, hover, active, disabled | `docs/orchestrator/queues/master-queue.md:4-9` revised binding owner spec primary #0a7c88, white text, height36, radius9, 14px/650; `legacy-styles/components___button.scss:1-90` older 8px/40px family variants | Shared `Button` receives semantic primary/secondary/danger props, disabled by existing state booleans; `src/app/globals.css:341-343` default36px/radius9; no local overriding raw button | Source shared skin route MATCH newer owner spec; exact hover/disabled pixels still require shared owner |
| Native form font/keyboard focus/error | `legacy-styles/components___form.scss:102-138` body 14px/20px/0.2px, background #fbfcfd, 13px/600 labels, teal focus, red error | Assignment/file/link editors use shared `Input`, `Select`, `Textarea`, `Checkbox`, `FilterChip`; `text-xs font-semibold text-body` field labels and `Alert tone=error` | Source MATCH for token path; keyboard/tab/focus computed states OPEN |
| Phone target and cutoff | `legacy-styles/components___learn-layout.scss:34,361-383` <=767px phone, minimum interactive target44px; 768px+ desktop/tab skin | All touched anchor/button/input controls `min-h-11` with `md:min-h-9` (44px/36px). All previous `sm:` in these 24 paths now `md:`. | Source MATCH for named controls, rendered hit boxes OPEN |
| Error, invalid, unloaded versus empty | `old-lms-pages.md:7-10` one canvas, narrow inline status strip and accessible action | `PageHeader` lives outside shared `Alert tone=error` on route errors, `ErrorState` retained for drilldowns; asynchronous Error, Empty, Loading state preserved in file controls | Source semantic MATCH, exact banner padding/status-color/radius OPEN |
| Status pills and colors | `legacy-styles/components___variables.scss:63-78`: success #059669, error #ef4444, warning #d97706, info #26bac7 | Attendance calendar uses `StatusBadge tone` rather than handmade `rounded-full px-2 py-1`; unknown status defaults neutral | Source semantic colors aligned, shared badge computed px value OPEN |
| Course cards/list wrappers | `docs/design/old-lms-pages.md:7,12` no nested ordinary table or list card, distinct objects retain cards | Learner assignment/quiz choose-course lists `divide-y border-y`; learner lesson/month review cards remain distinct objects | Source layout MATCH for changed ordinary wrappers |
| Uploading, verifying, ready, removed and failed | `old-lms-pages.md` structured state pills, muted helper/disabled button states | Shared `StatusBadge` in staged and submitted files, progress `MetricBar role=progressbar`, primary pending/secondary cancel/disabled remove, `Alert tone=error` on failure | All code state branches preserved, visual/race regression not run |
| Confirmation and discard | `legacy-styles/components___button.scss:39-87` semantic primary/secondary/danger and `old-lms-pages.md:7-10` page state boundaries | Assignment discard `Dialog` uses secondary Keep editing/danger Discard, buttons 44px phone. Existing typed confirmation, dirty check, no double submission intact | Semantic source matching, modal rendered focus and click-through OPEN |
| Focus and hover on text actions | `legacy-styles/components___form.scss:23-28` keyboard-visible focus and legacy teal hover | External submission/material links and course links use `focus-visible:outline-2`, `hover:text-primary-hover`, min44px phone; direct external `target="_blank" rel=noopener noreferrer` retained | Source style MATCH, keyboard traversal OPEN |

### Scoped grep output and syntax evidence

Post-write full-source fetch and regex check for exactly the **24 listed files** (not all portal routes). Across these 24 TSX paths:

| Probe | Hits |
| --- | ---: |
| `/<(button|input|select|textarea|table)(?=[\\s>])/g` raw controls and tables | **0** |
| `/#[a-f0-9]{6}\\b/gi` hard-coded six-digit colors | **0** |
| `/fixed inset-0\\|role="dialog"/g` hand-rolled overlays | **0** |
| `/\\bsm:/g` premature 640px breakpoint utility | **0** |
| `/\\bmd:/g` correct 768px transition utility | **91** |

Source JSX pair examples: learner course error pages `Alert` opens/closes 1/1 each; progress/attendance drilldown `ErrorState` native; assignment submission uses 1 `<form>` and 1 `</form>`, shared `Button` 3/3 and `Alert` 4/4; file upload `Button` 5/5 and `Alert` 1/1; materials `Button` 4/4 and `Alert` 2/2. Other component/route button and alert tags were also paired in the fetched files, never half-migrated. No TypeScript parse or runtime behavior test was executed.

**STRICT TICKS: H1–H6 remain [ ]**. These 24 **source-corrected** paths still require inherited shared Button/StatusBadge/Table/Alert visual-values complete comparison and route-level phone/tablet rendered states, which this lane cannot run. No unverified line is marked as a full pixel-parity closure; the orchestrator's checklist section J and shared component lanes remain the bottleneck. Source probes are scoped and not falsely presented as full 247-path zero.

**Next exact unticked file:** `src/app/(authenticated)/learn/attendance/calendar/error.tsx`, then `src/app/(authenticated)/learn/calendar/page.tsx` for the learner week/class schedule control and calendar responsive parity.

## 2026-10-20 chat-7 continuation — learner calendar error pages and Super Admin directories (batch 8)

**5 additional files updated, pushed, then complete-source fetched and scanned.** This is a *source/style migration*, not a UI screenshot or executed test. `PageHeader` remains outside an `Alert` in both learner calendar errors, so the old single page canvas and one-line header structure do not get absorbed into a colored banner. In admin pages the shared page head, tabs and directory bodies are unchanged; only local judgement cases were touched.

| Scope/file | Source change | Error/empty/loading and responsive proof |
| --- | --- | --- |
| `src/app/(authenticated)/learn/attendance/calendar/error.tsx` | Removed wrapper `role=alert` from page header; actual failed-read sentence now shared `Alert tone=error`. Retry `Button` 44px phone / 36px tablet. | Existing route-specific error copy and `reset` callback preserved. `min-h-11 md:min-h-9`, `Alert` 1/1, `PageHeader` 1. |
| `src/app/(authenticated)/learn/calendar/error.tsx` | Same shared `PageHeader` followed by `Alert tone=error`, compact wrap-aware Retry row. | Existing calendar refresh failure text and handler unchanged; `Alert` 1/1, button 1/1, 768px breakpoint. |
| `src/app/(authenticated)/admin/lessons/page.tsx` | Nine `sm:` replaced with `md:` in form filters, list actions and pagination; field labels inherit 13px semibold `text-xs`. Invalid-filter and retry `ErrorState` links gain 44px mobile/36px desktop and hover token. Separate partial-filter and lesson-picker failures now `Alert tone=warning` instead of handmade bordered `p`. | Forms retained (1 open/1 close); PageHeader 4 conditional states; Alert 2/2; Button 1/1. Existing `EmptyState`, `ErrorState`, CSV export, bulk visibility, paging and optimistic admin operations retained. |
| `src/app/(authenticated)/admin/course-progress/page.tsx` | Two form labels use 13px/600 font role; partial-filter warning now shared `Alert`; invalid `ErrorState` Clear action gains touch size/focus hover. | Existing adminScope permissions, read-only progress calculations, exported CSV link, flat record list, paging and empty states untouched. Form 1/1, Alert 1/1, 11 `md:` classes. |
| `src/app/(authenticated)/admin/courses/page.tsx` | Existing shared PageHeader and Tabs unchanged; invalid course-query `ErrorState` Clear filters action gets 44px phone/36px tablet and teal hover token. | No outer card introduced. Existing unselected-college `EmptyState`, section tabs, duplicated course copy semantics preserved. |

### Exact legacy-property and state values

| Property/required state | Old LMS authority | Current source/value | Source comparison |
| --- | --- | --- | --- |
| One page title outside banner | `docs/design/old-lms-pages.md:7-10`: one row title, same white 12px canvas; separate slim inline notices | Calendar error routes now shared `PageHeader` sibling before semantic `Alert tone=error`, Super Admin `PageHeader` already shared | Layout arrangement MATCH in source |
| Default text color / warning and error | `legacy-styles/components___variables.scss:20-32,63-78`: foreground #1a1d21, warning #d97706, error #ef4444, info teal #26bac7 | `src/components/ui/alert.tsx:6-19` shared `tone=error` / `tone=warning` and tokens rather than page-local `bg-warning-subtle` | Semantic color routing MATCH; exact rendered banner geometry still shared-owner |
| Form label | `legacy-styles/components___form.scss:107-111`: 13px/600/line16; shared Input font14/line20 | Lesson and course-progress filter labels `text-xs font-semibold text-body`, shared `Input`/`Select` handle focus/error/disabled | Source MATCH font role, actual browser states OPEN |
| Phone hit target | `legacy-styles/components___learn-layout.scss:361-383`: 44px back link/phone action | Retry/Clear filter/export/next buttons `min-h-11` (44px) below768; `md:min-h-9` (36px) at/above768 | Named controls MATCH source height |
| Breakpoint | `legacy-styles/components___learn-layout.scss:34,379,419,450`: `max-width:767px` mobile | Admin lessons 9 `sm` migrated to 768px `md`, no new 640px rules; existing progress 768px | Source BREAKPOINT MATCH, no viewport run |
| Focus, hover, disabled, loading | `legacy-styles/components___form.scss:23-28,123-138` keyboard focus visible; `components___button.scss:20-85` hover/disabled; `old-lms-pages.md:7-10` empty/error | Shared `Alert`, `Button`, `ErrorState`, `EmptyState` own token states; error links use `hover:text-primary-hover`; loading/error copy and retry functions kept | Component reuse proved; exact computed hover/focus/disabled **OPEN** |

**Scoped source grep:** For the exact **five paths** in the table, complete fetched text scanned with `/<(button|input|select|textarea|table)(?=[\\s>])/g`, `/#[a-f0-9]{6}\\b/gi`, `/fixed inset-0|role="dialog"/g`, and `/\\bsm:/g`: 0 matches for every probe. `/\\bmd:/g`: 26 occurrences (1+1+12+11+1). Shared `Alert` opens/closes 1/1 in each calendar error and 2/2 in Admin lessons, 1/1 in course-progress; admin courses uses shared `ErrorState` no new Alert. Admin lessons/course-progress form tags 1/1. No `h1` bypasses the shared PageHeader.

**STRICT TICK STATUS:** H1–H6 remain `[ ]` pending complete 247-path inventory/strict shared hover/disabled/focus computed-value comparison and orchestrator side-by-side phone/tablet screenshots per checklist J; source probes and legacy file tables alone are not a pixel-perfect runtime certificate. No local `rg`, JS/TS execution, browser session, tests or CI were performed.

**Next exact unticked file:** `src/app/(authenticated)/learn/calendar/page.tsx` (class schedule links, calendar visual state/layout and service-driven states), followed by `src/app/(authenticated)/learn/attendance/page.tsx`.

### Batch 8 continuation — learner calendar and attendance header links

After the previous five-route change, two more source pages were inspected end-to-end and pushed:

| File | Screen states and pixel-value source proof | Responsive proof |
| --- | --- | --- |
| `src/app/(authenticated)/learn/calendar/page.tsx` | Existing one `PageHeader`, authenticated `LearnerClassSchedule` (IST), empty and filter states untouched. Header secondary Attendance calendar link uses existing shared 9px `--lms-control-radius`, 1px border, white base with 150ms `--lms-motion-fast`; hover teal border/`--lms-primary-subtle`, focused teal 2px outline with 2px offset; reduced motion disabled transition. | `min-h-11 md:min-h-9`, 44px under768 and 36px desktop; zero `sm:` declarations. |
| `src/app/(authenticated)/learn/attendance/page.tsx` | Existing one `PageHeader` and scoped attendance service/IST summaries untouched; matching link hover/focus/reduced-motion as above. | `min-h-11 md:min-h-9`, 44/36px with breakpoint 768. |

Legacy sources: `legacy-styles/components___variables.scss:10-14` interactive `#26bac7` default/hover and `#eff8fa` subtle fill; `components___form.scss:23-28,120-127` keyboard-visible teal focus; `components___learn-layout.scss:34,361-383` phone cutoff 767px and 44px mobile button. The native link states follow shared tokens, not hard-coded CSS. Source-only validation for BOTH pages (fetched after edit): raw `button/input/select/textarea/table` count **0**, six-digit hex count **0**, hand-rolled dialogs count **0**, `sm:` count **0**, one `md:` breakpoint each, exactly one `PageHeader` each, exactly one `focus-visible:outline-2` and `motion-reduce:transition-none` each. No direct JSX button mismatch.

**Coverage inventory caveat:** The original 247-TSX inventory at the top of this audit is the 2026-10-19 baseline and is explicitly *not* a fresh exhaustive count. Later GitHub listing of `src/components/courses` returned 114 entries, including TypeScript and CSS modules. Refresh the full recursive inventory with exact TSX filtering and run the area-wide `rg` commands before any H1–H6 ticks. Source-edited ≠ full visual proof.

**Next exact unticked file:** `src/app/(authenticated)/learn/attendance/calendar/loading.tsx`, then `src/app/(authenticated)/learn/calendar/loading.tsx` — check spinner/loading skeleton value/state parity against shared `GracefulPageLoading` and old dotted-spinner contract. H1–H6 remain open pending global/source-state proof and computed phone/tablet comparisons. No application code, CI, tests or browser was run.

### Batch 8 final source addendum — per-student progress and loading states

**`src/app/(authenticated)/admin/course-progress/students/page.tsx`**: source-updated per-student Super Admin course progress report. Existing `PageHeader` and shared `DataTable` remain, with columns Student, Videos, Assignments, Quizzes, Progress; data scoping, percent calculations, no-data `empty`, 500-student truncation and CSV export preserved. All 19 premature `sm:` utilities (summary strip, table action/link) now use `md:` for legacy 768px tablet layout. `Back to Course Progress` link gains hover/focus token styling and maintains `min-h-11 md:min-h-9`. Truncation warning now `Alert tone=warning role=alert`, rather than a plain warning-colored paragraph.

| Property/state | Legacy value/reference | vNext current source | Comparison |
| --- | --- | --- | --- |
| Phone/tablet cutoff | `components___learn-layout.scss:34,379,419` phone ends at767px | Student summary 4-column grid and export controls use `md:` from768px | Source MATCH |
| Phone link touch target | `components___learn-layout.scss:361-383` 44px | Back/export `min-h-11` default, `md:min-h-9` (36px) | Source MATCH |
| Hover and focus | `components___variables.scss:10-14` interactive teal #26bac7, text #1a95a1; `components___form.scss:23-28` focus-ring keyboard only | Back action uses `hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary` | Token path MATCH; rendered keyboard browser check OPEN |
| Partial/truncated warning | `components___variables.scss:63-78` warning #d97706 and 10% tinted background; `old-lms-pages.md:7-12` in-canvas notice | `Alert tone=warning role=alert` shared component; retains original warning text | Semantic source MATCH; banner exact geometry OPEN |
| DataTable/empty state | `old-lms-pages.md:12` hairline rows, pills/table in page canvas; absence is not misrepresented | Existing shared `DataTable` with empty-state text and 5 column descriptors | Shared consumption confirmed; rendered table rows OPEN |

**Grep source check** after push: raw `<button/input/select/textarea/table>` 0, hardcoded 6-digit hex 0, hand-rolled modal 0, raw `h1` 0, `sm:` 0, `md:` 19, shared `Alert` opening/closing 1/1 and one `DataTable` self-closing. No compile, CI or browser run.

**Loading-state source review with no edit warranted:** `src/app/(authenticated)/learn/attendance/calendar/loading.tsx`, `learn/calendar/loading.tsx`, `allAssignments/[assignmentId]/loading.tsx`, `allQuizzes/[quizId]/loading.tsx`, `courses/[deliveryId]/progress/loading.tsx`, `courses/[deliveryId]/attendance-summary/loading.tsx`, `courses/[deliveryId]/[...courseTab]/loading.tsx`, `courses/[deliveryId]/loading.tsx`. Six of these use shared `GracefulPageLoading` (directory/card/route variants); two drilldowns use shared `PageHeader` plus `LoadingState`. No local hand-built spinner, raw controls, or overlay. The old LMS `old-lms-pages.md:27` observed a small dotted loading spinner; exact spinner render/animation is owned by shared UI and must be compared by the orchestrator before a strict tick.

**NEXT EXACT UNTICKED TSX:** `src/components/courses/college-live-classes-directory.tsx` — lesson/course live-class filters, recorded attendance section, responsive list rows and state actions; then `src/app/(authenticated)/admin/courses/offerings/[offeringId]/page.tsx` and its section content display. H1–H6 **remain open** for complete computed-value and full-area grep verification. This lane has not executed code, tests, typecheck or CI.

## 2026-10-20 chat-7, batch 9 — exact judgement cases after upstream skin sync

Rebased by fast-forward at start to `main@a7616350ee830c5e187533defabafb477a27172e` (757 commits behind, zero lane-7 commits ahead). Global element skin `src/styles/legacy-skin.css` is on main and owned by chat-17. **This turn changes page-level judgement cases only**; no shared UI or shell files touched.

### 9 updated TSX file-level source proofs

| File within `src/components/courses` | Changed state/layout decision | Boundary, keyboard, loading/error/empty paths |
| --- | --- | --- |
| `college-live-classes-directory.tsx` | 8 explicit label font roles; course offering action is >=44px on phone with hover/focus; link focus outline offset becomes 2px; list row padding flattens to canvas hairlines | `md:` 12; statuses shared `StatusBadge`, empty message and `Pagination` preserved, course/section/view/date filtering unchanged |
| `college-learner-progress-report.tsx` | Class/Course labels inherited 13px/600 skin, two CSV/filter links use 2px focus outline offset | `md:` 6; `DataTable`, `StatTile`, `MetricBar`, empty `EmptyState`, CSV and disabled filter unchanged |
| `college-content-aggregate.tsx` | 15 field label roles, focus offset2, phone course link >=44px; plain mobile publication text migrated to shared `StatusBadge` success/neutral/warning | `md:` 21; table/mobile cards switch at768px; `DataTable`, CSV export, `Pagination`, empty state and material flags retained |
| `college-assessment-aggregate.tsx` | 10 form field labels, ten field controls compact at768px; manual Previous/Next replaced with shared `Pagination`, existing Page/Total/25-per-page summary retained; mobile and desktop result visibility now shared `StatusBadge` | `md:` 17, `Pagination` self closes; quiz hidden vs published, assignment review, valid filters, no-results and route URLs unchanged |
| `college-learning-directory.tsx` | 64 labels inherit single global 13px/600 skin; 64 matching controls 44px phone/36px desktop; ordinary mobile records flattened from per-row nested cards to dividing hairlines; lesson visibility and offering status promoted to shared `StatusBadge` | `md:` 75, no `sm:`; mobile list and desktop `DataTable` switch at768px; both filtered forms, hidden input query persistence, jump-to-page, `Pagination`, empty/no-progress state retained |
| `college-quiz-attempts.tsx` | Flattened quiz submission and question nested frames into hairline/divider rows; section/student labels inherit shared form label; Correct/Incorrect review text now shared success/error `StatusBadge` | `md:` 6; shared `Disclosure`, fetch errors, retry, pagination, student search, 320px scroll box, 44px phone actions retained |
| `admin-course-overview.tsx` | Course list filters use global 13px/600 label role, search input 44px phone/36px tablet; offering action gains hover/focus/reduced-motion token states | `md:` 9; four summary/tables, `DataTable`, `Pagination`, Page/Filter/Empty, course actions retained |
| `learner-course-list.tsx` | Semester/search/term/progress/sort selectors, continue-only chip, reset and load-more actions keep 44px touch until 768px, compact 36px afterwards | `md:` 16, `sm:` zero; segmented-control semantics, warning `Alert`, 3 badge types, no-course card and progress `MetricBar` intact |
| `learner-assessment-overview.tsx` | Course/search/state/sort filter controls compact from 768px; Clear assessment filters uses same phone/desktop sizes | `md:` 27, `sm:` zero; shared `NeedsDoingChips`, `Disclosure`, 4 status pills, `EmptyState`, paging and action guards retained |

**Read-only peer verification:** Global skin `src/styles/legacy-skin.css:375-391` now forces form `label` font-size **13px**, weight **600**, color `var(--lms-neutral-400)` through `main`/page canvas. Thus page-local `text-xs` labels do **not** imply rendered 12px as long as authenticated global skin wins. Shared `input/select/textarea` state owners remain chat-17; no duplicated static color hex in any of the nine page files.

### Legacy value-to-source property table

| Property / state | Legacy source : expected | vNext route/property | Static-source result |
| --- | --- | --- | --- |
| Labels default | `legacy-styles/components___form.scss:107-115` `.ln-lb2`: 13px / 600 / 16px, neutral-400 `#a9a7ae` | All edited form labels inherit `legacy-skin.css:375-391` label 13px/600/neutral-400; selectors remain shared `Select` / `Input` | MATCH inherited font-size/weight/color; rendered line height depends descendant control and remains visually unverified |
| Input background/default | `legacy-styles/components___form.scss:117-132`: `#fbfcfd`, 10px radius, text14px/20px/0.2px | Existing shared Input/Select/DateInput, global skin form variables; removed page-level size overrides but not shared primitives | Shared token path only; actual computed padding/radius/letter-spacing require rendered comparison |
| Input focus/error | `legacy-styles/components___form.scss:128-140`: focus `0 0 0 2px rgba(38,186,199,.15)`; error `#ef4444` | Shared controls own these states; `focus-visible:outline-2 focus-visible:outline-offset-2` added on manually styled route links | Declared focus outline/token path; interacted states not run |
| Links default/hover/focus | `legacy-styles/components___variables.scss:10-14` accent `#26bac7`, hover `#1e9aa8`, subtle `#eff8fa` | Route links inherit `text-primary-text`, `hover:text-primary-hover`, `hover:bg-primary-subtle` and teal focus outline; checked all changed link cases | SOURCE comparison of semantic token routing only; owner CSS may use accessibility-adjusted shade |
| Phone tappable | `legacy-styles/components___learn-layout.scss:34,361-383`: viewport <=767px and target44px | `min-h-11` (44px), `md:min-h-9` (36px at>=768px), no `sm:` remaining across these 9 touched files | Source MATCH phone/tablet breakpoint and named link/selector targets |
| Table/list hairlines | `old-lms-pages.md:1-12`: one white canvas, 1px border `#e5e9f0`, ordinary table row separators, cards for distinct objects only | Mobile Lesson and Quiz attempts ordinary lists use `divide-y divide-border border-y`; course cards and distinct report tiles remain individual | Source layout closer to old table anatomy; computed element widths/padding/render proof outstanding |
| Status colors | `legacy-styles/components___variables.scss:63-78` success #059669, warning #d97706, error #ef4444, info #26bac7 | Content publication, lesson visibility, quiz answer grade/correctness and results status use shared `StatusBadge` semantic tone | Semantic source match; shared Badge owner to check exact pill geometry |
| Pagination, count, current/disabled | `legacy-styles/components___antddesign.scss:233-280` numeric active/disabled states and phone 44px | Assessments now shared `Pagination page={data.page} pageCount={data.totalPages} hrefForPage={...} showBoundaryLinks={false}`, existing record summary still shown; other pages already use shared Pagination | Source shared nav migration; visual active/focus rendering open |
| Loading/errors/empty | `old-lms-pages.md:7-12` in-canvas states; legacy semantic colors per variables | `college-quiz-attempts` failed/empty/search-miss, learner list unavailable card, assessment `EmptyState`, report `EmptyState`, content report `StatusBadge` all retained | Code branches and shared primitives preserved; live error/no-results render not inspected |
| Keyboard, mobile overflow, reduced-motion | `components___form.scss:23-28` keyboard teal ring; `learn-layout.scss:34` phone wrap | Manual links `focus-visible:outline`, `hover`, `motion-reduce:transition-none` where changed, list wrappers `min-w-0` and internal quiz list `overscroll-contain` | Source rules present, end-to-end keyboard and 320px/375px/768px/1024px screenshots absent |

### Exact source-probe output (9 files on `chatgpt/chat-7-b`)

After writes the nine files were fetched as complete UTF-8 source from the remote branch and scanned, not run as code. Order: live classes, college progress report, college content, assessments, learning directory, quiz attempts, admin overview, learner course list, learner assessments.

| File | Raw native button/input/select/textarea/table | Six-digit hex | Raw overlay/dialog | `sm:` | `md:` | Structural evidence |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| live classes | 0 | 0 | 0 | 0 | 12 | form 1/1, Button 1/1, StatusBadge 1/1, Pagination self-close |
| progress report | 0 | 0 | 0 | 0 | 6 | form 1/1, Button 1/1, shared DataTable and StatTile |
| content aggregate | 0 | 0 | 0 | 0 | 21 | form 1/1, Button 1/1, StatusBadge 1/1, Pagination self-close |
| assessment aggregate | 0 | 0 | 0 | 0 | 17 | form 1/1, Button 1/1, StatusBadge 4/4, Pagination self-close |
| learning directory | 0 | 0 | 0 | 0 | 75 | form 2/2, Button 2/2, StatusBadge 4/4, Pagination self-close |
| quiz attempts | 0 | 0 | 0 | 0 | 6 | Button 4/4, StatusBadge 1/1, shared Disclosure |
| admin course overview | 0 | 0 | 0 | 0 | 9 | form 1/1, Button 1/1, StatusBadge 3/3, Pagination self-close |
| learner course list | 0 | 0 | 0 | 0 | 16 | Button 3/3, Alert 1/1, StatusBadge 3/3, Disclosure 3/3 |
| learner assessment overview | 0 | 0 | 0 | 0 | 27 | Button 5/5, nav 1/1, StatusBadge 4/4, Disclosure 1/1 |

**Regex executed on fetched strings:** `/<(button|input|select|textarea|table)(?=[\\s>])/g`; `/#[A-Fa-f0-9]{6}\\b/g`; `/fixed inset-0|role=["']dialog["']/g`; `/\\bsm:/g`; `/\\bmd:/g`; JSX openings/closings with `/<Tag(?=[\\s>])/g` and `/<\\/Tag>/g`. The source-probe sum across nine paths is **0 raw controls, 0 hex, 0 raw overlays, 0 sm, 189 md**. `Pagination` is self-closing (1 opening, 0 `</Pagination>`) by design; this does not represent an unbalanced tag.

**STRICT TICK RULE:** These nine TSX paths are **source-corrected and source-probed, not fully ticked**. Missing for a full [x]: rendered/computed-value comparisons for every state in each path at old and new breakpoints; full 247+ path area-wide grep/ownership inventory; keyboard/focus/disabled/hover and interaction proof. H1–H6 remain `[ ]`. Do not imply running TSX, lint, typecheck, CI or screenshots. Next source path is `src/components/courses/learner-course-discussion.tsx`, which carries the preserved composer focus contract and needs responsive/state proof.

### Batch 9B — learner discussion/quiz/overview/assessment judgement cases

After the nine-file batch above, four additional learner TSX files were updated with no changes to submission APIs, grading math, or permissions:

| File in `src/components/courses/` | Exact semantic/layout change | Other states kept |
| --- | --- | --- |
| `learner-course-discussion.tsx` | All 11 premature `sm:` overrides migrated to 768px `md:`, including scroll region maximum height, mobile send instructions, composer stacking, jump-to-latest visibility and Send width/height; Send and overlay jump actions now 44px phone and compact 36px at tablet. Partial discussion refresh and older-page errors migrated to shared `Alert` warning/error. | `Textarea` composer ID/ref, Enter/Shift+Enter coarse-pointer behavior, disabled-while-posting, chronological scroll, `role=log`, pinned/edited/removed messages, moderation actions, page retry and no-message state preserved |
| `learner-quiz-attempt.tsx` | Fetch, review and attempt submission-error sentences now shared `Alert tone=error` instead of manual text-only states. Existing primary/secondary controls already `min-h-11 md:min-h-9`. | `PageLoading`, quiz `PageHeader`, question navigation/answer selection, passed deadline warning, review disclosure, `MetricBar`, confirmation, double-submit guard, result visibility and grades untouched |
| `learner-course-overview.tsx` | Unmeasured-course progress nested bordered warning replaced by shared `Alert tone=warning role=status` and title. Recent update category link hover border/text, keyboard focus ring and reduced-motion token states aligned; no duplicated nested canvas. | Recent update list, `ExpandableCourseUpdate`, status badges, `StatTile`, next-course action and section anchor IDs retained |
| `learner-assessment-overview.tsx` | Unavailable quiz class error uses shared `Alert tone=error` with accessible Retry action; closed/missing-deadline assignment state now `Alert tone=warning` (original strong heading+message kept). | `Drawer`, shared `NeedsDoingChips`, filters, list/data table, submission status `StatusBadge`, attempt quiz action, error/empty/overdue gates and pagination preserved |

**Legacy property/state crosswalk**

| Property/state | Legacy exact source | vNext source | Source outcome |
| --- | --- | --- | --- |
| Mobile/tab cutoff | `docs/design/legacy-styles/components___learn-layout.scss:34,379`, <=767px | Discussion now `md:hidden`, `md:flex-row`, `md:max-h`, Send `min-h-11 w-full md:min-h-9 md:w-auto`; other 3 have zero `sm:` | Source breakpoint MATCH; 375px/768px actual render still open |
| 44px mobile action | `components___learn-layout.scss:361-383`, back 44px phone minimum | Discussion Jump/Send 44px at <768, 36px >=768. Quiz previous/next 44px phone. Recent category nav links and retry 44px phone | Source value MATCH for touched actions |
| Alert warning/error default/hover | `components___variables.scss:63-78` warning #d97706, error #ef4444 and semantic 10% background; `old-lms-pages.md:7` narrow inline banner | `src/components/ui/alert.tsx:5-20`: shared `tone=warning/error` palettes. Replaced five local warning/error patterns across four screens, retaining text and role | Semantic-source match; hover/rendered dimensions owned shared alert |
| Form default and focus | `components___form.scss:107-140`: label13px/600, form14px, focus teal 15% halo, error red | Discussion uses shared `Textarea` with stable control ID and existing `onKeyDown`; `src/styles/legacy-skin.css:375-391` enforces labels 13px/600/neutral400 in page canvas | Shared control route MATCH; live focus interaction/keyboard remains untested |
| Quick-view link hover/focus | `components___variables.scss:10-14` accent #26bac7, hover #1e9aa8 and subtle #eff8fa; `components___form.scss:23-28` focus | Three recent category Links use `hover:border-primary hover:bg-primary-subtle hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none` | Token-source mapping, no browser visual proof |
| Distinct course objects vs ordinary notices | `old-lms-pages.md:1-12`: ordinary lists flatten to canvas, only independent objects retain cards | Discussion is one in-canvas message feed; unmeasured progress warning now shared banner, rather than another framed card; quiz questions remain distinct cards | Source anatomy MATCH for changed notice |
| Loading, empty, results, disabled | `old-lms-pages.md:7` semantic in-canvas states; `legacy-styles/components___button.scss:1-90` disabled/hover | Shared `PageLoading`, `Alert`, `Button`, `StatusBadge` paths retained with old API/state callbacks | Static code branch proof; no runtime or screenshot claim |

**Post-write fetched-source regex/proof for these four paths:** `learner-course-discussion`: 688 lines, raw controls 0, hardcoded six-digit hex 0, handrolled overlay 0, `sm:` 0, `md:` 24, `Alert` open/close 3/3, `Button` 13/13, `form` 1/1. `learner-quiz-attempt`: 573 lines, raw 0/hex 0/overlay 0/`sm:`0, `md:`16, `Alert` 6/6, `Button`12/12. `learner-course-overview`: 489 lines, raw/hex/overlay/`sm:` all 0, `md:`17, `Alert`1/1. `learner-assessment-overview`: 721 lines, raw/hex/overlay/`sm:` all 0, `md:`27, `Alert`2/2, `Button`5/5. All checks scanned complete remote source strings, not local `rg`, executed TypeScript or a JSX parser. The four-file source total is **0 raw controls/hex/overlays/sm, 84 md**.

**STRICT TICK:** Four files remain source-corrected but unchecked for *finished pixel parity*, because computed hover/disabled/focus and per-breakpoint phone/tablet screenshots are still missing and full-area source inventory is incomplete. H1–H6 remain `[ ]`. This is deliberate under `docs/design/ui-clone-checklist.md` STRICT TICK RULE. No CI, tests, build or app run.

**Next exact unticked file:** `src/components/courses/learner-course-workspace.tsx` (1020-line lesson/resource course shell; review deep nested lesson cards, content-status rows, pending/error/empty and @768px breakpoint before any edit), followed by `src/components/courses/learner-course-attendance.tsx`.

### Batch 9C — learner roadmap, Super Admin content and College content authoring

Six additional source files were edited and re-read in full after synchronizing concurrent main. Existing modules, vNext page contents, section order, permissions, mutations and labels were intentionally preserved.

| File in `src/components/courses/` | Concrete visual/state work | Required state and responsive mapping |
| --- | --- | --- |
| `learner-course-workspace.tsx` | Roadmap Back/Previous/Next lesson links now >=44px on phone, focus-visible ring/hover foreground, 36px from tablet; mobile Jump to Lesson links get teal-subtle hover and focus ring. Removed nested bordered empty-content message in lesson pane and normalized shared neutral `Badge` JSX spacing. Missed quiz now shared `Alert tone=warning`; recorded attempt now shared success `StatusBadge`, preserving release messaging. | `min-h-11 md:min-h-9`; existing 768px phone `Disclosure`/desktop Tabs, role-status alerts, lesson index, aria progress, historical/read-only lessons and authenticated navigation unchanged |
| `super-admin-content-directory-page.tsx` | Removed five redundant `PageHeader eyebrow="Super Admin · Courses"` props (owner page-head spec prohibits eyebrow); invalid filters/loading retry and edit actions 44px phone with hover/focus; Filter action 44px until 768px. | Shared `PageHeader` in normal, invalid, no-college, forbidden and unavailable states; existing `Banner`, `EmptyState`, `ErrorState`, `Pagination`, audience/status `StatusBadge`, no media leak; filter/CSV action state retained |
| `super-admin-content-actions.tsx` | Edit uses secondary outlined variant, Publish stays primary, destructive Delete uses danger variant rather than red text forced onto secondary; ordinary metadata edit panel loses extra nested card (flat `border-t`/hairline). | Form fields and save action stay shared `Input`/`Select`/`Textarea`/`Button`; 44px phone/36px desktop, archived read-only, busy/disabled, confirm and success/error `Alert` intact |
| `super-admin-lesson-bulk-visibility.tsx` | Bulk result custom gray framed notice replaced with shared `Alert tone=success` on full success or `tone=warning` when failures exist. | Preserves changed/unchanged/failed values, failure list, scrolled checkbox selection, 44px buttons, service calls and partial error reporting |
| `super-admin-course-bulk-visibility.tsx` | Corrected bulk action hierarchy (Show students = primary, Hide = outlined secondary). Results use shared success/warning `Alert` depending on failures or no eligible lessons; retry remains inside notice. | `min-h-11 md:min-h-9`, selected checkboxes, pending-disable, failure retry and API scope/version semantics unchanged |
| `college-content-authoring-control.tsx` | Refreshed against latest main: removed independent rounded canvas (flat section hairline), 9 authoring fields + 3 catalogue selectors 44px phone/36px tablet, 9 authoring labels + 3 search labels use global 13px/600 skin, New/Save/Cancel/Order/Materials/Edit/Publish/Delete 44px phone, outlined secondary and danger variants; full-row responsive action wrap; keyboard focus on third-party resource link; inline error/success migrated to shared `Alert`. | Full 3-content-kind form (`YOUTUBE`, `RESOURCE`, `LIVE_CLASS`) retains time-zone conversion, publisher status, notes, order, private materials, editing guard, disabled states, truncation, no matches and REST handling. All 9 native authorship `className="mt-1"` control bindings now `mt-1 min-h-11 md:min-h-9` |

**Legacy exact property crosswalk for these six files**

| Property / state | Old LMS exact rule | Current vNext mapping | Source judgement |
| --- | --- | --- | --- |
| Page title row, no eyebrow | `docs/design/old-lms-pages.md:1-12`: single large heading and inline small description/actions in one canvas; no eyebrow | Super Admin directory has five conditional `PageHeader` render paths and zero `eyebrow` after edits | MATCH source hierarchy; rendered alignment pending |
| Card count & separators | `old-lms-pages.md:1,6,9` ordinary filters/lists live directly on one white 12px canvas, hairlines `#e5e9f0`; cards only for distinct objects | Admin content metadata editor `border-t border-border pt-3`; college content editor `border-b`; learner empty-content line `border-t`; independent lessons retain cards | MATCH affected nesting in source |
| Buttons default, hover, active, danger, disabled | `master-queue.md:4-9`: primary solid `#0a7c88` white, radius9, 36px, 14px/650, hover `#086873`; secondary outlined; danger separate | Shared `Button variant="primary/secondary/danger"`, no local `text-error` override on Delete; `--lms-control-height:36px`, radius9px inherited; busy props retained | Semantic source route MATCH; exact browser state pixel proof OPEN |
| Label font/field backgrounds | `components___form.scss:107-132`: 13px/600 neutral-400 `#a9a7ae`, input 14px, background `#fbfcfd`, 10px radius | `src/styles/legacy-skin.css:375-391` forces label 13px/600/neutral-400; 9 fields + 3 selectors inherit global shared skins with no page-local border/rounded/bg overrides | MATCH global-skin value path; computed padding/error/focus proof OPEN |
| Phone/tablet sizing | `components___learn-layout.scss:34,361-383`: phone maximum767px and 44px back/action touch targets | `min-h-11` below768 and `md:min-h-9` above; no `sm:` in six files; mobile links wrap and lesson jump indexed; 768px+ form 2 columns | SOURCE MATCH responsive class contract; actual viewport check OPEN |
| Warning, error, success and status | `components___variables.scss:63-78`: success #059669, warning #d97706, error #ef4444 and pale background | `Alert tone=warning/success/error` for quiz deadline/missed, failed batch, success, metadata errors; `StatusBadge tone=success` completed attempt | Semantic source skin MATCH; exact alert/states render OPEN |
| Focus and hover | `components___form.scss:23-28,125-138`: visible teal focus shadow and color; `components___variables.scss:10-14` teal accent/subtle | Roadmap navigation and external links `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary` and teal hover; controls via shared skins | Correct source token path; keyboard traversal OPEN |

**Scoped grep proof, post-write exact fetched files (not a local executable `rg`):**

| File | Raw controls/table | Hex | Handmade modal | `sm:` | `md:` | Tag consistency |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| learner roadmap | 0 | 0 | 0 | 0 | 10 | Alert 5/5, Button 1/1 |
| Super Admin content directory | 0 | 0 | 0 | 0 | 11 | PageHeader 5 conditional occurrences, form 1/1, Button 1/1, no eyebrow |
| Super Admin content actions | 0 | 0 | 0 | 0 | 11 | Alert 2/2, Button 4/4 |
| Super Admin bulk lessons | 0 | 0 | 0 | 0 | 5 | Alert 2/2, Button 2/2 |
| Super Admin bulk courses | 0 | 0 | 0 | 0 | 3 | Alert 2/2, Button 3/3 |
| College content editor | 0 | 0 | 0 | 0 | 26 | Alert 2/2, Button 8/8 |

Regex on fully fetched UTF-8 source: `/<(button|input|select|textarea|table)(?=[\\s>])/g`, `/#[0-9a-fA-F]{6}\\b/g`, `/fixed inset-0|role=["']dialog["']/g`, `/\\bsm:/g`, `/\\bmd:/g`; JSX openings/closings counted by tag for the structural rows. Aggregate six-path source totals **0 raw, 0 hex, 0 hand-rolled modal, 0 sm, 66 md**. No application compilation, no CI, no browser and no runtime tests.

**STRICT-TICK STATUS:** H1–H6 remain `[ ]`. Source code migration and tables are complete for the six named files, but this does **not** prove pixel-level default/hover/focus/disabled/loading/error state parity until computed-value/screenshot checks and full-area grep against refreshed inventory happen. Shared skin and global Button/Alert ownership belong to chat-17/chat-5; no other lane code was altered.

**Next exact unticked file:** `src/components/courses/learner-course-attendance.tsx` (376 lines; calendar month controls/table/status pill responsive and value proof), followed by `src/components/courses/learner-course-state-retry.tsx` and the learner live-session status file.
