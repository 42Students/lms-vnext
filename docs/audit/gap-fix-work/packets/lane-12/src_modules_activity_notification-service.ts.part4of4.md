# Work packet: edit src/modules/activity/notification-service.ts (part 4 of 4)

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/notification-service-impl.md, docs/audit/gap2/lane-18/notification-service.md, docs/audit/gap2/lane-4/cross-notifications.md, docs/audit/gap2/lane-8/notification.md

## G2-15-011-025  [P2] GAP  facet F07  effort S
- Legacy: Course not found for slug. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:89-94`)
- vNext now: UUID event/user validation errors, no courseSlug error equivalent. (`src/modules/activity/notification-service.ts:146-158`)
- Fix: Restore course selector validation and error text at publisher boundary.

## G2-18-012-017  [P2] GAP  facet F07  effort S
- Legacy: Legacy invalid slug raises 400 `Course not found for slug` (`NotificationServiceImpl.java:89-95`).
- vNext now: New no slug acceptance; event actionHref internal route validated (`notification-service.ts:46-54`).
- Fix: Resolve course slug for legacy APIs, return exact safe validation message.

## G2-18-012-021  [P2] GAP  facet F08  effort M
- Legacy: Legacy save immediate status SENT and deliveredAt now; scheduled status SCHEDULED (`NotificationServiceImpl.java:139-150`).
- vNext now: New delivery reports delivered/skippedInactive/skippedDuplicate, no delivery status per row (`notification-service.ts:237-243`).
- Fix: Surface sent/scheduled/failed counts and operator-facing feedback per intended workflow.

## G2-18-012-022  [P2] GAP  facet F08  effort M
- Legacy: Legacy update/delete sends SSE but logs push failure without failing save (`NotificationServiceImpl.java:216-252`).
- vNext now: New notification write persists without push failure path (`notification-service.ts:218-243`).
- Fix: Ensure save success is independent of realtime transport while exposing soft warning.

## G2-4-032-021  [P2] GAP  facet F07  effort M
- Legacy: No auth `Authentication required`; missing class/course `classId or courseId required` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:63-73`)
- vNext now: Zod field limits and typed ActivityServiceError (`src/modules/activity/notification-service.ts:34-58`)
- Fix: Translate errors for migrated class/course API clients.

## G2-4-032-024  [P2] GAP  facet F07  effort M
- Legacy: Assessment URL must use http or https (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:78-84`)
- vNext now: actionHref must be safe internal path (`src/modules/activity/notification-service.ts:46-55`)
- Fix: Convert approved legacy external assessment URL to protected redirect or decide denial.

## G2-8-018-025  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/NotificationDTO.java:12-17: exact HTML/title required and max-length messages
- vNext now: src/modules/activity/notification-service.ts:34-58: Zod min/max with different limits
- Fix: Restore exact field-level validation messages for legacy composer.

## G2-8-018-026  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:61-84: “classId or courseId required” on invalid audience
- vNext now: src/modules/activity/notification-service.ts:69-129: user scope guard, no audience validation
- Fix: When accepting legacy audience payload, return same missing-class/course message.

## G2-8-018-027  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:108-123,204-210: “Notification not found”; “An error occurred”
- vNext now: src/modules/activity/notification-service.ts:365-439: NOTIFICATION_NOT_FOUND service error
- Fix: Map missing/error responses with usable HTTP statuses and old copy.

## G2-8-018-030  [P2] GAP  facet F08  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:58-84,178-203: create/update HTTP OK with notification DTO
- vNext now: src/modules/activity/notification-service.ts:140-266: delivery returns inserted user records/count
- Fix: Map old mutation response shape where compatibility is required.
