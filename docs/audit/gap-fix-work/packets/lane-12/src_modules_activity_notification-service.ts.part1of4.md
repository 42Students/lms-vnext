# Work packet: edit src/modules/activity/notification-service.ts (part 1 of 4)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l17-u026-notification-controller.md, docs/audit/gap2/lane-15/notification-service-impl.md

## G2-17-026-024  [P0] GAP  facet F11  effort M
- Legacy: Staff only create; faculty/admin/superadmin edit or delete; faculty creator-only; NotificationController.java:301-315
- vNext now: Generic producer validates stored recipient scope but not staff composer permission; notification-service.ts:61-130
- Fix: Never expose generic delivery API to user; enforce `requirePermission` plus creator/admin edit/delete, including cross-tenant reassignment.

## G2-17-026-025  [P0] GAP  facet F11  effort M
- Legacy: Both prior and requested class/course authorization before update; NotificationController.java:189-200
- vNext now: Delivery checks current recipient membership/recruiter grants/admin role; notification-service.ts:68-129
- Fix: Add before/after scope validation for any notification retargeting; never trust requested tenant/recipient.

## G2-17-026-008  [P1] GAP  facet F05  effort M
- Legacy: `fetchAll` pageNo=0/pageSize=50, DB-clamped size 1..200, descending ID; NotificationController.java:88-104; NotificationServiceImpl.java:177-194
- vNext now: Own inbox keyset `limit=50` capped 100, sorted createdAt desc, id desc; notification-service.ts:467-538
- Fix: Implement super-admin scoped listing with original page bounds and count, or document replacement admin affordance.

## G2-17-026-011  [P1] GAP  facet F06  effort M
- Legacy: Create DTO required htmlContent ≤50000/title ≤200; NotificationDTO.java:10-17
- vNext now: deliverySchema title 1..240/body 1..2000 and optional safe internal href; notification-service.ts:28-49
- Fix: Define separate staff composition validation keeping legacy 200/50000 bounds if editor parity required.

## G2-17-026-012  [P1] GAP  facet F06  effort L
- Legacy: Create requires classId>0 or courseId>0 and server-computed creatorFacultyId; NotificationController.java:65-78
- vNext now: Delivery requires eventId UUID and recipients IDs; notification-service.ts:133-162
- Fix: Supply authorized class/course audience resolver and immutable acting-user ownership mapping in producer API.

## G2-17-026-017  [P1] GAP  facet F07  effort M
- Legacy: Invalid assessment URL rejects with `Assessment URL must use http or https`; NotificationServiceImpl.java:71-79
- vNext now: Only safe internal `actionHref` accepted; notification-service.ts:39-47
- Fix: Handle external assessment URLs as an explicit trusted optional field; do not bypass internal-href restriction.

## G2-17-026-021  [P1] GAP  facet F10  effort L
- Legacy: POST `/createNotification`, PUT `/update/{id}`, DELETE `/delete/{id}`, DELETE `/deleteNotification`; NotificationController.java:59,179,214,272
- vNext now: Current shared service creates through event delivery and only exposes read acknowledgements; notification-service.ts:132-245,357-452
- Fix: Build staff author/edit/delete workflows only where legacy required, with service & API method/ownership parity.

## G2-17-026-022  [P1] GAP  facet F10  effort M
- Legacy: GET `/fetch/{id}`, `/fetchAll`, `/getNotifications`, `/getNotificationsByClassId`, `/getNotificationsForRecipient`; NotificationController.java:88-175
- vNext now: Own user query / count / cursor reader; notification-service.ts:246-355,465-538
- Fix: Document full route inventory and map admin/class-specific reads to new authorization model.

## G2-17-026-023  [P1] GAP  facet F10  effort L
- Legacy: Broadcast newly sent, updated and deleted class notifications over SSE; NotificationServiceImpl.java:151-165,230-262
- vNext now: Inbox reads server-side with no SSE in reviewed notification service; notification-service.ts:246-335
- Fix: Provide signed/authenticated real-time invalidation (SSE or equivalent) for class and personal inbox or document deliberate polling.

## G2-17-026-026  [P1] GAP  facet F11  effort M
- Legacy: `fetchAll` superadmin-only and JWT org/college scope; NotificationController.java:92-104
- vNext now: Generic reader always `userId=context.user.id`; notification-service.ts:263-275
- Fix: Add explicitly authorized admin scoped reader, never change personal reader to unrestricted.

## G2-17-026-033  [P1] GAP  facet F15  effort M
- Legacy: Creation/update/delete are broadcast on class SSE; NotificationServiceImpl.java:151-165,230-262
- vNext now: Event-linked records are inserted and deduplicated; notification-service.ts:194-231
- Fix: Specify push/distribution parity, and whether updates and deletes fan out to recipient clients.

## G2-17-026-044  [P1] GAP  facet F21  effort L
- Legacy: Legacy scheduler drains due SCHEDULED rows (query) and releases, SSE registry emits; NotificationRepository.java:179-186; NotificationServiceImpl.java:151-165
- vNext now: Event delivery inserts immediately; notification-service.ts:194-231
- Fix: Implement scheduled outbox release worker if scheduling retained; specify retries, failures, idempotent delivery.

## G2-15-011-002  [P1] GAP  facet F01  effort M
- Legacy: Legacy superadmin fetchAll?pageNo&pageSize scoped org or college. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:88-107`)
- vNext now: New listOwnNotifications only authenticated recipient, no super-admin scoped browse equivalent here. (`src/modules/activity/notification-service.ts:273-339`)
- Fix: Verify and restore admin audit/notification list route with chosen tenant scope.

## G2-15-011-003  [P1] GAP  facet F01  effort M
- Legacy: Old classId/courseSlug/courseId and personal recipient feeds. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:125-175`)
- vNext now: New userId recipient/event-scoped inbox independent of old course route. (`src/modules/activity/notification-service.ts:273-339`)
- Fix: Preserve course-context filters and deep-link origin in migrated inbox.

## G2-15-011-009  [P1] GAP  facet F04  effort L
- Legacy: Old type/contextLabel/applicationId/jobId/assessmentUrl/interviewId/creatorFacultyId. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Notification.java:63-85`)
- vNext now: New event module/type/importance and actionHref, no direct old context columns. (`src/modules/activity/notification-service.ts:303-317`)
- Fix: Preserve structured job/interview/action deep-link semantics in event metadata and href.

## G2-15-011-017  [P1] GAP  facet F05  effort M
- Legacy: Old fetchByClass hides job broadcasts and future scheduled notices. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/NotificationRepository.java:118-150`)
- vNext now: New per-user join + optional collegeId, no course filter. (`src/modules/activity/notification-service.ts:289-326`)
- Fix: Preserve course/class-only broadcast filtering and scheduled visibility.

## G2-15-011-019  [P1] GAP  facet F06  effort M
- Legacy: HTML content required max50000, title required max200. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/NotificationDTO.java:12-17`)
- vNext now: Body required max2000/title max240; no HTML support. (`src/modules/activity/notification-service.ts:34-45`)
- Fix: Reconcile long rich-text announcement composer and enforce legacy max/title feedback.

## G2-15-011-022  [P1] GAP  facet F06  effort M
- Legacy: Jsoup cleans HTML and title, supports u/s/sub/sup tags, safe external link protocols. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:41-49`)
- vNext now: New textual body and internal href-only action. (`src/modules/activity/notification-service.ts:34-58`)
- Fix: Preserve safe rich text where old composer supports, sanitize against XSS equivalently.

## G2-15-011-033  [P1] GAP  facet F10  effort L
- Legacy: POST /api/v1/notification/createNotification; save maps DTO fields. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:58-85`)
- vNext now: New deliverInAppNotification uses eventId/userIds and inserts per-recipient rows. (`src/modules/activity/notification-service.ts:140-243`)
- Fix: Crosswalk compose-to-activity-event and safe bulk recipient creation.

## G2-15-011-034  [P1] GAP  facet F10  effort M
- Legacy: GET class/course and class feed endpoints. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:125-155`)
- vNext now: New GET consumer listOwnNotifications by request context. (`src/modules/activity/notification-service.ts:273-339`)
- Fix: Retain course and class audience visibility, not just authenticated inbox.
