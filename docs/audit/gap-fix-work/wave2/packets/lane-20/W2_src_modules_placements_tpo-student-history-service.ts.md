# Work packet (wave 2): edit src/modules/placements/tpo-student-history-service.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u015-job-application-status-history-repository.md, docs/audit/gap2/lane-8/job-application-status-history.md

## G2-5-015-013  [P2] GAP  facet F05  effort S
- Legacy: Bulk query sorts applicationId ASC, changedAt ASC `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobApplicationStatusHistoryRepository.java:15-17`
- vNext now: TPO student reader batches UUIDs but does not specify history ordering `src/modules/placements/tpo-student-history-service.ts:178-197`
- Fix: Add applicationId,createdAt,id ordering to batch history.

## G2-5-015-014  [P2] GAP  facet F05  effort M
- Legacy: Bulk query filters exact newStatus parameter `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobApplicationStatusHistoryRepository.java:15-17`
- vNext now: TPO bulk query has no status filter `src/modules/placements/tpo-student-history-service.ts:178-197`
- Fix: Provide typed status-specific history filtering for reports.

## G2-5-015-017  [P2] GAP  facet F06  effort M
- Legacy: Bulk params integer applicationIds list plus String newStatus `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobApplicationStatusHistoryRepository.java:15-17`
- vNext now: TPO history API resolves membershipId and 25 UUID application IDs server side `src/modules/placements/tpo-student-history-service.ts:53-54,120-125`
- Fix: Add scoped batch helper accepting UUID list and normalized status.

## G2-5-015-024  [P2] GAP  facet F10  effort M
- Legacy: Bulk newStatus query excludes isDeleted TRUE and sorts by status transition time `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobApplicationStatusHistoryRepository.java:15-17`
- vNext now: TPO batch history SQL filters application ownership, not toStatus/deletion `src/modules/placements/tpo-student-history-service.ts:178-197`
- Fix: Support stage-filtered tenant-scoped bulk events without N+1.

## G2-5-015-039  [P2] GAP  facet F19  effort M
- Legacy: Bulk query returns all matching stage history with one `IN` statement `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobApplicationStatusHistoryRepository.java:15-17`
- vNext now: TPO reader batches 25 applications and their history `src/modules/placements/tpo-student-history-service.ts:120-125,178-197`
- Fix: Offer bounded bulk history read for hiring metrics, preserve scalability.

## G2-8-019-013  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobApplicationStatusHistoryRepository.java:12-17 per-app history asc, batch by newStatus/app ID/time
- vNext now: src/modules/placements/learner-application-detail-service.ts:109-119 per-app chronological SQL; src/modules/placements/tpo-student-history-service.ts:179-199 batch event join
- Fix: Verify batch status filtering and deterministic ordering.
