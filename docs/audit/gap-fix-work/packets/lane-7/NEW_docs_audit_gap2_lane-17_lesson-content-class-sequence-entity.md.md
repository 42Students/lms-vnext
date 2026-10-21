# Work packet: NEW / MISSING items from docs/audit/gap2/lane-17/lesson-content-class-sequence-entity.md

2 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-17/lesson-content-class-sequence-entity.md

## G2-17-018-006  [P1] GAP  facet F03  effort L
- Legacy: src/components/courses/faculty-content-order-editor.tsx:106-117 — vNext badge `Migration pending` when disabled.
- vNext now: docs/legacy-source/backend/src/main/resources/db/migration/V37__lesson_content_class_sequence.sql:1-14 — Legacy always has table from V37.
- Fix: Register DB05 delivery order migration and remove disabled state after acceptance.

## G2-17-018-014  [P1] GAP  facet F07  effort L
- Legacy: src/app/api/courses/lesson-contents/order/route.ts:17-24 — Migration pending returns 503 with code.
- vNext now: docs/legacy-source/backend/src/main/resources/db/migration/V37__lesson_content_class_sequence.sql:1-14 — Legacy V37 installed with no environment toggle.
- Fix: Ship registered migration or show clear disabled copy with ops recovery.
