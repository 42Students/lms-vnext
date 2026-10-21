# Dimension re-sweep after the polish pass: lane chat-17 owns "Badges, chips, status pills, tags" across the whole codebase

294 files (294 files use this aspect; yours are the ones with the most instances). For EACH file: find every instance of this aspect, compare with the legacy values (docs/design/old-lms-shell-spec.md, legacy-styles/, ui-clone-checklist.md) and fix every deviation. Checklist: legacy status tokens (success #059669, warning #d97706, error #ef4444, info #26bac7), height, radius, padding, font size/weight, dot, text casing.
Record ONE proof line per file in docs/audit/ux/dim2-lane-17.md: file, number of instances checked, at least 3 spec-versus-code value pairs, fixes made. Tick [x] in this queue in the same push. If a file has zero instances write 'none' as the proof and tick it.



## Dimension sweep: lane chat-17 owns "Tables and data grids" across the whole codebase

138 files (138 files use this aspect; yours are the ones with the most instances). For EACH file: find every instance of this aspect, compare with the legacy values (docs/design/old-lms-shell-spec.md, legacy-styles/, ui-clone-checklist.md) and fix every deviation. Checklist: header row height/bg/weight, cell padding, row hover, zebra, borders, sort icons, empty row, sticky header, pagination footer, horizontal scroll at 375.
Record ONE proof line per file in docs/audit/ux/dim2-lane-17.md: file, number of instances checked, at least 3 spec-versus-code value pairs, fixes made. Tick [x] in this queue in the same push. If a file has zero instances write 'none' as the proof and tick it.


- [x] `src/app/(authenticated)/tpo/students/preparation-plan/page.tsx`
- [x] `src/app/(authenticated)/tpo/verification/error.tsx`
- [x] `src/app/(authenticated)/tracker/mine/page.tsx`
- [x] `src/app/page.tsx`
- [x] `src/components/admin/super-admin-placement-detail-view.tsx`
- [x] `src/components/courses/college-assessment-aggregate.tsx`
- [x] `src/components/courses/super-admin-content-directory-page.tsx`
- [x] `src/components/placements/public-join-preview-retry.tsx`
- [x] `src/components/projects/project-admin-reassign-mentor-page.tsx`
- [x] `src/components/ui/breadcrumbs.tsx`
- [x] `src/components/placements/tpo-round-check-in.tsx`
- [x] `src/components/placements/tpo-week-hour-calendar.tsx`
- [x] `src/components/projects/learner-project-mobile-filters.tsx`
- [x] `src/components/projects/mentor-project-closeout-control.tsx`
- [x] `src/components/projects/project-delivery-file-uploader.tsx`
- [x] `src/components/projects/project-template-view.tsx`
- [x] `src/components/shell/learner-notification-bell.tsx`
- [x] `src/components/tpo/recruiter-board-theme.module.css`
- [x] `src/components/tpo/tpo-campaign-compose.tsx`
- [x] `src/components/tpo/tpo-students-bulk-debar.tsx`
- [x] `src/components/ui/data-table.tsx`
- [x] `src/components/ui/file-dropzone.tsx`
- [x] `src/components/ui/list-row.tsx`
- [x] `src/components/ui/segmented-control.tsx`
- [x] `src/components/ui/third-party-link.tsx`
- [x] `src/components/profile/learner-profile-workspace.tsx`
- [x] `src/components/projects/mentor-board-task-detail-dialog.tsx`
- [x] `src/components/projects/project-admin-collection-controls.tsx`
- [x] `src/components/projects/project-mentor-reassignment.tsx`
- [x] `src/components/public/public-screen.module.css`
- [x] `src/components/tpo/recruiter-invite-landing.tsx`
- [x] `src/components/tpo/tpo-builtin-job-types-editor.tsx`
- [x] `src/components/tpo/tpo-mobile-footer.tsx`
- [x] `src/components/ui/data-table.tsx`
- [x] `src/components/ui/input.tsx`
- [x] `src/components/ui/segmented-control.tsx`
- [x] `src/components/ui/tooltip.tsx`
- [x] `src/app/(authenticated)/tpo/students/requests/loading.tsx`
- [x] `src/app/company-share/[token]/page.tsx`
- [x] `src/components/admin/admin-scoped-read-page.tsx`
- [x] `src/components/admin/super-admin-hr-accounts.tsx`
- [x] `src/components/college/college-faculty-assignment-actions.tsx`
- [x] `src/components/college/student-class-move-action.tsx`
- [x] `src/components/courses/faculty-assignment-review.tsx`
- [x] `src/components/courses/faculty-quiz-review.tsx`
- [x] `src/components/courses/super-admin-content-directory-page.tsx`
- [x] `src/components/placements/learner-career-rounds.tsx`
- [x] `src/components/placements/tpo-bulk-round-result-recorder.tsx`
- [x] `src/components/placements/tpo-report-record-links.tsx`
- [x] `src/components/projects/class-team-workspace-creator.tsx`
- [ ] `src/components/projects/project-admin-at-risk-page.tsx`
- [ ] `src/components/projects/project-resource-files-panel.tsx`
- [ ] `src/components/tpo/tpo-company-memory-workspace.tsx`
- [ ] `src/components/tracker/tracker-live-logs-explorer.tsx`
- [ ] `src/components/tpo/tpo-prep-readiness-editor.tsx`
- [ ] `src/components/tpo/tpo-students-bulk-add.tsx`
- [ ] `src/components/tpo/tpo-team-forms.tsx`
- [ ] `src/components/tracker/independent-finding-copy-action.tsx`
- [ ] `src/components/tracker/tracker-telegram-manual-panel.tsx`
- [ ] `src/components/verification/CollegeVerificationPanel.tsx`
- [ ] `src/app/(authenticated)/teacher/report/quiz/[quizId]/attempts/page.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/candidate-schedule/page.tsx`
- [ ] `src/app/(authenticated)/tpo/students/page.tsx`
- [ ] `src/app/campaign-unsubscribe/confirmed/page.tsx`
- [ ] `src/components/admin/college-logo-uploader.tsx`
- [ ] `src/components/courses/admin-learning-structure-actions.tsx`
- [ ] `src/components/courses/faculty-assessment-overview.tsx`
- [ ] `src/components/courses/learner-course-tabs.tsx`
- [ ] `src/components/placements/college-drive-attention-cards.tsx`
- [ ] `src/components/placements/learner-placement-jobs.tsx`
- [ ] `src/components/placements/public-recruiter-join-form.tsx`
- [ ] `src/components/profile/learner-profile-workspace.tsx`
- [ ] `src/components/projects/project-resource-files-section.tsx`
- [ ] `src/components/shell/topbar/topbar.module.css`
- [ ] `src/components/tpo/tpo-bell-panel.tsx`
- [ ] `src/components/tracker/tracker-admin-nav.tsx`
- [ ] `src/components/verification/CollegeVerificationPanel.tsx`
- [ ] `src/app/(authenticated)/tpo/team/[threadId]/page.tsx`
- [ ] `src/app/home/page.tsx`
- [ ] `src/components/admin/admin-dashboard-actions.tsx`
- [ ] `src/components/admin/person-profile-dialog.tsx`
- [ ] `src/components/colleges/college-contact-profile-form.tsx`
- [ ] `src/components/courses/faculty-contacts-table.tsx`
- [ ] `src/components/groups/college-group-import-preview.tsx`
- [ ] `src/components/placements/learner-placement-offers.tsx`
- [ ] `src/components/placements/tpo-round-results-import.tsx`
- [ ] `src/components/projects/mentor-sprint-write.tsx`
- [ ] `src/components/tpo/recruiter-lead-detail-workspace.tsx`
- [ ] `src/components/placements/tpo-college-rules-control.tsx`
- [ ] `src/components/placements/tpo-public-placement-content-editor.tsx`
- [ ] `src/components/projects/learner-board-interactive.tsx`
- [ ] `src/components/projects/project-admin-missing-college.tsx`
- [ ] `src/components/shell/learner-notification-bell.tsx`
- [ ] `src/components/tpo/tpo-batch-inline-decision.tsx`
- [ ] `src/components/tpo/tpo-find-shortcut.tsx`
- [ ] `src/components/tpo/tpo-team-forms.tsx`
- [ ] `src/components/verification/VerificationReviewDrawer.tsx`
