# UI/UX polish VERIFICATION queue: lane chat-5 (surfaces polished by OTHER lanes)

40 surfaces. Each was already polished by another lane. Your job is to VERIFY and improve, strictly one surface at a time.

1. Regressions first (a polish pass edits many files without running code): matching tags, every import present and used, no duplicate attributes, no undeclared packages, props still match their component types, no removed export that another file imports. Fix anything broken.
2. Behaviour kept: ids, data-testid, aria labels, routes, permissions, form fields, wording (docs/audit/legacy-copy-A.md and B.md) and legacy tokens (docs/design) must be unchanged; if the polish dropped or reworded something, restore it.
3. Then judge the surface fresh as a senior product designer: is anything still cluttered, misaligned, duplicated or noisy? One obvious primary action? Aligned left edges and gaps on the legacy scale? Calm density? Real layouts at 375 and 768? Empty, loading, error states with a clear next step? Fix what you find.
4. Also check the route files in the same folder (loading, error, not-found, template) and the nearest parent layout.

Proof: ONE entry per surface in docs/audit/ux/verify-lane-5.md: surface | regressions found and fixed | extra clutter/alignment fixes | files changed (write 'verified, no change' only after a real read of every component). Tick [x] here and push to chatgpt/chat-5-b with [chat-5] after every 2 surfaces.

- [x] `src/app/(authenticated)/recruiter/calendar/page.tsx`
- [x] `src/app/(authenticated)/recruiter/colleges/page.tsx`
- [x] `src/app/(authenticated)/recruiter/company/page.tsx`
- [x] `src/app/(authenticated)/recruiter/drives/[jobId]/change-requests/page.tsx`
- [x] `src/app/(authenticated)/recruiter/drives/[jobId]/interview-slots/page.tsx`
- [x] `src/app/(authenticated)/recruiter/drives/[jobId]/messages/page.tsx`
- [x] `src/app/(authenticated)/recruiter/drives/[jobId]/page.tsx`
- [x] `src/app/(authenticated)/recruiter/drives/[jobId]/rounds/editor/page.tsx`
- [x] `src/app/(authenticated)/recruiter/drives/[jobId]/rounds/editor/remove/[roundId]/page.tsx`
- [x] `src/app/(authenticated)/recruiter/drives/new/page.tsx`
- [x] `src/app/(authenticated)/recruiter/drives/page.tsx`
- [x] `src/app/(authenticated)/recruiter/drives/proposals/page.tsx`
- [x] `src/app/(authenticated)/recruiter/drives/recorded-outside/page.tsx`
- [x] `src/app/(authenticated)/recruiter/home/page.tsx`
- [x] `src/app/(authenticated)/recruiter/messages/page.tsx`
- [x] `src/app/(authenticated)/recruiter/page.tsx`
- [x] `src/app/(authenticated)/recruiter/profile/page.tsx`
- [x] `src/app/(authenticated)/tracker/audit-findings/[publicId]/page.tsx`
- [x] `src/app/(authenticated)/tracker/audit-findings/page.tsx`
- [x] `src/app/(authenticated)/tracker/issues/[publicId]/page.tsx`
- [x] `src/app/(authenticated)/tracker/issues/page.tsx`
- [x] `src/app/(authenticated)/tracker/logs/page.tsx`
- [x] `src/app/(authenticated)/tracker/mine/[publicId]/page.tsx`
- [x] `src/app/(authenticated)/tracker/mine/page.tsx`
- [ ] `src/app/(authenticated)/tracker/page.tsx`
- [ ] `src/app/auth/handoff/page.tsx`
- [ ] `src/app/campaign-unsubscribe/[token]/page.tsx`
- [ ] `src/app/campaign-unsubscribe/confirmed/page.tsx`
- [ ] `src/app/college-join/[token]/page.tsx`
- [ ] `src/app/company-join/[token]/page.tsx`
- [ ] `src/app/company-share/[token]/page.tsx`
- [ ] `src/app/e2e/chat17-ui-kit/page.tsx`
- [ ] `src/app/e2e/superadmin-login/page.tsx`
- [ ] `src/app/enterprises/page.tsx`
- [ ] `src/app/forbidden/page.tsx`
- [ ] `src/app/home/page.tsx`
- [ ] `src/app/hr-invite/[token]/page.tsx`
- [ ] `src/app/login/page.tsx`
- [ ] `src/components/tracker/tracker-issue-bulk-actions.tsx`
- [ ] `src/components/tracker/tracker-workflow-panel.tsx`
