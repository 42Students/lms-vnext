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
- [x] `src/components/tpo/tpo-students-assign-prep.tsx`
- [x] `src/components/tpo/tpo-students-bulk-add.tsx`
- [x] `src/components/tpo/tpo-students-bulk-debar.tsx`
- [x] `src/components/tpo/tpo-students-drive-visibility.tsx`
- [x] `src/components/tpo/tpo-team-ask-panel.tsx`
- [x] `src/components/tpo/tpo-team-message-actions.tsx`
- [x] `src/components/tpo/tpo-timed-debar-control.tsx`
- [x] `src/components/tracker/known-errors-workspace.tsx`
- [x] `src/components/tracker/tracker-live-logs-explorer.tsx`
- [x] `src/components/tracker/tracker-quick-report-launcher.tsx`
- [x] `src/components/tracker/tracker-telegram-manual-panel.tsx`
- [x] `src/components/ui/confirm-action-dialog.tsx`
- [x] `src/components/ui/confirm-dialog.tsx`
- [x] `src/components/ui/date-input.tsx`
- [x] `src/components/ui/drawer.tsx`
- [x] `src/components/ui/searchable-select.tsx`
- [x] `src/components/verification/VerificationReviewDrawer.tsx`
- [x] `src/components/activity/notification-toolbar.tsx`
- [x] `src/components/verification/CollegeVerificationPanel.tsx`
- [x] `src/components/auth/connection-failure-notice.tsx`
- [x] `src/components/courses/course-detail-anchor-tabs.tsx`
- [x] `src/components/placements/learner-placements-tabs.tsx`
- [x] `src/components/public/error-page-view.tsx`
- [x] `src/components/tpo/tpo-academic-import-preview.tsx`
- [x] `src/components/ui/date-range-picker.tsx`
- [x] `src/components/ui/long-text.tsx`
- [x] `src/components/ui/permission-action.tsx`
- [x] `src/app/(authenticated)/teacher/error.tsx`
- [x] `src/app/(authenticated)/admin/layout.tsx`
- [x] `src/app/(authenticated)/hr/error.tsx`
- [x] `src/app/(authenticated)/teach/layout.tsx`
- [x] `src/app/(authenticated)/hr/layout.tsx`
