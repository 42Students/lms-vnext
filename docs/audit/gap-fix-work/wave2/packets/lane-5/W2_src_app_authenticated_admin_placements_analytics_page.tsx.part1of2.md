# Work packet (wave 2): edit src/app/(authenticated)/admin/placements/analytics/page.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-hiring-dashboard.md, docs/audit/gap2/lane-5/l13-u031-dashboards-reports.md

## G2-10-008-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/SuperAdminGroupShell.jsx:12-28` wraps legacy dashboard in Placements PageShell with grouped tabs
- vNext now: `src/components/admin/admin-scoped-read-page.tsx:34-41` and `src/app/(authenticated)/admin/placements/analytics/page.tsx:77-82` separate new page headers rather than same group tab strip
- Fix: Restore single Placements group tab strip and correct active Analytics subtab

## G2-10-008-003  [P2] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/hiring-dashboard.js:14-25` when no selected college shows Select a college to continue warning with Organization + College instructions
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:34-39` shows EmptyState Choose a college; `src/components/admin/admin-scoped-read-page.tsx:54-57` displays generic people directory wording
- Fix: Match old yellow warning banner and exact college-required explanation

## G2-10-008-004  [P2] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/common/superAdminNavGroups.js:74-93` Placements group offers common tabs and recruiter/announcement additions
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:77-82` separate dashboard title; `src/app/(authenticated)/admin/placements/hiring/page.tsx:7-9` separate Hiring Dashboard · Applications title
- Fix: Expose Hiring Dashboard location within placements tabs, not only a separate job counts directory

## G2-10-008-006  [P2] GAP  facet F02  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/placements/PlacementsPageOverview.jsx:13-37` overview is compact bordered Card with Placements eyebrow
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:77-82` header inline no eyebrow Card
- Fix: Match old overview eyebrow/typography/panel spacing inside shared canvas

## G2-10-008-007  [P2] GAP  facet F02  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:328-402` inline filters and actions before error/skeleton/metric row
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:83-103` form filters before tally then funnel and report
- Fix: Recreate inline compact filter toolbar; keep extended filters as progressive disclosure

## G2-10-008-008  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:437-499` KPI card grid precedes funnel Card then company report Card
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:109-146` renders hairline KPI strip, funnel section, company results + separate totals section
- Fix: Match card order, stat weight and chart/report framing without nested excessive cards

## G2-10-008-009  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:501-550` Hiring Funnel uses narrow 500px vertical stack of 24px bars
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:112-125` uses 2/3-column responsive stage cards
- Fix: Restore single-column vertical bar track and 500px width with legacy labels

## G2-10-008-010  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:552-604` Company-wise Hiring Report single Table with pinned company totals footer
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:128-145` splits results DataTable from Company totals cards
- Fix: Put company totals back as fixed table summary rather than separate cards

## G2-10-008-011  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:396-401` icon ReloadOutlined Refresh and DownloadOutlined Export report buttons
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:80-88` Refresh submit and Export report (CSV) in header, without icons
- Fix: Match icons, button labels and adjacent toolbar position

## G2-10-008-012  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:404-410` closable Applied date-range chip and Clear all when filters active
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:104-105` plain Active filters string and always Clear all link
- Fix: Use closable date chip and conditionally show clear-all action

## G2-10-008-013  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:438-442` metric Total Applications displayed in Stat Card
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:109-111` Total Applications present as plain metric strip tile
- Fix: Match legacy compact Statistic tile styling

## G2-10-008-023  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:552-553` heading Company-wise Hiring Report
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:128-129` heading Company hiring results
- Fix: Use exact legacy report title

## G2-10-008-030  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:240-256` report columns include Company, Job, Applied, Shortlisted, Assessment, Interview, Offered, Hired, Rejected
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:61-71` and `src/modules/admin-ui/super-admin-hiring-report-model.ts:15` expands to Company, Drive, Total Applications, plus Withdrawn and Waitlisted
- Fix: Restore exact Job column wording and stage order; document additional totals columns

## G2-10-008-032  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:488-496` average rounds ms to integer hours
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:127` never renders hours numeric
- Fix: Restore Math.round(ms/3_600_000) hrs display for valid value

## G2-10-008-033  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:328-395` filter order dates then Job, Department, Program, Batch
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:84-101` Job inline then Department, Program, Batch, dates inside Filters disclosure
- Fix: Reorder legacy toolbar: Applied from/to then four selectors

## G2-10-008-034  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:329-336` Applied from/to RangePicker allowClear placeholders
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:96-99` two distinct DateInput controls Applied from/Applied through
- Fix: Use one accessible range input with exact paired placeholders

## G2-10-008-035  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:338-351` Job dropdown starts All jobs and custom company suffix
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:72-75`,87 shows All job and only title from `src/modules/admin-ui/super-admin-hiring-report-filters-service.ts:18-19`
- Fix: Show company suffix and default All jobs wording; retain 30-char truncation

## G2-10-008-037  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:368-379` Program dropdown All, independent choices
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:72-75`,94 All program selector
- Fix: Match default All and dependent reset behavior

## G2-10-008-038  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:381-392` Batch dropdown All
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:72-75`,95 All batch selector
- Fix: Restore exact Batch placeholder/default

## G2-10-008-039  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:240-255` report company rows order by company then jobId, 9 columns
- vNext now: `src/modules/admin-ui/super-admin-hiring-report-service.ts:89` sorts company/jobTitle/id; `src/app/(authenticated)/admin/placements/analytics/page.tsx:61-71` 12 columns
- Fix: Preserve company then jobId ordering or document approved title sort

## G2-10-008-041  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:564-587` company total rows visible in Table.Summary fixed bottom
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:133-145` separately rendered total cards
- Fix: Render footer summary columns aligned and fixed to table

## G2-10-008-042  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:587-604` company empty text varies by filter and offers Clear filters
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:130-131` generic No hiring results
- Fix: Provide exact filtered/unfiltered empty messages and clear-filter action

## G2-10-008-043  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:557-564` horizontal scroll x800 and ellipsis for Company/Job
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:61-71` uses responsive priority and no fixed 800px horizontal minimum
- Fix: Restore min-width/ellipsis behavior, especially at phone/tablet widths

## G2-10-008-048  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:396-401` Refresh reloads all three data sources and Export disabled without metrics/during loading
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:80-88` Export link shown regardless of loading/data readiness
- Fix: Disable export when data is unavailable, indicate loading and stale results

## G2-10-008-060  [P2] MISSING  facet F09  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:404-410` closable date filter Tag with blue tone and Clear all link
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:104-105` readonly key=value text no close controls
- Fix: Implement closable filter chip with each clear handler

## G2-10-008-076  [P2] GAP  facet F12  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2459-2464` company report ignores jobId filter (only college/date/academic)
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:85` and `src/modules/admin-ui/super-admin-hiring-report-service.ts:84-89` filter by jobId all report sections
- Fix: Clarify intended job-scoped company report extension or match legacy all-job company totals

## G2-10-008-079  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:428-434` loading skeleton 6 metrics and defensive no-data message
- vNext now: `src/app/(authenticated)/admin/placements/analytics/loading.tsx:1-3` has generic directory skeleton, `src/app/(authenticated)/admin/placements/analytics/page.tsx:109-111` lacks separated skeleton
- Fix: Show legacy DashboardSkeleton metrics6 and no-data fallback

## G2-10-008-081  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:590-603` empty No companies match these filters... or No hiring data yet
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:130-131` only No hiring results match these filters
- Fix: Implement differentiated filtered/unfiltered empty results with Clear filters

## G2-10-008-092  [P2] GAP  facet F16  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:438-499` KPI Row Col xs24/xs12 sm/md/lg widths including avg metric xs24
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:109-111` grid cols2 sm3 lg5
- Fix: Match legacy breakpoint-specific KPI tile columns and special total/avg width

## G2-10-008-093  [P2] GAP  facet F16  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:328-402` Space wrap toolbar controls with explicit minWidths
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:83-101` grid filters and collapsed details
- Fix: Match 1280/768 toolbar wraps and phone touch-height controls

## G2-10-008-094  [P2] GAP  facet F16  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:557-565` horizontal x800 table and fixed summary footer
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:128-145` responsive prioritized table and separate totals grid
- Fix: Restore horizontal report scroll/pinned total behavior on 375/768

## G2-10-008-096  [P2] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:329-392` RangePicker/Select aria-labels Filter by date range/job/department/program/batch
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:72-75`,85-101 uses visible form labels with native controls
- Fix: Use equivalent descriptive accessible names, especially paired date range

## G2-10-008-098  [P2] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:557-564` Ant Table keyboard and summary semantics
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:128-145` DataTable and Company totals separate articles
- Fix: Make company totals semantically connected and labeled by columns

## G2-10-008-101  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:328-336` placeholders Applied from, Applied to
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:96-99` label Applied through instead of Applied to
- Fix: Use exact Applied to wording

## G2-10-008-103  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:552-553` Company-wise Hiring Report
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:128-129` Company hiring results
- Fix: Restore title exact string

## G2-10-008-105  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/hiring-dashboard.js:17-23` no-college warning exact Select a college to continue / Hiring metrics are college-scoped
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:35-39` uses EmptyState with different copy
- Fix: Use original warning copy in legacy entrance state

## G2-10-008-107  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:557-562` frontend pagination of report rows >10
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:130-131` renders every row up to 5000
- Fix: Paginate report presentation independently of export cap

## G2-13-031-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy Super Admin Dashboard uses dedicated PageShell and selected scope. `docs/legacy-source/frontend/src/pages/superadmin/dashboard.js:43-65`
- vNext now: vNext analytics is separate selected-college report route. `src/app/(authenticated)/admin/placements/analytics/page.tsx:36-43`
- Fix: Keep Dashboard nav and correct analytics link.

## G2-13-031-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy filters on top then statistic cards and funnel/company report. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:322-340,437-499`
- vNext now: vNext GET filters with disclosure, tile strip, tiled funnel and table. `src/app/(authenticated)/admin/placements/analytics/page.tsx:83-145`
- Fix: Match filter/card/panel layout.

## G2-13-031-008  [P2] GAP  facet F03  effort M
- Legacy: Legacy Refresh and Export buttons with Reload/Download icons. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:396-401`
- vNext now: vNext text Refresh and Export report (CSV) arrow. `src/app/(authenticated)/admin/placements/analytics/page.tsx:79-88`
- Fix: Match icon and action spacing.
