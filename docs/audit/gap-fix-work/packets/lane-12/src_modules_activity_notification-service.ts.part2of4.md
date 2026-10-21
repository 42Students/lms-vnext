# Work packet: edit src/modules/activity/notification-service.ts (part 2 of 4)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/notification-service-impl.md, docs/audit/gap2/lane-18/notification-service.md, docs/audit/gap2/lane-18/u004-learner-notifications.md, docs/audit/gap2/lane-2/admin-recycle-bin-controller.md, docs/audit/gap2/lane-2/l17-u026-notification-controller.md, docs/audit/gap2/lane-4/cross-notifications.md

## G2-15-011-036  [P1] GAP  facet F10  effort L
- Legacy: Save sets SENT immediately or SCHEDULED and pushes SSE. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:127-167`)
- vNext now: Writes in_app_notifications immediately; delayed delivery domain-specific. (`src/modules/activity/notification-service.ts:218-243`)
- Fix: Model scheduled release/status independently for all supported announcement publishers.

## G2-15-011-040  [P1] GAP  facet F11  effort M
- Legacy: Only superadmin fetchAll with org/college scope. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:88-105`)
- vNext now: New own-inbox only. (`src/modules/activity/notification-service.ts:273-339`)
- Fix: Restore admin scoped aggregate browse and status oversight.

## G2-18-012-006  [P1] GAP  facet F03  effort M
- Legacy: Legacy body accepts relaxed HTML with underline, strike, sub/sup and safe link protocols (`NotificationServiceImpl.java:41-47`).
- vNext now: New body max2000 plain text, actionHref separate (`notification-service.ts:42-55`).
- Fix: Create legacy rich-body migration/render policy, sanitize and preserve safe inline links.

## G2-18-012-014  [P1] GAP  facet F06  effort L
- Legacy: Legacy service supports save, update and soft delete of notification (`NotificationService.java:13-31`).
- vNext now: New delivery inserts immutable user event; read acknowledgment only via route (`notification-service.ts:218-243`; `learn/notifications/read/route.ts:9-23`).
- Fix: Provide authorized editor/admin mutation mapping and soft-delete/recall semantics.

## G2-18-012-018  [P1] GAP  facet F07  effort M
- Legacy: Legacy assessmentUrl accepts HTTP or HTTPS, rejects anything else with specific message (`NotificationServiceImpl.java:78-84`).
- vNext now: New actionHref must be internal path, external URL forbidden (`notification-service.ts:46-55`).
- Fix: Use vetted external-assessment redirect/token, not unsanitized external href.

## G2-18-012-035  [P1] GAP  facet F13  effort M
- Legacy: Legacy scheduled rows not sent to SSE until due, no recipient feed before release (`NotificationServiceImpl.java:139-154`).
- vNext now: New writes show in own feed as soon as delivered (`notification-service.ts:218-243`).
- Fix: Keep scheduled previews out of live inbox until committed release.

## G2-18-012-036  [P1] MISSING  facet F13  effort S
- Legacy: Legacy invalid scheduled input throws specific parser error, not immediate send (`NotificationServiceImpl.java:106-125`).
- vNext now: New has no notification scheduler parser (`notification-service.ts:34-58`).
- Fix: Fail closed on bad schedule, never interpret unparseable as now.

## G2-18-012-055  [P1] GAP  facet F21  effort L
- Legacy: Legacy SSE registry pushes creation, update and `notification_deleted` to class clients (`NotificationServiceImpl.java:150-165,224-252`).
- vNext now: New route is GET own inbox; no SSE in mapped provider (`notifications/route.ts:8-37`; `notification-service.ts:218-270`).
- Fix: Plan realtime event bridge/polling cadence and offline reconciliation.

## G2-18-004-049  [P1] GAP  facet F10  effort L
- Legacy: Legacy class broadcast notices target class+course and may have learnerId; no per-user read state. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:54-74`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/NotificationService.java:25-43`
- vNext now: vNext row keyed by unique userId and eventId; mark-read per recipient. `src/modules/activity/notification-service.ts:273-337`, `src/modules/activity/notification-service.ts:365-421`
- Fix: Ensure producers send one row per authorized class learner, not missing shared broadcast messages.

## G2-18-004-050  [P1] GAP  facet F10  effort M
- Legacy: Legacy static notification detail has deep links by applicationId, jobId, courseId, assessmentUrl, interviewId. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:65-110`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/NotificationService.java:91-121`
- vNext now: vNext actionHref delivered as internal path, safe filtered and optionally converted placements. `src/modules/activity/notification-service.ts:34-58`, `src/components/activity/learner-notifications-inbox.tsx:209-214`
- Fix: Define full old→new link map, validate ownership of each target, keep compatible action labels.

## G2-18-004-059  [P1] GAP  facet F12  effort L
- Legacy: Legacy job/application/interview deep link based on numeric IDs. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:83-110`
- vNext now: vNext UUID routes require validated actionHref generated by source event. `src/modules/activity/notification-service.ts:34-58`, `src/components/activity/learner-notifications-inbox.tsx:209-214`
- Fix: Provide secure resolved mapping at producer time; explicit unknown-target fallback.

## G2-18-004-093  [P1] GAP  facet F21  effort L
- Legacy: Legacy notifications come from class notification REST and college announcements REST; SSE class updates. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:22-24`, `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:379-409`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:145-163`
- vNext now: vNext Drizzle in_app_notifications+activity_event and announcement tables; no SSE in mapped page. `src/app/(authenticated)/learn/notifications/page.tsx:5-8`, `src/modules/activity/notification-service.ts:273-337`
- Fix: Inventory old source producers, fanout, release/schedule and expose compatible refresh.

## G2-2-023-016  [P1] GAP  facet F05  effort M
- Legacy: AdminRecycleBinController.java:141-149 optimized notification candidate query
- vNext now: src/modules/activity/notification-service.ts:29-99 per-user receipts separate from archived notice storage
- Fix: Use indexed deleted-only notification campaign query; avoid scanning all receipts.

## G2-2-023-032  [P1] GAP  facet F10  effort M
- Legacy: AdminRecycleBinController.java:141-149 notification candidate uses findAllDeleted()
- vNext now: src/modules/activity/notification-service.ts:29-99 per-recipient notifications not same as legacy `notification` rows
- Fix: Recover authored notice or campaign, not recipients' in-app read receipts.

## G2-2-023-054  [P1] GAP  facet F19  effort M
- Legacy: AdminRecycleBinController.java:141-149 notification findAllDeleted special optimization
- vNext now: src/modules/activity/notification-service.ts:29-99 per-recipient indexes
- Fix: Index campaign deletion and filter server-side.

## G2-17-026-056  [P1] GAP  facet F19  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:175-192 superadmin pageable max200; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:271-305 class/recipient first100 max500
- vNext now: src/modules/activity/notification-service.ts:282-338 own GET max100 and src/app/(authenticated)/learn/notifications/page.tsx:25-27 hard 60 limit
- Fix: Give each role cursor or offset pagination with reliable unbounded history

## G2-17-026-064  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/NotificationRepository.java:28-107 pageable college/org scope; docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/NotificationRepository.java:109-127 per-learner scheduled visibility filters
- vNext now: src/db/schema/activity.ts:152-166 unique user/event and read-time index; src/modules/activity/notification-service.ts:289-333 joined activity event filter
- Fix: Add author scope/publish indexes and scheduled_due index alongside per-recipient delivery indexes

## G2-4-032-030  [P1] GAP  facet F10  effort M
- Legacy: Dispatch events job, interview, course, system OTP exception (`docs/legacy-source/backend/src/main/java/com/_42students/lms/enums/NotificationEvent.java:9-36`)
- vNext now: Generic inApp producer API, not a central event dispatcher (`src/modules/activity/notification-service.ts:246-273`)
- Fix: Create event coverage matrix and connect each legacy event to a producer.

## G2-8-018-016  [P1] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:134-154,517-575: role-specific tabs and newest-by-date sorting
- vNext now: src/components/activity/notification-toolbar.tsx:53-69, src/modules/activity/notification-service.ts:521-525: unread filter, timestamp/id sort
- Fix: Preserve category filters; use deterministic timestamp+ID sort.

## G2-8-018-020  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/NotificationDTO.java:12-17: required htmlContent max50000; title max200
- vNext now: src/modules/activity/notification-service.ts:34-45: body max2000 and title max240
- Fix: Align editor limits and migrate sanitized HTML; expose distinct field errors.
