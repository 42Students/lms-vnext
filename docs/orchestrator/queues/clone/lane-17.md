# Clone queue: lane chat-17

Generated from the code by the orchestrator's deviation audit. Work each section top to bottom, in batches of about 30 items. When an item is finished and proven, change its `[ ]` to `[x]` in this file in the same push. Never delete or reorder lines; only tick.

## Section 1: files that still deviate from the shared look (1)
Fix every listed deviation using the shared components in src/components/ui and the values in docs/design/ (shell spec, legacy-styles, ui-clone-checklist).

- [x] `src/app/e2e/chat17-ui-kit/ui-harness.tsx` (score 13: own <h1> (use PageHeader) x1, arbitrary px size x5, inline style x1)

## Section 2: page routes, full fidelity pass (20)
For each page: page head via PageHeader (title, subtitle, actions exactly as the old LMS), canvas card (white, radius 12, border #e5e9f0, padding 24), tabs, filter row, tables/grids/cards, chips and badges, banners and inline notices, every modal and drawer the page opens, buttons and forms, empty/loading/error states, toasts, spacing and typography values, and responsive at 1280, 768 and 375 widths. Read the page and the components it renders, fix every deviation you find, not only the listed ones.

- [x] `src/app/(authenticated)/admin/placements/screenings/[applicationId]/page.tsx`
- [x] `src/app/(authenticated)/admin/projects/templates/[templateId]/resources/page.tsx`
- [x] `src/app/(authenticated)/admin/resources/page.tsx`
- [x] `src/app/(authenticated)/college/groups/page.tsx`
- [x] `src/app/(authenticated)/college/placements/calendar/page.tsx`
- [x] `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx`
- [x] `src/app/(authenticated)/college/placements/retention/page.tsx`
- [x] `src/app/(authenticated)/college/projects/templates/[templateId]/page.tsx`
- [x] `src/app/(authenticated)/college/projects/workspaces/[workspaceId]/page.tsx`
- [x] `src/app/(authenticated)/college/students/import/page.tsx`
- [x] `src/app/(authenticated)/learn/assignments/page.tsx`
- [x] `src/app/(authenticated)/learn/profile/academic-record/page.tsx`
- [x] `src/app/(authenticated)/recruiter/company/page.tsx`
- [x] `src/app/(authenticated)/recruiter/drives/new/page.tsx`
- [x] `src/app/(authenticated)/recruiter/profile/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/page.tsx`
- [x] `src/app/(authenticated)/tpo/reports/by-branch/page.tsx`
- [x] `src/app/e2e/chat17-ui-kit/page.tsx`
- [x] `src/app/quiz/page.tsx`
