# NORTH STAR visual sweep — chat-7

Branch: `chatgpt/chat-7-b`; commit prefix `[chat-7]`. Source of truth: owner NORTH STAR in `docs/orchestrator/queues/master-queue.md`, `docs/design/old-lms-shell-spec.md`, `old-lms-shell.css`, `old-lms-pages.md`, `vnext-vs-old-lms-gap.md`, and SCSS under `docs/design/legacy-styles/`.

## Scope / inventory (created before changing UI)

- Learner portal routes: **135** files
- Super Admin course and content routes: **28** files
- Learner course components: **18** files
- Super Admin course/content components: **16** files
- Shared course assignment/progress controls used on learner routes: **8** files
- Other learner-facing UI components: **51** files

All paths below are tracked for visual audit; an unchanged file may legitimately have no local style overrides. All error/loading states remain accessible. Do **not** change page content, wording, UI behaviour, or data fetching.

### Learner portal routes

- `src/app/(authenticated)/learn/allAssignments/[assignmentId]/error.tsx`
- `src/app/(authenticated)/learn/allAssignments/[assignmentId]/loading.tsx`
- `src/app/(authenticated)/learn/allAssignments/[assignmentId]/page.tsx`
- `src/app/(authenticated)/learn/allAssignments/error.tsx`
- `src/app/(authenticated)/learn/allAssignments/loading.tsx`
- `src/app/(authenticated)/learn/allAssignments/page.tsx`
- `src/app/(authenticated)/learn/allQuizzes/[quizId]/error.tsx`
- `src/app/(authenticated)/learn/allQuizzes/[quizId]/loading.tsx`
- `src/app/(authenticated)/learn/allQuizzes/[quizId]/page.tsx`
- `src/app/(authenticated)/learn/allQuizzes/error.tsx`
- `src/app/(authenticated)/learn/allQuizzes/loading.tsx`
- `src/app/(authenticated)/learn/allQuizzes/page.tsx`
- `src/app/(authenticated)/learn/assignments/error.tsx`
- `src/app/(authenticated)/learn/assignments/loading.tsx`
- `src/app/(authenticated)/learn/assignments/page.tsx`
- `src/app/(authenticated)/learn/attendance/calendar/error.tsx`
- `src/app/(authenticated)/learn/attendance/calendar/loading.tsx`
- `src/app/(authenticated)/learn/attendance/calendar/page.tsx`
- `src/app/(authenticated)/learn/attendance/error.tsx`
- `src/app/(authenticated)/learn/attendance/loading.tsx`
- `src/app/(authenticated)/learn/attendance/page.tsx`
- `src/app/(authenticated)/learn/calendar/error.tsx`
- `src/app/(authenticated)/learn/calendar/loading.tsx`
- `src/app/(authenticated)/learn/calendar/page.tsx`
- `src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/error.tsx`
- `src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/loading.tsx`
- `src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/not-found.tsx`
- `src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx`
- `src/app/(authenticated)/learn/courses/[deliveryId]/attendance-summary/error.tsx`
- `src/app/(authenticated)/learn/courses/[deliveryId]/attendance-summary/loading.tsx`
- `src/app/(authenticated)/learn/courses/[deliveryId]/attendance-summary/page.tsx`
- `src/app/(authenticated)/learn/courses/[deliveryId]/error.tsx`
- `src/app/(authenticated)/learn/courses/[deliveryId]/loading.tsx`
- `src/app/(authenticated)/learn/courses/[deliveryId]/page.tsx`
- `src/app/(authenticated)/learn/courses/[deliveryId]/progress/error.tsx`
- `src/app/(authenticated)/learn/courses/[deliveryId]/progress/loading.tsx`
- `src/app/(authenticated)/learn/courses/[deliveryId]/progress/page.tsx`
- `src/app/(authenticated)/learn/courses/error.tsx`
- `src/app/(authenticated)/learn/courses/loading.tsx`
- `src/app/(authenticated)/learn/courses/page.tsx`
- `src/app/(authenticated)/learn/error.tsx`
- `src/app/(authenticated)/learn/layout.tsx`
- `src/app/(authenticated)/learn/loading.tsx`
- `src/app/(authenticated)/learn/my-placements/announcements/error.tsx`
- `src/app/(authenticated)/learn/my-placements/announcements/loading.tsx`
- `src/app/(authenticated)/learn/my-placements/announcements/page.tsx`
- `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/company/error.tsx`
- `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/company/loading.tsx`
- `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/company/page.tsx`
- `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/error.tsx`
- `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/error.tsx`
- `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/loading.tsx`
- `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx`
- `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/loading.tsx`
- `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/page.tsx`
- `src/app/(authenticated)/learn/my-placements/applications/error.tsx`
- `src/app/(authenticated)/learn/my-placements/applications/loading.tsx`
- `src/app/(authenticated)/learn/my-placements/applications/page.tsx`
- `src/app/(authenticated)/learn/my-placements/assessments/error.tsx`
- `src/app/(authenticated)/learn/my-placements/assessments/loading.tsx`
- `src/app/(authenticated)/learn/my-placements/assessments/page.tsx`
- `src/app/(authenticated)/learn/my-placements/assessments/results/error.tsx`
- `src/app/(authenticated)/learn/my-placements/assessments/results/loading.tsx`
- `src/app/(authenticated)/learn/my-placements/assessments/results/page.tsx`
- `src/app/(authenticated)/learn/my-placements/calendar/error.tsx`
- `src/app/(authenticated)/learn/my-placements/calendar/loading.tsx`
- `src/app/(authenticated)/learn/my-placements/calendar/page.tsx`
- `src/app/(authenticated)/learn/my-placements/error.tsx`
- `src/app/(authenticated)/learn/my-placements/interviews/error.tsx`
- `src/app/(authenticated)/learn/my-placements/interviews/loading.tsx`
- `src/app/(authenticated)/learn/my-placements/interviews/page.tsx`
- `src/app/(authenticated)/learn/my-placements/jobs/[jobId]/error.tsx`
- `src/app/(authenticated)/learn/my-placements/jobs/[jobId]/loading.tsx`
- `src/app/(authenticated)/learn/my-placements/jobs/[jobId]/page.tsx`
- `src/app/(authenticated)/learn/my-placements/jobs/error.tsx`
- `src/app/(authenticated)/learn/my-placements/jobs/loading.tsx`
- `src/app/(authenticated)/learn/my-placements/jobs/page.tsx`
- `src/app/(authenticated)/learn/my-placements/layout.tsx`
- `src/app/(authenticated)/learn/my-placements/loading.tsx`
- `src/app/(authenticated)/learn/my-placements/notification-preferences/error.tsx`
- `src/app/(authenticated)/learn/my-placements/notification-preferences/loading.tsx`
- `src/app/(authenticated)/learn/my-placements/notification-preferences/page.tsx`
- `src/app/(authenticated)/learn/my-placements/offers/error.tsx`
- `src/app/(authenticated)/learn/my-placements/offers/loading.tsx`
- `src/app/(authenticated)/learn/my-placements/offers/page.tsx`
- `src/app/(authenticated)/learn/my-placements/page.tsx`
- `src/app/(authenticated)/learn/my-placements/placement/error.tsx`
- `src/app/(authenticated)/learn/my-placements/placement/loading.tsx`
- `src/app/(authenticated)/learn/my-placements/placement/page.tsx`
- `src/app/(authenticated)/learn/my-placements/preparation/error.tsx`
- `src/app/(authenticated)/learn/my-placements/preparation/loading.tsx`
- `src/app/(authenticated)/learn/my-placements/preparation/page.tsx`
- `src/app/(authenticated)/learn/my-placements/rules/error.tsx`
- `src/app/(authenticated)/learn/my-placements/rules/loading.tsx`
- `src/app/(authenticated)/learn/my-placements/rules/page.tsx`
- `src/app/(authenticated)/learn/my-placements/schedule/error.tsx`
- `src/app/(authenticated)/learn/my-placements/schedule/loading.tsx`
- `src/app/(authenticated)/learn/my-placements/schedule/page.tsx`
- `src/app/(authenticated)/learn/my-placements/support/error.tsx`
- `src/app/(authenticated)/learn/my-placements/support/loading.tsx`
- `src/app/(authenticated)/learn/my-placements/support/page.tsx`
- `src/app/(authenticated)/learn/not-found.tsx`
- `src/app/(authenticated)/learn/notifications/error.tsx`
- `src/app/(authenticated)/learn/notifications/history/error.tsx`
- `src/app/(authenticated)/learn/notifications/history/loading.tsx`
- `src/app/(authenticated)/learn/notifications/history/page.tsx`
- `src/app/(authenticated)/learn/notifications/loading.tsx`
- `src/app/(authenticated)/learn/notifications/page.tsx`
- `src/app/(authenticated)/learn/page.tsx`
- `src/app/(authenticated)/learn/placements/error.tsx`
- `src/app/(authenticated)/learn/placements/loading.tsx`
- `src/app/(authenticated)/learn/placements/page.tsx`
- `src/app/(authenticated)/learn/profile/academic-record/error.tsx`
- `src/app/(authenticated)/learn/profile/academic-record/loading.tsx`
- `src/app/(authenticated)/learn/profile/academic-record/page.tsx`
- `src/app/(authenticated)/learn/profile/completeness/error.tsx`
- `src/app/(authenticated)/learn/profile/completeness/loading.tsx`
- `src/app/(authenticated)/learn/profile/completeness/page.tsx`
- `src/app/(authenticated)/learn/profile/data-access/page.tsx`
- `src/app/(authenticated)/learn/profile/error.tsx`
- `src/app/(authenticated)/learn/profile/loading.tsx`
- `src/app/(authenticated)/learn/profile/page.tsx`
- `src/app/(authenticated)/learn/profile/verification/error.tsx`
- `src/app/(authenticated)/learn/profile/verification/loading.tsx`
- `src/app/(authenticated)/learn/profile/verification/page.tsx`
- `src/app/(authenticated)/learn/projects/[projectId]/error.tsx`
- `src/app/(authenticated)/learn/projects/[projectId]/loading.tsx`
- `src/app/(authenticated)/learn/projects/[projectId]/not-found.tsx`
- `src/app/(authenticated)/learn/projects/[projectId]/page.tsx`
- `src/app/(authenticated)/learn/projects/error.tsx`
- `src/app/(authenticated)/learn/projects/loading.tsx`
- `src/app/(authenticated)/learn/projects/page.tsx`
- `src/app/(authenticated)/learn/quizzes/error.tsx`
- `src/app/(authenticated)/learn/quizzes/loading.tsx`
- `src/app/(authenticated)/learn/quizzes/page.tsx`

### Super Admin course and content routes

- `src/app/(authenticated)/admin/assignments/error.tsx`
- `src/app/(authenticated)/admin/assignments/loading.tsx`
- `src/app/(authenticated)/admin/assignments/page.tsx`
- `src/app/(authenticated)/admin/course-progress/error.tsx`
- `src/app/(authenticated)/admin/course-progress/loading.tsx`
- `src/app/(authenticated)/admin/course-progress/page.tsx`
- `src/app/(authenticated)/admin/course-progress/students/page.tsx`
- `src/app/(authenticated)/admin/courses/error.tsx`
- `src/app/(authenticated)/admin/courses/loading.tsx`
- `src/app/(authenticated)/admin/courses/offerings/[offeringId]/error.tsx`
- `src/app/(authenticated)/admin/courses/offerings/[offeringId]/loading.tsx`
- `src/app/(authenticated)/admin/courses/offerings/[offeringId]/page.tsx`
- `src/app/(authenticated)/admin/courses/page.tsx`
- `src/app/(authenticated)/admin/lessons/error.tsx`
- `src/app/(authenticated)/admin/lessons/loading.tsx`
- `src/app/(authenticated)/admin/lessons/page.tsx`
- `src/app/(authenticated)/admin/live-classes/error.tsx`
- `src/app/(authenticated)/admin/live-classes/loading.tsx`
- `src/app/(authenticated)/admin/live-classes/page.tsx`
- `src/app/(authenticated)/admin/quizzes/error.tsx`
- `src/app/(authenticated)/admin/quizzes/loading.tsx`
- `src/app/(authenticated)/admin/quizzes/page.tsx`
- `src/app/(authenticated)/admin/resources/error.tsx`
- `src/app/(authenticated)/admin/resources/loading.tsx`
- `src/app/(authenticated)/admin/resources/page.tsx`
- `src/app/(authenticated)/admin/videos/error.tsx`
- `src/app/(authenticated)/admin/videos/loading.tsx`
- `src/app/(authenticated)/admin/videos/page.tsx`

### Learner course components

- `src/components/courses/learner-assessment-overview.tsx`
- `src/components/courses/learner-course-attendance.tsx`
- `src/components/courses/learner-course-card-image.tsx`
- `src/components/courses/learner-course-discussion.tsx`
- `src/components/courses/learner-course-document-title.tsx`
- `src/components/courses/learner-course-list.tsx`
- `src/components/courses/learner-course-overview.tsx`
- `src/components/courses/learner-course-state-retry.tsx`
- `src/components/courses/learner-course-tabs.tsx`
- `src/components/courses/learner-course-workspace.tsx`
- `src/components/courses/learner-formatted-response.tsx`
- `src/components/courses/learner-live-class-link.tsx`
- `src/components/courses/learner-live-session-status.tsx`
- `src/components/courses/learner-quiz-attempt.tsx`
- `src/components/courses/learner-rich-response-editor.tsx`
- `src/components/courses/learner-roadmap-item-dialog.tsx`
- `src/components/courses/learner-video-player.tsx`
- `src/components/courses/learner-youtube-player.tsx`

### Super Admin course/content components

- `src/components/courses/admin-assessment-read-directory.tsx`
- `src/components/courses/admin-course-actions.tsx`
- `src/components/courses/admin-course-create-panel.tsx`
- `src/components/courses/admin-course-display-editor.tsx`
- `src/components/courses/admin-course-overview.tsx`
- `src/components/courses/admin-learning-structure-actions.tsx`
- `src/components/courses/admin-offering-learning-overview.tsx`
- `src/components/courses/admin-offering-learning-page.tsx`
- `src/components/courses/admin-offering-section-preview.tsx`
- `src/components/courses/admin-offering-teachers-panel.tsx`
- `src/components/courses/super-admin-content-actions.tsx`
- `src/components/courses/super-admin-content-authoring.tsx`
- `src/components/courses/super-admin-content-directory-page.tsx`
- `src/components/courses/super-admin-course-bulk-visibility.tsx`
- `src/components/courses/super-admin-lesson-bulk-visibility.tsx`
- `src/components/courses/super-admin-lesson-create.tsx`

### Shared course assignment/progress controls used on learner routes

- `src/components/courses/assignment-file-open-control.tsx`
- `src/components/courses/assignment-file-submission-control.tsx`
- `src/components/courses/assignment-multipart-parts-editor.tsx`
- `src/components/courses/assignment-submission-control.tsx`
- `src/components/courses/assignment-submission-links.tsx`
- `src/components/courses/lesson-resource-materials-control.tsx`
- `src/components/courses/quiz-attempt-control.tsx`
- `src/components/courses/resource-progress-control.tsx`

### Other learner-facing UI components

- `src/components/academics/learner-class-schedule.tsx`
- `src/components/activity/learner-notifications-inbox.tsx`
- `src/components/admin/learner-module-access-drawer.tsx`
- `src/components/admin/super-admin-learning-filter-fields.tsx`
- `src/components/attendance/learner-attendance-workspace.tsx`
- `src/components/placements/learner-application-detail-withdraw.tsx`
- `src/components/placements/learner-applications-browse.tsx`
- `src/components/placements/learner-career-calendar.tsx`
- `src/components/placements/learner-career-rounds-workspace.tsx`
- `src/components/placements/learner-career-rounds.tsx`
- `src/components/placements/learner-general-requests.tsx`
- `src/components/placements/learner-interview-withdrawal-request.tsx`
- `src/components/placements/learner-jobs-browse.tsx`
- `src/components/placements/learner-own-drive-journey.tsx`
- `src/components/placements/learner-placement-academic-evidence.tsx`
- `src/components/placements/learner-placement-alert-action.tsx`
- `src/components/placements/learner-placement-alerts.tsx`
- `src/components/placements/learner-placement-job-detail.tsx`
- `src/components/placements/learner-placement-jobs.tsx`
- `src/components/placements/learner-placement-journey.tsx`
- `src/components/placements/learner-placement-notification-settings.tsx`
- `src/components/placements/learner-placement-offers.tsx`
- `src/components/placements/learner-placement-partial-alert.tsx`
- `src/components/placements/learner-placement-preferences.tsx`
- `src/components/placements/learner-placement-registration.tsx`
- `src/components/placements/learner-placement-requests.tsx`
- `src/components/placements/learner-placements-dashboard.tsx`
- `src/components/placements/learner-placements-tabs.tsx`
- `src/components/placements/learner-prep-assignment-cards.tsx`
- `src/components/placements/learner-recent-placement-activity.tsx`
- `src/components/placements/learner-round-confirm-attendance.tsx`
- `src/components/placements/learner-save-drive-button.tsx`
- `src/components/placements/learner-schedule-reschedule.tsx`
- `src/components/placements/learner-support-cancel.tsx`
- `src/components/profile/learner-profile-academic-retry.tsx`
- `src/components/profile/learner-profile-workspace.tsx`
- `src/components/profile/learner-skill-catalog-input.tsx`
- `src/components/profile/learner-verification-live-refresh.tsx`
- `src/components/profile/learner-verification-submit.tsx`
- `src/components/profile/learner-verification-withdraw.tsx`
- `src/components/projects/learner-board-interactive.tsx`
- `src/components/projects/learner-board-task-detail-dialog.tsx`
- `src/components/projects/learner-board-task-index.tsx`
- `src/components/projects/learner-own-task-controls.tsx`
- `src/components/projects/learner-project-activity.tsx`
- `src/components/projects/learner-project-board-search.tsx`
- `src/components/projects/learner-project-goals.tsx`
- `src/components/projects/learner-project-mobile-filters.tsx`
- `src/components/projects/learner-project-tabs.tsx`
- `src/components/projects/learner-task-progress-control.tsx`
- `src/components/projects/learner-task-status-actions.tsx`

## Sweep checklist

- [ ] Remove per-page outer containers/panels that visibly compete with shared `PageCanvas`; retain cards for truly separate content objects and keep page sections/forms/tables in their existing order.
- [ ] Use inherited Inter and legacy shared semantic tokens for primary actions, hover/focus, text, surfaces, borders, shadows and radii. Primary buttons: #0a7c88 background and white text; 36px height, 9px radius, 14px/650.
- [ ] H1: 30px/600 `#172033` via semantic shared heading typography; preserve smaller headings' hierarchy.
- [ ] Use the shared UI kit rather than hard-coded local button/input/card shells whenever safe; preserve native controls' names/IDs, events, loading/disabled and keyboard behaviours.
- [ ] Preserve responsive mobile touch targets and no CI/test execution under this lane brief. Static syntax hygiene only.
- [ ] Inspect non-Tailwind inline styles and warnings separately, not by broad textual substitutions that might change behaviours.

## Ownership boundaries

Do not edit shared `src/app/globals.css`, `src/components/ui/**`, `src/components/shell/**`, `src/app/layout.tsx` (chat-17/19/13 own these). Course components prefixed `faculty-` or `college-`, as well as placements/projects component implementations, are owned by other lanes and should be documented / escalated rather than force-edit them during this scope.

## Progress log

- Inventory created against latest main tree after fast-forwarding chat-7 branch to main.
- UI edits: in progress. 131 distinct files listed in the six completed visual batches have direct old-LMS visual edits committed; continue auditing all remaining inventory entries.


## Completed visual edits — 2026-10-19 (first sweep batch)

- [x] `src/components/courses/admin-offering-section-preview.tsx`
- [x] `src/components/courses/admin-course-actions.tsx`
- [x] `src/components/courses/admin-course-overview.tsx`
- [x] `src/components/courses/admin-course-create-panel.tsx`
- [x] `src/components/courses/learner-course-attendance.tsx`
- [x] `src/components/courses/learner-course-list.tsx`
- [x] `src/components/courses/super-admin-course-bulk-visibility.tsx`
- [x] `src/components/courses/super-admin-lesson-bulk-visibility.tsx`
- [x] `src/components/courses/admin-offering-learning-overview.tsx`
- [x] `src/components/courses/learner-course-tabs.tsx`
- [x] `src/components/courses/learner-quiz-attempt.tsx`
- [x] `src/components/courses/assignment-submission-control.tsx`
- [x] `src/components/courses/lesson-resource-materials-control.tsx`
- [x] `src/components/courses/super-admin-content-directory-page.tsx`
- [x] `src/components/courses/learner-assessment-overview.tsx`
- [x] `src/components/courses/learner-course-workspace.tsx`
- [x] `src/components/courses/admin-assessment-read-directory.tsx`
- [x] `src/components/courses/admin-offering-teachers-panel.tsx`
- [x] `src/components/courses/super-admin-content-actions.tsx`
- [x] `src/components/courses/admin-offering-learning-page.tsx`
- [x] `src/components/courses/learner-course-discussion.tsx`
- [x] `src/components/courses/learner-live-class-link.tsx`
- [x] `src/components/courses/learner-course-state-retry.tsx`
- [x] `src/app/(authenticated)/admin/course-progress/page.tsx`
- [x] `src/app/(authenticated)/admin/lessons/page.tsx`
- [x] `src/app/(authenticated)/admin/quizzes/page.tsx`
- [x] `src/app/(authenticated)/admin/assignments/page.tsx`

Changes include 9px semantic control radii, 36px desktop / 44px mobile touch heights, teal-white primary actions and tab focus treatments, input focus rings, 12px card radii for distinct objects, and removal of redundant outer surface wrappers. Course Progress filter button's malformed doubled-radius class was fixed. Individual course/lesson object cards remain distinct; page data, section order, wording, and actions are unchanged. Static JSX closing-tag spot checks performed on modified source text; no code execution, typecheck, tests, or CI performed. Remaining inventory is not claimed complete.

## Completed visual edits — continued batch (35 files)

- [x] `src/components/courses/assignment-multipart-parts-editor.tsx`
- [x] `src/components/courses/quiz-attempt-control.tsx`
- [x] `src/components/courses/learner-video-player.tsx`
- [x] `src/components/courses/learner-youtube-player.tsx`
- [x] `src/components/courses/assignment-file-submission-control.tsx`
- [x] `src/components/courses/assignment-file-open-control.tsx`
- [x] `src/components/courses/super-admin-content-authoring.tsx`
- [x] `src/components/courses/admin-learning-structure-actions.tsx`
- [x] `src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx`
- [x] `src/app/(authenticated)/learn/courses/[deliveryId]/progress/page.tsx`
- [x] `src/app/(authenticated)/learn/courses/[deliveryId]/attendance-summary/page.tsx`
- [x] `src/app/(authenticated)/learn/allAssignments/[assignmentId]/page.tsx`
- [x] `src/app/(authenticated)/learn/allQuizzes/[quizId]/page.tsx`
- [x] `src/app/(authenticated)/learn/attendance/page.tsx`
- [x] `src/app/(authenticated)/learn/calendar/page.tsx`
- [x] `src/components/profile/learner-profile-workspace.tsx`
- [x] `src/components/profile/learner-skill-catalog-input.tsx`
- [x] `src/components/profile/learner-verification-submit.tsx`
- [x] `src/components/activity/learner-notifications-inbox.tsx`
- [x] `src/components/academics/learner-class-schedule.tsx`
- [x] `src/components/attendance/learner-attendance-workspace.tsx`
- [x] `src/app/(authenticated)/learn/profile/page.tsx`
- [x] `src/app/(authenticated)/learn/profile/academic-record/page.tsx`
- [x] `src/app/(authenticated)/learn/profile/completeness/page.tsx`
- [x] `src/app/(authenticated)/learn/profile/verification/page.tsx`
- [x] `src/app/(authenticated)/learn/notifications/history/page.tsx`
- [x] `src/app/(authenticated)/learn/attendance/calendar/page.tsx`
- [x] `src/app/(authenticated)/learn/courses/error.tsx`
- [x] `src/app/(authenticated)/learn/allQuizzes/error.tsx`
- [x] `src/app/(authenticated)/learn/allAssignments/error.tsx`
- [x] `src/app/(authenticated)/learn/allAssignments/[assignmentId]/error.tsx`
- [x] `src/app/(authenticated)/learn/allQuizzes/[quizId]/error.tsx`
- [x] `src/app/(authenticated)/learn/attendance/error.tsx`
- [x] `src/app/(authenticated)/learn/calendar/error.tsx`
- [x] `src/app/(authenticated)/learn/profile/error.tsx`

Additional controls now use semantic colors/radii and mobile touch targets; learner quiz/assignment detail links no longer use raw teal aliases, and one course-workspace back link no longer renders white text on a white button. Attendance/calendar and profile pages shed redundant shell-like filter/intro cards. Eight learner error pages now use the shared outer canvas instead of nesting another full-page white card. Loading/error routes that delegate to shared graceful components were inspected without altering shared ownership files. Static edited-source JSX close-tag checks only; project tests, typecheck, execution, and CI not run. The rest of the inventory remains for follow-on audit.

## Completed visual edits — continued learner routes and fallbacks (33 files)

- [x] `src/app/(authenticated)/learn/profile/completeness/error.tsx`
- [x] `src/app/(authenticated)/learn/profile/verification/error.tsx`
- [x] `src/app/(authenticated)/learn/attendance/calendar/error.tsx`
- [x] `src/app/(authenticated)/learn/notifications/error.tsx`
- [x] `src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/not-found.tsx`
- [x] `src/app/(authenticated)/learn/profile/loading.tsx`
- [x] `src/app/(authenticated)/learn/allAssignments/loading.tsx`
- [x] `src/app/(authenticated)/learn/allQuizzes/loading.tsx`
- [x] `src/components/profile/learner-verification-withdraw.tsx`
- [x] `src/components/courses/learner-roadmap-item-dialog.tsx`
- [x] `src/app/(authenticated)/learn/my-placements/page.tsx`
- [x] `src/app/(authenticated)/learn/my-placements/jobs/page.tsx`
- [x] `src/app/(authenticated)/learn/my-placements/applications/page.tsx`
- [x] `src/app/(authenticated)/learn/my-placements/offers/page.tsx`
- [x] `src/app/(authenticated)/learn/my-placements/notification-preferences/page.tsx`
- [x] `src/app/(authenticated)/learn/my-placements/preparation/page.tsx`
- [x] `src/app/(authenticated)/learn/my-placements/support/page.tsx`
- [x] `src/app/(authenticated)/learn/projects/[projectId]/page.tsx`
- [x] `src/app/(authenticated)/learn/my-placements/announcements/page.tsx`
- [x] `src/app/(authenticated)/learn/my-placements/assessments/page.tsx`
- [x] `src/app/(authenticated)/learn/my-placements/assessments/results/page.tsx`
- [x] `src/app/(authenticated)/learn/my-placements/placement/page.tsx`
- [x] `src/app/(authenticated)/learn/my-placements/rules/page.tsx`
- [x] `src/app/(authenticated)/learn/my-placements/schedule/page.tsx`
- [x] `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/page.tsx`
- [x] `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/company/page.tsx`
- [x] `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx`
- [x] `src/app/(authenticated)/learn/projects/[projectId]/error.tsx`
- [x] `src/app/(authenticated)/learn/my-placements/error.tsx`
- [x] `src/app/(authenticated)/learn/my-placements/announcements/error.tsx`
- [x] `src/app/(authenticated)/learn/my-placements/preparation/error.tsx`
- [x] `src/app/(authenticated)/learn/my-placements/support/error.tsx`
- [x] `src/app/(authenticated)/learn/projects/error.tsx`

Retained learner placements/projects data, behavior, and page contents while aligning local link colors, buttons, warning banners, 9px control corners, and exception/skeleton states. Removed duplicated page-size cards within the authenticated white canvas. Normalized verification action styling and profile skill input focus. The extra touches to previously marked files reflect continued file-by-file polish. The remainder of the inventory is still open. No app execution, CI, lint, typecheck, tests or deployment; edited JSX closing-tag string checks only.

## Completed visual edits — latest lane continuation (27 files)

- [x] `src/components/courses/learner-rich-response-editor.tsx`
- [x] `src/components/admin/super-admin-learning-filter-fields.tsx`
- [x] `src/components/courses/super-admin-lesson-create.tsx`
- [x] `src/components/courses/learner-live-session-status.tsx`
- [x] `src/components/placements/learner-application-detail-withdraw.tsx`
- [x] `src/components/placements/learner-applications-browse.tsx`
- [x] `src/components/placements/learner-career-calendar.tsx`
- [x] `src/components/placements/learner-jobs-browse.tsx`
- [x] `src/components/placements/learner-general-requests.tsx`
- [x] `src/components/placements/learner-interview-withdrawal-request.tsx`
- [x] `src/components/placements/learner-own-drive-journey.tsx`
- [x] `src/components/placements/learner-placement-alert-action.tsx`
- [x] `src/components/placements/learner-placement-alerts.tsx`
- [x] `src/components/placements/learner-placement-job-detail.tsx`
- [x] `src/components/placements/learner-placement-jobs.tsx`
- [x] `src/components/placements/learner-placement-journey.tsx`
- [x] `src/components/placements/learner-placement-offers.tsx`
- [x] `src/components/placements/learner-placement-partial-alert.tsx`
- [x] `src/components/placements/learner-placements-dashboard.tsx`
- [x] `src/components/placements/learner-prep-assignment-cards.tsx`
- [x] `src/components/placements/learner-recent-placement-activity.tsx`
- [x] `src/components/placements/learner-round-confirm-attendance.tsx`
- [x] `src/components/placements/learner-save-drive-button.tsx`
- [x] `src/components/placements/learner-schedule-reschedule.tsx`
- [x] `src/components/placements/learner-placements-tabs.tsx`
- [x] `src/components/placements/learner-placement-requests.tsx`
- [x] `src/components/placements/learner-placement-preferences.tsx`

Merged the latest origin/main as a genuine two-parent merge, retaining 86 non-conflicting lane files and choosing main for 13 concurrently modified course files; replayed remaining style-only deltas in four overlapping files. Continued through learner course controls and learner-facing placements components: standard 9px controls, hover/focus rings, primary teal with readable white foreground, compact typography, informative warning surfaces, list section dividers instead of extra white outer cards. No page wording/data/API behavior intentionally changed. No build/run/typecheck/lint/CI, per lane instructions. Source closing tags rechecked textually after edits. Work remains in inventory.

## Completed visual edits — learner placements failure states (5 files)

- [x] `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/error.tsx`
- [x] `src/app/(authenticated)/learn/my-placements/interviews/error.tsx`
- [x] `src/app/(authenticated)/learn/my-placements/calendar/error.tsx`
- [x] `src/app/(authenticated)/learn/my-placements/rules/error.tsx`
- [x] `src/app/(authenticated)/learn/my-placements/assessments/results/error.tsx`

Removed duplicated white full-page cards inside the authenticated canvas, kept retry/back actions reachable with 44px mobile targets and legacy teal outline control styling. Existing error wording and routing are unchanged. JSX closing tags inspected textually; no test, typecheck or CI execution.

## Completed visual edits — course/placement canvas continuation (4 additional files)

- [x] `src/app/(authenticated)/learn/my-placements/announcements/loading.tsx`
- [x] `src/app/(authenticated)/learn/my-placements/support/loading.tsx`
- [x] `src/app/(authenticated)/learn/my-placements/interviews/loading.tsx`
- [x] `src/components/placements/learner-placement-academic-evidence.tsx`

Neutral skeleton placeholders remain visibly distinguishable on the white page canvas. Academic evidence, placement preferences, and placement requests now align their existing sectional separators and internal margins with the shared canvas instead of nesting full-page border cards. Functional workflows and JSX hierarchy are preserved; no CI, tests, typecheck, or application execution.
