# UI/UX polish VERIFICATION queue: lane chat-17 (surfaces polished by OTHER lanes)

43 surfaces. Each was already polished by another lane. Your job is to VERIFY and improve, strictly one surface at a time.

1. Regressions first (a polish pass edits many files without running code): matching tags, every import present and used, no duplicate attributes, no undeclared packages, props still match their component types, no removed export that another file imports. Fix anything broken.
2. Behaviour kept: ids, data-testid, aria labels, routes, permissions, form fields, wording (docs/audit/legacy-copy-A.md and B.md) and legacy tokens (docs/design) must be unchanged; if the polish dropped or reworded something, restore it.
3. Then judge the surface fresh as a senior product designer: is anything still cluttered, misaligned, duplicated or noisy? One obvious primary action? Aligned left edges and gaps on the legacy scale? Calm density? Real layouts at 375 and 768? Empty, loading, error states with a clear next step? Fix what you find.
4. Also check the route files in the same folder (loading, error, not-found, template) and the nearest parent layout.

Proof: ONE entry per surface in docs/audit/ux/verify-lane-17.md: surface | regressions found and fixed | extra clutter/alignment fixes | files changed (write 'verified, no change' only after a real read of every component). Tick [x] here and push to chatgpt/chat-17-b with [chat-17] after every 2 surfaces.

- [x] `src/app/(authenticated)/admin/placements/shortlisted/page.tsx`
- [x] `src/app/(authenticated)/admin/placements/student-lookup/page.tsx`
- [x] `src/app/(authenticated)/admin/programs/page.tsx`
- [x] `src/app/(authenticated)/admin/projects/[projectId]/[section]/page.tsx`
- [x] `src/app/(authenticated)/admin/projects/[projectId]/page.tsx`
- [x] `src/app/(authenticated)/admin/projects/[projectId]/readiness/page.tsx`
- [x] `src/app/(authenticated)/admin/projects/at-risk/page.tsx`
- [x] `src/app/(authenticated)/admin/projects/audit/page.tsx`
- [ ] `src/app/(authenticated)/admin/projects/page.tsx`
- [ ] `src/app/(authenticated)/admin/projects/readiness/page.tsx`
- [ ] `src/app/(authenticated)/admin/projects/reassign-mentor/page.tsx`
- [ ] `src/app/(authenticated)/admin/projects/submissions/page.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/colleges/page.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/overview/page.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/page.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/resources/page.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/sprints/page.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/tasks/page.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/versions/page.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/new/page.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/page.tsx`
- [ ] `src/app/(authenticated)/admin/projects/workspaces/new/page.tsx`
- [ ] `src/app/(authenticated)/admin/quizzes/page.tsx`
- [ ] `src/app/(authenticated)/admin/recruiters/page.tsx`
- [ ] `src/app/(authenticated)/admin/resources/page.tsx`
- [ ] `src/app/(authenticated)/admin/semester-courses/page.tsx`
- [ ] `src/app/(authenticated)/admin/semesters/page.tsx`
- [ ] `src/app/(authenticated)/admin/settings/auth/page.tsx`
- [ ] `src/app/(authenticated)/admin/settings/page.tsx`
- [ ] `src/app/(authenticated)/admin/students/page.tsx`
- [ ] `src/app/(authenticated)/admin/tenants/create/page.tsx`
- [ ] `src/app/(authenticated)/admin/tenants/page.tsx`
- [ ] `src/app/(authenticated)/admin/tenants/setup/page.tsx`
- [ ] `src/app/(authenticated)/admin/verification/page.tsx`
- [ ] `src/app/(authenticated)/admin/videos/page.tsx`
- [ ] `src/components/admin/college-admin-lifecycle-action.tsx`
- [ ] `src/components/admin/college-feature-rule-editor.tsx`
- [ ] `src/components/admin/managed-college-subdomain.tsx`
- [ ] `src/components/admin/student-rule-editor.tsx`
- [ ] `src/components/admin/super-admin-batch-roster-manager.tsx`
- [ ] `src/components/admin/super-admin-company-verification.tsx`
- [ ] `src/components/admin/tenant-restore-action.tsx`
