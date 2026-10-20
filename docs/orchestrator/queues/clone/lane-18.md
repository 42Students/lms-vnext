# Clone queue: lane chat-18

Generated from the code by the orchestrator's deviation audit. Work each section top to bottom, in batches of about 30 items. When an item is finished and proven, change its `[ ]` to `[x]` in this file in the same push. Never delete or reorder lines; only tick.

## Section 1: files that still deviate from the shared look (0)
Fix every listed deviation using the shared components in src/components/ui and the values in docs/design/ (shell spec, legacy-styles, ui-clone-checklist).


## Section 2: page routes, full fidelity pass (20)
For each page: page head via PageHeader (title, subtitle, actions exactly as the old LMS), canvas card (white, radius 12, border #e5e9f0, padding 24), tabs, filter row, tables/grids/cards, chips and badges, banners and inline notices, every modal and drawer the page opens, buttons and forms, empty/loading/error states, toasts, spacing and typography values, and responsive at 1280, 768 and 375 widths. Read the page and the components it renders, fix every deviation you find, not only the listed ones.

- [x] `src/app/(authenticated)/admin/placements/job-settings/[jobId]/page.tsx`
- [x] `src/app/(authenticated)/admin/placements/seasons/[seasonId]/page.tsx`
- [x] `src/app/(authenticated)/admin/projects/templates/[templateId]/sprints/page.tsx`
- [x] `src/app/(authenticated)/admin/videos/page.tsx`
- [x] `src/app/(authenticated)/college/groups/[groupId]/rule-preview/page.tsx`
- [x] `src/app/(authenticated)/college/placements/interviews/page.tsx`
- [x] `src/app/(authenticated)/college/placements/readiness-by-department/page.tsx`
- [x] `src/app/(authenticated)/college/projects/[projectId]/[section]/page.tsx`
- [x] `src/app/(authenticated)/college/projects/submissions/page.tsx`
- [x] `src/app/(authenticated)/college/projects/workspaces/page.tsx`
- [x] `src/app/(authenticated)/college/students/[membershipId]/page.tsx`
- [x] `src/app/(authenticated)/learn/courses/[deliveryId]/page.tsx`
- [x] `src/app/(authenticated)/recruiter/drives/[jobId]/interview-slots/page.tsx`
- [x] `src/app/(authenticated)/recruiter/drives/page.tsx`
- [x] `src/app/(authenticated)/superadmin/departments/page.tsx`
- [ ] `src/app/(authenticated)/teacher/results/page.tsx`
- [ ] `src/app/(authenticated)/tpo/recruiters/[leadId]/page.tsx`
- [ ] `src/app/(authenticated)/tpo/reports/after-college/page.tsx`
- [ ] `src/app/(authenticated)/tpo/settings/page.tsx`
- [ ] `src/app/(authenticated)/tracker/audit-findings/[publicId]/page.tsx`
