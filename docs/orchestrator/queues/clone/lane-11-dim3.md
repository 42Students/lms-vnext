# Dimension re-sweep after the polish pass: lane chat-11 owns "Typography and headings (part 1 of 2)" across the whole codebase

300 files (973 files use this aspect; yours are the ones with the most instances). For EACH file: find every instance of this aspect, compare with the legacy values (docs/design/old-lms-shell-spec.md, legacy-styles/, ui-clone-checklist.md) and fix every deviation. Checklist: every heading level size/weight/colour/line-height vs legacy scale, body 14px, caption 12px, no off-scale sizes, letter-spacing, truncation and wrapping.
Record ONE proof line per file in docs/audit/ux/dim2-lane-11.md: file, number of instances checked, at least 3 spec-versus-code value pairs, fixes made. Tick [x] in this queue in the same push. If a file has zero instances write 'none' as the proof and tick it.



## Dimension sweep: lane chat-11 owns "Icons and imagery" across the whole codebase

36 files (36 files use this aspect; yours are the ones with the most instances). For EACH file: find every instance of this aspect, compare with the legacy values (docs/design/old-lms-shell-spec.md, legacy-styles/, ui-clone-checklist.md) and fix every deviation. Checklist: icon size 16/18/20 per context, stroke width and colour inherit, alignment with text baseline, avatar size/radius/initials colours, image aspect and fallback, no undeclared icon package imports.
Record ONE proof line per file in docs/audit/ux/dim2-lane-11.md: file, number of instances checked, at least 3 spec-versus-code value pairs, fixes made. Tick [x] in this queue in the same push. If a file has zero instances write 'none' as the proof and tick it.


- [x] `src/app/(authenticated)/tpo/students/[membershipId]/participation/page.tsx`
- [x] `src/app/(authenticated)/tpo/team/company/[companyId]/page.tsx`
- [x] `src/app/(authenticated)/tracker/issues/page.tsx`
- [x] `src/app/company-share/[token]/not-found.tsx`
- [x] `src/components/academics/college-structure-directory.tsx`
- [x] `src/components/college/college-role-directory-workspace.tsx`
- [x] `src/components/courses/faculty-course-workspace.tsx`
- [x] `src/components/placements/placement-calendar-workspace.tsx`
- [x] `src/components/projects/project-admin-at-risk-page.tsx`
- [x] `src/components/tpo/recruiter-invite-landing.tsx`
- [x] `src/components/placements/tpo-request-decision-control.tsx`
- [x] `src/components/placements/tpo-settings-nav.tsx`
- [x] `src/components/projects/learner-board-task-index.tsx`
- [x] `src/components/projects/mentor-meeting-history.tsx`
- [x] `src/components/projects/project-admin-readiness-page.tsx`
- [x] `src/components/projects/project-resource-files-panel.tsx`
- [x] `src/components/projects/super-admin-template-subview-page.tsx`
- [x] `src/components/tpo/grid/grid-workspace.tsx`
- [ ] `src/components/tpo/recruiter-roster-display-controls.tsx`
- [ ] `src/components/tpo/tpo-new-recruiter-conversation.tsx`
- [ ] `src/components/ui/breadcrumbs.tsx`
- [ ] `src/components/ui/dropdown.tsx`
- [ ] `src/components/ui/input-group.tsx`
- [ ] `src/components/ui/pagination.tsx`
- [ ] `src/components/ui/table.tsx`
- [ ] `src/styles/micro-details.css`
- [ ] `src/components/projects/learner-project-activity.tsx`
- [ ] `src/components/projects/mentor-projects-unavailable.tsx`
- [ ] `src/components/projects/project-admin-workspace-list.tsx`
- [ ] `src/components/projects/super-admin-template-create-form.tsx`
- [ ] `src/components/shell/topbar/account-menu.tsx`
- [ ] `src/components/tpo/tpo-audit-grid.tsx`
- [ ] `src/components/tpo/tpo-due-followup-workspace.tsx`
- [ ] `src/components/tracker/tracker-report-form.tsx`
- [ ] `src/components/ui/file-upload.tsx`
- [ ] `src/components/ui/popover.tsx`
- [ ] `src/components/ui/textarea.tsx`
- [ ] `src/app/(authenticated)/tpo/students/page.tsx`
- [ ] `src/app/(authenticated)/tracker/issues/page.tsx`
- [ ] `src/components/academics/learner-class-schedule.tsx`
- [ ] `src/components/admin/college-dashboard-section-failure.tsx`
- [ ] `src/components/attendance/faculty-attendance-workspace.tsx`
- [ ] `src/components/college/college-role-directory-workspace.tsx`
- [ ] `src/components/courses/faculty-assessment-create.tsx`
- [ ] `src/components/courses/faculty-course-workspace.tsx`
- [ ] `src/components/courses/learner-course-discussion.tsx`
- [ ] `src/components/hr/recruiter-notification-bell.tsx`
- [ ] `src/components/placements/placement-report-ui.tsx`
- [ ] `src/components/placements/tpo-interview-slot-planner.tsx`
- [ ] `src/components/placements/tpo-selection-import.tsx`
- [ ] `src/components/projects/mentor-product-backlog.tsx`
- [ ] `src/components/projects/project-admin-submissions-page.tsx`
- [ ] `src/components/projects/super-admin-template-subview-page.tsx`
- [ ] `src/components/tpo/tpo-team-ask-panel.tsx`
- [ ] `src/components/ui/page-loading.tsx`
- [ ] `src/components/tpo/tpo-student-nudge-panel.tsx`
- [ ] `src/components/tpo/tpo-team-away-form.tsx`
- [ ] `src/components/tpo/tpo-timed-debar-control.tsx`
- [ ] `src/components/tracker/tracker-issue-saved-views.tsx`
- [ ] `src/components/ui/legacy-overlays.css`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/students/error.tsx`
- [ ] `src/app/(authenticated)/tpo/batches/[batchId]/students/page.tsx`
- [ ] `src/app/(authenticated)/tpo/recruiters/campaigns/page.tsx`
- [ ] `src/app/(authenticated)/tracker/issues/[publicId]/page.tsx`
- [ ] `src/components/admin/college-at-glance-panel.tsx`
- [ ] `src/components/college/college-legacy-group-tabs.tsx`
- [ ] `src/components/courses/assignment-file-submission-control.tsx`
- [ ] `src/components/courses/learner-course-discussion.tsx`
- [ ] `src/components/hr/hr-recruiter-bell.tsx`
- [ ] `src/components/placements/learner-career-rounds-workspace.tsx`
- [ ] `src/components/placements/placement-calendar-workspace.tsx`
- [ ] `src/components/placements/tpo-drive-workspace-nav.tsx`
- [ ] `src/components/projects/project-admin-nav.tsx`
- [ ] `src/components/shell/learner-topbar-tools.tsx`
- [ ] `src/components/tpo/recruiter-leads-workspace.tsx`
- [ ] `src/components/tpo/tpo-student-quick-panel.tsx`
- [ ] `src/components/ui/dropdown.tsx`
- [ ] `src/app/(authenticated)/tpo/settings/team/page.tsx`
- [ ] `src/app/(authenticated)/tracker/mine/page.tsx`
- [ ] `src/components/academics/college-cohort-management.tsx`
- [ ] `src/components/admin/learner-module-access-drawer.tsx`
- [ ] `src/components/college/college-department-insights.tsx`
- [ ] `src/components/courses/faculty-assessment-create.tsx`
- [ ] `src/components/courses/faculty-report-student-table.tsx`
- [ ] `src/components/placements/college-hiring-funnel.tsx`
- [ ] `src/components/placements/super-admin-bulk-drive-actions.tsx`
- [ ] `src/components/projects/mentor-meeting-notes-editor.tsx`
- [ ] `src/components/projects/project-resource-list.tsx`
- [ ] `src/components/tpo/tpo-students-bulk-add.tsx`
- [ ] `src/components/placements/tpo-general-requests-panel.tsx`
- [ ] `src/components/placements/tpo-round-drive-day-read-only.tsx`
- [ ] `src/components/projects/mentor-release-editor.tsx`
- [ ] `src/components/projects/project-template-view.tsx`
- [ ] `src/components/tpo/recruiter-invite-landing.tsx`
- [ ] `src/components/tpo/tpo-company-memory-workspace.tsx`
- [ ] `src/components/tpo/tpo-notice-audience-picker.tsx`
- [ ] `src/components/ui/date-input.tsx`
