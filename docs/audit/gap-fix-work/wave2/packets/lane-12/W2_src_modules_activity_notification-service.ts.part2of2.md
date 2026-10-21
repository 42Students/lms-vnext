# Work packet (wave 2): edit src/modules/activity/notification-service.ts (part 2 of 2)

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/cross-notifications.md, docs/audit/gap2/lane-8/notification.md

## G2-4-032-012  [P2] GAP  facet F04  effort M
- Legacy: Legacy job titles `Application Submitted`, `Shortlisted`, `Online Assessment` etc (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/NotificationEventRegistry.java:79-103`)
- vNext now: New notification uses producer-defined title/body, no central copy registry (`src/modules/activity/notification-service.ts:34-58`)
- Fix: Use one event-to-copy mapping with exact legacy strings and copy tests.

## G2-4-032-014  [P2] GAP  facet F05  effort M
- Legacy: Admin notification fetchAll pageNo0/pageSize50/max200 (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:88-105`)
- vNext now: Cursor page and per-role filtering (`src/modules/activity/notification-service.ts:476-500`)
- Fix: Match legacy paging defaults on compatibility admin list.

## G2-4-032-018  [P2] GAP  facet F06  effort M
- Legacy: NotificationDTO supports title/htmlContent/classId/courseId/recipient (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:59-80`)
- vNext now: New Zod requires title1..240, body1..2000, internal actionHref (`src/modules/activity/notification-service.ts:34-58`)
- Fix: Migrate old form payload and sanitize HTML, show limits.

## G2-4-032-020  [P2] GAP  facet F06  effort M
- Legacy: Legacy HTML sanitized with Jsoup relaxed allowlist (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:41-49`)
- vNext now: New body plain-text validation but no HTML rendering contract (`src/modules/activity/notification-service.ts:34-58`)
- Fix: Choose rich/plain notification editor and sanitize render consistently.

## G2-4-032-028  [P2] GAP  facet F09  effort M
- Legacy: SSE connection registered after 3,000 class cap, no prompt (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:244-268`)
- vNext now: No SSE client subscription in read service (`src/modules/activity/notification-service.ts:273-341`)
- Fix: Show connection/reconnect state and cap if real-time restored.

## G2-4-032-046  [P2] GAP  facet F13  effort M
- Legacy: SSE disconnected/network cap can miss frame but fetch remains (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:244-268`)
- vNext now: Read API available, no live-update connection state (`src/modules/activity/notification-service.ts:273-341`)
- Fix: Use reconnect re-sync or safe polling and no duplicate badge updates.

## G2-4-032-057  [P2] GAP  facet F17  effort M
- Legacy: Browser SSE returns event stream and class scoped state (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:244-268`)
- vNext now: Read service returns data but no live announcement mechanism (`src/modules/activity/notification-service.ts:273-341`)
- Fix: Add `aria-live` unread update or poll-based announcement in UI.

## G2-4-032-077  [P2] MISSING  facet F23  effort M
- Legacy: SSE live push, scheduler release hidden until due (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:244-268`)
- vNext now: Own-recipient list without SSE publisher (`src/modules/activity/notification-service.ts:273-341`)
- Fix: Implement live badge refresh or document approved polling alternative.

## G2-8-018-002  [P2] GAP  facet F01  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:158-175: self-only per-recipient feed across classes
- vNext now: src/modules/activity/notification-service.ts:273-341: request-context user feed
- Fix: Map legacy recipient references to UUID user context, including faculty records.

## G2-8-018-018  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/NotificationRepository.java:17-32: superadmin active records ordered numeric ID DESC
- vNext now: src/modules/activity/notification-service.ts:521-525: createdAt/id descending
- Fix: Document list-specific sort behavior and keep stable older pagination.

## G2-8-018-022  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/NotificationDTO.java:22-32: type, context, job/application/assessment/interview fields
- vNext now: src/modules/activity/notification-service.ts:34-58: no typed notification target
- Fix: Preserve each typed target in activity metadata or structured link fields.

## G2-8-018-066  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:174-192: superadmin page size 1..200 and scope
- vNext now: src/modules/activity/notification-service.ts:476-525: cursor size 1..100, default50
- Fix: Document role-specific size and selected scope; avoid unbounded fetch.
