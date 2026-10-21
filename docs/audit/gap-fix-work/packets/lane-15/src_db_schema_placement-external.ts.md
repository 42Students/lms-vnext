# Work packet: edit src/db/schema/placement-external.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/learner-saved-job-service.md, docs/audit/gap2/lane-3/learner-saved-job.md

## G2-19-012-048  [P1] GAP  facet F22  effort L
- Legacy: Legacy `learner_saved_job` integer PK, learner_id and job_id and created_at `docs/legacy-source/backend/src/main/resources/db/migration/V44__learner_saved_jobs.sql:2-9` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LearnerSavedJob.java:13-27`
- vNext now: vNext `placement_saved_jobs` UUID PK, collegeId, membershipId, jobId, savedAt `src/db/schema/placement-external.ts:93-109`
- Fix: Map legacy learner ID→membership UUID, job INT→UUID and savedAt chronology.

## G2-3-019-042  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LearnerSavedJob.java:14-40`
- vNext now: `src/db/schema/placement-external.ts:94-109`
- Fix: Legacy MySQL learner_saved_job unique(learner_id,job_id), created_at local timestamp and nullable FK constraints; vNext Postgres placement_saved_jobs unique(membership_id,job_id), collegeId UUID, FK restrict and timezone. Map multi-college ownership/old IDs in migration.
