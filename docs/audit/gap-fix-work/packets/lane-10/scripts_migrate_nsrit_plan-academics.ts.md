# Work packet: edit scripts/migrate/nsrit/plan-academics.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/quiz-answer-entity.md

## G2-19-016-052  [P1] GAP  facet F22  effort L
- Legacy: Legacy migration is MySQL V66 `docs/legacy-source/backend/src/main/resources/db/migration/V66__first_class_quiz_tables.sql:69-83`
- vNext now: vNext Postgres quiz_attempt_answers in Drizzle plus nsrit import plans `src/db/schema/quizzes.ts:279-343` `scripts/migrate/nsrit/plan-academics.ts:1671-1794`
- Fix: Run staged mapping integrity checks and quarantine dangling answer refs.
