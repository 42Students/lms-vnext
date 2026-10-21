# Work packet: edit src/app/api/placements/college/jobs/[jobId]/pipeline/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-applications.md, docs/audit/gap2/lane-9/college-admin-jobs-applications.md

## G2-10-011-033  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:637-694 — Status writes reject absent applicationStatus and concurrent changes with clean 400/409 responses.
- vNext now: src/app/api/placements/college/jobs/[jobId]/pipeline/route.ts:14-20; src/modules/placements/college-application-stage-service.ts:47-83 — Zod action validation and per-row skipped result; no identical stale-write 409 surfaced in UI.
- Fix: Preserve actionable stale-edit conflict/error response with retry/read-back.

## G2-9-010-048  [P1] GAP  facet F10  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:516-605` — POST bulk-status drives canonical application status updates and notifications
- vNext now: `src/app/api/placements/college/jobs/[jobId]/pipeline/route.ts:14-19` — POST pipeline changes separate college stage and screening with in-app notification
- Fix: Trace canonical application-status outcomes; do not misrepresent stage-only moves as legacy status transitions
