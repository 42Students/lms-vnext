# UI/UX polish VERIFICATION queue: lane chat-4 (surfaces polished by OTHER lanes)

42 surfaces. Each was already polished by another lane. Your job is to VERIFY and improve, strictly one surface at a time.

1. Regressions first (a polish pass edits many files without running code): matching tags, every import present and used, no duplicate attributes, no undeclared packages, props still match their component types, no removed export that another file imports. Fix anything broken.
2. Behaviour kept: ids, data-testid, aria labels, routes, permissions, form fields, wording (docs/audit/legacy-copy-A.md and B.md) and legacy tokens (docs/design) must be unchanged; if the polish dropped or reworded something, restore it.
3. Then judge the surface fresh as a senior product designer: is anything still cluttered, misaligned, duplicated or noisy? One obvious primary action? Aligned left edges and gaps on the legacy scale? Calm density? Real layouts at 375 and 768? Empty, loading, error states with a clear next step? Fix what you find.
4. Also check the route files in the same folder (loading, error, not-found, template) and the nearest parent layout.

Proof: ONE entry per surface in docs/audit/ux/verify-lane-4.md: surface | regressions found and fixed | extra clutter/alignment fixes | files changed (write 'verified, no change' only after a real read of every component). Tick [x] here and push to chatgpt/chat-4-b with [chat-4] after every 2 surfaces.

- [x] `src/app/(authenticated)/hr/activity/page.tsx`
- [x] `src/app/(authenticated)/hr/calendar/page.tsx`
- [x] `src/app/(authenticated)/hr/colleges/page.tsx`
- [x] `src/app/(authenticated)/hr/company/page.tsx`
- [x] `src/app/(authenticated)/hr/company/reports/page.tsx`
- [x] `src/app/(authenticated)/hr/conversations/[threadId]/page.tsx`
- [x] `src/app/(authenticated)/hr/conversations/page.tsx`
- [x] `src/app/(authenticated)/hr/drives/[jobId]/interview-slots/page.tsx`
- [x] `src/app/(authenticated)/hr/drives/[jobId]/messages/page.tsx`
- [x] `src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/page.tsx`
- [x] `src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/remove/[roundId]/page.tsx`
- [x] `src/app/(authenticated)/hr/drives/new/page.tsx`
- [x] `src/app/(authenticated)/hr/drives/page.tsx`
- [x] `src/app/(authenticated)/hr/drives/proposals/page.tsx`
- [x] `src/app/(authenticated)/hr/drives/recorded-outside/page.tsx`
- [x] `src/app/(authenticated)/hr/home/page.tsx`
- [x] `src/app/(authenticated)/hr/messages/page.tsx`
- [x] `src/app/(authenticated)/hr/notifications/page.tsx`
- [x] `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx`
- [x] `src/app/(authenticated)/hr/placements/page.tsx`
- [x] `src/app/(authenticated)/hr/profile/page.tsx`
- [x] `src/app/(authenticated)/hr/round-results/page.tsx`
- [x] `src/app/(authenticated)/account/security/page.tsx`
- [x] `src/app/(authenticated)/activity/[eventId]/page.tsx`
- [x] `src/app/(authenticated)/activity/page.tsx`
- [x] `src/app/(authenticated)/college-admin/departments/page.tsx`
- [x] `src/app/(authenticated)/college-admin/programs/page.tsx`
- [x] `src/app/(authenticated)/dashboard/page.tsx`
- [x] `src/app/(authenticated)/notifications/page.tsx`
- [x] `src/app/(authenticated)/superadmin/[...legacy]/page.tsx`
- [x] `src/app/(authenticated)/superadmin/departments/page.tsx`
- [x] `src/app/(authenticated)/superadmin/page.tsx`
- [x] `src/app/(authenticated)/superadmin/programs/page.tsx`
- [x] `src/app/(authenticated)/teach/courses/[deliveryId]/page.tsx`
- [x] `src/app/(authenticated)/teach/courses/page.tsx`
- [x] `src/components/hr/hr-drive-draft-form.tsx`
- [x] `src/components/hr/hr-unsent-drive-alert.tsx`
- [x] `src/components/hr/recruiter-conversation-live-refresh.tsx`
- [x] `src/components/hr/recruiter-conversation-reply-form.tsx`
- [ ] `src/components/hr/recruiter-profile-access.tsx`
- [ ] `src/components/hr/recruiter-profile-details-editor.tsx`
- [ ] `src/components/hr/recruiter-request-cancel-button.tsx`
