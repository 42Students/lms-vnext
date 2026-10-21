# Work packet (wave 2): edit src/components/placements/college-hiring-funnel.tsx

21 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-hiring-dashboard.md

## G2-9-008-007  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:501-550` — Hiring Funnel card with maximum 500px plot and padding 24px
- vNext now: `src/components/placements/college-hiring-funnel.tsx:83-98` — Border-separated full-width section with chartRows and no standalone card
- Fix: Match plot max width, card border/radius and vertical spacing

## G2-9-008-008  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:552-604` — Company-wise Hiring Report card with table and pinned footer totals
- vNext now: `src/components/placements/college-hiring-funnel.tsx:99-124` — Bordered section with DataTable and collapsed global totals details
- Fix: Restore Ant-equivalent company report card/pinned company rollups

## G2-9-008-010  [P2] MISSING  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:404-410` — Applied-date closable blue chip and Clear all when any filter selected
- vNext now: `src/components/placements/college-hiring-funnel.tsx:36-71` — Filters accordion with Clear all link, no active-date chip
- Fix: Display applied date range as removable chip

## G2-9-008-012  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:438-498` — Ant cards use Statistic label and large count with responsive column gutters
- vNext now: `src/components/placements/college-hiring-funnel.tsx:73-81` — StatTile grid behind details; stage labels plus new avg with decimal
- Fix: Align card hierarchy/typography and visible default

## G2-9-008-013  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:240-256` — Company report exactly Company, Job, Applied, Shortlisted, Assessment, Interview, Offered, Hired, Rejected
- vNext now: `src/components/placements/college-hiring-funnel.tsx:101-114` — Adds Total, Waitlisted, Withdrawn and different stage order
- Fix: Preserve legacy default column set/order with extra status columns optional

## G2-9-008-015  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:560-563` — Small table, x scroll 800, pageSize10 when more than ten jobs
- vNext now: `src/components/placements/college-hiring-funnel.tsx:101-115` — DataTable without per-report pagination controls
- Fix: Restore table density/horizontal scroll and 10-job pagination

## G2-9-008-017  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:488-498` — Avg time to shortlist shown only when nonnull, rounded whole hours with suffix hrs
- vNext now: `src/components/placements/college-hiring-funnel.tsx:76-80` — Always visible when details expanded, formats 1 decimal hours or No recorded transitions
- Fix: Match conditional display, integer rounding and hrs suffix

## G2-9-008-018  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:328-336` — Single Ant DatePicker.RangePicker with Applied from/Applied to placeholders
- vNext now: `src/components/placements/college-hiring-funnel.tsx:59-64` — Two browser date inputs in collapsible form
- Fix: Use single keyboard-accessible date-range picker

## G2-9-008-021  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:381-392` — Batch selector All from all college batches
- vNext now: `src/components/placements/college-hiring-funnel.tsx:53-57` — Cohort label All batches, derived from program-linked cohorts
- Fix: Align options and default label after data-model mapping

## G2-9-008-023  [P2] MISSING  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:217-223` — Date chip uses DD MMM YYYY and clear X
- vNext now: `src/components/placements/college-hiring-funnel.tsx:36-71` — Date fields visible only in accordion, no chips
- Fix: Add closable applied date chip in display format

## G2-9-008-025  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:339-393` — All job/dept/program/batch selects allowClear and update data automatically
- vNext now: `src/components/placements/college-hiring-funnel.tsx:38-70` — Submit Apply filters required after selection; season/drive separate Apply buttons
- Fix: Match immediate filter refresh and clear actions

## G2-9-008-026  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:396-400` — Refresh button busy spinner and Export report disabled while loading
- vNext now: `src/components/placements/college-hiring-funnel.tsx:30-34` — Refresh ordinary link and Export CSV link never disabled on data loading
- Fix: Support refresh pending and disable export until metrics are ready

## G2-9-008-039  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:328-393` — Ant date picker and selects use dropdown popovers and allowClear
- vNext now: `src/components/placements/college-hiring-funnel.tsx:36-71` — Native select/date input controls use browser popup behavior
- Fix: Align popover placement, keyboard and dropdown visual tokens

## G2-9-008-053  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:587-603` — Company empty state depends on active filters and offers clear button
- vNext now: `src/components/placements/college-hiring-funnel.tsx:101-115` — Uniform No data message and no company-section clear control
- Fix: Implement filtered versus initial distinct empty states

## G2-9-008-056  [P2] GAP  facet F14  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:264-266` — Export disabled until metrics exist and not loading
- vNext now: `src/components/placements/college-hiring-funnel.tsx:30-34` — Export anchor always enabled even no rows
- Fix: Disable or provide empty-state explanatory guard while loading

## G2-9-008-059  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:438-499` — Ant Row gutter16 and responsive Col xs12 sm8 md4 lg3 metric cards
- vNext now: `src/components/placements/college-hiring-funnel.tsx:73-81` — Grid2/md3/lg5 metrics hidden in details
- Fix: Restore matching 1280/768/375 cards with exact gutter

## G2-9-008-060  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:328-402` — Ant Space wrap size middle and min-widths date/job 180, department/program 140, batch 120
- vNext now: `src/components/placements/college-hiring-funnel.tsx:38-69` — Accordion responsive grid md2/992px5 columns and full-width fields
- Fix: Test and align wrapping and width at desktop/tablet/phone

## G2-9-008-062  [P2] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:329-335` — RangePicker explicitly aria-label Filter by date range and applied placeholders
- vNext now: `src/components/placements/college-hiring-funnel.tsx:59-64` — Two labelled date inputs in details with native focus handling
- Fix: Provide equivalent grouped date range accessible label

## G2-9-008-063  [P2] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:339-393` — Every select aria-label Filter by job/department/program/batch and allowClear
- vNext now: `src/components/placements/college-hiring-funnel.tsx:41-57` — Native Select names embedded in visible label, no clear icon
- Fix: Match clear affordance and keyboard operation

## G2-9-008-064  [P2] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:396-400` — Refresh button indicates loading, export disabled
- vNext now: `src/components/placements/college-hiring-funnel.tsx:30-34` — Links have no pending state or disability
- Fix: Add accessible loading announcements and busy state

## G2-9-008-066  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:397-400` — Actions Refresh and Export report
- vNext now: `src/components/placements/college-hiring-funnel.tsx:30-34` — Refresh and Export CSV
- Fix: Rename export and add download icon
