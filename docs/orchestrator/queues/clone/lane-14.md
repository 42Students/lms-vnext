# Clone queue: lane chat-14

Generated from the code by the orchestrator's deviation audit. Work each section top to bottom, in batches of about 30 items. When an item is finished and proven, change its `[ ]` to `[x]` in this file in the same push. Never delete or reorder lines; only tick.

## Section 1: files that still deviate from the shared look (9)
Fix every listed deviation using the shared components in src/components/ui and the values in docs/design/ (shell spec, legacy-styles, ui-clone-checklist).

- [x] `src/app/(authenticated)/mentor/activity/page.tsx` (score 9: arbitrary px size x9)
- [x] `src/app/(authenticated)/mentor/task-reviews/page.tsx` (score 8: arbitrary px size x8)
- [x] `src/app/(authenticated)/mentor/reviews/page.tsx` (score 6: arbitrary px size x6)
- [x] `src/components/tpo/tpo-spreadsheet-grid.tsx` (score 4: inline style x2)
- [x] `src/components/projects/mentor-release-editor.tsx` (score 2: arbitrary px size x2)
- [x] `src/components/auth/portal-access-notice.tsx` (score 1: arbitrary px size x1)
- [x] `src/components/projects/mentor-delivery-lock-control.tsx` (score 1: arbitrary px size x1)
- [x] `src/components/public/graceful-error-boundary.tsx` (score 1: arbitrary px size x1)
- [x] `src/components/tpo/grid/tpo-grid.tsx` (score 1: arbitrary px size x1)

## Section 2: page routes, full fidelity pass (20)
For each page: page head via PageHeader (title, subtitle, actions exactly as the old LMS), canvas card (white, radius 12, border #e5e9f0, padding 24), tabs, filter row, tables/grids/cards, chips and badges, banners and inline notices, every modal and drawer the page opens, buttons and forms, empty/loading/error states, toasts, spacing and typography values, and responsive at 1280, 768 and 375 widths. Read the page and the components it renders, fix every deviation you find, not only the listed ones.

- [x] `src/app/(authenticated)/college/lecture-halls/[hallId]/page.tsx`
- [x] `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx`
- [x] `src/app/(authenticated)/college/profile/page.tsx`
- [x] `src/app/(authenticated)/college/projects/workspaces/new/page.tsx`
- [x] `src/app/(authenticated)/college/students/register/page.tsx`
- [x] `src/app/(authenticated)/learn/profile/verification/page.tsx`
- [x] `src/app/(authenticated)/mentor/activity/page.tsx`
- [x] `src/app/(authenticated)/mentor/page.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/closeout/page.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/meetings/[meetingId]/notes/page.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/review-completeness/page.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/tasks/[taskId]/feedback/page.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/timeline/page.tsx`
- [x] `src/app/(authenticated)/mentor/reviews/page.tsx`
- [x] `src/app/(authenticated)/mentor/task-reviews/page.tsx`
- [x] `src/app/(authenticated)/tpo/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/new/draft/page.tsx`
- [x] `src/app/(authenticated)/tpo/reports/failure-reasons/page.tsx`
- [x] `src/app/(authenticated)/tpo/requests/page.tsx`
- [x] `src/app/forbidden/page.tsx`
