# Work packet: edit src/app/(authenticated)/college/hiring-dashboard/page.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-hiring-dashboard.md

## G2-9-008-003  [P1] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/hiring-dashboard.js:23-35` — Missing college displays warning Admin not assigned to a college and exact contact text
- vNext now: `src/app/(authenticated)/college/hiring-dashboard/page.tsx:18-21` — Missing or wrong-role membership redirects dashboard
- Fix: Show no-college warning with contact guidance without exposing private data

## G2-9-008-005  [P1] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:328-402` — Filter controls then badges then metric cards then hiring funnel and company report
- vNext now: `src/app/(authenticated)/college/hiring-dashboard/page.tsx:47-55` — Report navigation, season/drive filters, four summary metrics, second filter accordion, hidden status metrics then funnel
- Fix: Match legacy section order and remove duplicate report head/filters

## G2-9-008-030  [P1] GAP  facet F07  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:87-168` — Three metrics/funnel/company requests fail independently with partial success retained
- vNext now: `src/app/(authenticated)/college/hiring-dashboard/page.tsx:34-40` — Await workspace and funnel server services sequentially; failure escalates to route boundary
- Fix: Introduce sectional results and recoverable independent failures

## G2-9-008-032  [P1] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:503-505` — Funnel failure renders its own error Alert within card
- vNext now: `src/app/(authenticated)/college/hiring-dashboard/page.tsx:38-40` — Funnel failure throws before page rendered; no sectional error
- Fix: Isolate funnel error and keep metrics/company report visible

## G2-9-008-040  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/api/Services/AdminService.js:910-938` — Three GET APIs /api/v1/admin/jobs/metrics, funnel, company-report with explicit collegeId
- vNext now: `src/app/(authenticated)/college/hiring-dashboard/page.tsx:34-40` — Direct DB workspace+funnel server services, no 3 remote GET calls
- Fix: Map independent results, author equivalent read endpoints or service branches

## G2-9-008-069  [P1] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:87-130` — Three GETs parallel and independent; previous scope data cleared when filter/scope changes
- vNext now: `src/app/(authenticated)/college/hiring-dashboard/page.tsx:34-40` — Server workspace fetch then funnel; separate await sequentially
- Fix: Run report sections concurrently and preserve per-scope refresh behavior

## G2-9-008-077  [P1] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:920-941` — Company report fetch is independent HTTP read after filter change
- vNext now: `src/app/(authenticated)/college/hiring-dashboard/page.tsx:34-40` — Company rows share getCollegeHiringFunnel service call
- Fix: Split report query error handling while sharing cached base rows

## G2-9-008-035  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:416-429` — Refreshing hiring dashboard… indicator while retaining last data; initial loading six metric skeleton
- vNext now: `src/app/(authenticated)/college/hiring-dashboard/page.tsx:34-41` — Async server-rendered page with no explicit route loading skeleton referenced
- Fix: Provide six-tile loading skeleton and non-destructive refresh status
