# Work packet (wave 2): edit src/app/api/placements/learner/saved-jobs/route.ts

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/learner-saved-jobs-service.md, docs/audit/gap2/lane-19/learner-saved-job-service.md, docs/audit/gap2/lane-3/learner-saved-job.md, docs/audit/gap2/lane-6/job-controller.md

## G2-17-011-002  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:828-864 — Two GET endpoints saved-ids/{learnerId} and saved/{learnerId}.
- vNext now: src/app/api/placements/learner/saved-jobs/route.ts:7-12 — One private current-user GET /api/placements/learner/saved-jobs.
- Fix: Document old GET redirects or adapt client calls.

## G2-17-011-009  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerSavedJobServiceImpl.java:50-64 — Saved IDs Set<Integer>, saved jobs List<Job> (full Job entity).
- vNext now: src/app/api/placements/learner/saved-jobs/route.ts:7-12 — List of {id,jobId,savedAt,title}, UUID identifiers.
- Fix: Expose equivalent fields/IDs in UI as needed; avoid disclosing full record data.

## G2-17-011-028  [P2] GAP  facet F10  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:746-888 — Legacy path prefixes save/unsave/saved-ids/saved with learnerId in path.
- vNext now: src/app/api/placements/learner/saved-jobs/route.ts:7-12 — Current-user-only GET; POST/DELETE by job ID.
- Fix: Make old deep links safe redirect or 404, never trust foreign learner ID.

## G2-19-012-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy bookmark service owned by JobController `/api/v1/jobs` learner-specific routes `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/LearnerSavedJobService.java:11-36` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:53-55` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:745-750`
- vNext now: vNext learner bookmark routes `/api/placements/learner/saved-jobs` and `/[jobId]` `src/app/api/placements/learner/saved-jobs/route.ts:5-12` `src/app/api/placements/learner/saved-jobs/[jobId]/route.ts:8-23`
- Fix: Map legacy deep API consumers to new self-scoped routes.

## G2-19-012-032  [P2] GAP  facet F13  effort S
- Legacy: Legacy null saved-job service returns 503 on mutation, empty list on read `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:764-765` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:841-842` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:873-874`
- vNext now: vNext installed service calls DB and error handler, no optional disabled-injection pathway `src/modules/placements/saved-job-service.ts:29-53` `src/app/api/placements/learner/saved-jobs/route.ts:7-12`
- Fix: Show feature-unavailable response if storage not provisioned.

## G2-3-019-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:744-885`
- vNext now: `src/app/(authenticated)/learn/my-placements/jobs/page.tsx:59-81`, `src/app/api/placements/learner/saved-jobs/route.ts:7-13`, `src/app/api/placements/learner/saved-jobs/[jobId]/route.ts:8-23`
- Fix: Legacy save endpoints POST /jobs/{jobId}/save/{learnerId}, DELETE /unsave/{learnerId}, GET saved-ids and saved; vNext /api/placements/learner/saved-jobs with job ID and session-derived learner. Provide old-route redirect/adapter if deep-linked, keep own-scope.

## G2-3-019-023  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:830-885`
- vNext now: `src/app/api/placements/learner/saved-jobs/route.ts:7-13`, `src/modules/placements/saved-job-service.ts:73-95`
- Fix: Legacy separate saved IDs and complete saved jobs GET endpoints, recheck visibility per bookmark; vNext one GET returns limited joined items, no IDs-only route. Preserve efficient IDs projection for card badges.

## G2-3-019-029  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:841-855`, `873-884`
- vNext now: `src/app/api/placements/learner/saved-jobs/route.ts:7-13`, `src/components/placements/learner-jobs-browse.tsx:240-244`
- Fix: Legacy missing bookmark service gracefully returns empty set/list and message `No saved jobs`; vNext DB table missing will throw, page server load fails. Add explicit not-ready fallback preserving safe state and disabling save.

## G2-6-027-013  [P2] GAP  facet F05  effort S
- Legacy: Saved IDs returned as Set<Integer> distinct from full Job list (JobController.java:830-852,862-880).
- vNext now: vNext single saved list includes id,jobId,savedAt,title (saved-job-service.ts:72-94; learner/saved-jobs/route.ts:7-12).
- Fix: Provide an ID-only projection/cache where frontend requests it; keep visibility filtering.

## G2-19-012-041  [P3] GAP  facet F18  effort S
- Legacy: Legacy saved list response label `Saved jobs retrieved` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:877-880`
- vNext now: vNext GET `{jobs}` with no message `src/app/api/placements/learner/saved-jobs/route.ts:7-12`
- Fix: Normalize response or preserve exact older copy where displayed.
