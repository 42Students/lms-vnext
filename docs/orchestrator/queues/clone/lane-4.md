# Clone queue: lane chat-4

Generated from the code by the orchestrator's deviation audit. Work each section top to bottom, in batches of about 30 items. When an item is finished and proven, change its `[ ]` to `[x]` in this file in the same push. Never delete or reorder lines; only tick.

## Section 1: files that still deviate from the shared look (18)
Fix every listed deviation using the shared components in src/components/ui and the values in docs/design/ (shell spec, legacy-styles, ui-clone-checklist).

- [x] `src/components/admin/college-branding-preview.tsx` (score 13: arbitrary px size x5, inline style x4)
- [x] `src/components/admin/college-logo-uploader.tsx` (score 6: arbitrary px size x4, inline style x1)
- [x] `src/components/courses/faculty-course-workspace.tsx` (score 4: arbitrary px size x4)
- [x] `src/app/(authenticated)/admin/organizations/page.tsx` (score 2: arbitrary px size x2)
- [x] `src/app/(authenticated)/college/groups/page.tsx` (score 2: arbitrary px size x2)
- [x] `src/app/(authenticated)/college/placements/interviews/page.tsx` (score 2: arbitrary px size x2)
- [x] `src/components/college/college-admin-profile-editor.tsx` (score 2: rounded-full pill x1)
- [x] `src/app/(authenticated)/college/lecture-halls/[hallId]/page.tsx` (score 1: arbitrary px size x1)
- [x] `src/app/(authenticated)/college/page.tsx` (score 1: arbitrary px size x1)
- [x] `src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx` (score 1: arbitrary px size x1)
- [x] `src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx` (score 1: arbitrary px size x1)
- [x] `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx` (score 1: arbitrary px size x1)
- [x] `src/app/(authenticated)/college/placements/student-lookup/page.tsx` (score 1: arbitrary px size x1)
- [x] `src/components/admin/college-admin-lifecycle-action.tsx` (score 1: arbitrary px size x1)
- [x] `src/components/admin/college-feature-rule-editor.tsx` (score 1: arbitrary px size x1)
- [x] `src/components/admin/tenant-domain-manager.tsx` (score 1: arbitrary px size x1)
- [x] `src/components/admin/tenant-settings-editor.tsx` (score 1: arbitrary px size x1)
- [x] `src/components/courses/faculty-lesson-authoring.tsx` (score 1: arbitrary px size x1)

## Section 2: page routes, full fidelity pass (38)
For each page: page head via PageHeader (title, subtitle, actions exactly as the old LMS), canvas card (white, radius 12, border #e5e9f0, padding 24), tabs, filter row, tables/grids/cards, chips and badges, banners and inline notices, every modal and drawer the page opens, buttons and forms, empty/loading/error states, toasts, spacing and typography values, and responsive at 1280, 768 and 375 widths. Read the page and the components it renders, fix every deviation you find, not only the listed ones.

- [x] `src/app/(authenticated)/activity/page.tsx`
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/history/page.tsx`
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx`
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx`
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/verification/page.tsx`
- [x] `src/app/(authenticated)/admin/organizations/page.tsx`
- [x] `src/app/(authenticated)/admin/projects/[projectId]/[section]/page.tsx`
- [x] `src/app/(authenticated)/college/academics/page.tsx`
- [x] `src/app/(authenticated)/college/academics/sections/[sectionId]/page.tsx`
- [x] `src/app/(authenticated)/college/activity/[eventId]/page.tsx`
- [x] `src/app/(authenticated)/college/activity/page.tsx`
- [x] `src/app/(authenticated)/college/announcements/page.tsx`
- [x] `src/app/(authenticated)/college/assignments/page.tsx`
- [x] `src/app/(authenticated)/college/attendance/corrections/page.tsx`
- [x] `src/app/(authenticated)/college/attendance/departments/page.tsx`
- [x] `src/app/(authenticated)/college/attendance/page.tsx`
- [x] `src/app/(authenticated)/college/attendance/settings/page.tsx`
- [x] `src/app/(authenticated)/college/batch-promotion/page.tsx`
- [ ] `src/app/(authenticated)/college/batches/[cohortId]/students/page.tsx`
- [ ] `src/app/(authenticated)/college/batches/page.tsx`
- [ ] `src/app/(authenticated)/college/branding/page.tsx`
- [ ] `src/app/(authenticated)/college/classes/page.tsx`
- [ ] `src/app/(authenticated)/college/classes/recurring-preview/page.tsx`
- [ ] `src/app/(authenticated)/college/college-profile/page.tsx`
- [ ] `src/app/(authenticated)/college/companies/page.tsx`
- [ ] `src/app/(authenticated)/college/contacts/[membershipId]/page.tsx`
- [ ] `src/app/(authenticated)/college/contacts/page.tsx`
- [ ] `src/app/(authenticated)/college/course-progress/page.tsx`
- [ ] `src/app/(authenticated)/college/courses/offerings/[offeringId]/page.tsx`
- [ ] `src/app/(authenticated)/college/courses/page.tsx`
- [ ] `src/app/(authenticated)/college/departments/page.tsx`
- [ ] `src/app/(authenticated)/college/domains/page.tsx`
- [ ] `src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx`
- [ ] `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx`
- [ ] `src/app/(authenticated)/college/electives/page.tsx`
- [ ] `src/app/(authenticated)/college/faculty-assignment/page.tsx`
- [ ] `src/app/(authenticated)/college/faculty/[membershipId]/page.tsx`
- [ ] `src/app/(authenticated)/college/faculty/import/page.tsx`
