# Work packet: edit src/modules/admin-ui/super-admin-hiring-funnel-model.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-hiring-dashboard.md, docs/audit/gap2/lane-5/l13-u031-dashboards-reports.md

## G2-10-008-027  [P1] GAP  facet F04  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2408-2434` true funnel counts EVER reached each stage using status history
- vNext now: `src/modules/admin-ui/super-admin-hiring-funnel-model.ts:10-20` derives stage counts from current snapshot totals at `src/app/(authenticated)/admin/placements/analytics/page.tsx:50-59`
- Fix: Use immutable status history for cumulative funnel; do not relabel snapshot as conversion

## G2-10-008-072  [P1] GAP  facet F12  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2408-2434` cumulative ever-reached stages including rejected former interviewees
- vNext now: `src/modules/admin-ui/super-admin-hiring-funnel-model.ts:10-20` uses mutually exclusive current counts, no stage history in calculation
- Fix: Implement cumulative ever-stage reach and monotonic-conversion semantics

## G2-10-008-078  [P1] GAP  facet F12  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:510-514` conversion is rounded current stage / previous reached stage
- vNext now: `src/modules/admin-ui/super-admin-hiring-funnel-model.ts:16-18` uses same Math.round arithmetic but on snapshot
- Fix: Calculate percentages using historical counts with zero-denominator null semantics

## G2-10-008-106  [P1] GAP  facet F19  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2294-2307` GROUP BY status query, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2410-2429` cumulative history query
- vNext now: `src/modules/admin-ui/super-admin-hiring-report-service.ts:36-90` bounded aggregate query LIMIT5001, `src/modules/admin-ui/super-admin-hiring-funnel-model.ts:10-20` JS derive stages
- Fix: Retain bounded aggregate performance while adding correct historical funnel query

## G2-13-031-041  [P1] GAP  facet F12  effort M
- Legacy: Legacy conversion denominator previous stage, null when prior zero. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:510-524`
- vNext now: vNext previous zero becomes 0 percent. `src/modules/admin-ui/super-admin-hiring-funnel-model.ts:10-18`
- Fix: Display unavailable for zero denominator.

## G2-13-031-042  [P1] GAP  facet F12  effort M
- Legacy: Legacy returned funnel stage ordering from API. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:501-550`
- vNext now: vNext hardcoded six stages. `src/modules/admin-ui/super-admin-hiring-funnel-model.ts:1-19`
- Fix: Reconcile nonmonotonic/current-state funnel semantics.
