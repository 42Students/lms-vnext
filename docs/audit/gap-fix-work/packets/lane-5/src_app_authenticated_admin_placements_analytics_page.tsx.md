# Work packet: edit src/app/(authenticated)/admin/placements/analytics/page.tsx

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-hiring-dashboard.md, docs/audit/gap2/lane-5/l13-u031-dashboards-reports.md

## G2-10-008-001  [P1] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/hiring-dashboard.js:11-37` /superadmin/hiring-dashboard under SuperAdminLayout, college-scoped
- vNext now: `src/app/(authenticated)/admin/placements/hiring/page.tsx:5-9` /admin/placements/hiring renders job count directory; `src/app/(authenticated)/admin/placements/analytics/page.tsx:19-44` /admin/placements/analytics implements dashboard features
- Fix: Make the Analytics page the primary hiring-dashboard equivalent and preserve legacy deep link/active tab to it

## G2-10-008-027  [P1] GAP  facet F04  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2408-2434` true funnel counts EVER reached each stage using status history
- vNext now: `src/modules/admin-ui/super-admin-hiring-funnel-model.ts:10-20` derives stage counts from current snapshot totals at `src/app/(authenticated)/admin/placements/analytics/page.tsx:50-59`
- Fix: Use immutable status history for cumulative funnel; do not relabel snapshot as conversion

## G2-10-008-036  [P1] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:352-366` Department dropdown All; on change resets Program
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:72-75`,93 direct GET selectors without dependent Program reset
- Fix: Clear selected program automatically when Department changes

## G2-10-008-040  [P1] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:557-564` company report paginates job rows only when >10, pageSize10
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:128-132` renders entire up-to-5000-row DataTable without pagination
- Fix: Restore table pagination default 10 per page and pinned rollups

## G2-10-008-052  [P1] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:115-129` metrics/funnel/company partial errors kept per section
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:41-44` Promise.all throws entire page when either report or filters fails
- Fix: Implement Promise.allSettled and isolated partial error recovery for metric/funnel/company sections

## G2-10-008-068  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/hiring-dashboard.js:11-37` requires selected college; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:874-877` checks selected scope, college perform-admin, placements feature enabled
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:34-44` selected college gate via VSEL:5-10, but no explicit optional-module enable gate in service
- Fix: Ensure feature-disabled legacy behavior and Super Admin exemption policy are explicitly reconciled

## G2-10-008-074  [P1] MISSING  facet F12  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2309-2340` average first shortlisted stage versus applied timestamp
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:127` cannot derive, says Not recorded
- Fix: Derive transition history timing; do not approximate from current status

## G2-10-008-113  [P1] GAP  facet F20  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:237-238` extracts rollups from paginated rows, pins totals
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:133-145` totals derived from capped report set
- Fix: Warn against treating truncated totals as authoritative; offer full filtered server summaries

## G2-13-031-017  [P1] MISSING  facet F04  effort M
- Legacy: Legacy optional average time to shortlist in milliseconds. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:488-498`
- vNext now: vNext Super Admin displays Not recorded despite college history average. `src/app/(authenticated)/admin/placements/analytics/page.tsx:127-127`, `src/modules/placements/college-hiring-funnel-service.ts:42-46,76-100`
- Fix: Connect same history-backed average to Super Admin.

## G2-13-031-038  [P1] GAP  facet F11  effort M
- Legacy: Legacy global Super Admin or college scoped report branch. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:96-155`
- vNext now: vNext requires selected college. `src/app/(authenticated)/admin/placements/analytics/page.tsx:36-40`, `src/modules/admin-ui/super-admin-hiring-report-service.ts:15-16`
- Fix: Decide whether global report is still intended.

## G2-13-031-065  [P1] GAP  facet F19  effort M
- Legacy: Legacy average shortlist time is shown if computed. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:488-498`
- vNext now: vNext college computes average but Super Admin does not. `src/modules/placements/college-hiring-funnel-service.ts:76-100`, `src/app/(authenticated)/admin/placements/analytics/page.tsx:127-127`
- Fix: Share average calculation across roles.

## G2-13-031-073  [P1] GAP  facet F23  effort M
- Legacy: Legacy optional avg shortlist hours. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:488-498`
- vNext now: vNext suppresses as Not recorded despite college history. `src/app/(authenticated)/admin/placements/analytics/page.tsx:127-127`
- Fix: Wire same metric or document intentional retirement.

## G2-10-008-050  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/api/Services/AdminService.js:911-918` missing college rejects collegeId is required; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:862-884` returns Metrics retrieved or 400 error
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:28-33` invalid-filter page shows Invalid analytics filters
- Fix: Include specific field-level reason and legacy equivalent copy for malformed date/IDs

## G2-10-008-057  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:416-425` Refreshing hiring dashboard… inline RefreshStatus
- vNext now: `src/app/(authenticated)/admin/placements/analytics/loading.tsx:1-3` route skeleton only; `src/app/(authenticated)/admin/placements/analytics/page.tsx:88` GET Refresh
- Fix: Use inline refresh state without hiding last good charts

## G2-13-031-026  [P2] GAP  facet F07  effort M
- Legacy: Legacy warning identifies failed dropdown source. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:190-206`
- vNext now: vNext filter read errors not separately surfaced. `src/app/(authenticated)/admin/placements/analytics/page.tsx:41-47,83-101`
- Fix: Show failed source and retry.

## G2-13-031-027  [P2] GAP  facet F07  effort M
- Legacy: Legacy Failed refresh retains last good metrics with Retry. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:418-425`
- vNext now: vNext route error state cannot show stale last-good snapshot. `src/app/(authenticated)/admin/placements/analytics/page.tsx:29-31`
- Fix: Preserve stale display and retry.

## G2-13-031-028  [P2] GAP  facet F07  effort M
- Legacy: Legacy funnel and company panel errors independently shown. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:503-505,554-556`
- vNext now: vNext one aggregated service read for all sections. `src/app/(authenticated)/admin/placements/analytics/page.tsx:112-145`
- Fix: Distinguish panel failures.

## G2-13-031-030  [P2] GAP  facet F08  effort M
- Legacy: Legacy in-place refresh shows stale data and clears error when successful. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:416-425`
- vNext now: vNext GET Refresh reloads full page. `src/app/(authenticated)/admin/placements/analytics/page.tsx:83-90`
- Fix: Retain loaded tiles during refresh.

## G2-13-031-031  [P2] GAP  facet F08  effort M
- Legacy: Legacy browser downloads dated hiring-report CSV. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:264-319`
- vNext now: vNext server CSV endpoint download. `src/app/(authenticated)/admin/placements/analytics/page.tsx:79-82`
- Fix: Compare filename, sections and result.

## G2-10-008-059  [P3] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:397-400` buttons Refresh / Export report
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:80-88` Export report (CSV) → / Refresh
- Fix: Align exact labels, icons and action order
