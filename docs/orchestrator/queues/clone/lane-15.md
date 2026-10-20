# Clone queue: lane chat-15

Generated from the code by the orchestrator's deviation audit. Work each section top to bottom, in batches of about 30 items. When an item is finished and proven, change its `[ ]` to `[x]` in this file in the same push. Never delete or reorder lines; only tick.

## Section 1: files that still deviate from the shared look (4)
Fix every listed deviation using the shared components in src/components/ui and the values in docs/design/ (shell spec, legacy-styles, ui-clone-checklist).

- [x] `src/app/(authenticated)/hr/company/page.tsx` (score 3: rounded-full pill x1, arbitrary px size x1)
- [x] `src/app/(authenticated)/hr/notifications/page.tsx` (score 2: arbitrary px size x2)
- [x] `src/app/(authenticated)/hr/activity/page.tsx` (score 1: arbitrary px size x1)
- [x] `src/components/tracker/tracker-report-form.tsx` (score 1: arbitrary px size x1)

## Section 2: page routes, full fidelity pass (20)
For each page: page head via PageHeader (title, subtitle, actions exactly as the old LMS), canvas card (white, radius 12, border #e5e9f0, padding 24), tabs, filter row, tables/grids/cards, chips and badges, banners and inline notices, every modal and drawer the page opens, buttons and forms, empty/loading/error states, toasts, spacing and typography values, and responsive at 1280, 768 and 375 widths. Read the page and the components it renders, fix every deviation you find, not only the listed ones.

- [x] `src/app/(authenticated)/hr/activity/page.tsx`
- [x] `src/app/(authenticated)/hr/company/page.tsx`
- [x] `src/app/(authenticated)/hr/company/reports/page.tsx`
- [x] `src/app/(authenticated)/hr/drives/[jobId]/messages/page.tsx`
- [x] `src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/page.tsx`
- [x] `src/app/(authenticated)/hr/drives/proposals/page.tsx`
- [x] `src/app/(authenticated)/hr/drives/recorded-outside/page.tsx`
- [x] `src/app/(authenticated)/hr/notifications/page.tsx`
- [x] `src/app/(authenticated)/hr/round-results/page.tsx`
- [x] `src/app/(authenticated)/learn/allAssignments/page.tsx`
- [x] `src/app/(authenticated)/learn/allQuizzes/page.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/placement/page.tsx`
- [ ] `src/app/(authenticated)/learn/profile/page.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/change-requests/page.tsx`
- [ ] `src/app/(authenticated)/tpo/reports/ctc/page.tsx`
- [ ] `src/app/(authenticated)/tracker/audit-findings/page.tsx`
- [ ] `src/app/(authenticated)/tracker/issues/[publicId]/page.tsx`
- [ ] `src/app/(authenticated)/tracker/issues/page.tsx`
- [ ] `src/app/(authenticated)/tracker/logs/page.tsx`
- [ ] `src/app/(authenticated)/tracker/page.tsx`
