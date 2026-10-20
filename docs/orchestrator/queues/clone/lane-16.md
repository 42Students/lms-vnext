# Clone queue: lane chat-16

Generated from the code by the orchestrator's deviation audit. Work each section top to bottom, in batches of about 30 items. When an item is finished and proven, change its `[ ]` to `[x]` in this file in the same push. Never delete or reorder lines; only tick.

## Section 1: files that still deviate from the shared look (16)
Fix every listed deviation using the shared components in src/components/ui and the values in docs/design/ (shell spec, legacy-styles, ui-clone-checklist).

- [ ] `src/components/tpo/recruiter-invite-landing.tsx` (score 35: own <h1> (use PageHeader) x5, arbitrary px size x5)
- [ ] `src/components/placements/tpo-week-hour-calendar.tsx` (score 19: raw <button> x1, hard-coded hex colour x1, arbitrary px size x1, inline style x5)
- [ ] `src/components/marketing/marketing-layout.tsx` (score 17: own <h1> (use PageHeader) x1, arbitrary px size x11)
- [ ] `src/components/public/graceful-screen.tsx` (score 16: raw <button> x2, own <h1> (use PageHeader) x1)
- [ ] `src/components/public/error-recovery-actions.tsx` (score 10: raw <button> x2)
- [ ] `src/app/request-demo/page.tsx` (score 9: own <h1> (use PageHeader) x1, arbitrary px size x3)
- [ ] `src/components/auth/membership-recovery.tsx` (score 7: own <h1> (use PageHeader) x1, arbitrary px size x1)
- [ ] `src/components/public/error-page-view.tsx` (score 6: own <h1> (use PageHeader) x1)
- [ ] `src/components/public/public-page-loading.tsx` (score 6: own <h1> (use PageHeader) x1)
- [ ] `src/app/home/page.tsx` (score 3: arbitrary px size x3)
- [ ] `src/components/hr/recruiter-notification-bell.tsx` (score 3: rounded-full pill x1, arbitrary px size x1)
- [ ] `src/components/shell/learner-topbar-tools.tsx` (score 3: hard-coded hex colour x1)
- [ ] `src/app/campaign-unsubscribe/confirmed/page.tsx` (score 1: arbitrary px size x1)
- [ ] `src/app/platform/page.tsx` (score 1: arbitrary px size x1)
- [ ] `src/components/tpo/tpo-new-followup-modal.tsx` (score 1: arbitrary px size x1)
- [ ] `src/components/tpo/tpo-topbar-new-menu.tsx` (score 1: arbitrary px size x1)

## Section 2: page routes, full fidelity pass (20)
For each page: page head via PageHeader (title, subtitle, actions exactly as the old LMS), canvas card (white, radius 12, border #e5e9f0, padding 24), tabs, filter row, tables/grids/cards, chips and badges, banners and inline notices, every modal and drawer the page opens, buttons and forms, empty/loading/error states, toasts, spacing and typography values, and responsive at 1280, 768 and 375 widths. Read the page and the components it renders, fix every deviation you find, not only the listed ones.

- [ ] `src/app/(authenticated)/college/hiring-dashboard/page.tsx`
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx`
- [ ] `src/app/(authenticated)/college/placements/student-lookup/page.tsx`
- [ ] `src/app/(authenticated)/learn/profile/completeness/page.tsx`
- [ ] `src/app/(authenticated)/mentor/allQuizzes/page.tsx`
- [ ] `src/app/(authenticated)/mentor/contacts/[[...contactsTab]]/page.tsx`
- [ ] `src/app/(authenticated)/mentor/courses/[courseId]/[[...courseTab]]/page.tsx`
- [ ] `src/app/(authenticated)/mentor/courses/page.tsx`
- [ ] `src/app/(authenticated)/mentor/fileExplorer/page.tsx`
- [ ] `src/app/(authenticated)/mentor/profile/page.tsx`
- [ ] `src/app/(authenticated)/tpo/reports/by-company/page.tsx`
- [ ] `src/app/campaign-unsubscribe/[token]/page.tsx`
- [ ] `src/app/campaign-unsubscribe/confirmed/page.tsx`
- [ ] `src/app/college-join/[token]/page.tsx`
- [ ] `src/app/company-join/[token]/page.tsx`
- [ ] `src/app/home/page.tsx`
- [ ] `src/app/maintenance/page.tsx`
- [ ] `src/app/offline/page.tsx`
- [ ] `src/app/platform/page.tsx`
- [ ] `src/app/request-demo/page.tsx`
