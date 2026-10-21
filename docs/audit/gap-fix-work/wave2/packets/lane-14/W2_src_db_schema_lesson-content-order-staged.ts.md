# Work packet (wave 2): edit src/db/schema/lesson-content-order-staged.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/lesson-content-class-sequence-entity.md

## G2-17-018-001  [P2] GAP  facet F01  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LessonContentClassSequence.java:10-14 — Per-class override for shared lesson-content sequence.
- vNext now: src/db/schema/lesson-content-order-staged.ts:7-20 — Per-delivery override table staged under offering/section.
- Fix: Map classId to canonical deliveryId and reject cross-offering rows.

## G2-17-018-007  [P2] GAP  facet F04  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LessonContentClassSequence.java:25-36 — lessonContentId and classId ints, sequence long, created/updated LocalDateTime.
- vNext now: src/db/schema/lesson-content-order-staged.ts:10-20 — UUID lessonId/Content/Delivery, integer sequence, updatedByUserId, timestamps TZ.
- Fix: Map old numeric content/class IDs, BIGINT sequence, timestamp.
