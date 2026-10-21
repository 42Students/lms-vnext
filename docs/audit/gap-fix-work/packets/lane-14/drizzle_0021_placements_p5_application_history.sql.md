# Work packet: edit drizzle/0021_placements_p5_application_history.sql

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/job-application-status-history-service.md

## G2-3-013-044  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplicationStatusHistory.java:13-35`, `docs/legacy-source/backend/src/main/resources/db/migration/V40__job_application_status_history.sql:4-18`
- vNext now: `src/db/schema/placements.ts:1064-1110`, `drizzle/0021_placements_p5_application_history.sql:1-17`
- Fix: Legacy MySQL INT PK, nullable actor and soft-delete, varchar50 status/reason500, cascade delete with separate changed index. vNext UUID PK/required actor/timestamptz/text reason, restrictive FK, narrow enum. Provide migration/mapping, preserve historical records.
