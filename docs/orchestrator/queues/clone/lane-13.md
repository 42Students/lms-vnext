# Clone queue: lane chat-13

Generated from the code by the orchestrator's deviation audit. Work each section top to bottom, in batches of about 30 items. When an item is finished and proven, change its `[ ]` to `[x]` in this file in the same push. Never delete or reorder lines; only tick.

## Section 1: files that still deviate from the shared look (18)
Fix every listed deviation using the shared components in src/components/ui and the values in docs/design/ (shell spec, legacy-styles, ui-clone-checklist).

- [x] `src/app/company-share/[token]/page.tsx` (score 30: own <h1> (use PageHeader) x3, arbitrary px size x7, hand-rolled overlay (use Dialog/Drawer) x1)
- [x] `src/app/(authenticated)/admin/features/page.tsx` (score 11: arbitrary px size x11)
- [x] `src/components/tpo/tpo-bell-panel.tsx` (score 9: rounded-full pill x2, arbitrary px size x5)
- [x] `src/components/hr/hr-recruiter-bell.tsx` (score 7: rounded-full pill x3, arbitrary px size x1)
- [x] `src/app/(authenticated)/admin/classes/page.tsx` (score 5: arbitrary px size x5)
- [x] `src/components/admin/college-edit-dialog.tsx` (score 5: arbitrary px size x5)
- [x] `src/app/(authenticated)/admin/batch-promotion/page.tsx` (score 4: arbitrary px size x4)
- [x] `src/app/(authenticated)/admin/electives/page.tsx` (score 4: arbitrary px size x4)
- [x] `src/components/admin/college-create-form.tsx` (score 4: arbitrary px size x4)
- [x] `src/components/shell/learner-notification-bell.tsx` (score 4: rounded-full pill x1, arbitrary px size x2)
- [x] `src/components/shell/topbar/command-search.tsx` (score 4: arbitrary px size x4)
- [x] `src/app/(authenticated)/admin/colleges/page.tsx` (score 2: arbitrary px size x2)
- [x] `src/app/(authenticated)/admin/companies/page.tsx` (score 2: arbitrary px size x2)
- [x] `src/components/admin/college-bulk-import.tsx` (score 2: arbitrary px size x2)
- [x] `src/components/shell/topbar/tpo-find-suggestions.tsx` (score 2: arbitrary px size x2)
- [x] `src/components/admin/department-create-form.tsx` (score 1: arbitrary px size x1)
- [x] `src/components/admin/learner-module-access-drawer.tsx` (score 1: arbitrary px size x1)
- [x] `src/components/admin/organization-actions.tsx` (score 1: arbitrary px size x1)

## Section 2: page routes, full fidelity pass (23)
For each page: page head via PageHeader (title, subtitle, actions exactly as the old LMS), canvas card (white, radius 12, border #e5e9f0, padding 24), tabs, filter row, tables/grids/cards, chips and badges, banners and inline notices, every modal and drawer the page opens, buttons and forms, empty/loading/error states, toasts, spacing and typography values, and responsive at 1280, 768 and 375 widths. Read the page and the components it renders, fix every deviation you find, not only the listed ones.

- [x] `src/app/(authenticated)/admin/academics/sections/[sectionId]/page.tsx`
- [x] `src/app/(authenticated)/admin/announcements/page.tsx`
- [x] `src/app/(authenticated)/admin/attendance/page.tsx`
- [x] `src/app/(authenticated)/admin/audit/page.tsx`
- [x] `src/app/(authenticated)/admin/batch-promotion/page.tsx`
- [x] `src/app/(authenticated)/admin/batches/[batchId]/students/page.tsx`
- [x] `src/app/(authenticated)/admin/classes/page.tsx`
- [x] `src/app/(authenticated)/admin/colleges/page.tsx`
- [x] `src/app/(authenticated)/admin/companies/[companyId]/drives/page.tsx`
- [x] `src/app/(authenticated)/admin/companies/page.tsx`
- [x] `src/app/(authenticated)/admin/departments/page.tsx`
- [x] `src/app/(authenticated)/admin/domains/page.tsx`
- [x] `src/app/(authenticated)/admin/electives/page.tsx`
- [x] `src/app/(authenticated)/admin/features/[collegeId]/history/page.tsx`
- [x] `src/app/(authenticated)/admin/features/[collegeId]/page.tsx`
- [x] `src/app/(authenticated)/admin/features/[collegeId]/students/[membershipId]/history/page.tsx`
- [x] `src/app/(authenticated)/admin/features/[collegeId]/students/[membershipId]/page.tsx`
- [x] `src/app/(authenticated)/admin/features/[collegeId]/trace/page.tsx`
- [x] `src/app/(authenticated)/admin/features/page.tsx`
- [x] `src/app/(authenticated)/admin/projects/[projectId]/page.tsx`
- [x] `src/app/(authenticated)/superadmin/[...legacy]/page.tsx`
- [x] `src/app/(authenticated)/superadmin/page.tsx`
- [x] `src/app/company-share/[token]/page.tsx`
