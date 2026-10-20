# UI/UX polish VERIFICATION queue: lane chat-2 (surfaces polished by OTHER lanes)

48 surfaces. Each was already polished by another lane. Your job is to VERIFY and improve, strictly one surface at a time.

1. Regressions first (a polish pass edits many files without running code): matching tags, every import present and used, no duplicate attributes, no undeclared packages, props still match their component types, no removed export that another file imports. Fix anything broken.
2. Behaviour kept: ids, data-testid, aria labels, routes, permissions, form fields, wording (docs/audit/legacy-copy-A.md and B.md) and legacy tokens (docs/design) must be unchanged; if the polish dropped or reworded something, restore it.
3. Then judge the surface fresh as a senior product designer: is anything still cluttered, misaligned, duplicated or noisy? One obvious primary action? Aligned left edges and gaps on the legacy scale? Calm density? Real layouts at 375 and 768? Empty, loading, error states with a clear next step? Fix what you find.
4. Also check the route files in the same folder (loading, error, not-found, template) and the nearest parent layout.

Proof: ONE entry per surface in docs/audit/ux/verify-lane-2.md: surface | regressions found and fixed | extra clutter/alignment fixes | files changed (write 'verified, no change' only after a real read of every component). Tick [x] here and push to chatgpt/chat-2-b with [chat-2] after every 2 surfaces.


- [x] `src/components/placements/recruiter-result-controls.tsx`
- [x] `src/components/placements/tpo-interview-slot-planner.tsx`
- [ ] `src/components/tpo/tpo-batch-class-decision.tsx`
- [ ] `src/components/placements/tpo-bulk-drive-reminder.tsx`
- [ ] `src/components/placements/tpo-round-check-in.tsx`
- [ ] `src/components/tpo/tpo-company-memory-workspace.tsx`
- [ ] `src/components/public/browser-support-notice.tsx`
- [ ] `src/components/ui/password-input.tsx`
- [ ] `src/app/(authenticated)/loading.tsx`
- [ ] `src/components/placements/tpo-bulk-round-result-recorder.tsx`
- [ ] `src/components/placements/tpo-round-result-entry-form.tsx`
- [ ] `src/components/tpo/tpo-company-team-conversation.tsx`
- [ ] `src/app/(authenticated)/admin/features/page.tsx`
- [ ] `src/components/admin/college-logo-uploader.tsx`
- [ ] `src/components/admin/super-admin-platform-block-action.tsx`
- [ ] `src/components/courses/learner-course-discussion.tsx`
- [ ] `src/app/(authenticated)/teach/not-found.tsx`
- [ ] `src/components/admin/scoped-membership-lifecycle-actions.tsx`
- [ ] `src/components/admin/tenant-settings-other-keys.tsx`
