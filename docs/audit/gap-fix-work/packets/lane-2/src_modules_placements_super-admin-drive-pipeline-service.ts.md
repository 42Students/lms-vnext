# Work packet: edit src/modules/placements/super-admin-drive-pipeline-service.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-overview.md

## G2-10-012-017  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:241-255 — Pipeline numbers are status SNAPSHOT; current applications in each of six status buckets.
- vNext now: src/modules/placements/super-admin-drive-pipeline-service.ts:15-38; src/modules/placements/super-admin-drive-pipeline-model.ts:4-27 — Counts submitted apps grouped by stage; adds rejected/waitlisted totals and ratio-based funnel.
- Fix: Keep snapshot semantics and show distinct applicant total; do not relabel snapshot as cumulative funnel.

## G2-10-012-022  [P1] MISSING  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:81-88 — Attention only for jobId === parsed selected job, not all college drives.
- vNext now: src/modules/placements/super-admin-drive-pipeline-service.ts:15-38 — Pipeline scoped by selected job, but missing any attention projection.
- Fix: Filter college-wide attention source by job ID before display.

## G2-10-012-029  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:60-64 — Metrics GET failure shows 'Could not load pipeline metrics.' but leaves job header intact.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx:23-31; src/modules/placements/super-admin-drive-pipeline-service.ts:15-38 — getSuperAdminDrivePipeline awaited before workspace; rejection aborts entire page rendering.
- Fix: Make pipeline optional/settled and render warning without hiding drive identity or buttons.

## G2-10-012-039  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:49-68; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:167-197 — GET /api/v1/admin/jobs/{jobId}?collegeId, independent GET /metrics?collegeId&jobId; errors separately settled.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx:23-31; src/modules/placements/job-service.ts:136-147; src/modules/placements/super-admin-drive-pipeline-service.ts:15-38 — getPlacementJob and pipeline direct SQL; Super Admin page awaits pipeline before workspace.
- Fix: Use Promise.allSettled for independent drive and metrics; show hero on metrics failure.

## G2-10-012-041  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:860-883; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2278-2328 — GET /metrics aggregates legacy job_application.current application_status per college/job, plus other timing stats.
- vNext now: src/modules/placements/super-admin-drive-pipeline-service.ts:15-38; src/modules/placements/super-admin-drive-pipeline-model.ts:4-27 — Direct SQL count by persisted college stage or screening fallback, not canonical legacy status.
- Fix: Write status mapping, account for changed semantics (screening fallback, withdrawn excluded).

## G2-10-012-077  [P1] GAP  facet F21  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:12,49-51,76-78 — AdminService calls GET job, metrics, needs-attention (all college-scoped).
- vNext now: src/modules/placements/job-service.ts:136-147; src/modules/placements/super-admin-drive-pipeline-service.ts:15-38 — Native services replace job+metrics; missing needs-attention integration.
- Fix: Implement selected-job attention service and consistent pipeline event projection.

## G2-10-012-081  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2278-2328 — Hiring metrics keyed lower-case current statuses from legacy JobApplication status (Applied etc).
- vNext now: src/modules/placements/super-admin-drive-pipeline-model.ts:4-27; src/modules/placements/super-admin-drive-pipeline-service.ts:17-38 — Derived stage from college stage row or screening; withdrawn excluded; includes waitlist/rejected footer.
- Fix: Reconcile snapshot metrics against actual applicant timeline and modern stage distribution.
