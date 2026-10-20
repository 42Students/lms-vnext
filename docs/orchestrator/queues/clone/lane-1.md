# Clone queue: lane chat-1

Generated from the code by the orchestrator's deviation audit. Work each section top to bottom, in batches of about 30 items. When an item is finished and proven, change its `[ ]` to `[x]` in this file in the same push. Never delete or reorder lines; only tick.

## Section 1: files that still deviate from the shared look (2)
Fix every listed deviation using the shared components in src/components/ui and the values in docs/design/ (shell spec, legacy-styles, ui-clone-checklist).

- [ ] `src/components/placements/learner-placement-alerts.tsx` (score 5: arbitrary px size x5)
- [ ] `src/app/(authenticated)/learn/my-placements/support/page.tsx` (score 1: arbitrary px size x1)

## Section 2: page routes, full fidelity pass (20)
For each page: page head via PageHeader (title, subtitle, actions exactly as the old LMS), canvas card (white, radius 12, border #e5e9f0, padding 24), tabs, filter row, tables/grids/cards, chips and badges, banners and inline notices, every modal and drawer the page opens, buttons and forms, empty/loading/error states, toasts, spacing and typography values, and responsive at 1280, 768 and 375 widths. Read the page and the components it renders, fix every deviation you find, not only the listed ones.

- [ ] `src/app/(authenticated)/admin/placements/interviews/[roundId]/page.tsx`
- [ ] `src/app/(authenticated)/admin/placements/offers/[offerId]/page.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/overview/page.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/versions/page.tsx`
- [ ] `src/app/(authenticated)/college-admin/programs/page.tsx`
- [ ] `src/app/(authenticated)/college/live-classes/page.tsx`
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx`
- [ ] `src/app/(authenticated)/college/projects/[projectId]/readiness/page.tsx`
- [ ] `src/app/(authenticated)/college/projects/create/page.tsx`
- [ ] `src/app/(authenticated)/college/resources/page.tsx`
- [ ] `src/app/(authenticated)/college/videos/page.tsx`
- [ ] `src/app/(authenticated)/hr/colleges/page.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/support/page.tsx`
- [ ] `src/app/(authenticated)/learn/quizzes/page.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/rounds/editor/page.tsx`
- [ ] `src/app/(authenticated)/recruiter/home/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/page.tsx`
- [ ] `src/app/(authenticated)/tpo/reports/page.tsx`
- [ ] `src/app/(authenticated)/tpo/settings/job-types/page.tsx`
- [ ] `src/app/(authenticated)/tpo/verification/page.tsx`
