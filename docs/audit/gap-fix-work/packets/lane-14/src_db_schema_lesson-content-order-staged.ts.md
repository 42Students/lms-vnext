# Work packet: edit src/db/schema/lesson-content-order-staged.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/lesson-content-class-sequence-entity.md

## G2-17-018-039  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V37__lesson_content_class_sequence.sql:3-13 — MySQL BIGINT per class without FK, unique pair, created/updated timestamps.
- vNext now: src/db/schema/lesson-content-order-staged.ts:7-27 — Postgres UUID scope + lessonId+actor and 0..int sequence, staged only.
- Fix: Register DB migration, backfill old classId→delivery and preserve sequences.
