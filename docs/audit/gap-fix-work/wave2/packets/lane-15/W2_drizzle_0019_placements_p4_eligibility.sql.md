# Work packet (wave 2): edit drizzle/0019_placements_p4_eligibility.sql

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/job-eligibility-override-repository.md

## G2-17-014-044  [P2] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V161__tpo_v1_drives.sql:78-88 — job_eligibility_override MySQL table: unique job/learner and index job.
- vNext now: drizzle/0019_placements_p4_eligibility.sql:60-82 — Postgres UUID override table, partial unique active, index membership+revoked.
- Fix: Map IDs, reason, creator, timestamps and revoked history in migration.
