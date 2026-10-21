# Work packet: edit drizzle/0098_academics_legacy_fidelity_columns.sql

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-course-progress-controller.md, docs/audit/gap2/lane-2/admin-learner-progress-controller.md

## G2-2-015-092  [P1] GAP  facet F22  effort L
- Legacy: Migration V132 keys retakes using attempt column and unique (learner,content,attempt) `docs/legacy-source/backend/src/main/resources/db/migration/V132__learner_content_progress_attempt.sql:19-32`
- vNext now: vNext migration 0098 ADDS attempt, but the existing two-column unique membership/content index remains `drizzle/0098_academics_legacy_fidelity_columns.sql:3-10`; `src/db/schema/courses.ts:497-519`
- Fix: Replace two-column unique with membership/content/attempt and add indexed latest-attempt reads; do not add a duplicate attempt column

## G2-2-017-057  [P1] GAP  facet F22  effort L
- Legacy: Legacy DB unique learner/content/attempt, max-attempt index and default1 `docs/legacy-source/backend/src/main/resources/db/migration/V132__learner_content_progress_attempt.sql:19-32`
- vNext now: Migration 0098 adds attempt and check, but not unique replacement `drizzle/0098_academics_legacy_fidelity_columns.sql:3-10`
- Fix: Replace unique with membership/content/attempt and add matching index
