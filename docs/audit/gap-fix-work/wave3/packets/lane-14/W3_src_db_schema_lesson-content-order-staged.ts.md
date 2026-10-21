# Work packet (wave 3): edit src/db/schema/lesson-content-order-staged.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/lesson-content-class-sequence-entity.md

## G2-17-018-020  [P1] MISSING  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V37__lesson_content_class_sequence.sql:3-13 — Physical legacy class sequence table from V37.
- vNext now: src/db/schema/lesson-content-order-staged.ts:1-3 — vNext table marked staged only.
- Fix: Register schema/index/FKs before enabling order API.

## G2-17-018-040  [P1] MISSING  facet F22  effort L
- Legacy: docs/planning/db05-content-order-delivery-scope-contract.md:16-32 — Candidate needs composite content+lesson and offering+delivery referential constraints.
- vNext now: src/db/schema/lesson-content-order-staged.ts:10-15 — Staged model declares one content FK and lessonId, composite FK planned in SQL.
- Fix: Add composite FKs/unique exact ordering prior to activation.
