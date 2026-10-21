# Work packet (wave 2): edit drizzle/0007_courses_c4b_quizzes.sql

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/quiz-option-entity.md

## G2-17-016-044  [P2] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V66__first_class_quiz_tables.sql:38-49 — MySQL quiz_options with is_deleted and update timestamp, FK ON DELETE CASCADE.
- vNext now: drizzle/0007_courses_c4b_quizzes.sql:36-44 — Postgres UUID options with no is_deleted/updated_at, sequence CHECK.
- Fix: Map deleted options and timestamps to audit/snapshots on migration.
