# UI/UX polish VERIFICATION queue: lane chat-15 (surfaces polished by OTHER lanes)

46 surfaces. Each was already polished by another lane. Your job is to VERIFY and improve, strictly one surface at a time.

1. Regressions first (a polish pass edits many files without running code): matching tags, every import present and used, no duplicate attributes, no undeclared packages, props still match their component types, no removed export that another file imports. Fix anything broken.
2. Behaviour kept: ids, data-testid, aria labels, routes, permissions, form fields, wording (docs/audit/legacy-copy-A.md and B.md) and legacy tokens (docs/design) must be unchanged; if the polish dropped or reworded something, restore it.
3. Then judge the surface fresh as a senior product designer: is anything still cluttered, misaligned, duplicated or noisy? One obvious primary action? Aligned left edges and gaps on the legacy scale? Calm density? Real layouts at 375 and 768? Empty, loading, error states with a clear next step? Fix what you find.
4. Also check the route files in the same folder (loading, error, not-found, template) and the nearest parent layout.

Proof: ONE entry per surface in docs/audit/ux/verify-lane-15.md: surface | regressions found and fixed | extra clutter/alignment fixes | files changed (write 'verified, no change' only after a real read of every component). Tick [x] here and push to chatgpt/chat-15-b with [chat-15] after every 2 surfaces.

- [x] `src/app/(authenticated)/admin/academics/page.tsx`
- [x] `src/app/(authenticated)/admin/academics/sections/[sectionId]/page.tsx`
- [x] `src/app/(authenticated)/admin/announcements/page.tsx`
- [x] `src/app/(authenticated)/admin/assignments/page.tsx`
- [x] `src/app/(authenticated)/admin/attendance/page.tsx`
- [x] `src/app/(authenticated)/admin/audit/page.tsx`
- [x] `src/app/(authenticated)/admin/batch-promotion/page.tsx`
- [x] `src/app/(authenticated)/admin/batches/[batchId]/students/page.tsx`
- [x] `src/app/(authenticated)/admin/batches/page.tsx`
- [x] `src/app/(authenticated)/admin/classes/page.tsx`
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/history/page.tsx`
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/page.tsx`
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx`
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/readiness/page.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/verification/page.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/page.tsx`
- [ ] `src/app/(authenticated)/admin/companies/[companyId]/drives/page.tsx`
- [ ] `src/app/(authenticated)/admin/companies/page.tsx`
- [ ] `src/app/(authenticated)/admin/course-progress/page.tsx`
- [ ] `src/app/(authenticated)/admin/course-progress/students/page.tsx`
- [ ] `src/app/(authenticated)/admin/courses/offerings/[offeringId]/page.tsx`
- [ ] `src/app/(authenticated)/admin/courses/page.tsx`
- [ ] `src/app/(authenticated)/admin/departments/page.tsx`
- [ ] `src/app/(authenticated)/admin/domains/page.tsx`
- [ ] `src/app/(authenticated)/admin/electives/page.tsx`
- [ ] `src/app/(authenticated)/admin/faculty-assignment/page.tsx`
- [ ] `src/app/(authenticated)/admin/faculty/page.tsx`
- [ ] `src/app/(authenticated)/admin/features/[collegeId]/history/page.tsx`
- [ ] `src/app/(authenticated)/admin/features/[collegeId]/page.tsx`
- [ ] `src/app/(authenticated)/admin/features/[collegeId]/students/[membershipId]/history/page.tsx`
- [ ] `src/app/(authenticated)/admin/features/[collegeId]/students/[membershipId]/page.tsx`
- [ ] `src/app/(authenticated)/admin/features/[collegeId]/trace/page.tsx`
- [ ] `src/app/(authenticated)/admin/features/page.tsx`
- [ ] `src/app/(authenticated)/admin/hr/page.tsx`
- [ ] `src/components/admin/admin-program-directory.tsx`
- [ ] `src/components/admin/college-branding-form.tsx`
- [ ] `src/components/admin/college-logo-uploader.tsx`
- [ ] `src/components/admin/organization-create-form.tsx`
- [ ] `src/components/admin/super-admin-attendance-settings-editor.tsx`
- [ ] `src/components/admin/super-admin-college-company-actions.tsx`
- [ ] `src/components/admin/super-admin-platform-block-action.tsx`
- [ ] `src/components/admin/tenant-settings-editor.tsx`
