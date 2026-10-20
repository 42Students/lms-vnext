# UI/UX polish VERIFICATION queue: lane chat-9 (surfaces polished by OTHER lanes)

46 surfaces. Each was already polished by another lane. Your job is to VERIFY and improve, strictly one surface at a time.

1. Regressions first (a polish pass edits many files without running code): matching tags, every import present and used, no duplicate attributes, no undeclared packages, props still match their component types, no removed export that another file imports. Fix anything broken.
2. Behaviour kept: ids, data-testid, aria labels, routes, permissions, form fields, wording (docs/audit/legacy-copy-A.md and B.md) and legacy tokens (docs/design) must be unchanged; if the polish dropped or reworded something, restore it.
3. Then judge the surface fresh as a senior product designer: is anything still cluttered, misaligned, duplicated or noisy? One obvious primary action? Aligned left edges and gaps on the legacy scale? Calm density? Real layouts at 375 and 768? Empty, loading, error states with a clear next step? Fix what you find.
4. Also check the route files in the same folder (loading, error, not-found, template) and the nearest parent layout.

Proof: ONE entry per surface in docs/audit/ux/verify-lane-9.md: surface | regressions found and fixed | extra clutter/alignment fixes | files changed (write 'verified, no change' only after a real read of every component). Tick [x] here and push to chatgpt/chat-9-b with [chat-9] after every 2 surfaces.

- [x] `src/components/tpo/tpo-batch-eligibility-import.tsx`
- [x] `src/components/tpo/tpo-batch-inline-decision.tsx`
- [x] `src/components/tpo/tpo-bell-panel.tsx`
- [x] `src/components/tpo/tpo-bulk-action-panel.tsx`
- [x] `src/components/tpo/tpo-company-create-form.tsx`
- [x] `src/components/tpo/tpo-find-shortcut.tsx`
- [x] `src/components/tpo/tpo-keyboard-shortcuts.tsx`
- [x] `src/components/tpo/tpo-new-followup-modal.tsx`
- [x] `src/components/tpo/tpo-new-recruiter-conversation.tsx`
- [x] `src/components/tpo/tpo-notice-composer-dialog.tsx`
- [x] `src/components/tpo/tpo-notice-delete-confirm.tsx`
- [x] `src/components/tpo/tpo-student-nudge-panel.tsx`
- [x] `src/components/tpo/tpo-student-quick-panel.tsx`
- [x] `src/components/tpo/tpo-student-saved-views.tsx`
- [ ] `src/components/tpo/tpo-students-assign-prep.tsx`
- [ ] `src/components/tpo/tpo-students-bulk-add.tsx`
- [ ] `src/components/tpo/tpo-students-bulk-debar.tsx`
- [ ] `src/components/tpo/tpo-students-drive-visibility.tsx`
- [ ] `src/components/tpo/tpo-team-ask-panel.tsx`
- [ ] `src/components/tpo/tpo-team-message-actions.tsx`
- [ ] `src/components/tpo/tpo-timed-debar-control.tsx`
- [ ] `src/components/tracker/known-errors-workspace.tsx`
- [ ] `src/components/tracker/tracker-live-logs-explorer.tsx`
- [ ] `src/components/tracker/tracker-quick-report-launcher.tsx`
- [ ] `src/components/tracker/tracker-telegram-manual-panel.tsx`
- [ ] `src/components/ui/confirm-action-dialog.tsx`
- [ ] `src/components/ui/confirm-dialog.tsx`
- [ ] `src/components/ui/date-input.tsx`
- [ ] `src/components/ui/drawer.tsx`
- [ ] `src/components/ui/searchable-select.tsx`
- [ ] `src/components/verification/VerificationReviewDrawer.tsx`
- [ ] `src/components/activity/notification-toolbar.tsx`
- [ ] `src/components/verification/CollegeVerificationPanel.tsx`
- [ ] `src/components/auth/connection-failure-notice.tsx`
- [ ] `src/components/courses/course-detail-anchor-tabs.tsx`
- [ ] `src/components/placements/learner-placements-tabs.tsx`
- [ ] `src/components/public/error-page-view.tsx`
- [ ] `src/components/tpo/tpo-academic-import-preview.tsx`
- [ ] `src/components/ui/date-range-picker.tsx`
- [ ] `src/components/ui/long-text.tsx`
- [ ] `src/components/ui/permission-action.tsx`
- [ ] `src/app/(authenticated)/teacher/error.tsx`
- [ ] `src/app/(authenticated)/admin/layout.tsx`
- [ ] `src/app/(authenticated)/hr/error.tsx`
- [ ] `src/app/(authenticated)/teach/layout.tsx`
- [ ] `src/app/(authenticated)/hr/layout.tsx`
