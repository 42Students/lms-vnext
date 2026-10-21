# Work packet (wave 2): edit src/db/schema/placement-external.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/learner-saved-jobs-service.md, docs/audit/gap2/lane-19/learner-saved-job-service.md, docs/audit/gap2/lane-20/learner-saved-job-repository.md, docs/audit/gap2/lane-3/learner-saved-job.md

## G2-17-011-048  [P2] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V44__learner_saved_jobs.sql:2-9 — MySQL INT auto ID, learner/job INT, created DATETIME, unique pair and two indexes.
- vNext now: src/db/schema/placement-external.ts:94-109 — Postgres UUID ids, membership UUID, college UUID, timestamptz, unique pair and college index.
- Fix: Write mapping for legacy learnerId→membershipId, jobId→UUID and backfill timestamps.

## G2-17-011-050  [P2] GAP  facet F22  effort S
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V44__learner_saved_jobs.sql:6-9 — Separate index idx_job on job_id.
- vNext now: src/db/schema/placement-external.ts:106-109 — Unique membership/job supports job suffix poorly; no direct jobId index.
- Fix: Consider index(job_id) for job deletion and saved counts.

## G2-19-012-042  [P2] GAP  facet F19  effort M
- Legacy: Legacy database index by learner and by job; saved list full scan per learner no LIMIT `docs/legacy-source/backend/src/main/resources/db/migration/V44__learner_saved_jobs.sql:2-9` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LearnerSavedJobRepository.java:18-18`
- vNext now: vNext college+membership index and savedAt DESC order, no list cap `src/db/schema/placement-external.ts:93-109` `src/modules/placements/saved-job-service.ts:73-90`
- Fix: Add savedAt sort index/pagination for large bookmarks if needed.

## G2-19-012-049  [P2] GAP  facet F22  effort M
- Legacy: Legacy unique (learner_id,job_id) and separate indices `docs/legacy-source/backend/src/main/resources/db/migration/V44__learner_saved_jobs.sql:7-9`
- vNext now: vNext unique (membership_id,job_id) plus college/member index `src/db/schema/placement-external.ts:106-109`
- Fix: Verify uniqueness across re-enrollment/tenant migration and include FK scope.

## G2-20-014-006  [P2] GAP  facet F04  effort S
- Legacy: Entity ID Integer, learner_id/job_id Integer, createdAt LocalDateTime `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LearnerSavedJob.java:14-27`
- vNext now: UUID id/membershipId/jobId and savedAt timestamptz `src/db/schema/placement-external.ts:93-105`
- Fix: Map timestamp/ID presentation and UTC→IST conversion

## G2-20-014-034  [P2] GAP  facet F22  effort M
- Legacy: MySQL table learner_saved_job unique learner/job and createdAt `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LearnerSavedJob.java:13-27`
- vNext now: Postgres placement_saved_jobs unique membership/job plus explicit collegeId, savedAt `src/db/schema/placement-external.ts:93-110`
- Fix: Verify migration 0094 applied; map old learner ID to membership if migration required

## G2-3-019-008  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LearnerSavedJob.java:13-40`
- vNext now: `src/db/schema/placement-external.ts:93-110`
- Fix: Legacy saved-job id integer, learnerId and jobId integer unique pair with LocalDateTime created_at; vNext UUID id, membershipId+job UUID+college UUID unique, savedAt timestamptz. Preserve timestamp and legacy identity during conversion.
