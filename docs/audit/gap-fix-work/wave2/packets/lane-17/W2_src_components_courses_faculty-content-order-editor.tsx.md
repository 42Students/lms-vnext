# Work packet (wave 2): edit src/components/courses/faculty-content-order-editor.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/lesson-content-class-sequence-entity.md, docs/audit/gap2/lane-3/lesson-content-controller.md

## G2-17-018-004  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LessonContentsServiceImpl.java:1150-1187 — Admin can reorder class contents through whole-order service.
- vNext now: src/components/courses/faculty-content-order-editor.tsx:103-119 — Faculty editor adds explanation and Save/Reset.
- Fix: Confirm admin equivalence and placement in old content editor.

## G2-17-018-012  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LessonContentsServiceImpl.java:1161-1187 — Server writes whole reordered class list.
- vNext now: src/components/courses/faculty-content-order-editor.tsx:138-187 — Arrow buttons reorder one position, Save full order.
- Fix: Consider drag handle parity plus keyboard arrow fallback.

## G2-3-027-011  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:558-596`
- vNext now: `src/components/courses/faculty-content-order-editor.tsx:16-49`
- Fix: Legacy historic class target selector includes stored historical class in edit mode; vNext delivery-bound order editor only shows current supplied delivery list.

## G2-3-027-013  [P2] MISSING  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:351-383`
- vNext now: `src/components/courses/faculty-content-order-editor.tsx:101-137`
- Fix: Legacy per-content-type metrics by class are separate endpoint; vNext order editor has status badge but no equivalent type count summary.

## G2-3-027-015  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:617-632`
- vNext now: `src/components/courses/faculty-content-order-editor.tsx:101-137`
- Fix: Legacy order update returns Order updated; vNext toast Section order saved and disabled-state Order saved. Match exact copy if UI-clone is required.

## G2-17-018-032  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V37__lesson_content_class_sequence.sql:1-2 — Legacy comment says class-only order; no end-user label.
- vNext now: src/components/courses/faculty-content-order-editor.tsx:107-117 — Uses `Section content order`, `Migration pending`.
- Fix: Align class/section terminology to old LMS label policy.

## G2-3-027-071  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:630-631`
- vNext now: `src/components/courses/faculty-content-order-editor.tsx:83-95`
- Fix: Legacy message Order updated differs from vNext Section order saved / Could not save Section order toast.
