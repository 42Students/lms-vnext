# Work packet: edit src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-overview.md

## G2-10-012-029  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:60-64 — Metrics GET failure shows 'Could not load pipeline metrics.' but leaves job header intact.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx:23-31; src/modules/placements/super-admin-drive-pipeline-service.ts:15-38 — getSuperAdminDrivePipeline awaited before workspace; rejection aborts entire page rendering.
- Fix: Make pipeline optional/settled and render warning without hiding drive identity or buttons.

## G2-10-012-039  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:49-68; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:167-197 — GET /api/v1/admin/jobs/{jobId}?collegeId, independent GET /metrics?collegeId&jobId; errors separately settled.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx:23-31; src/modules/placements/job-service.ts:136-147; src/modules/placements/super-admin-drive-pipeline-service.ts:15-38 — getPlacementJob and pipeline direct SQL; Super Admin page awaits pipeline before workspace.
- Fix: Use Promise.allSettled for independent drive and metrics; show hero on metrics failure.

## G2-10-012-053  [P1] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:226-233 — Pipeline error remains in card and states 'Could not load pipeline metrics'.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx:23-31; src/components/placements/super-admin-drive-pipeline.tsx:5-29 — No local error fallback; pipeline service error aborts before render.
- Fix: Catch only pipeline promise; preserve hero and actions.

## G2-10-012-071  [P1] GAP  facet F19  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:49-64 — Promise.allSettled of job and metrics; attention fetched separately; page resilience under partial failure.
- vNext now: src/components/placements/placement-drive-workspace.tsx:70-115; src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx:23-31 — Many Promise.all required calls and preloaded pipeline; one failure cancels entire server render.
- Fix: Split required identity and optional metrics/auxiliary reads; add per-panel recoveries.

## G2-10-012-028  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:48-57 — parseInt(jobId,10) and failed job fetch shows 'Could not load this drive.' in Alert.
- vNext now: src/modules/placements/job-service.ts:136-147; src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx:22-23 — UUID Zod service error route, not same inline message or back recovery.
- Fix: Map invalid/missing job errors to actionable legacy message and Drives back.

## G2-10-012-031  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:101-106 — No selected college renders warning Select a college to continue.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx:15-20 — EmptyState Choose a college plus Placement overview back action.
- Fix: Match exact warning copy and pale-yellow styling.
