# UI/UX polish VERIFICATION queue: lane chat-11 (surfaces polished by OTHER lanes)

50 surfaces. Each was already polished by another lane. Your job is to VERIFY and improve, strictly one surface at a time.

1. Regressions first (a polish pass edits many files without running code): matching tags, every import present and used, no duplicate attributes, no undeclared packages, props still match their component types, no removed export that another file imports. Fix anything broken.
2. Behaviour kept: ids, data-testid, aria labels, routes, permissions, form fields, wording (docs/audit/legacy-copy-A.md and B.md) and legacy tokens (docs/design) must be unchanged; if the polish dropped or reworded something, restore it.
3. Then judge the surface fresh as a senior product designer: is anything still cluttered, misaligned, duplicated or noisy? One obvious primary action? Aligned left edges and gaps on the legacy scale? Calm density? Real layouts at 375 and 768? Empty, loading, error states with a clear next step? Fix what you find.
4. Also check the route files in the same folder (loading, error, not-found, template) and the nearest parent layout.

Proof: ONE entry per surface in docs/audit/ux/verify-lane-11.md: surface | regressions found and fixed | extra clutter/alignment fixes | files changed (write 'verified, no change' only after a real read of every component). Tick [x] here and push to chatgpt/chat-11-b with [chat-11] after every 2 surfaces.

- [x] `src/app/(authenticated)/tpo/announcements/page.tsx`
- [x] `src/app/(authenticated)/tpo/audit/actors/page.tsx`
- [x] `src/app/(authenticated)/tpo/audit/page.tsx`
- [x] `src/app/(authenticated)/tpo/batches/[batchId]/classes/page.tsx`
- [x] `src/app/(authenticated)/tpo/batches/[batchId]/history/page.tsx`
- [x] `src/app/(authenticated)/tpo/batches/[batchId]/invitation-prep/page.tsx`
- [x] `src/app/(authenticated)/tpo/batches/[batchId]/nudge-prep/page.tsx`
- [x] `src/app/(authenticated)/tpo/batches/[batchId]/page.tsx`
- [x] `src/app/(authenticated)/tpo/batches/[batchId]/registrations/[membershipId]/history/page.tsx`
- [x] `src/app/(authenticated)/tpo/batches/[batchId]/registrations/page.tsx`
- [x] `src/app/(authenticated)/tpo/batches/[batchId]/reminder-prep/page.tsx`
- [x] `src/app/(authenticated)/tpo/batches/[batchId]/rules/page.tsx`
- [ ] `src/app/(authenticated)/tpo/batches/[batchId]/students/page.tsx`
- [ ] `src/app/(authenticated)/tpo/batches/page.tsx`
- [ ] `src/app/(authenticated)/tpo/calendar/export/page.tsx`
- [ ] `src/app/(authenticated)/tpo/calendar/interviews/page.tsx`
- [ ] `src/app/(authenticated)/tpo/calendar/page.tsx`
- [ ] `src/app/(authenticated)/tpo/calendar/rounds/page.tsx`
- [ ] `src/app/(authenticated)/tpo/companies/[companyId]/contact-log/page.tsx`
- [ ] `src/app/(authenticated)/tpo/companies/[companyId]/feedback/page.tsx`
- [ ] `src/app/(authenticated)/tpo/companies/[companyId]/manage/page.tsx`
- [ ] `src/app/(authenticated)/tpo/companies/[companyId]/page.tsx`
- [ ] `src/app/(authenticated)/tpo/companies/[companyId]/people/page.tsx`
- [ ] `src/app/(authenticated)/tpo/companies/[companyId]/team/page.tsx`
- [ ] `src/app/(authenticated)/tpo/companies/archived/page.tsx`
- [ ] `src/app/(authenticated)/tpo/companies/page.tsx`
- [ ] `src/app/(authenticated)/tpo/drive-day/[roundId]/no-shows/page.tsx`
- [ ] `src/app/(authenticated)/tpo/drive-day/[roundId]/page.tsx`
- [ ] `src/app/(authenticated)/tpo/drive-day/page.tsx`
- [ ] `src/app/(authenticated)/tpo/find/page.tsx`
- [ ] `src/app/(authenticated)/tpo/follow-ups/page.tsx`
- [ ] `src/app/(authenticated)/tpo/home/page.tsx`
- [ ] `src/app/(authenticated)/tpo/messages/[threadId]/page.tsx`
- [ ] `src/components/placements/college-interview-status-actions.tsx`
- [ ] `src/components/placements/learner-placement-requests.tsx`
- [ ] `src/components/placements/placement-drive-controls.tsx`
- [ ] `src/components/placements/placement-job-lifecycle-controls.tsx`
- [ ] `src/components/placements/placement-season-manager.tsx`
- [ ] `src/components/placements/report-interactive-table.tsx`
- [ ] `src/components/placements/tpo-bulk-drive-reminder.tsx`
- [ ] `src/components/placements/tpo-drive-change-requests.tsx`
- [ ] `src/components/placements/tpo-drive-saved-views.tsx`
- [ ] `src/components/placements/tpo-joining-update-form.tsx`
- [ ] `src/components/placements/tpo-round-check-in.tsx`
- [ ] `src/components/placements/tpo-selection-import.tsx`
- [ ] `src/components/tpo/recruiter-roster-display-controls.tsx`
- [ ] `src/components/tpo/tpo-batch-invitation-control.tsx`
- [ ] `src/components/tpo/tpo-company-memory-workspace.tsx`
- [ ] `src/components/tpo/tpo-mobile-footer.tsx`
- [ ] `src/components/tpo/tpo-team-assign-unowned.tsx`
