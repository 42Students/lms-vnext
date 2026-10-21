# Work packet: edit src/modules/placements/saved-job-service.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/learner-placement-jobs.md, docs/audit/gap2/lane-20/learner-saved-job-repository.md, docs/audit/gap2/lane-3/learner-saved-job.md, docs/audit/gap2/lane-19/learner-saved-job-service.md

## G2-14-005-034  [P1] GAP  facet F05  effort M
- Legacy: Legacy expired saved lists all closed previously saved jobs, vNext bookmarks only if published and still in authorized job feed — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:519-539,658-678`
- vNext now: `src/modules/placements/saved-job-service.ts:72-95`
- Fix: Preserve previously saved expired jobs with privacy-safe historical read permission

## G2-14-005-050  [P1] GAP  facet F10  effort L
- Legacy: Legacy parallel getAllJobsWithEligibility, saved ids, saved jobs, learner applications and follow-up getApplyChecks (100); vNext direct authorized DB joins one server fetch+saved jobs — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:385-449`
- vNext now: `src/app/(authenticated)/learn/my-placements/jobs/page.tsx:59-63`; `src/modules/placements/learner-job-service.ts:52-89`; `src/modules/placements/saved-job-service.ts:72-95`
- Fix: Ensure equivalence of active visibility, applications stage and held offers in one service

## G2-14-005-080  [P1] GAP  facet F19  effort M
- Legacy: Legacy separate saved jobs endpoint preserves expired saves outside active job list; vNext saved service filters to current visible feed, drops archived — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:519-539`
- vNext now: `src/modules/placements/saved-job-service.ts:72-95`
- Fix: Persist and display permitted historic saves even if closed after bookmarking

## G2-20-014-023  [P1] GAP  facet F13  effort M
- Legacy: Legacy 503 unavailable if service injection absent `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:764-765`
- vNext now: New unregistered DB table failure not proactively detected in savedJobService `src/modules/placements/saved-job-service.ts:13-21`
- Fix: Verify numbered Drizzle migration deployed; return 503/disabled toggle rather than 500

## G2-3-019-024  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerSavedJobServiceImpl.java:56-64`
- vNext now: `src/modules/placements/saved-job-service.ts:75-95`
- Fix: Legacy bookmark remains after job closed/deadline passed; vNext stored row survives but listOwnPlacementSavedJobs filters status PUBLISHED/feed, losing page visibility. Add authorized historical summary query without changing bookmark permanence.

## G2-19-012-017  [P2] GAP  facet F07  effort S
- Legacy: Legacy controller checks positive numeric IDs, explicit 400 copy `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:753-758` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:803-807`
- vNext now: vNext UUID parsing via z.string().uuid() then apiErrorResponse `src/modules/placements/saved-job-service.ts:11-11` `src/app/api/placements/learner/saved-jobs/[jobId]/route.ts:11-14`
- Fix: Map malformed UUID to comparable 400/422 UX error.

## G2-20-014-014  [P3] GAP  facet F08  effort S
- Legacy: Success response messages returned as JSON `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:784-785,819-820`
- vNext now: New bookmark service returns data, not status/message `src/modules/placements/saved-job-service.ts:47-69`
- Fix: Client toast mapping for exact saved/unsaved copy
