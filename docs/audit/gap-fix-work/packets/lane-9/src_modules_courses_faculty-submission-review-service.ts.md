# Work packet: edit src/modules/courses/faculty-submission-review-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/assignment-controller.md

## G2-2-026-005  [P1] GAP  facet F01  effort L
- Legacy: AssignmentController.java:216-268 offers `/submissionStats` and `/submissionStats/bulk`.
- vNext now: faculty-submission-review-service.ts:13-35 supplies per-assignment review, not `SubmissionStatsDTO` bulk map.
- Fix: Add roster-aware single/bulk statistics service with same authorized counts and missing-student IDs.

## G2-2-026-017  [P1] GAP  facet F04  effort L
- Legacy: SubmissionStatsDTO.java:9-15 includes totalStudents,totalSubmitted,totalGraded,notGraded,notSubmitted and 2 student-ID lists.
- vNext now: faculty-submission-review-service.ts:32-34 returns selected paged submission rows rather than those six roster fields.
- Fix: Compute all roster-derived stats including both absent ID sets with tenant authorization.

## G2-2-026-023  [P1] GAP  facet F05  effort L
- Legacy: AssignmentController.java:236-267 bulk stats distincts at most 100 IDs, silently omits unauthorized IDs.
- vNext now: faculty-submission-review-service.ts:13-35 handles one assignment at a time.
- Fix: Add capped batch stat route; preserve unauthorized-ID omission without side-channel.

## G2-2-026-052  [P1] GAP  facet F10  effort L
- Legacy: AssignmentServiceImpl.java:754-817 computes roster-based submission stats and missing learner IDs.
- vNext now: faculty-submission-review-service.ts:13-35 only filters recorded submission rows.
- Fix: Create roster join for not-submitted counts and IDs with scoped delivery audience.
