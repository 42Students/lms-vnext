# UI/UX polish VERIFICATION queue: lane chat-6 (surfaces polished by OTHER lanes)

51 surfaces. Each was already polished by another lane. Your job is to VERIFY and improve, strictly one surface at a time.

1. Regressions first (a polish pass edits many files without running code): matching tags, every import present and used, no duplicate attributes, no undeclared packages, props still match their component types, no removed export that another file imports. Fix anything broken.
2. Behaviour kept: ids, data-testid, aria labels, routes, permissions, form fields, wording (docs/audit/legacy-copy-A.md and B.md) and legacy tokens (docs/design) must be unchanged; if the polish dropped or reworded something, restore it.
3. Then judge the surface fresh as a senior product designer: is anything still cluttered, misaligned, duplicated or noisy? One obvious primary action? Aligned left edges and gaps on the legacy scale? Calm density? Real layouts at 375 and 768? Empty, loading, error states with a clear next step? Fix what you find.
4. Also check the route files in the same folder (loading, error, not-found, template) and the nearest parent layout.

Proof: ONE entry per surface in docs/audit/ux/verify-lane-6.md: surface | regressions found and fixed | extra clutter/alignment fixes | files changed (write 'verified, no change' only after a real read of every component). Tick [x] here and push to chatgpt/chat-6-b with [chat-6] after every 2 surfaces.

- [x] `src/components/academics/academics-actions.tsx`
- [x] `src/components/academics/college-cohort-management.tsx`
- [x] `src/components/academics/college-section-management.tsx`
- [x] `src/components/academics/college-semester-management.tsx`
- [ ] `src/components/activity/learner-notifications-inbox.tsx`
- [ ] `src/components/admin/college-archive-button.tsx`
- [ ] `src/components/admin/college-edit-dialog.tsx`
- [ ] `src/components/admin/department-actions.tsx`
- [ ] `src/components/admin/inbound-mail-list.tsx`
- [ ] `src/components/admin/learner-module-access-drawer.tsx`
- [ ] `src/components/admin/lecture-hall-manager.tsx`
- [ ] `src/components/admin/organization-actions.tsx`
- [ ] `src/components/admin/person-membership-actions.tsx`
- [ ] `src/components/admin/person-onboard-dialog.tsx`
- [ ] `src/components/admin/person-profile-dialog.tsx`
- [ ] `src/components/admin/super-admin-faculty-schedule-reassign-action.tsx`
- [ ] `src/components/admin/super-admin-hr-account-dialog.tsx`
- [ ] `src/components/admin/super-admin-hr-accounts.tsx`
- [ ] `src/components/admin/super-admin-hr-detail-drawer.tsx`
- [ ] `src/components/admin/super-admin-student-import-history.tsx`
- [ ] `src/components/announcements/announcement-admin-workspace.tsx`
- [ ] `src/components/attendance/admin-attendance-workspace.tsx`
- [ ] `src/components/attendance/faculty-attendance-workspace.tsx`
- [ ] `src/components/college/college-faculty-reassign-action.tsx`
- [ ] `src/components/college/college-faculty-schedule-reassign.tsx`
- [ ] `src/components/college/college-offering-metadata-action.tsx`
- [ ] `src/components/college/college-person-audit-modal.tsx`
- [ ] `src/components/college/college-person-edit-action.tsx`
- [ ] `src/components/college/college-person-profile-overview-modal.tsx`
- [ ] `src/components/college/college-student-import-history.tsx`
- [ ] `src/components/college/student-class-move-action.tsx`
- [ ] `src/components/courses/admin-course-actions.tsx`
- [ ] `src/components/courses/admin-learning-structure-actions.tsx`
- [ ] `src/components/courses/assignment-submission-control.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-preview/company-share-controls.tsx`
- [ ] `src/components/announcements/super-admin-college-broadcast-form.tsx`
- [ ] `src/components/verification/SuperAdminVerificationPanel.tsx`
- [ ] `src/app/(authenticated)/admin/placements/jobs/[jobId]/admin-placement-job-tabs.tsx`
- [ ] `src/components/auth/portal-access-notice.tsx`
- [ ] `src/components/hr/recruiter-designation-editor.tsx`
- [ ] `src/components/projects/college-project-summary-editor.tsx`
- [ ] `src/components/public/graceful-error-boundary.tsx`
- [ ] `src/components/tpo/tpo-header-indicators.tsx`
- [ ] `src/components/ui/form-grid.tsx`
- [ ] `src/components/ui/otp-input.tsx`
- [ ] `src/components/ui/search-field.tsx`
- [ ] `src/app/(authenticated)/hr/loading.tsx`
- [ ] `src/app/(authenticated)/college-admin/layout.tsx`
- [ ] `src/app/(authenticated)/hr/not-found.tsx`
- [ ] `src/app/(authenticated)/teacher/layout.tsx`
- [ ] `src/components/ui/range-slider.tsx`
