# UI/UX polish VERIFICATION queue: lane chat-12 (surfaces polished by OTHER lanes)

50 surfaces. Each was already polished by another lane. Your job is to VERIFY and improve, strictly one surface at a time.

1. Regressions first (a polish pass edits many files without running code): matching tags, every import present and used, no duplicate attributes, no undeclared packages, props still match their component types, no removed export that another file imports. Fix anything broken.
2. Behaviour kept: ids, data-testid, aria labels, routes, permissions, form fields, wording (docs/audit/legacy-copy-A.md and B.md) and legacy tokens (docs/design) must be unchanged; if the polish dropped or reworded something, restore it.
3. Then judge the surface fresh as a senior product designer: is anything still cluttered, misaligned, duplicated or noisy? One obvious primary action? Aligned left edges and gaps on the legacy scale? Calm density? Real layouts at 375 and 768? Empty, loading, error states with a clear next step? Fix what you find.
4. Also check the route files in the same folder (loading, error, not-found, template) and the nearest parent layout.

Proof: ONE entry per surface in docs/audit/ux/verify-lane-12.md: surface | regressions found and fixed | extra clutter/alignment fixes | files changed (write 'verified, no change' only after a real read of every component). Tick [x] here and push to chatgpt/chat-12-b with [chat-12] after every 2 surfaces.

- [x] `src/app/(authenticated)/tpo/messages/notifications/page.tsx`
- [x] `src/app/(authenticated)/tpo/messages/page.tsx`
- [x] `src/app/(authenticated)/tpo/more/page.tsx`
- [x] `src/app/(authenticated)/tpo/notifications/page.tsx`
- [x] `src/app/(authenticated)/tpo/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/about/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants/[applicationId]/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applications-export/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/cancel-preview/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/candidate-schedule/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/change-requests/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/close-preview/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/closeout/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/discussion/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/drive-day/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/edit/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/extend-deadline/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/interview-slots/page.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/joining/page.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/letters/page.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/[offerId]/page.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/page.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/page.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/[roundId]/results/page.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/[roundId]/slots/page.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/page.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/selections/page.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-audit/page.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-preview/page.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/shortlist/page.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/waitlist/page.tsx`
- [ ] `src/components/placements/drive-day-roster.tsx`
- [ ] `src/components/placements/placement-calendar-workspace.tsx`
- [ ] `src/components/placements/placement-drive-workspace.tsx`
- [ ] `src/components/placements/placement-recruiter-access.tsx`
- [ ] `src/components/placements/recruiter-focused-review-shortcuts.tsx`
- [ ] `src/components/placements/super-admin-bulk-drive-actions.tsx`
- [ ] `src/components/placements/tpo-bulk-round-result-recorder.tsx`
- [ ] `src/components/placements/tpo-drive-clone-action.tsx`
- [ ] `src/components/placements/tpo-drive-workspace-nav.tsx`
- [ ] `src/components/placements/tpo-mark-own-notification-read.tsx`
- [ ] `src/components/placements/tpo-round-result-entry-form.tsx`
- [ ] `src/components/placements/tpo-trust-toggle.tsx`
- [ ] `src/components/tpo/tpo-applications-spreadsheet.tsx`
- [ ] `src/components/tpo/tpo-batch-rule-editor.tsx`
- [ ] `src/components/tpo/tpo-company-team-conversation.tsx`
- [ ] `src/components/tpo/tpo-notice-undo-toast.tsx`
- [ ] `src/components/tpo/tpo-topbar-new-menu.tsx`
