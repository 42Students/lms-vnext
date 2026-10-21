# Dimension re-sweep after the polish pass: lane chat-10 owns "Buttons and links (part 2 of 2)" across the whole codebase

300 files (1027 files use this aspect; yours are the ones with the most instances). For EACH file: find every instance of this aspect, compare with the legacy values (docs/design/old-lms-shell-spec.md, legacy-styles/, ui-clone-checklist.md) and fix every deviation. Checklist: variant per legacy (primary #0a7c88 white radius 9 height 36 weight 650 size 14), secondary/ghost/danger, hover, focus-visible, disabled, loading spinner, icon-only size, link colour and underline.
Record ONE proof line per file in docs/audit/ux/dim2-lane-10.md: file, number of instances checked, at least 3 spec-versus-code value pairs, fixes made. Tick [x] in this queue in the same push. If a file has zero instances write 'none' as the proof and tick it.



## Dimension sweep: lane chat-10 owns "Colour tokens and raw colours (part 2 of 2)" across the whole codebase

50 files (101 files use this aspect; yours are the ones with the most instances). For EACH file: find every instance of this aspect, compare with the legacy values (docs/design/old-lms-shell-spec.md, legacy-styles/, ui-clone-checklist.md) and fix every deviation. Checklist: every colour must be a legacy token or exactly a legacy value; replace tailwind default palette and stray hex with tokens; check text contrast; no pure black text.
Record ONE proof line per file in docs/audit/ux/dim2-lane-10.md: file, number of instances checked, at least 3 spec-versus-code value pairs, fixes made. Tick [x] in this queue in the same push. If a file has zero instances write 'none' as the proof and tick it.


- [x] `src/app/(authenticated)/tpo/students/[membershipId]/participation/error.tsx`
- [x] `src/app/(authenticated)/tpo/team/[threadId]/page.tsx`
- [x] `src/app/(authenticated)/tracker/issues/[publicId]/page.tsx`
- [x] `src/app/company-share/[token]/error.tsx`
- [x] `src/components/academics/college-academic-directory.tsx`
- [x] `src/components/college/college-department-insights.tsx`
- [x] `src/components/courses/college-live-classes-directory.tsx`
- [x] `src/components/placements/learner-placement-job-detail.tsx`
- [x] `src/components/profile/learner-profile-workspace.tsx`
- [x] `src/components/projects/super-admin-template-subview-page.tsx`
- [x] `src/components/placements/tpo-outside-participants-editor.tsx`
- [x] `src/components/placements/tpo-round-results-import.tsx`
- [x] `src/components/projects/learner-board-task-detail-dialog.tsx`
- [x] `src/components/projects/mentor-lane-board.tsx`
- [x] `src/components/projects/project-admin-collection-controls.tsx`
- [x] `src/components/projects/project-participant-list-controls.tsx`
- [x] `src/components/projects/super-admin-template-create-form.tsx`
- [x] `src/components/shell/topbar/topbar.module.css`
- [x] `src/components/tpo/recruiter-leads-workspace.tsx`
- [x] `src/components/tpo/tpo-new-followup-modal.tsx`
- [x] `src/components/ui/bottom-sheet.tsx`
- [x] `src/components/ui/drawer.tsx`
- [x] `src/components/ui/graceful-page-loading.tsx`
- [x] `src/components/ui/needs-doing-chips.tsx`
- [x] `src/components/ui/stat-tile.tsx`
- [x] `src/styles/legacy-skin.css`
- [x] `src/components/projects/learner-board-task-index.tsx`
- [x] `src/components/projects/mentor-product-backlog.tsx`
- [x] `src/components/projects/project-admin-submissions-page.tsx`
- [x] `src/components/projects/super-admin-template-college-bulk.tsx`
- [x] `src/components/shell/sidebar-legacy.css`
- [x] `src/components/tpo/recruiter-roster-display-controls.tsx`
- [x] `src/components/tpo/tpo-company-team-conversation.tsx`
- [x] `src/components/tpo/tpo-students-spreadsheet.tsx`
- [x] `src/components/ui/dropdown.tsx`
- [x] `src/components/ui/pagination.tsx`
- [x] `src/components/ui/tabs.tsx`
- [x] `src/app/(authenticated)/tpo/students/[membershipId]/history/page.tsx`
- [x] `src/app/(authenticated)/tracker/issues/[publicId]/page.tsx`
- [x] `src/components/academics/college-recurring-preview.tsx`
- [x] `src/components/admin/college-dashboard-cards.tsx`
- [x] `src/components/attendance/admin-attendance-workspace.tsx`
- [x] `src/components/college/college-person-profile-overview-modal.tsx`
- [x] `src/components/courses/college-learner-progress-report.tsx`
- [x] `src/components/courses/faculty-course-roster.tsx`
- [x] `src/components/courses/learner-course-attendance.tsx`
- [x] `src/components/hr/hr-recruiter-bell.tsx`
- [x] `src/components/placements/placement-operations-overview.tsx`
- [x] `src/components/placements/tpo-general-requests-panel.tsx`
- [x] `src/components/placements/tpo-round-results-import.tsx`
- [x] `src/components/projects/mentor-lane-board.tsx`
- [x] `src/components/projects/project-admin-reassign-mentor-page.tsx`
- [x] `src/components/projects/super-admin-template-college-bulk.tsx`
- [x] `src/components/tpo/tpo-students-bulk-add.tsx`
- [x] `src/components/ui/loading-state.tsx`
- [x] `src/components/tpo/tpo-student-note-editor.tsx`
- [x] `src/components/tpo/tpo-team-assign-unowned.tsx`
- [x] `src/components/tpo/tpo-team-rename.tsx`
- [x] `src/components/tracker/tracker-issue-logs-panel.tsx`
- [x] `src/components/ui/inline-notice.tsx`
- [x] `src/styles/micro-details.css`
- [x] `src/app/(authenticated)/tpo/audit/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx`
- [x] `src/app/(authenticated)/tracker/audit-findings/page.tsx`
- [x] `src/components/activity/activity-center.tsx`
- [x] `src/components/attendance/learner-attendance-workspace.tsx`
- [x] `src/components/courses/admin-offering-teachers-panel.tsx`
- [x] `src/components/courses/learner-assessment-overview.tsx`
- [x] `src/components/courses/quiz-attempt-control.tsx`
- [x] `src/components/placements/learner-career-calendar.tsx`
- [x] `src/components/placements/learner-recent-placement-activity.tsx`
- [x] `src/components/placements/tpo-drive-act-on-panel.tsx`
- [x] `src/components/projects/project-admin-audit-page.tsx`
- [x] `src/components/shell/learner-notification-bell.tsx`
- [x] `src/components/tpo/recruiter-lead-csv-import.tsx`
- [x] `src/components/tpo/tpo-student-nudge-panel.tsx`
- [x] `src/components/ui/date-input.tsx`
- [x] `src/components/verification/VerificationWorkspace.tsx`
- [x] `src/app/(authenticated)/tracker/logs/page.tsx`
- [x] `src/components/academics/academics-overview.tsx`
- [x] `src/components/admin/college-logo-uploader.tsx`
- [x] `src/components/announcements/announcement-admin-workspace.tsx`
- [x] `src/components/courses/college-live-classes-directory.tsx`
- [x] `src/components/courses/faculty-quiz-question-editor.tsx`
- [x] `src/components/placements/college-application-pipeline-controls.tsx`
- [x] `src/components/placements/report-interactive-table.tsx`
- [ ] `src/components/projects/mentor-lane-board.tsx`
- [ ] `src/components/projects/project-delivery-reopen-control.tsx`
- [ ] `src/components/tpo/tpo-new-recruiter-conversation.tsx`
- [ ] `src/components/placements/tpo-drive-workspace-nav.tsx`
- [ ] `src/components/placements/tpo-request-page-clipboard.tsx`
- [ ] `src/components/projects/mentor-product-backlog.tsx`
- [ ] `src/components/projects/project-task-submission-control.tsx`
- [ ] `src/components/tpo/grid/grid-workspace.tsx`
- [ ] `src/components/tpo/tpo-company-create-form.tsx`
- [ ] `src/components/tpo/tpo-new-followup-modal.tsx`
- [ ] `src/components/ui/action-pagination.tsx`
