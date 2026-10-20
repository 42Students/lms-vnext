# Clone queue: lane chat-19

Generated from the code by the orchestrator's deviation audit. Work each section top to bottom, in batches of about 30 items. When an item is finished and proven, change its `[ ]` to `[x]` in this file in the same push. Never delete or reorder lines; only tick.

## Section 1: files that still deviate from the shared look (4)
Fix every listed deviation using the shared components in src/components/ui and the values in docs/design/ (shell spec, legacy-styles, ui-clone-checklist).

- [x] `src/components/shell/app-shell.tsx` (score 4: arbitrary px size x2, inline style x1)
- [x] `src/components/shell/shell-nav-icons.tsx` (score 2: arbitrary px size x2)
- [x] `src/components/tpo/tpo-mobile-footer.tsx` (score 2: arbitrary px size x2)
- [x] `src/app/(authenticated)/hr/conversations/page.tsx` (score 1: arbitrary px size x1)

## Section 2: page routes, full fidelity pass (20)
For each page: page head via PageHeader (title, subtitle, actions exactly as the old LMS), canvas card (white, radius 12, border #e5e9f0, padding 24), tabs, filter row, tables/grids/cards, chips and badges, banners and inline notices, every modal and drawer the page opens, buttons and forms, empty/loading/error states, toasts, spacing and typography values, and responsive at 1280, 768 and 375 widths. Read the page and the components it renders, fix every deviation you find, not only the listed ones.

- [x] `src/app/(authenticated)/college/groups/[groupId]/page.tsx`
- [x] `src/app/(authenticated)/college/people/manage/page.tsx`
- [x] `src/app/(authenticated)/college/placements/page.tsx`
- [x] `src/app/(authenticated)/college/projects/reassign-mentor/page.tsx`
- [x] `src/app/(authenticated)/college/semesters/page.tsx`
- [x] `src/app/(authenticated)/hr/calendar/page.tsx`
- [x] `src/app/(authenticated)/hr/conversations/page.tsx`
- [x] `src/app/(authenticated)/hr/drives/[jobId]/interview-slots/page.tsx`
- [x] `src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/remove/[roundId]/page.tsx`
- [x] `src/app/(authenticated)/hr/drives/new/page.tsx`
- [x] `src/app/(authenticated)/hr/placements/page.tsx`
- [ ] `src/app/(authenticated)/hr/profile/page.tsx`
- [ ] `src/app/(authenticated)/learn/page.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/messages/page.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/proposals/page.tsx`
- [ ] `src/app/(authenticated)/superadmin/programs/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/attendance-corrections/page.tsx`
- [ ] `src/app/(authenticated)/tpo/reports/accreditation/page.tsx`
- [ ] `src/app/(authenticated)/tpo/reports/unplaced/page.tsx`
- [ ] `src/app/hr-invite/[token]/page.tsx`
