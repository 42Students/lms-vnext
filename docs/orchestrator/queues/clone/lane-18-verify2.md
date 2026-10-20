# UI/UX polish VERIFICATION queue: lane chat-18 (surfaces polished by OTHER lanes)

32 surfaces. Each was already polished by another lane. Your job is to VERIFY and improve, strictly one surface at a time.

1. Regressions first (a polish pass edits many files without running code): matching tags, every import present and used, no duplicate attributes, no undeclared packages, props still match their component types, no removed export that another file imports. Fix anything broken.
2. Behaviour kept: ids, data-testid, aria labels, routes, permissions, form fields, wording (docs/audit/legacy-copy-A.md and B.md) and legacy tokens (docs/design) must be unchanged; if the polish dropped or reworded something, restore it.
3. Then judge the surface fresh as a senior product designer: is anything still cluttered, misaligned, duplicated or noisy? One obvious primary action? Aligned left edges and gaps on the legacy scale? Calm density? Real layouts at 375 and 768? Empty, loading, error states with a clear next step? Fix what you find.
4. Also check the route files in the same folder (loading, error, not-found, template) and the nearest parent layout.

Proof: ONE entry per surface in docs/audit/ux/verify-lane-18.md: surface | regressions found and fixed | extra clutter/alignment fixes | files changed (write 'verified, no change' only after a real read of every component). Tick [x] here and push to chatgpt/chat-18-b with [chat-18] after every 2 surfaces.


- [ ] `src/components/placements/tpo-drive-deadline-form.tsx`
- [ ] `src/components/tpo/grid/grid-workspace.tsx`
- [ ] `src/components/tpo/tpo-spreadsheet-grid.tsx`
- [ ] `src/components/placements/tpo-joining-update-form.tsx`
- [ ] `src/components/tpo/tpo-batch-invitation-control.tsx`
- [ ] `src/components/placements/college-drive-legacy-nav.tsx`
- [ ] `src/components/ui/input-group.tsx`
- [ ] `src/app/(authenticated)/error.tsx`
- [ ] `src/components/placements/super-admin-bulk-drive-actions.tsx`
- [ ] `src/components/placements/tpo-mark-own-notification-read.tsx`
- [ ] `src/components/tpo/tpo-batch-rule-editor.tsx`
- [ ] `src/app/(authenticated)/admin/features/[collegeId]/trace/page.tsx`
- [ ] `src/components/admin/college-branding-form.tsx`
- [ ] `src/components/admin/super-admin-college-company-actions.tsx`
- [ ] `src/components/courses/college-assignment-create.tsx`
- [ ] `src/components/courses/resource-progress-control.tsx`
- [ ] `src/components/admin/college-signin-method-form.tsx`
- [ ] `src/components/admin/tenant-domain-manager.tsx`
