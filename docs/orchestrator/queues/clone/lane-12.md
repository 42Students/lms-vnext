# Clone queue: lane chat-12

Generated from the code by the orchestrator's deviation audit. Work each section top to bottom, in batches of about 30 items. When an item is finished and proven, change its `[ ]` to `[x]` in this file in the same push. Never delete or reorder lines; only tick.

## Section 1: files that still deviate from the shared look (4)
Fix every listed deviation using the shared components in src/components/ui and the values in docs/design/ (shell spec, legacy-styles, ui-clone-checklist).

- [ ] `src/components/tpo/tpo-company-memory-workspace.tsx` (score 7: arbitrary px size x7)
- [ ] `src/app/(authenticated)/tpo/students/page.tsx` (score 4: rounded-full pill x2)
- [ ] `src/components/tpo/tpo-header-indicators.tsx` (score 2: rounded-full pill x1)
- [ ] `src/components/tpo/grid/grid-workspace.tsx` (score 1: arbitrary px size x1)

## Section 2: page routes, full fidelity pass (26)
For each page: page head via PageHeader (title, subtitle, actions exactly as the old LMS), canvas card (white, radius 12, border #e5e9f0, padding 24), tabs, filter row, tables/grids/cards, chips and badges, banners and inline notices, every modal and drawer the page opens, buttons and forms, empty/loading/error states, toasts, spacing and typography values, and responsive at 1280, 768 and 375 widths. Read the page and the components it renders, fix every deviation you find, not only the listed ones.

- [ ] `src/app/(authenticated)/tpo/audit/actors/page.tsx`
- [ ] `src/app/(authenticated)/tpo/batches/[batchId]/classes/page.tsx`
- [ ] `src/app/(authenticated)/tpo/batches/[batchId]/history/page.tsx`
- [ ] `src/app/(authenticated)/tpo/batches/[batchId]/page.tsx`
- [ ] `src/app/(authenticated)/tpo/batches/[batchId]/registrations/[membershipId]/history/page.tsx`
- [ ] `src/app/(authenticated)/tpo/batches/[batchId]/registrations/page.tsx`
- [ ] `src/app/(authenticated)/tpo/batches/[batchId]/rules/page.tsx`
- [ ] `src/app/(authenticated)/tpo/batches/[batchId]/students/page.tsx`
- [ ] `src/app/(authenticated)/tpo/calendar/page.tsx`
- [ ] `src/app/(authenticated)/tpo/calendar/rounds/page.tsx`
- [ ] `src/app/(authenticated)/tpo/companies/[companyId]/contact-log/page.tsx`
- [ ] `src/app/(authenticated)/tpo/companies/[companyId]/feedback/page.tsx`
- [ ] `src/app/(authenticated)/tpo/companies/[companyId]/manage/page.tsx`
- [ ] `src/app/(authenticated)/tpo/companies/[companyId]/people/page.tsx`
- [ ] `src/app/(authenticated)/tpo/companies/[companyId]/team/page.tsx`
- [ ] `src/app/(authenticated)/tpo/companies/archived/page.tsx`
- [ ] `src/app/(authenticated)/tpo/companies/page.tsx`
- [ ] `src/app/(authenticated)/tpo/find/page.tsx`
- [ ] `src/app/(authenticated)/tpo/follow-ups/page.tsx`
- [ ] `src/app/(authenticated)/tpo/more/page.tsx`
- [ ] `src/app/(authenticated)/tpo/students/[membershipId]/history/page.tsx`
- [ ] `src/app/(authenticated)/tpo/students/[membershipId]/participation/page.tsx`
- [ ] `src/app/(authenticated)/tpo/students/page.tsx`
- [ ] `src/app/(authenticated)/tpo/students/preparation-plan/page.tsx`
- [ ] `src/app/(authenticated)/tpo/students/preparation-prep/page.tsx`
- [ ] `src/app/(authenticated)/tpo/students/requests/page.tsx`
