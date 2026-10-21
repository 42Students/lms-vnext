# Work packet (wave 2): edit src/modules/courses/lesson-content-order-service.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/lesson-content-class-sequence-entity.md, docs/audit/gap2/lane-3/lesson-content-controller.md

## G2-17-018-021  [P2] GAP  facet F11  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LessonContentClassSequence.java:10-14 — Legacy creator/admin may reorder for one class.
- vNext now: src/modules/courses/lesson-content-order-service.ts:137-140 — Requires delivery content mutation permission.
- Fix: Validate College Admin and Super Admin path parity in policy.

## G2-3-027-006  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:533-615`
- vNext now: `src/modules/courses/lesson-content-order-service.ts:104-140`
- Fix: Legacy exposes fetchUniqueClassesByCourseId and fetchClassesForCourseSyllabus with historical selector; vNext content-order service validates delivery but does not list target classes.

## G2-3-027-021  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:533-555`
- vNext now: `src/modules/courses/lesson-content-order-service.ts:118-139`
- Fix: Legacy unique classes are class ID→display name mapping with cross-college filtering; vNext order writer accepts delivery UUID but doesn't supply display names.

## G2-3-027-026  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:558-615`
- vNext now: `src/modules/courses/lesson-content-order-service.ts:104-140`
- Fix: Legacy target selector offers current classes plus optionally all or a single historical class; vNext writer takes known delivery UUID only.

## G2-3-027-028  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/ClassContentOrderRequest.java:13-22`
- vNext now: `src/modules/courses/lesson-content-order-service.ts:114-140`
- Fix: Legacy `orderedContentIds` positive IDs, classId positive and lessonId positive; vNext accepts delivery UUID and content UUID, validates full audience set.

## G2-3-027-054  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:617-631`
- vNext now: `src/modules/courses/lesson-content-order-service.ts:175-255`
- Fix: Legacy per-class sequence override is unconditional and stored in lesson_content_class_sequence; vNext order is conditional on DB05 readiness, with full current list replacement.
