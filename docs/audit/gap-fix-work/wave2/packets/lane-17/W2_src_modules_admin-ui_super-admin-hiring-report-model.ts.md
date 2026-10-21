# Work packet (wave 2): edit src/modules/admin-ui/super-admin-hiring-report-model.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-hiring-dashboard.md, docs/audit/gap2/lane-5/l13-u031-dashboards-reports.md

## G2-10-008-030  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:240-256` report columns include Company, Job, Applied, Shortlisted, Assessment, Interview, Offered, Hired, Rejected
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:61-71` and `src/modules/admin-ui/super-admin-hiring-report-model.ts:15` expands to Company, Drive, Total Applications, plus Withdrawn and Waitlisted
- Fix: Restore exact Job column wording and stage order; document additional totals columns

## G2-10-008-046  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:80-84` ignores nonnumeric job/academic filter IDs
- vNext now: `src/modules/admin-ui/super-admin-hiring-report-model.ts:2-11` uses strict UUID schema; invalid filters return dedicated state
- Fix: Map legacy numerical IDs to vNext UUID and preserve clear validation copy

## G2-10-008-075  [P2] GAP  facet F12  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2468-2527` company group uses trim/lowercase name even for unlinked jobs
- vNext now: `src/modules/admin-ui/super-admin-hiring-report-model.ts:18-25` groups by companyId and displays canonical name
- Fix: Preserve grouping of case/space variant free-text company names

## G2-10-008-104  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:248-255` table Job column heading
- vNext now: `src/modules/admin-ui/super-admin-hiring-report-model.ts:15` labels Drive
- Fix: Use legacy Job column label on this report

## G2-10-008-112  [P2] GAP  facet F20  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2490-2528` normalizes company names trim/lower case
- vNext now: `src/modules/admin-ui/super-admin-hiring-report-model.ts:18-25` groups company UUID
- Fix: Handle aliases/unlinked jobs and casing explicitly

## G2-13-031-018  [P2] GAP  facet F05  effort M
- Legacy: Legacy date, job, department, program and batch filter all results. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:71-85`
- vNext now: vNext adds q and maps batch to cohortId. `src/modules/admin-ui/super-admin-hiring-report-model.ts:2-12`, `src/app/(authenticated)/admin/placements/analytics/page.tsx:83-101`
- Fix: Preserve exact filter descriptions/behavior.

## G2-13-031-036  [P2] GAP  facet F10  effort M
- Legacy: Legacy export combines summary,funnel,job rows and company totals. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:282-309`
- vNext now: vNext export link backed by service. `src/app/(authenticated)/admin/placements/analytics/page.tsx:79-82`, `src/modules/admin-ui/super-admin-hiring-report-model.ts:15-25`
- Fix: Diff CSV field/section order.
