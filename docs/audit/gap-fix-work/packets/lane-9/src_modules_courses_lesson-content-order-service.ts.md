# Work packet: edit src/modules/courses/lesson-content-order-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/lesson-content-controller.md

## G2-3-027-083  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/resources/db/migration/V37__lesson_content_class_sequence.sql:1-14`
- vNext now: `src/modules/courses/lesson-content-order-service.ts:104-255`
- Fix: Legacy per-class content sequence override table UNIQUE(content_id,class_id), vNext staged lessonContentDeliverySequences and runtime gate; migration and scope crosswalk needed.
