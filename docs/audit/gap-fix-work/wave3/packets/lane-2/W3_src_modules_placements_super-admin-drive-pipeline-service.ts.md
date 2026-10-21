# Work packet (wave 3): edit src/modules/placements/super-admin-drive-pipeline-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-overview.md

## G2-10-012-040  [P1] MISSING  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:75-88; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:975-993 — GET /api/v1/admin/jobs/needs-attention?collegeId returns category maps; client matches item.jobId.
- vNext now: src/modules/placements/super-admin-drive-pipeline-service.ts:15-38 — No selected-job attention service equivalent on page.
- Fix: Implement scoped attention projection for four legacy categories, preserve item fields.

## G2-10-012-049  [P1] MISSING  facet F12  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:1780-1880 — Attention stale applications threshold >=7d, interview unscheduled and missing offer letter uses live records.
- vNext now: src/modules/placements/super-admin-drive-pipeline-service.ts:15-38 — Only stage bucket counts; cannot show stuck/missing-offer/closing-soon actions.
- Fix: Recreate exactly the backend attention rules with status time and scheduling/offer evidence.

## G2-10-012-083  [P1] MISSING  facet F23  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:140-180 — Selected-job follow-ups show overdue applications, unscheduled interviews, missing offer letters and closing soon.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx:23-31; src/modules/placements/super-admin-drive-pipeline-service.ts:15-38 — Only stage counts; follow-up rules not present.
- Fix: Restore attention banner and exact business criteria, plus completion tests.
