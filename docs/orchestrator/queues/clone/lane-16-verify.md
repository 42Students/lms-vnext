# UI/UX polish VERIFICATION queue: lane chat-16 (surfaces polished by OTHER lanes)

46 surfaces. Each was already polished by another lane. Your job is to VERIFY and improve, strictly one surface at a time.

1. Regressions first (a polish pass edits many files without running code): matching tags, every import present and used, no duplicate attributes, no undeclared packages, props still match their component types, no removed export that another file imports. Fix anything broken.
2. Behaviour kept: ids, data-testid, aria labels, routes, permissions, form fields, wording (docs/audit/legacy-copy-A.md and B.md) and legacy tokens (docs/design) must be unchanged; if the polish dropped or reworded something, restore it.
3. Then judge the surface fresh as a senior product designer: is anything still cluttered, misaligned, duplicated or noisy? One obvious primary action? Aligned left edges and gaps on the legacy scale? Calm density? Real layouts at 375 and 768? Empty, loading, error states with a clear next step? Fix what you find.
4. Also check the route files in the same folder (loading, error, not-found, template) and the nearest parent layout.

Proof: ONE entry per surface in docs/audit/ux/verify-lane-16.md: surface | regressions found and fixed | extra clutter/alignment fixes | files changed (write 'verified, no change' only after a real read of every component). Tick [x] here and push to chatgpt/chat-16-b with [chat-16] after every 2 surfaces.

- [x] `src/app/(authenticated)/admin/inbound-mail/page.tsx`
- [x] `src/app/(authenticated)/admin/lecture-halls/[hallId]/page.tsx`
- [x] `src/app/(authenticated)/admin/lecture-halls/page.tsx`
- [x] `src/app/(authenticated)/admin/lessons/page.tsx`
- [x] `src/app/(authenticated)/admin/live-classes/page.tsx`
- [x] `src/app/(authenticated)/admin/module-access/page.tsx`
- [x] `src/app/(authenticated)/admin/organizations/page.tsx`
- [x] `src/app/(authenticated)/admin/people/directory/[membershipId]/audit/page.tsx`
- [x] `src/app/(authenticated)/admin/people/directory/[membershipId]/page.tsx`
- [x] `src/app/(authenticated)/admin/people/directory/page.tsx`
- [x] `src/app/(authenticated)/admin/people/page.tsx`
- [x] `src/app/(authenticated)/admin/people/unassigned/page.tsx`
- [x] `src/app/(authenticated)/admin/placements/analytics/page.tsx`
- [x] `src/app/(authenticated)/admin/placements/applications/[applicationId]/page.tsx`
- [x] `src/app/(authenticated)/admin/placements/applications/page.tsx`
- [x] `src/app/(authenticated)/admin/placements/calendar/page.tsx`
- [x] `src/app/(authenticated)/admin/placements/drives/page.tsx`
- [x] `src/app/(authenticated)/admin/placements/hiring/page.tsx`
- [x] `src/app/(authenticated)/admin/placements/interviews/[roundId]/page.tsx`
- [x] `src/app/(authenticated)/admin/placements/interviews/page.tsx`
- [x] `src/app/(authenticated)/admin/placements/job-settings/[jobId]/page.tsx`
- [x] `src/app/(authenticated)/admin/placements/job-settings/page.tsx`
- [x] `src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx`
- [x] `src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx`
- [x] `src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx`
- [x] `src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx`
- [x] `src/app/(authenticated)/admin/placements/joining/[offerId]/page.tsx`
- [x] `src/app/(authenticated)/admin/placements/joining/page.tsx`
- [x] `src/app/(authenticated)/admin/placements/new/page.tsx`
- [x] `src/app/(authenticated)/admin/placements/offers/[offerId]/page.tsx`
- [x] `src/app/(authenticated)/admin/placements/offers/page.tsx`
- [x] `src/app/(authenticated)/admin/placements/page.tsx`
- [x] `src/app/(authenticated)/admin/placements/retention/page.tsx`
- [ ] `src/app/(authenticated)/admin/placements/screenings/[applicationId]/page.tsx`
- [ ] `src/app/(authenticated)/admin/placements/screenings/page.tsx`
- [ ] `src/app/(authenticated)/admin/placements/seasons/[seasonId]/page.tsx`
- [ ] `src/app/(authenticated)/admin/placements/seasons/page.tsx`
- [ ] `src/app/(authenticated)/admin/placements/shortlisted/[applicationId]/page.tsx`
- [ ] `src/components/admin/admin-revoke-sessions.tsx`
- [ ] `src/components/admin/college-bulk-import.tsx`
- [ ] `src/components/admin/college-signin-method-form.tsx`
- [ ] `src/components/admin/scoped-membership-lifecycle-actions.tsx`
- [ ] `src/components/admin/super-admin-batch-graduate-action.tsx`
- [ ] `src/components/admin/super-admin-company-merge.tsx`
- [ ] `src/components/admin/tenant-domain-manager.tsx`
- [ ] `src/components/admin/tenant-settings-other-keys.tsx`
