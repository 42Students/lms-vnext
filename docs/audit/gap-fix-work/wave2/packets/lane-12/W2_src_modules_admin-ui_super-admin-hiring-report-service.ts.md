# Work packet (wave 2): edit src/modules/admin-ui/super-admin-hiring-report-service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-hiring-dashboard.md, docs/audit/gap2/lane-5/l13-u031-dashboards-reports.md

## G2-10-008-039  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:240-255` report company rows order by company then jobId, 9 columns
- vNext now: `src/modules/admin-ui/super-admin-hiring-report-service.ts:89` sorts company/jobTitle/id; `src/app/(authenticated)/admin/placements/analytics/page.tsx:61-71` 12 columns
- Fix: Preserve company then jobId ordering or document approved title sort

## G2-10-008-069  [P2] GAP  facet F11  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:904-907` and `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:932-935` require perform admin for college with scope and module enabled
- vNext now: `src/modules/admin-ui/super-admin-hiring-report-service.ts:15-17` uses VSEL:5-10 placements.read permission
- Fix: Audit current permission mapping against legacy perform-admin scope and module toggle

## G2-10-008-073  [P2] GAP  facet F12  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2299-2307` metrics snapshot includes all statuses and total
- vNext now: `src/modules/admin-ui/super-admin-hiring-report-service.ts:29-45` excludes other statuses from applied tally and totals all current applications
- Fix: Define exact submitted/withdrawn/waitlisted scope and total reconciliation

## G2-10-008-076  [P2] GAP  facet F12  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2459-2464` company report ignores jobId filter (only college/date/academic)
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:85` and `src/modules/admin-ui/super-admin-hiring-report-service.ts:84-89` filter by jobId all report sections
- Fix: Clarify intended job-scoped company report extension or match legacy all-job company totals

## G2-13-031-069  [P2] GAP  facet F21  effort M
- Legacy: Legacy AdminService and placementJobService API calls. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:98-155`
- vNext now: vNext Drizzle PG reporting service. `src/modules/admin-ui/super-admin-hiring-report-service.ts:14-92`
- Fix: Map API query/result contract.
