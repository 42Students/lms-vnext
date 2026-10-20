# Clone queue: lane chat-9

Generated from the code by the orchestrator's deviation audit. Work each section top to bottom, in batches of about 30 items. When an item is finished and proven, change its `[ ]` to `[x]` in this file in the same push. Never delete or reorder lines; only tick.

## Section 1: files that still deviate from the shared look (16)
Fix every listed deviation using the shared components in src/components/ui and the values in docs/design/ (shell spec, legacy-styles, ui-clone-checklist).

- [x] `src/components/projects/super-admin-template-create-form.tsx` (score 10: arbitrary px size x10)
- [x] `src/components/projects/project-template-controls.tsx` (score 7: arbitrary px size x7)
- [x] `src/components/projects/project-admin-audit-page.tsx` (score 6: arbitrary px size x6)
- [x] `src/components/projects/super-admin-template-resource-editor.tsx` (score 5: arbitrary px size x5)
- [x] `src/app/(authenticated)/admin/semesters/page.tsx` (score 4: arbitrary px size x4)
- [x] `src/components/projects/super-admin-template-overview-editor.tsx` (score 3: arbitrary px size x3)
- [x] `src/components/projects/super-admin-template-plan-editor.tsx` (score 3: arbitrary px size x3)
- [x] `src/app/(authenticated)/admin/settings/page.tsx` (score 2: arbitrary px size x2)
- [x] `src/components/admin/super-admin-attendance-settings-editor.tsx` (score 2: arbitrary px size x2)
- [x] `src/components/placements/placement-calendar-workspace.tsx` (score 2: rounded-full pill x1)
- [x] `src/components/projects/project-admin-reassign-mentor-page.tsx` (score 2: arbitrary px size x2)
- [x] `src/components/projects/project-readiness-override-form.tsx` (score 2: arbitrary px size x2)
- [x] `src/components/shell/tpo-topbar-messages.tsx` (score 2: rounded-full pill x1)
- [x] `src/app/(authenticated)/admin/module-access/page.tsx` (score 1: arbitrary px size x1)
- [x] `src/components/projects/admin-readiness-workspace-picker.tsx` (score 1: arbitrary px size x1)
- [x] `src/components/projects/project-admin-submission-review.tsx` (score 1: arbitrary px size x1)

## Section 2: page routes, full fidelity pass (38)
For each page: page head via PageHeader (title, subtitle, actions exactly as the old LMS), canvas card (white, radius 12, border #e5e9f0, padding 24), tabs, filter row, tables/grids/cards, chips and badges, banners and inline notices, every modal and drawer the page opens, buttons and forms, empty/loading/error states, toasts, spacing and typography values, and responsive at 1280, 768 and 375 widths. Read the page and the components it renders, fix every deviation you find, not only the listed ones.

- [x] `src/app/(authenticated)/activity/[eventId]/page.tsx`
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/page.tsx`
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx`
- [x] `src/app/(authenticated)/admin/module-access/page.tsx`
- [x] `src/app/(authenticated)/admin/placements/hiring/page.tsx`
- [x] `src/app/(authenticated)/admin/placements/interviews/page.tsx`
- [x] `src/app/(authenticated)/admin/placements/job-settings/page.tsx`
- [x] `src/app/(authenticated)/admin/placements/joining/page.tsx`
- [x] `src/app/(authenticated)/admin/placements/offers/page.tsx`
- [x] `src/app/(authenticated)/admin/placements/screenings/page.tsx`
- [x] `src/app/(authenticated)/admin/placements/seasons/page.tsx`
- [x] `src/app/(authenticated)/admin/placements/shortlisted/[applicationId]/page.tsx`
- [x] `src/app/(authenticated)/admin/placements/student-lookup/page.tsx`
- [x] `src/app/(authenticated)/admin/programs/page.tsx`
- [ ] `src/app/(authenticated)/admin/projects/at-risk/page.tsx`
- [ ] `src/app/(authenticated)/admin/projects/audit/page.tsx`
- [ ] `src/app/(authenticated)/admin/projects/page.tsx`
- [ ] `src/app/(authenticated)/admin/projects/readiness/page.tsx`
- [ ] `src/app/(authenticated)/admin/projects/reassign-mentor/page.tsx`
- [ ] `src/app/(authenticated)/admin/projects/submissions/page.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/colleges/page.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/page.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/new/page.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/page.tsx`
- [ ] `src/app/(authenticated)/admin/projects/workspaces/new/page.tsx`
- [ ] `src/app/(authenticated)/admin/quizzes/page.tsx`
- [ ] `src/app/(authenticated)/admin/semester-courses/page.tsx`
- [ ] `src/app/(authenticated)/admin/semesters/page.tsx`
- [ ] `src/app/(authenticated)/admin/settings/auth/page.tsx`
- [ ] `src/app/(authenticated)/admin/settings/page.tsx`
- [ ] `src/app/(authenticated)/admin/students/page.tsx`
- [ ] `src/app/(authenticated)/admin/tenants/setup/page.tsx`
- [ ] `src/app/(authenticated)/admin/verification/page.tsx`
- [ ] `src/app/(authenticated)/college/projects/audit/page.tsx`
- [ ] `src/app/(authenticated)/college/projects/page.tsx`
- [ ] `src/app/(authenticated)/college/projects/templates/page.tsx`
- [ ] `src/app/(authenticated)/tpo/audit/page.tsx`
