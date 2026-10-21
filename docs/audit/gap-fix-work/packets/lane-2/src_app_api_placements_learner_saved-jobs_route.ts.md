# Work packet: edit src/app/api/placements/learner/saved-jobs/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/learner-saved-job-repository.md, docs/audit/gap2/lane-19/learner-saved-job-service.md

## G2-20-014-012  [P2] GAP  facet F07  effort S
- Legacy: Legacy save controller 503 'Saved jobs not configured' when service absent `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:764-765`
- vNext now: New service assumes schema ready; DB errors mapped by generic handler `src/app/api/placements/learner/saved-jobs/route.ts:7-12`
- Fix: Add user-friendly storage unavailable message if migration absent

## G2-19-012-022  [P3] GAP  facet F08  effort S
- Legacy: Legacy saved read successful message `Saved jobs retrieved` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:876-880`
- vNext now: vNext JSON response `{jobs}` without message envelope `src/app/api/placements/learner/saved-jobs/route.ts:7-12`
- Fix: Restore legacy-compatible response normalization in client or API facade.
