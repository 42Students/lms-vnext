# Clone queue: lane chat-8

Generated from the code by the orchestrator's deviation audit. Work each section top to bottom, in batches of about 30 items. When an item is finished and proven, change its `[ ]` to `[x]` in this file in the same push. Never delete or reorder lines; only tick.

## Section 1: files that still deviate from the shared look (13)
Fix every listed deviation using the shared components in src/components/ui and the values in docs/design/ (shell spec, legacy-styles, ui-clone-checklist).

- [x] `src/app/(authenticated)/mentor/calendar/page.tsx` (score 9: arbitrary px size x9)
- [x] `src/app/(authenticated)/mentor/reports/page.tsx` (score 6: arbitrary px size x6)
- [x] `src/app/(authenticated)/mentor/review-history/page.tsx` (score 6: arbitrary px size x6)
- [x] `src/app/(authenticated)/mentor/sprint-progress/page.tsx` (score 6: arbitrary px size x6)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx` (score 5: arbitrary px size x5)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/resources-directory/page.tsx` (score 5: arbitrary px size x5)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/team-meetings/page.tsx` (score 5: arbitrary px size x5)
- [x] `src/app/(authenticated)/mentor/team-coverage/page.tsx` (score 5: arbitrary px size x5)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/board-review/page.tsx` (score 4: arbitrary px size x4)
- [x] `src/app/(authenticated)/mentor/task-review-history/page.tsx` (score 4: arbitrary px size x4)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/review-overview/page.tsx` (score 3: arbitrary px size x3)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/team-history/page.tsx` (score 3: arbitrary px size x3)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/risk-readiness/page.tsx` (score 2: arbitrary px size x2)

## Section 2: page routes, full fidelity pass (20)
For each page: page head via PageHeader (title, subtitle, actions exactly as the old LMS), canvas card (white, radius 12, border #e5e9f0, padding 24), tabs, filter row, tables/grids/cards, chips and badges, banners and inline notices, every modal and drawer the page opens, buttons and forms, empty/loading/error states, toasts, spacing and typography values, and responsive at 1280, 768 and 375 widths. Read the page and the components it renders, fix every deviation you find, not only the listed ones.

- [x] `src/app/(authenticated)/college/lessons/page.tsx`
- [x] `src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx`
- [x] `src/app/(authenticated)/college/projects/at-risk/page.tsx`
- [x] `src/app/(authenticated)/mentor/calendar/page.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/board-review/page.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/resources-directory/page.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/review-overview/page.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/risk-readiness/page.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/team-history/page.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/team-meetings/page.tsx`
- [x] `src/app/(authenticated)/mentor/reports/page.tsx`
- [x] `src/app/(authenticated)/mentor/review-history/page.tsx`
- [x] `src/app/(authenticated)/mentor/sprint-progress/page.tsx`
- [x] `src/app/(authenticated)/mentor/task-review-history/page.tsx`
- [x] `src/app/(authenticated)/mentor/team-coverage/page.tsx`
- [x] `src/app/(authenticated)/tpo/reports/offers-acceptance/page.tsx`
- [ ] `src/app/(authenticated)/tpo/settings/blocked-dates/page.tsx`
- [ ] `src/app/(authenticated)/tracker/mine/[publicId]/page.tsx`
- [ ] `src/app/(authenticated)/tracker/mine/page.tsx`
