# Work packet (wave 2): edit src/app/api/placements/learner/saved-jobs/[jobId]/route.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/learner-saved-jobs-service.md, docs/audit/gap2/lane-19/learner-saved-job-service.md, docs/audit/gap2/lane-3/learner-saved-job.md

## G2-17-011-001  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerSavedJobServiceImpl.java:27-35 — Bookmarks a legacy Job for given learner; interface called by JobController.
- vNext now: src/app/api/placements/learner/saved-jobs/[jobId]/route.ts:8-14 — POST nested saved-jobs/{jobId} for authenticated learner.
- Fix: Preserve prior job detail bookmark state and old URL redirects.

## G2-19-012-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy bookmark service owned by JobController `/api/v1/jobs` learner-specific routes `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/LearnerSavedJobService.java:11-36` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:53-55` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:745-750`
- vNext now: vNext learner bookmark routes `/api/placements/learner/saved-jobs` and `/[jobId]` `src/app/api/placements/learner/saved-jobs/route.ts:5-12` `src/app/api/placements/learner/saved-jobs/[jobId]/route.ts:8-23`
- Fix: Map legacy deep API consumers to new self-scoped routes.

## G2-19-012-007  [P2] GAP  facet F03  effort S
- Legacy: Legacy `unsaveJob` controller returns `{saved:false}` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:817-820`
- vNext now: vNext DELETE returns `{removed:boolean}` `src/app/api/placements/learner/saved-jobs/[jobId]/route.ts:16-21`
- Fix: Return saved:false alongside removed for legacy-equivalent clients.

## G2-19-012-025  [P2] GAP  facet F10  effort M
- Legacy: Legacy POST `/api/v1/jobs/{jobId}/save/{learnerId}` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:745-750`
- vNext now: vNext POST `/api/placements/learner/saved-jobs/{jobId}` `src/app/api/placements/learner/saved-jobs/[jobId]/route.ts:8-15`
- Fix: Document endpoint replacement/compatibility.

## G2-19-012-026  [P2] GAP  facet F10  effort M
- Legacy: Legacy DELETE `/api/v1/jobs/{jobId}/unsave/{learnerId}` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:794-801`
- vNext now: vNext DELETE `/api/placements/learner/saved-jobs/{jobId}` `src/app/api/placements/learner/saved-jobs/[jobId]/route.ts:16-23`
- Fix: Map unsave route and response contract.

## G2-3-019-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:744-885`
- vNext now: `src/app/(authenticated)/learn/my-placements/jobs/page.tsx:59-81`, `src/app/api/placements/learner/saved-jobs/route.ts:7-13`, `src/app/api/placements/learner/saved-jobs/[jobId]/route.ts:8-23`
- Fix: Legacy save endpoints POST /jobs/{jobId}/save/{learnerId}, DELETE /unsave/{learnerId}, GET saved-ids and saved; vNext /api/placements/learner/saved-jobs with job ID and session-derived learner. Provide old-route redirect/adapter if deep-linked, keep own-scope.

## G2-3-019-013  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:753-765`, `799-815`
- vNext now: `src/app/api/placements/learner/saved-jobs/[jobId]/route.ts:8-23`
- Fix: Legacy validates positive integer jobId/learnerId path, sends exact errors; vNext validates UUID and derives learner session. Map legacy bad id errors while preserving no caller-supplied learner id.

## G2-19-012-046  [P3] GAP  facet F21  effort M
- Legacy: Legacy JPA Spring repositories and Java interface `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/LearnerSavedJobService.java:11-36` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerSavedJobServiceImpl.java:16-24`
- vNext now: vNext Next route + Zod/Drizzle service `src/modules/placements/saved-job-service.ts:1-11` `src/app/api/placements/learner/saved-jobs/[jobId]/route.ts:1-23`
- Fix: Map Java DTO semantics to TypeScript API contract.
