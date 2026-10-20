# UI/UX polish VERIFICATION queue: lane chat-14 (surfaces polished by OTHER lanes)

47 surfaces. Each was already polished by another lane. Your job is to VERIFY and improve, strictly one surface at a time.

1. Regressions first (a polish pass edits many files without running code): matching tags, every import present and used, no duplicate attributes, no undeclared packages, props still match their component types, no removed export that another file imports. Fix anything broken.
2. Behaviour kept: ids, data-testid, aria labels, routes, permissions, form fields, wording (docs/audit/legacy-copy-A.md and B.md) and legacy tokens (docs/design) must be unchanged; if the polish dropped or reworded something, restore it.
3. Then judge the surface fresh as a senior product designer: is anything still cluttered, misaligned, duplicated or noisy? One obvious primary action? Aligned left edges and gaps on the legacy scale? Calm density? Real layouts at 375 and 768? Empty, loading, error states with a clear next step? Fix what you find.
4. Also check the route files in the same folder (loading, error, not-found, template) and the nearest parent layout.

Proof: ONE entry per surface in docs/audit/ux/verify-lane-14.md: surface | regressions found and fixed | extra clutter/alignment fixes | files changed (write 'verified, no change' only after a real read of every component). Tick [x] here and push to chatgpt/chat-14-b with [chat-14] after every 2 surfaces.

- [x] `src/app/(authenticated)/tpo/reports/season-pipeline/page.tsx`
- [x] `src/app/(authenticated)/tpo/reports/unplaced/page.tsx`
- [x] `src/app/(authenticated)/tpo/requests/page.tsx`
- [x] `src/app/(authenticated)/tpo/settings/after-college/page.tsx`
- [x] `src/app/(authenticated)/tpo/settings/blocked-dates/page.tsx`
- [x] `src/app/(authenticated)/tpo/settings/branding/page.tsx`
- [x] `src/app/(authenticated)/tpo/settings/job-types/page.tsx`
- [x] `src/app/(authenticated)/tpo/settings/notices/page.tsx`
- [x] `src/app/(authenticated)/tpo/settings/notifications/page.tsx`
- [x] `src/app/(authenticated)/tpo/settings/page.tsx`
- [x] `src/app/(authenticated)/tpo/settings/prep-readiness/page.tsx`
- [x] `src/app/(authenticated)/tpo/settings/public-link/page.tsx`
- [x] `src/app/(authenticated)/tpo/settings/public-page/page.tsx`
- [x] `src/app/(authenticated)/tpo/settings/recruiters/page.tsx`
- [x] `src/app/(authenticated)/tpo/settings/rules/page.tsx`
- [x] `src/app/(authenticated)/tpo/settings/season/page.tsx`
- [x] `src/app/(authenticated)/tpo/settings/see/page.tsx`
- [x] `src/app/(authenticated)/tpo/settings/team/page.tsx`
- [x] `src/app/(authenticated)/tpo/settings/templates/page.tsx`
- [x] `src/app/(authenticated)/tpo/settings/trusted/page.tsx`
- [x] `src/app/(authenticated)/tpo/students/[membershipId]/history/page.tsx`
- [x] `src/app/(authenticated)/tpo/students/[membershipId]/participation/page.tsx`
- [ ] `src/app/(authenticated)/tpo/students/page.tsx`
- [ ] `src/app/(authenticated)/tpo/students/preparation-plan/page.tsx`
- [ ] `src/app/(authenticated)/tpo/students/preparation-prep/page.tsx`
- [ ] `src/app/(authenticated)/tpo/students/requests/page.tsx`
- [ ] `src/app/(authenticated)/tpo/team/[threadId]/page.tsx`
- [ ] `src/app/(authenticated)/tpo/team/company/[companyId]/page.tsx`
- [ ] `src/app/(authenticated)/tpo/team/everyone/page.tsx`
- [ ] `src/app/(authenticated)/tpo/team/page.tsx`
- [ ] `src/app/(authenticated)/tpo/verification/page.tsx`
- [ ] `src/components/placements/learner-placement-preferences.tsx`
- [ ] `src/components/placements/placement-draft-edit-form.tsx`
- [ ] `src/components/placements/placement-job-create-form.tsx`
- [ ] `src/components/placements/placement-role-options.tsx`
- [ ] `src/components/placements/recruiter-result-controls.tsx`
- [ ] `src/components/placements/super-admin-drive-duplicate.tsx`
- [ ] `src/components/placements/tpo-drive-act-on-panel.tsx`
- [ ] `src/components/placements/tpo-drive-deadline-form.tsx`
- [ ] `src/components/placements/tpo-interview-slot-planner.tsx`
- [ ] `src/components/placements/tpo-round-calendar-control.tsx`
- [ ] `src/components/placements/tpo-season-controls.tsx`
- [ ] `src/components/tpo/grid/grid-workspace.tsx`
- [ ] `src/components/tpo/tpo-batch-class-decision.tsx`
- [ ] `src/components/tpo/tpo-campaign-send-control.tsx`
- [ ] `src/components/tpo/tpo-grid-filter-panel.tsx`
- [ ] `src/components/tpo/tpo-spreadsheet-grid.tsx`
