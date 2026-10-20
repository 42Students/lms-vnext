# Clone queue: lane chat-2

Generated from the code by the orchestrator's deviation audit. Work each section top to bottom, in batches of about 30 items. When an item is finished and proven, change its `[ ]` to `[x]` in this file in the same push. Never delete or reorder lines; only tick.

## Section 1: files that still deviate from the shared look (14)
Fix every listed deviation using the shared components in src/components/ui and the values in docs/design/ (shell spec, legacy-styles, ui-clone-checklist).

- [x] `src/components/placements/public-recruiter-join-form.tsx` (score 28: own <h1> (use PageHeader) x4, arbitrary px size x4)
- [x] `src/app/placements/page.tsx` (score 11: own <h1> (use PageHeader) x1, arbitrary px size x5)
- [x] `src/app/company-share/[token]/error.tsx` (score 7: own <h1> (use PageHeader) x1, arbitrary px size x1)
- [x] `src/app/company-share/[token]/not-found.tsx` (score 7: own <h1> (use PageHeader) x1, arbitrary px size x1)
- [x] `src/components/placements/public-join-preview-retry.tsx` (score 7: own <h1> (use PageHeader) x1, arbitrary px size x1)
- [x] `src/components/placements/learner-career-calendar.tsx` (score 6: raw <button> x1, arbitrary px size x1)
- [x] `src/app/(authenticated)/tpo/team/page.tsx` (score 4: arbitrary px size x4)
- [x] `src/components/tpo/recruiter-leads-workspace.tsx` (score 3: arbitrary px size x3)
- [x] `src/app/(authenticated)/tpo/team/[threadId]/page.tsx` (score 2: rounded-full pill x1)
- [x] `src/app/(authenticated)/tpo/messages/page.tsx` (score 1: arbitrary px size x1)
- [x] `src/components/courses/faculty-course-home-signals.tsx` (score 1: arbitrary px size x1)
- [x] `src/components/tpo/recruiter-inline-owner.tsx` (score 1: arbitrary px size x1)
- [x] `src/components/tpo/recruiter-inline-stage.tsx` (score 1: arbitrary px size x1)
- [x] `src/components/tpo/recruiter-lead-detail-workspace.tsx` (score 1: arbitrary px size x1)

## Section 2: page routes, full fidelity pass (32)
For each page: page head via PageHeader (title, subtitle, actions exactly as the old LMS), canvas card (white, radius 12, border #e5e9f0, padding 24), tabs, filter row, tables/grids/cards, chips and badges, banners and inline notices, every modal and drawer the page opens, buttons and forms, empty/loading/error states, toasts, spacing and typography values, and responsive at 1280, 768 and 375 widths. Read the page and the components it renders, fix every deviation you find, not only the listed ones.

- [x] `src/app/(authenticated)/recruiter/colleges/page.tsx`
- [x] `src/app/(authenticated)/recruiter/page.tsx`
- [x] `src/app/(authenticated)/tpo/announcements/page.tsx`
- [x] `src/app/(authenticated)/tpo/calendar/export/page.tsx`
- [x] `src/app/(authenticated)/tpo/calendar/interviews/page.tsx`
- [x] `src/app/(authenticated)/tpo/companies/[companyId]/page.tsx`
- [x] `src/app/(authenticated)/tpo/messages/[threadId]/page.tsx`
- [x] `src/app/(authenticated)/tpo/messages/notifications/page.tsx`
- [x] `src/app/(authenticated)/tpo/messages/page.tsx`
- [x] `src/app/(authenticated)/tpo/notifications/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/schedule-conflicts/page.tsx`
- [x] `src/app/(authenticated)/tpo/recruiters/campaigns/[batchId]/page.tsx`
- [x] `src/app/(authenticated)/tpo/recruiters/campaigns/drafts/[campaignId]/page.tsx`
- [x] `src/app/(authenticated)/tpo/recruiters/campaigns/new/page.tsx`
- [x] `src/app/(authenticated)/tpo/recruiters/campaigns/page.tsx`
- [x] `src/app/(authenticated)/tpo/recruiters/campaigns/preview/page.tsx`
- [x] `src/app/(authenticated)/tpo/recruiters/page.tsx`
- [x] `src/app/(authenticated)/tpo/reports/[slug]/page.tsx`
- [x] `src/app/(authenticated)/tpo/reports/branch-season/page.tsx`
- [x] `src/app/(authenticated)/tpo/reports/intelligence/page.tsx`
- [x] `src/app/(authenticated)/tpo/reports/joining-followups/page.tsx`
- [x] `src/app/(authenticated)/tpo/reports/joining-status/page.tsx`
- [x] `src/app/(authenticated)/tpo/reports/offers-expiry/page.tsx`
- [x] `src/app/(authenticated)/tpo/reports/placed-branch/page.tsx`
- [x] `src/app/(authenticated)/tpo/reports/season-pipeline/page.tsx`
- [x] `src/app/(authenticated)/tpo/settings/public-page/page.tsx`
- [x] `src/app/(authenticated)/tpo/team/[threadId]/page.tsx`
- [x] `src/app/(authenticated)/tpo/team/everyone/page.tsx`
- [x] `src/app/(authenticated)/tpo/team/page.tsx`
- [x] `src/app/e2e/superadmin-login/page.tsx`
- [x] `src/app/placements/page.tsx`
- [x] `src/app/superadmin-login/page.tsx`
