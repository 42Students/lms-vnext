# Work packet: edit src/app/api/placements/college/jobs/[jobId]/applications/[applicationId]/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-applications.md

## G2-9-010-050  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:772-828` — PATCH internal-notes updates in place with optimistic version
- vNext now: `src/app/api/placements/college/jobs/[jobId]/applications/[applicationId]/route.ts:15-20` — POST append note record with amendment reference instead of in-place overwrite
- Fix: Preserve note edit/audit visibility policy and handle stale editor

## G2-9-010-051  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:829-855` — PATCH offer-letter on application with URL field
- vNext now: `src/app/api/placements/college/jobs/[jobId]/applications/[applicationId]/route.ts:22-28` — PATCH attaches letter to identified offer id using confirmed:true
- Fix: Map legacy application-level letter to specific real offer and show missing-offer case
