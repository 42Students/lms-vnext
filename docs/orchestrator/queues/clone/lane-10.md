# Clone queue: lane chat-10

Generated from the code by the orchestrator's deviation audit. Work each section top to bottom, in batches of about 30 items. When an item is finished and proven, change its `[ ]` to `[x]` in this file in the same push. Never delete or reorder lines; only tick.

## Section 1: files that still deviate from the shared look (0)
Fix every listed deviation using the shared components in src/components/ui and the values in docs/design/ (shell spec, legacy-styles, ui-clone-checklist).


## Section 2: page routes, full fidelity pass (20)
For each page: page head via PageHeader (title, subtitle, actions exactly as the old LMS), canvas card (white, radius 12, border #e5e9f0, padding 24), tabs, filter row, tables/grids/cards, chips and badges, banners and inline notices, every modal and drawer the page opens, buttons and forms, empty/loading/error states, toasts, spacing and typography values, and responsive at 1280, 768 and 375 widths. Read the page and the components it renders, fix every deviation you find, not only the listed ones.

- [ ] `src/app/(authenticated)/admin/placements/calendar/page.tsx`
- [ ] `src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx`
- [ ] `src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx`
- [ ] `src/app/(authenticated)/admin/placements/new/page.tsx`
- [ ] `src/app/(authenticated)/admin/recruiters/page.tsx`
- [ ] `src/app/(authenticated)/college/faculty/page.tsx`
- [ ] `src/app/(authenticated)/college/lecture-halls/page.tsx`
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/page.tsx`
- [ ] `src/app/(authenticated)/college/programs/page.tsx`
- [ ] `src/app/(authenticated)/college/projects/workspaces/[workspaceId]/[section]/page.tsx`
- [ ] `src/app/(authenticated)/college/quizzes/page.tsx`
- [ ] `src/app/(authenticated)/college/verification/page.tsx`
- [ ] `src/app/(authenticated)/hr/messages/page.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/page.tsx`
- [ ] `src/app/(authenticated)/recruiter/calendar/page.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/rounds/editor/remove/[roundId]/page.tsx`
- [ ] `src/app/(authenticated)/recruiter/messages/page.tsx`
- [ ] `src/app/(authenticated)/tpo/drive-day/[roundId]/page.tsx`
- [ ] `src/app/(authenticated)/tpo/reports/leads/page.tsx`
- [ ] `src/app/(authenticated)/tpo/team/company/[companyId]/page.tsx`
