# Work packet: edit src/modules/placements/college-hiring-funnel-service.ts

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l13-u031-dashboards-reports.md, docs/audit/gap2/lane-9/college-admin-hiring-dashboard.md, docs/audit/gap2/lane-9/college-admin-jobs-overview.md

## G2-13-031-017  [P1] MISSING  facet F04  effort M
- Legacy: Legacy optional average time to shortlist in milliseconds. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:488-498`
- vNext now: vNext Super Admin displays Not recorded despite college history average. `src/app/(authenticated)/admin/placements/analytics/page.tsx:127-127`, `src/modules/placements/college-hiring-funnel-service.ts:42-46,76-100`
- Fix: Connect same history-backed average to Super Admin.

## G2-13-031-065  [P1] GAP  facet F19  effort M
- Legacy: Legacy average shortlist time is shown if computed. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:488-498`
- vNext now: vNext college computes average but Super Admin does not. `src/modules/placements/college-hiring-funnel-service.ts:76-100`, `src/app/(authenticated)/admin/placements/analytics/page.tsx:127-127`
- Fix: Share average calculation across roles.

## G2-13-031-068  [P1] GAP  facet F20  effort M
- Legacy: Legacy date endOf day precise milliseconds. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:72-84`
- vNext now: vNext college through 23:59:59, SA 23:59:59.999. `src/modules/placements/college-hiring-funnel-service.ts:64-65`, `src/modules/admin-ui/super-admin-hiring-report-service.ts:31-34`
- Fix: Use exclusive next-day end.

## G2-9-008-029  [P1] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:194-204` — Filter lookup failure names specific jobs/departments/programs/batches and explains empty controls
- vNext now: `src/modules/placements/college-hiring-funnel-service.ts:21-31` — Filter options are fetched within one server service read and no individually identifiable dropdown error
- Fix: Show granular load failure and Retry for each lookup

## G2-9-008-042  [P1] GAP  facet F10  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2385-2429` — Backend funnel cumulative lifetime reached stages from history, Applied all starts
- vNext now: `src/modules/placements/college-hiring-funnel-service.ts:36-41` — Funnel uses current stage coalesce status with screening, no reached-stage history aggregate
- Fix: Compute ever-reached funnel from stage events, distinguish from snapshot KPIs

## G2-9-008-043  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2443-2526` — Company report per-job and normalized company-level subtotal rows
- vNext now: `src/modules/placements/college-hiring-funnel-service.ts:84-101` — Groups only by jobId; no per-company subtotal grouping
- Fix: Add normalized company-name or companyId group rollups

## G2-9-008-048  [P1] GAP  facet F12  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2336-2351` — Legacy class takes priority over batch; program over department, with learner foreign-key filters
- vNext now: `src/modules/placements/college-hiring-funnel-service.ts:66-74` — Academic filter matches active learnerProgramEnrollment, optional cohort, no class-level matching
- Fix: Define and test filter precedence and historical-vs-current enrolment

## G2-9-008-049  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2278-2307` — Metrics status snapshot groups by current applicationStatus and includes all matching applications
- vNext now: `src/modules/placements/college-hiring-funnel-service.ts:36-41` — Current snapshot stage prioritizes withdrawn, college stage then screening status
- Fix: Reconcile status normalization, especially WAITLISTED and ASSESSMENT after screening

## G2-9-008-050  [P1] GAP  facet F12  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2409-2429` — Funnel APPLIED count all applications and later stages ever reached
- vNext now: `src/modules/placements/college-hiring-funnel-service.ts:89-100` — Current-stage counts summed as single-stage partition; Applied counts only currently applied
- Fix: Restore true funnel semantics so downstream percentages are meaningful

## G2-9-008-058  [P1] GAP  facet F15  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2321-2333` — Legacy shortlist average from status history MIN SHORTLISTED and applied_at
- vNext now: `src/modules/placements/college-hiring-funnel-service.ts:42-47` — Average from college stage history h.moved_at and submittedAt
- Fix: Verify stage-history conversion/migration and durations for dual-tracked jobs

## G2-9-008-070  [P1] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:233-239` — Per-company totals separated, job table paginated10
- vNext now: `src/modules/placements/college-hiring-funnel-service.ts:76-101` — Aggregate rows per job only, no company total or per-page cap
- Fix: Add company subtotal and pagination; optimize large report table

## G2-9-008-073  [P1] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:174-209` — Lookups guarded by cancelled effect and filtersError state
- vNext now: `src/modules/placements/college-hiring-funnel-service.ts:21-31` — Server Promise.all lookups; failure rejects entire funnel dataset
- Fix: Implement per-lookup error boundaries and fallback choices

## G2-9-008-074  [P1] GAP  facet F20  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2336-2351` — Inclusive appliedAfter and appliedBefore timestamps
- vNext now: `src/modules/placements/college-hiring-funnel-service.ts:64-65` — to bound ends at 23:59:59+05:30, excludes fractional final second
- Fix: Set exclusive next-day boundary or end at 23:59:59.999 for exact inclusion

## G2-9-008-075  [P1] GAP  facet F21  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2385-2429` — Cumulative funnel computed with status-history existence SQL
- vNext now: `src/modules/placements/college-hiring-funnel-service.ts:33-47` — Reads college stages/screening and status; touches history only for shortlist time
- Fix: Join historical stage transitions for cumulative funnel with cohort scope

## G2-9-008-078  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2294-2329` — JobApplication and JobApplicationStatusHistory MySQL with LocalDateTime
- vNext now: `src/modules/placements/college-hiring-funnel-service.ts:33-75` — placementApplications plus placementCollegeApplicationStages/History in Postgres
- Fix: Map old application status-history to vNext college-stage history and reconcile stage parity

## G2-9-008-079  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2470-2526` — Company totals grouped by normalized trim lower companyName incl unlinked company free text
- vNext now: `src/modules/placements/college-hiring-funnel-service.ts:84-101` — Each companyRows element per job only; company name from joined company table
- Fix: Reinstate normalised subtotal semantics including aliases/free-text jobs

## G2-9-011-040  [P1] GAP  facet F12  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:239-257` — Pipeline current application-status snapshot, six stages
- vNext now: `src/modules/placements/college-hiring-funnel-service.ts:36-41` — Current stage from status/screening/college pipeline stage combined
- Fix: Use canonical status vs college stage only after explicitly labelling different metric meaning
