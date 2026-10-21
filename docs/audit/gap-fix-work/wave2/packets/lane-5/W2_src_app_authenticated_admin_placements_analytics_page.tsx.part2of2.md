# Work packet (wave 2): edit src/app/(authenticated)/admin/placements/analytics/page.tsx (part 2 of 2)

28 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l13-u031-dashboards-reports.md, docs/audit/gap2/lane-10/superadmin-hiring-dashboard.md

## G2-13-031-009  [P2] GAP  facet F03  effort M
- Legacy: Legacy removable blue date-range chip and Clear all. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:404-411`
- vNext now: vNext plain Active filters key-value text. `src/app/(authenticated)/admin/placements/analytics/page.tsx:104-104`
- Fix: Restore closable date chip.

## G2-13-031-010  [P2] GAP  facet F03  effort M
- Legacy: Legacy horizontal 24px blue funnel bars and conversion tag. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:501-550`
- vNext now: vNext grid stage cards with MetricBar and conversion text. `src/app/(authenticated)/admin/placements/analytics/page.tsx:112-125`
- Fix: Use old funnel geometry.

## G2-13-031-018  [P2] GAP  facet F05  effort M
- Legacy: Legacy date, job, department, program and batch filter all results. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:71-85`
- vNext now: vNext adds q and maps batch to cohortId. `src/modules/admin-ui/super-admin-hiring-report-model.ts:2-12`, `src/app/(authenticated)/admin/placements/analytics/page.tsx:83-101`
- Fix: Preserve exact filter descriptions/behavior.

## G2-13-031-019  [P2] GAP  facet F05  effort M
- Legacy: Legacy changing department clears program filter. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:337-393`
- vNext now: vNext standalone GET selects do not reset program automatically. `src/app/(authenticated)/admin/placements/analytics/page.tsx:90-101`
- Fix: Clear dependent selections.

## G2-13-031-020  [P2] GAP  facet F05  effort M
- Legacy: Legacy company jobs paginate 10 per page. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:560-562`
- vNext now: vNext DataTable not configured to page 10 here. `src/app/(authenticated)/admin/placements/analytics/page.tsx:128-131`
- Fix: Apply old paging controls.

## G2-13-031-021  [P2] GAP  facet F05  effort M
- Legacy: Legacy company totals pinned as table summary footer. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:233-240,564-586`
- vNext now: vNext totals shown as separate cards beneath table. `src/app/(authenticated)/admin/placements/analytics/page.tsx:133-145`
- Fix: Recreate fixed footer.

## G2-13-031-023  [P2] GAP  facet F06  effort M
- Legacy: Legacy one-row selected filters and clearable controls. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:337-401`
- vNext now: vNext primary search plus collapsed advanced filters. `src/app/(authenticated)/admin/placements/analytics/page.tsx:83-103`
- Fix: Match default filter visibility.

## G2-13-031-024  [P2] GAP  facet F06  effort M
- Legacy: Legacy export disabled on loading/no data. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:396-401`
- vNext now: vNext export link visible with no disabled state. `src/app/(authenticated)/admin/placements/analytics/page.tsx:79-82`
- Fix: Gate export on loaded valid results.

## G2-13-031-033  [P2] GAP  facet F09  effort M
- Legacy: Legacy RangePicker+Select popovers. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:329-336,337-395`
- vNext now: vNext native DateInput, Select, details disclosure. `src/app/(authenticated)/admin/placements/analytics/page.tsx:83-101`
- Fix: Compare overlay and focus.

## G2-13-031-034  [P2] GAP  facet F09  effort M
- Legacy: Legacy removable date chip. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:404-411`
- vNext now: vNext text-only status; no dismissible chip. `src/app/(authenticated)/admin/placements/analytics/page.tsx:104-104`
- Fix: Restore chip close button.

## G2-13-031-036  [P2] GAP  facet F10  effort M
- Legacy: Legacy export combines summary,funnel,job rows and company totals. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:282-309`
- vNext now: vNext export link backed by service. `src/app/(authenticated)/admin/placements/analytics/page.tsx:79-82`, `src/modules/admin-ui/super-admin-hiring-report-model.ts:15-25`
- Fix: Diff CSV field/section order.

## G2-13-031-046  [P2] GAP  facet F13  effort M
- Legacy: Legacy load skeleton, stale-success warning, retry and zero state. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:213-216,416-435`
- vNext now: vNext SSR plus invalid-filter error and truncation banner. `src/app/(authenticated)/admin/placements/analytics/page.tsx:29-31,105-111`
- Fix: Restore per-report loading/error states.

## G2-13-031-048  [P2] GAP  facet F13  effort M
- Legacy: Legacy no matching filtered companies suggests Clear filters. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:588-603`
- vNext now: vNext generic No hiring results match these filters. `src/app/(authenticated)/admin/placements/analytics/page.tsx:128-131`
- Fix: Separate unfiltered empty from no matching filters.

## G2-13-031-053  [P2] GAP  facet F16  effort M
- Legacy: Legacy Ant col xs/sm/md/lg tiles. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:438-486`
- vNext now: vNext CSS grid 2/3/5 across breakpoints. `src/app/(authenticated)/admin/placements/analytics/page.tsx:109-111`
- Fix: Screenshot 375,768,1280.

## G2-13-031-054  [P2] GAP  facet F16  effort M
- Legacy: Legacy funnel max width500, table scroll x800. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:501-550,557-565`
- vNext now: vNext stage tile grid and generic DataTable. `src/app/(authenticated)/admin/placements/analytics/page.tsx:112-131`
- Fix: Match width and overflow.

## G2-13-031-061  [P2] GAP  facet F18  effort M
- Legacy: Legacy Company-wise Hiring Report heading. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:552-555`
- vNext now: vNext Company hiring results. `src/app/(authenticated)/admin/placements/analytics/page.tsx:129-131`
- Fix: Restore exact heading.

## G2-13-031-062  [P2] GAP  facet F18  effort M
- Legacy: Legacy `% of [named previous stage]` conversion tag. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:520-523`
- vNext now: vNext `% of previous`. `src/app/(authenticated)/admin/placements/analytics/page.tsx:121-121`
- Fix: Name denominator stage.

## G2-10-008-024  [P3] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:507-509` empty No funnel data text
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:117-125` always renders six zero stage cards
- Fix: Distinguish absent funnel data from fully zeroed response

## G2-10-008-044  [P3] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:56-64` job, department, program, batch default null
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:72-101` selectors default q values or empty; Q validation enforces UUID IDs
- Fix: Align initial visible empty selections and clearing semantics

## G2-10-008-047  [P3] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:339-392` dropdown min widths Job180, Department140, Program140, Batch120
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:84-101` grid and generic Select width
- Fix: Match desktop widths and responsive wrapping

## G2-10-008-049  [P3] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:224-231` Clear all resets date/job/department/program/batch
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:102` GET link Clear all resets q too
- Fix: Keep clear-all behavior and avoid unintentional unrelated search reset

## G2-10-008-061  [P3] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:322-609` no modal/drawer/popup beyond Date RangePicker/Select dropdowns
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:83-103` native Select/DateInput and HTML details
- Fix: Match placement of dropdown portals and date picker calendar accessibility

## G2-10-008-062  [P3] GAP  facet F09  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:501-550` funnel bars animate width 0.3s
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:117-125` MetricBar segmented cards styled via CSS
- Fix: Match transition and single-track animation

## G2-10-008-082  [P3] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:507-509` No funnel data if empty array
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:117-125` renders fixed six stages from empty totals
- Fix: Render explicit empty funnel message on true no-data

## G2-10-008-091  [P3] GAP  facet F15  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:413-425` warns via inline Ant alerts, not push notifications
- vNext now: `src/app/(authenticated)/admin/placements/analytics/error.tsx:6-10` error boundary and `src/app/(authenticated)/admin/placements/analytics/page.tsx:106-108` warning banner
- Fix: Match in-page transient/closable feedback, not background notification

## G2-10-008-097  [P3] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:396-401` icon buttons have visible Refresh and Export report text
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:80-88` button/link visible text but no matched icon
- Fix: Restore icon+text and keyboard focus ring equal to legacy

## G2-10-008-102  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:398-400` Export report
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:80-82` Export report (CSV) →
- Fix: Match Export report control text, place CSV detail in tooltip

## G2-13-031-060  [P3] GAP  facet F18  effort S
- Legacy: Legacy Applied from / Applied to. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:334-335`
- vNext now: vNext Applied from / Applied through. `src/app/(authenticated)/admin/placements/analytics/page.tsx:96-99`
- Fix: Use legacy Applied to label.
