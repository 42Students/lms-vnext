# Work packet: edit src/modules/placements/super-admin-drive-pipeline-model.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-overview.md

## G2-10-012-017  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:241-255 — Pipeline numbers are status SNAPSHOT; current applications in each of six status buckets.
- vNext now: src/modules/placements/super-admin-drive-pipeline-service.ts:15-38; src/modules/placements/super-admin-drive-pipeline-model.ts:4-27 — Counts submitted apps grouped by stage; adds rejected/waitlisted totals and ratio-based funnel.
- Fix: Keep snapshot semantics and show distinct applicant total; do not relabel snapshot as cumulative funnel.

## G2-10-012-041  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:860-883; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2278-2328 — GET /metrics aggregates legacy job_application.current application_status per college/job, plus other timing stats.
- vNext now: src/modules/placements/super-admin-drive-pipeline-service.ts:15-38; src/modules/placements/super-admin-drive-pipeline-model.ts:4-27 — Direct SQL count by persisted college stage or screening fallback, not canonical legacy status.
- Fix: Write status mapping, account for changed semantics (screening fallback, withdrawn excluded).

## G2-10-012-048  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:241-255 — Pipeline is current-status snapshot: no cumulative claims and no drop-off percentages.
- vNext now: src/modules/placements/super-admin-drive-pipeline-model.ts:23-27; src/components/placements/super-admin-drive-pipeline.tsx:13-29 — hiringFunnel computes percentPrevious from current bucket counts and displays as prior-stage ratio.
- Fix: Suppress percent previous when stages are snapshots; only show supported cumulative metrics.

## G2-10-012-081  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2278-2328 — Hiring metrics keyed lower-case current statuses from legacy JobApplication status (Applied etc).
- vNext now: src/modules/placements/super-admin-drive-pipeline-model.ts:4-27; src/modules/placements/super-admin-drive-pipeline-service.ts:17-38 — Derived stage from college stage row or screening; withdrawn excluded; includes waitlist/rejected footer.
- Fix: Reconcile snapshot metrics against actual applicant timeline and modern stage distribution.

## G2-10-012-084  [P1] GAP  facet F23  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:235-255 — Comment explicitly forbids treating snapshot stage counts as cumulative funnel.
- vNext now: src/components/placements/super-admin-drive-pipeline.tsx:15-24; src/modules/placements/super-admin-drive-pipeline-model.ts:26-27 — Displays percentPrevious based on snapshots, potentially nonsensical when earlier bucket is 0.
- Fix: Remove or fix misleading percentage metrics before production.
