# UI/UX polish VERIFICATION queue: lane chat-8 (surfaces polished by OTHER lanes)

49 surfaces. Each was already polished by another lane. Your job is to VERIFY and improve, strictly one surface at a time.

1. Regressions first (a polish pass edits many files without running code): matching tags, every import present and used, no duplicate attributes, no undeclared packages, props still match their component types, no removed export that another file imports. Fix anything broken.
2. Behaviour kept: ids, data-testid, aria labels, routes, permissions, form fields, wording (docs/audit/legacy-copy-A.md and B.md) and legacy tokens (docs/design) must be unchanged; if the polish dropped or reworded something, restore it.
3. Then judge the surface fresh as a senior product designer: is anything still cluttered, misaligned, duplicated or noisy? One obvious primary action? Aligned left edges and gaps on the legacy scale? Calm density? Real layouts at 375 and 768? Empty, loading, error states with a clear next step? Fix what you find.
4. Also check the route files in the same folder (loading, error, not-found, template) and the nearest parent layout.

Proof: ONE entry per surface in docs/audit/ux/verify-lane-8.md: surface | regressions found and fixed | extra clutter/alignment fixes | files changed (write 'verified, no change' only after a real read of every component). Tick [x] here and push to chatgpt/chat-8-b with [chat-8] after every 2 surfaces.

- [x] `src/components/placements/tpo-request-bulk-decision.tsx`
- [x] `src/components/placements/tpo-request-decision-control.tsx`
- [x] `src/components/placements/tpo-week-hour-calendar.tsx`
- [x] `src/components/profile/learner-profile-workspace.tsx`
- [x] `src/components/profile/learner-skill-catalog-input.tsx`
- [x] `src/components/projects/college-project-mentor-dialog.tsx`
- [x] `src/components/projects/college-project-student-roster-dialog.tsx`
- [x] `src/components/projects/learner-board-task-detail-dialog.tsx`
- [x] `src/components/projects/mentor-board-task-detail-dialog.tsx`
- [x] `src/components/projects/mentor-meeting-notes-editor.tsx`
- [x] `src/components/projects/mentor-meeting-reschedule.tsx`
- [x] `src/components/projects/mentor-sprint-details-edit.tsx`
- [x] `src/components/projects/mentor-sprint-write.tsx`
- [x] `src/components/projects/mentor-task-create.tsx`
- [x] `src/components/projects/mentor-task-details-edit.tsx`
- [x] `src/components/projects/project-admin-submission-review.tsx`
- [x] `src/components/projects/project-archive-control.tsx`
- [x] `src/components/projects/project-create-control.tsx`
- [x] `src/components/projects/project-delivery-reopen-control.tsx`
- [x] `src/components/projects/project-final-delivery-controls.tsx`
- [x] `src/components/projects/project-lifecycle-actions.tsx`
- [x] `src/components/projects/project-meeting-controls.tsx`
- [x] `src/components/projects/project-mentor-reassignment.tsx`
- [x] `src/components/projects/project-resource-controls.tsx`
- [ ] `src/components/projects/project-task-submission-control.tsx`
- [ ] `src/components/projects/project-team-controls.tsx`
- [ ] `src/components/projects/project-template-controls.tsx`
- [ ] `src/components/projects/template-metadata-edit-control.tsx`
- [ ] `src/components/tpo/recruiter-lead-csv-import.tsx`
- [ ] `src/components/tpo/recruiter-lead-detail-workspace.tsx`
- [ ] `src/components/tpo/recruiter-leads-workspace.tsx`
- [ ] `src/components/tpo/tpo-academic-import-workspace.tsx`
- [ ] `src/components/tpo/tpo-after-college-bulk-editor.tsx`
- [ ] `src/components/tpo/tpo-after-college-editor.tsx`
- [ ] `src/components/activity/notification-list.tsx`
- [ ] `src/components/groups/college-study-member-actions.tsx`
- [ ] `src/components/admin/super-admin-legacy-group-tabs.tsx`
- [ ] `src/components/college/college-legacy-group-tabs.tsx`
- [ ] `src/components/placements/college-drive-legacy-nav.tsx`
- [ ] `src/components/public/browser-support-notice.tsx`
- [ ] `src/components/public/public-page-loading.tsx`
- [ ] `src/components/ui/button-group.tsx`
- [ ] `src/components/ui/input-group.tsx`
- [ ] `src/components/ui/password-input.tsx`
- [ ] `src/app/(authenticated)/teach/error.tsx`
- [ ] `src/app/(authenticated)/teacher/loading.tsx`
- [ ] `src/app/(authenticated)/error.tsx`
- [ ] `src/app/(authenticated)/loading.tsx`
- [ ] `src/app/(authenticated)/admin/not-found.tsx`
