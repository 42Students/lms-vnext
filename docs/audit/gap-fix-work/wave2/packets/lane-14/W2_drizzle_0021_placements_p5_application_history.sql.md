# Work packet (wave 2): edit drizzle/0021_placements_p5_application_history.sql

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/job-application-status-history-service.md

## G2-3-013-038  [P3] GAP  facet F19  effort S
- Legacy: `docs/legacy-source/backend/src/main/resources/db/migration/V40__job_application_status_history.sql:15-17`
- vNext now: `src/db/schema/placements.ts:1090-1095`, `drizzle/0021_placements_p5_application_history.sql:17-17`
- Fix: Legacy indexes application_id and changed_at separately, vNext compound application_id/created_at index and cascade partial index. Confirm query plans, preserve stable asc ordering.
