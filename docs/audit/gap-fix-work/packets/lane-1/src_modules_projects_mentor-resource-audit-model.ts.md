# Work packet: edit src/modules/projects/mentor-resource-audit-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/l15-u017-project-resource-audit.md

## G2-15-017-044  [P1] GAP  facet F20  effort M
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V197__project_resource_creator_type.sql:6-20 backfill original actor role from first UPSERT audit
- vNext now: src/modules/projects/mentor-resource-audit-model.ts:13-20 new event metadata no actor type snapshot
- Fix: Store immutable creator role and guard cross-role ID collisions
