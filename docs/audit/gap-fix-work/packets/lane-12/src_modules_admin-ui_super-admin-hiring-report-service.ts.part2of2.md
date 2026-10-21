# Work packet: edit src/modules/admin-ui/super-admin-hiring-report-service.ts (part 2 of 2)

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l13-u031-dashboards-reports.md, docs/audit/gap2/lane-5/u015-job-application-status-history-repository.md

## G2-13-031-068  [P1] GAP  facet F20  effort M
- Legacy: Legacy date endOf day precise milliseconds. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:72-84`
- vNext now: vNext college through 23:59:59, SA 23:59:59.999. `src/modules/placements/college-hiring-funnel-service.ts:64-65`, `src/modules/admin-ui/super-admin-hiring-report-service.ts:31-34`
- Fix: Use exclusive next-day end.

## G2-13-031-071  [P1] GAP  facet F22  effort M
- Legacy: Legacy report rows and CSV stage stats. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:267-309`
- vNext now: vNext current placement stages, joining outcomes and company rollups. `src/modules/admin-ui/super-admin-hiring-report-service.ts:29-60`, `src/modules/admin-ui/super-admin-hiring-report-model.ts:15-25`
- Fix: Document stage provenance.

## G2-5-015-043  [P1] GAP  facet F21  effort M
- Legacy: Admin hiring metrics gets first SHORTLISTED transition time from history `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2309-2331`
- vNext now: Superadmin report only counts mutable current stage `src/modules/admin-ui/super-admin-hiring-report-service.ts:29-60`
- Fix: Compute first-shortlist latency from immutable stage transition rows.
