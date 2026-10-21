# Work packet (wave 2): edit src/db/schema/academic-progression.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-batch-promotion.md

## G2-9-002-082  [P2] GAP  facet F22  effort M
- Legacy: Current semester and academic_year stored on batch (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Batch.java:33-47`)
- vNext now: cohort_progression_state stores term integer/yearStart/version (`src/db/schema/academic-progression.ts:6-17`)
- Fix: Format year string and verify old existing values mapped.
