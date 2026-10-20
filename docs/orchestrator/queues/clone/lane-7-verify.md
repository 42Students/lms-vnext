# UI/UX polish VERIFICATION queue: lane chat-7 (surfaces polished by OTHER lanes)

51 surfaces. Each was already polished by another lane. Your job is to VERIFY and improve, strictly one surface at a time.

1. Regressions first (a polish pass edits many files without running code): matching tags, every import present and used, no duplicate attributes, no undeclared packages, props still match their component types, no removed export that another file imports. Fix anything broken.
2. Behaviour kept: ids, data-testid, aria labels, routes, permissions, form fields, wording (docs/audit/legacy-copy-A.md and B.md) and legacy tokens (docs/design) must be unchanged; if the polish dropped or reworded something, restore it.
3. Then judge the surface fresh as a senior product designer: is anything still cluttered, misaligned, duplicated or noisy? One obvious primary action? Aligned left edges and gaps on the legacy scale? Calm density? Real layouts at 375 and 768? Empty, loading, error states with a clear next step? Fix what you find.
4. Also check the route files in the same folder (loading, error, not-found, template) and the nearest parent layout.

Proof: ONE entry per surface in docs/audit/ux/verify-lane-7.md: surface | regressions found and fixed | extra clutter/alignment fixes | files changed (write 'verified, no change' only after a real read of every component). Tick [x] here and push to chatgpt/chat-7-b with [chat-7] after every 2 surfaces.

- [x] `src/components/courses/college-content-preview.tsx`
- [x] `src/components/courses/faculty-assessment-create.tsx`
- [x] `src/components/courses/faculty-assessment-editor.tsx`
- [x] `src/components/courses/faculty-assignment-review.tsx`
- [x] `src/components/courses/faculty-choice-quiz-builder.tsx`
- [x] `src/components/courses/faculty-content-editor.tsx`
- [x] `src/components/courses/faculty-course-roster.tsx`
- [x] `src/components/courses/faculty-quiz-question-editor.tsx`
- [x] `src/components/courses/faculty-quiz-review.tsx`
- [x] `src/components/courses/learner-assessment-overview.tsx`
- [x] `src/components/courses/learner-roadmap-item-dialog.tsx`
- [x] `src/components/groups/college-group-actions.tsx`
- [x] `src/components/hr/hr-recruiter-bell.tsx`
- [x] `src/components/hr/recruiter-applicant-review-drawer.tsx`
- [x] `src/components/hr/recruiter-notification-bell.tsx`
- [x] `src/components/hr/recruiter-round-inline-editor.tsx`
- [x] `src/components/placements/college-application-detail-drawer.tsx`
- [x] `src/components/placements/college-application-pipeline-controls.tsx`
- [x] `src/components/placements/college-drive-deadline-action.tsx`
- [x] `src/components/placements/college-interview-appointments.tsx`
- [x] `src/components/placements/learner-application-detail-withdraw.tsx`
- [x] `src/components/placements/learner-applications-browse.tsx`
- [x] `src/components/placements/learner-career-calendar.tsx`
- [x] `src/components/placements/learner-career-rounds-workspace.tsx`
- [x] `src/components/placements/learner-placement-jobs.tsx`
- [x] `src/components/placements/learner-placement-notification-settings.tsx`
- [x] `src/components/placements/learner-placement-offers.tsx`
- [x] `src/components/placements/learner-support-cancel.tsx`
- [x] `src/components/placements/placement-offer-controls.tsx`
- [x] `src/components/placements/tpo-applicant-review-drawer.tsx`
- [x] `src/components/placements/tpo-drive-edit-form.tsx`
- [ ] `src/components/placements/tpo-drive-selection-manager.tsx`
- [ ] `src/components/placements/tpo-general-requests-panel.tsx`
- [ ] `src/components/placements/tpo-remind-non-applicants.tsx`
- [ ] `src/app/e2e/chat17-ui-kit/ui-harness.tsx`
- [ ] `src/components/groups/college-group-detail-writes.tsx`
- [ ] `src/components/verification/TpoVerificationPanel.tsx`
- [ ] `src/components/admin/people-pagination.tsx`
- [ ] `src/components/auth/session-response-guard.tsx`
- [ ] `src/components/hr/recruiter-display-name-editor.tsx`
- [ ] `src/components/projects/learner-board-task-index.tsx`
- [ ] `src/components/public/offline-banner.tsx`
- [ ] `src/components/tracker/audit-finding-filter-persistence.tsx`
- [ ] `src/components/ui/form-section.tsx`
- [ ] `src/components/ui/page-canvas.tsx`
- [ ] `src/app/(authenticated)/admin/error.tsx`
- [ ] `src/app/(authenticated)/teach/loading.tsx`
- [ ] `src/app/(authenticated)/college-admin/not-found.tsx`
- [ ] `src/app/(authenticated)/layout.tsx`
- [ ] `src/app/(authenticated)/teacher/not-found.tsx`
- [ ] `src/app/(authenticated)/admin/loading.tsx`
