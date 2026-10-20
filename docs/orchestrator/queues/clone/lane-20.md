# Clone queue: lane chat-20

Generated from the code by the orchestrator's deviation audit. Work each section top to bottom, in batches of about 30 items. When an item is finished and proven, change its `[ ]` to `[x]` in this file in the same push. Never delete or reorder lines; only tick.

## Section 1: files that still deviate from the shared look (0)
Fix every listed deviation using the shared components in src/components/ui and the values in docs/design/ (shell spec, legacy-styles, ui-clone-checklist).


## Section 2: page routes, full fidelity pass (20)
For each page: page head via PageHeader (title, subtitle, actions exactly as the old LMS), canvas card (white, radius 12, border #e5e9f0, padding 24), tabs, filter row, tables/grids/cards, chips and badges, banners and inline notices, every modal and drawer the page opens, buttons and forms, empty/loading/error states, toasts, spacing and typography values, and responsive at 1280, 768 and 375 widths. Read the page and the components it renders, fix every deviation you find, not only the listed ones.

- [ ] `src/app/(authenticated)/admin/live-classes/page.tsx`
- [ ] `src/app/(authenticated)/admin/placements/joining/[offerId]/page.tsx`
- [ ] `src/app/(authenticated)/admin/projects/[projectId]/readiness/page.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/tasks/page.tsx`
- [ ] `src/app/(authenticated)/college-admin/departments/page.tsx`
- [ ] `src/app/(authenticated)/college/groups/[groupId]/import-preview/page.tsx`
- [ ] `src/app/(authenticated)/college/page.tsx`
- [ ] `src/app/(authenticated)/college/placements/new/page.tsx`
- [ ] `src/app/(authenticated)/college/projects/[projectId]/page.tsx`
- [ ] `src/app/(authenticated)/college/projects/readiness/page.tsx`
- [ ] `src/app/(authenticated)/college/semester-courses/page.tsx`
- [ ] `src/app/(authenticated)/college/students/page.tsx`
- [ ] `src/app/(authenticated)/learn/placements/page.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/page.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/recorded-outside/page.tsx`
- [ ] `src/app/(authenticated)/teacher/contacts/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx`
- [ ] `src/app/(authenticated)/tpo/home/page.tsx`
- [ ] `src/app/(authenticated)/tpo/reports/placement-summary/page.tsx`
- [ ] `src/app/recruiter-invite/[token]/page.tsx`
