# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-17/lesson-content-class-sequence-entity.md

3 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-17/lesson-content-class-sequence-entity.md

## G2-17-018-025  [P2] GAP  facet F12  effort M
- Legacy: src/modules/courses/lesson-content-order-service.ts:104-140 — Reorder only rows of same learning path/offering delivery.
- vNext now: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LessonContentsServiceImpl.java:607-615 — Class override applies to current contents.
- Fix: Test shared and section-specific content masking and inherited order.

## G2-17-018-027  [P2] GAP  facet F13  effort S
- Legacy: src/components/courses/faculty-content-order-editor.tsx:109-113 — Migration pending warning disables Save.
- vNext now: docs/legacy-source/backend/src/main/resources/db/migration/V37__lesson_content_class_sequence.sql:3-13 — Legacy column exists without staged runtime gate.
- Fix: Present actionable readiness error and no false success.

## G2-17-018-042  [P2] GAP  facet F23  effort M
- Legacy: src/components/courses/faculty-content-order-editor.tsx:109-118 — Migration pending badge and excludes assessments from order.
- vNext now: docs/legacy-source/backend/src/main/resources/db/migration/V37__lesson_content_class_sequence.sql:1-2 — Legacy class order not explicitly restricted to only Resource/Video.
- Fix: Verify what legacy ordered vs new assessment separation and adapt sorting.
