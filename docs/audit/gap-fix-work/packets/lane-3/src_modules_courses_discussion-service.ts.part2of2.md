# Work packet: edit src/modules/courses/discussion-service.ts (part 2 of 2)

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u020-discussions.md, docs/audit/gap2/lane-1/l19-u031-cross-messaging.md, docs/audit/gap2/lane-2/classroom-controller.md, docs/audit/gap2/lane-3/l17-u027-discussion-controller.md, docs/audit/gap2/lane-17/classroom-message-entity.md

## G2-5-020-028  [P1] GAP  facet F11  effort L
- Legacy: Legacy scope calls requireAccessClass/course + requireTeachingScope `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:47-70`
- vNext now: VNext requireLearningReadAccess to delivery and learner/faculty guards `src/modules/courses/discussion-service.ts:53-87`
- Fix: Match faculty assigned-teaching access for each lesson content.

## G2-5-020-044  [P1] GAP  facet F21  effort L
- Legacy: Legacy controller delegates to LessonContentsService and LessonService for scope `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:24-69`
- vNext now: VNext delivery authorization via scoped read helpers `src/modules/courses/discussion-service.ts:53-88`
- Fix: Add registered lesson-parent ownership integration, not merely delivery checks.

## G2-19-031-045  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/DiscussionDTO.java:13-15` — Lesson post errors Content cannot be empty and Content cannot exceed 5000 characters.
- vNext now: `src/modules/courses/discussion-service.ts:35-38` — Delivery message validation has different field and length.
- Fix: Add field-specific lesson validation strings.

## G2-2-033-025  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassroomController.java:36-42 `since must be an ISO-8601 timestamp`
- vNext now: src/modules/courses/discussion-service.ts:42-50 validates `beforeCreatedAt`/beforeId compound cursor
- Fix: Map validation error per parameter, show reload-from-latest action.

## G2-2-033-027  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ClassroomServiceImpl.java:113-119 'Only faculty or admin can pin messages'
- vNext now: src/modules/courses/discussion-service.ts:334-345 DISCUSSION_MODERATION_ACCESS_DENIED
- Fix: Map permission denial to reader-friendly actionable text.

## G2-2-033-028  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ClassroomServiceImpl.java:138-139 'You can only delete your own messages'
- vNext now: src/modules/courses/discussion-service.ts:397-405 rejects own pinned message / moderator scope
- Fix: Explain pinned-message learner deletion restriction and preserve precise old wording where valid.

## G2-17-027-015  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/DiscussionDTO.java:13-15`
- vNext now: `src/modules/courses/discussion-service.ts:35-39`
- Fix: Legacy Content cannot be empty/Content cannot exceed 5000 characters, vNext Zod messages/3900 limit.

## G2-5-020-018  [P2] GAP  facet F07  effort S
- Legacy: Legacy scope missing gives 503 'Service unavailable' `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:41-43`
- vNext now: VNext missing delivery handled by scoped access and CoursesServiceError `src/modules/courses/discussion-service.ts:53-88`
- Fix: Translate service unavailable/missing content separately.

## G2-5-020-019  [P2] GAP  facet F07  effort M
- Legacy: Legacy unauthenticated 401 'Authentication required' `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:42-45`
- vNext now: VNext requireLearningReadAccess and role guard `src/modules/courses/discussion-service.ts:53-88`
- Fix: Map explicit 401/403/404 codes consistently.

## G2-5-020-020  [P2] MISSING  facet F07  effort S
- Legacy: Legacy absent lesson content 404 'Lesson content not found' `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:45-46`
- vNext now: VNext delivery scoped UUID and no lesson-content lookup in active API `src/modules/courses/discussion-service.ts:53-65`
- Fix: Add lesson content not-found handling with exact code.

## G2-19-031-043  [P3] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassroomController.java:36-42` — Bad since yields HTTP400 since must be an ISO-8601 timestamp.
- vNext now: `src/modules/courses/discussion-service.ts:42-49` — New history validates strict cursor pair with Complete cursor required.
- Fix: Map invalid cursor to clear localized wording.

## G2-19-031-044  [P3] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ClassroomServiceImpl.java:89-93` — Empty classroom post says Message cannot be empty.
- vNext now: `src/modules/courses/discussion-service.ts:35-37` — Zod min1 exposes different error contract.
- Fix: Map error to legacy copy.

## G2-17-020-017  [P3] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassroomController.java:38-42 — Malformed since rejects `since must be an ISO-8601 timestamp`.
- vNext now: src/modules/courses/discussion-service.ts:41-48 — Zod cursor requires offset ISO and paired beforeId.
- Fix: Align pagination validation error surface.

## G2-2-033-026  [P3] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ClassroomServiceImpl.java:93 'Message cannot be empty'
- vNext now: src/modules/courses/discussion-service.ts:35-37 Zod min1, returned by apiErrorResponse
- Fix: Show exact legacy blank message copy inline at composer.

## G2-5-020-023  [P3] GAP  facet F08  effort S
- Legacy: Legacy GET success Response(HttpStatus.OK,'OK',data) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:85-93`
- vNext now: New list includes accessMode/canPost/messages/pinned/nextCursor `src/modules/courses/discussion-service.ts:149-165`
- Fix: Map response unwrap and empty state in consumers.
