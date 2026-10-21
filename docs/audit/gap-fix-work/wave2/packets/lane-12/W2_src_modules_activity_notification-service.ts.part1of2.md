# Work packet (wave 2): edit src/modules/activity/notification-service.ts (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l17-u026-notification-controller.md, docs/audit/gap2/lane-15/notification-service-impl.md, docs/audit/gap2/lane-18/notification-service.md, docs/audit/gap2/lane-18/u004-learner-notifications.md, docs/audit/gap2/lane-4/cross-notifications.md

## G2-17-026-006  [P2] GAP  facet F04  effort S
- Legacy: `created_at` DTO is `[year,zero-based-month,day]`; NotificationResponseDTO.java:12-13,73-80
- vNext now: `createdAt` ISO timestamp and server Date, notification-service.ts:472-520; notifications/page.tsx:59-64
- Fix: Normalize display date from ISO with local/IST presentation without recreating zero-based-month parsing bugs.

## G2-17-026-037  [P2] GAP  facet F18  effort M
- Legacy: Legacy payload keys `html_content`, `is_read`, `notification_type`, `course_slug`; NotificationDTO.java:9-41
- vNext now: vNext `body`, `readAt`, `actionHref`, `module` etc.; notification-service.ts:26-50; activity.ts:105-129
- Fix: Add translation at migration/API boundary where legacy client remains reachable; do not mix semantics silently.

## G2-17-026-038  [P2] MISSING  facet F18  effort S
- Legacy: Legacy delete messages differ between endpoints, exact strings; NotificationController.java:231-233,285-289
- vNext now: vNext no delete notification UI in reviewed service; notification-service.ts:356-452
- Fix: Carry approved copy in staff UI or record retirement explicitly.

## G2-17-026-042  [P2] GAP  facet F20  effort M
- Legacy: Per-user SSE cap3 oldest evicted, class cap >3000 gets 429; NotificationController.java:260-269; SseEmitterRegistry.java:39-80
- vNext now: No SSE registry in reviewed vNext notification-service; notification-service.ts:246-335
- Fix: If adding stream, enforce connection caps, JWT rotation, cleanup on close, fanout limits and duplicate suppression.

## G2-15-011-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy notification CRUD under /api/v1/notification and course/notification pages. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:35-80`)
- vNext now: New event-recipient delivery service; notifications exposed through role-specific Next endpoints. (`src/modules/activity/notification-service.ts:140-270`)
- Fix: Crosswalk compose/list/delete/read routes and keep course shell menu labels.

## G2-15-011-010  [P2] GAP  facet F04  effort M
- Legacy: CourseSlug resolves to course ID or errors Course not found for slug. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:89-95`)
- vNext now: New eventId UUID, no courseSlug resolver at delivery boundary. (`src/modules/activity/notification-service.ts:140-158`)
- Fix: Translate course-slug context to tenant-safe delivery/event ID before creation.

## G2-15-011-012  [P2] GAP  facet F04  effort M
- Legacy: Jsoup relaxed HTML body, plain sanitized title. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:41-49`)
- vNext now: New body plain trimmed string max2000 and title max240. (`src/modules/activity/notification-service.ts:34-58`)
- Fix: Define HTML-to-text/allowed markup rendering conversion without losing old underlined/link emphasis.

## G2-15-011-013  [P2] GAP  facet F04  effort S
- Legacy: Old batch-loads courseSlug and courseName for returned notifications. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:345-366`)
- vNext now: New list outputs event data and notice, no course slug/name enrichment. (`src/modules/activity/notification-service.ts:273-339`)
- Fix: Include localized course context line or action href from event metadata.

## G2-15-011-014  [P2] GAP  facet F05  effort M
- Legacy: Admin paged findAll caps pageSize 200 and minimum1. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:169-191`)
- vNext now: New listOwnNotifications defaults40 max100. (`src/modules/activity/notification-service.ts:273-288`)
- Fix: Match legacy page sizes per context and retain admin cap/next-page controls.

## G2-15-011-015  [P2] GAP  facet F05  effort M
- Legacy: Learner feed default 100, max500; PageRequest page index. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:271-305`)
- vNext now: New keyset pagination default50 max100, createdAt+UUID cursor. (`src/modules/activity/notification-service.ts:476-525`)
- Fix: Translate legacy pagination expectation into keyset load-more while preserving visible initial count.

## G2-15-011-016  [P2] GAP  facet F05  effort M
- Legacy: Old admin sort notification numeric ID desc. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/NotificationRepository.java:17-32`)
- vNext now: New sort createdAt desc then UUID desc. (`src/modules/activity/notification-service.ts:327-332`)
- Fix: Compare old ID/date relation and stabilize event sort for migration.

## G2-15-011-020  [P2] GAP  facet F06  effort M
- Legacy: Class/course/recipient/read/delete/type/context/job/assessment/creator fields. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/NotificationDTO.java:18-35`)
- vNext now: New delivery input only title/body/internal actionHref. (`src/modules/activity/notification-service.ts:34-58`)
- Fix: Add scoped audience and metadata mapping in publisher form model, not untrusted send body.

## G2-15-011-037  [P2] GAP  facet F10  effort M
- Legacy: Update, soft delete push SSE change/delete event. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:216-253`)
- vNext now: New insert notifications but no per-message SSE transport in service. (`src/modules/activity/notification-service.ts:140-243`)
- Fix: Implement event/polling invalidation for edits/deletion and unread counts.

## G2-15-011-038  [P2] GAP  facet F10  effort M
- Legacy: findAll/fetch and DTO mapping with course slug enrichment. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:169-213`)
- vNext now: User inbox with event join. (`src/modules/activity/notification-service.ts:273-339`)
- Fix: Map DTO shape, event metadata and course labels before client rendering.

## G2-15-011-047  [P2] GAP  facet F12  effort M
- Legacy: Legacy soft-deletes notifications older than 90 days weekly. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:158-173`)
- vNext now: New own inbox has no built-in age cutoff/cleanup in this service. (`src/modules/activity/notification-service.ts:273-339`)
- Fix: Provide retention/archival job for per-recipient notifications with compliance policy.

## G2-15-011-052  [P2] GAP  facet F15  effort M
- Legacy: Immediate save emits SSE to selected class/learner. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:150-164`)
- vNext now: New inserts recipient rows, no SSE shown at service boundary. (`src/modules/activity/notification-service.ts:218-243`)
- Fix: Ensure live bell refresh/polling to match SSE immediacy.

## G2-15-011-053  [P2] GAP  facet F15  effort M
- Legacy: createFacultyNotification to FACULTY recipient, type/context. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:369-385`)
- vNext now: New uses all userIds, typed event metadata. (`src/modules/activity/notification-service.ts:140-243`)
- Fix: Preserve faculty-targeted notifications and visible event context.

## G2-15-011-057  [P2] GAP  facet F18  effort S
- Legacy: Old content/title field labels and exact length limits. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/NotificationDTO.java:12-17`)
- vNext now: New title/body schema names with different limits. (`src/modules/activity/notification-service.ts:34-45`)
- Fix: Restore legacy compose labels/errors where same functionality is cloned.

## G2-15-011-061  [P2] GAP  facet F19  effort M
- Legacy: Admin page caps 200; learner page caps 500. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:175-191`)
- vNext now: New normal list max100; keyset page max100. (`src/modules/activity/notification-service.ts:282-288`)
- Fix: Expose pagination/load-more for large notification history.

## G2-15-011-066  [P2] GAP  facet F20  effort M
- Legacy: Update may change recipient but resets recipientType. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:216-234`)
- vNext now: New recipient inserts immutable owner. (`src/modules/activity/notification-service.ts:140-243`)
- Fix: Treat editing audience as revoke/recreate, not recipient reassignment.

## G2-15-011-067  [P2] GAP  facet F21  effort M
- Legacy: Depends on in-process SSE registry. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:10-37`)
- vNext now: New Drizzle service no direct SSE call. (`src/modules/activity/notification-service.ts:140-243`)
- Fix: Decide server sent events vs polling for real-time new messages.

## G2-15-011-073  [P2] GAP  facet F23  effort M
- Legacy: Old sanitized rich HTML, allows selected tags. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:41-49`)
- vNext now: New plain text and internal navigation only. (`src/modules/activity/notification-service.ts:34-45`)
- Fix: Document rich text reduction as explicit product choice or restore safe markup.

## G2-18-012-003  [P2] GAP  facet F02  effort M
- Legacy: Legacy service emits notification object to SSE subscribers immediately on class delivery (`NotificationServiceImpl.java:150-165`).
- vNext now: New inserts user-specific rows; no SSE send in mapped delivery (`notification-service.ts:218-243`).
- Fix: Preserve real-time bell update or use documented polling with equivalent freshness/loading behavior.

## G2-18-012-005  [P2] GAP  facet F03  effort S
- Legacy: Legacy title cleaned with Jsoup Safelist.none preserving plain text only (`NotificationServiceImpl.java:41-50`).
- vNext now: New z.string trim min1 max240, no HTML sanitizer at delivery (`notification-service.ts:34-42`).
- Fix: Escape/render legacy HTML entities identically and normalize incoming title.

## G2-18-012-015  [P2] GAP  facet F06  effort M
- Legacy: Legacy createNotification overloaded class/course and optional learner/type/context (`NotificationService.java:63-88`).
- vNext now: New deliver takes eventId, recipient user UUID array, title/body/actionHref (`notification-service.ts:140-157,246-270`).
- Fix: Write overload adapter to derive explicit recipient set, event type and college.

## G2-18-012-016  [P2] GAP  facet F06  effort M
- Legacy: Legacy faculty notice `classId=0`, `courseId=0`, recipientType FACULTY (`NotificationServiceImpl.java:369-385`).
- vNext now: New generic deliver requires a previously persisted activity event with authorized recipients (`notification-service.ts:168-216`).
- Fix: Add faculty project/classless context mapping and persist correct tenant event.

## G2-18-012-027  [P2] GAP  facet F10  effort M
- Legacy: Legacy save and update publishes SSE payload to class and optional learner (`NotificationServiceImpl.java:150-165,224-231`).
- vNext now: New deliverInAppNotification inserts rows and no push call (`notification-service.ts:246-270`).
- Fix: Map old SSE event type `notification_deleted` and immediate deliver to new push/poll mechanism.

## G2-18-012-031  [P2] GAP  facet F11  effort M
- Legacy: Legacy writes allow class broadcasts with learnerId null (`NotificationService.java:63-88`; `NotificationServiceImpl.java:133-161`).
- vNext now: New delivery requires an explicit set of active recipient UUIDs (`notification-service.ts:140-157,207-216`).
- Fix: Expand course/class audience at enqueue based on current persisted roster.

## G2-18-012-037  [P2] GAP  facet F13  effort S
- Legacy: Legacy fetching missing courseSlug throws response400 (`NotificationServiceImpl.java:89-95`).
- vNext now: New actionHref validator rejects malformed internal destination via zod (`notification-service.ts:46-55`).
- Fix: Use accurate field-specific UI errors and route fallback for legacy slug links.

## G2-18-012-038  [P2] GAP  facet F13  effort S
- Legacy: Legacy SSE fails while DB commit remains persisted, only warn logged (`NotificationServiceImpl.java:156-165`).
- vNext now: New delivery DB result returned without SSE status (`notification-service.ts:218-243`).
- Fix: Document 'saved but live update unavailable' fallback/refetch.

## G2-18-012-043  [P2] GAP  facet F16  effort M
- Legacy: Legacy HTML notification body can include safe formatted links (`NotificationServiceImpl.java:41-47`).
- vNext now: New body is text1..2000 and actionHref single link (`notification-service.ts:34-55`).
- Fix: Ensure long wrapped prose, links and rich inline content survive mobile formatting.

## G2-18-012-046  [P2] MISSING  facet F18  effort S
- Legacy: Legacy exact invalid schedule `scheduledAt must be yyyy-MM-dd HH:mm:ss` (`NotificationServiceImpl.java:112-124`).
- vNext now: New no scheduledAt field (`notification-service.ts:34-58`).
- Fix: Expose identical validation sentence on admin schedule field.

## G2-18-012-048  [P2] GAP  facet F18  effort S
- Legacy: Legacy assessment URL error `Assessment URL must use http or https` (`NotificationServiceImpl.java:78-83`).
- vNext now: New `Notification actionHref must be an internal path` (`notification-service.ts:46-54`).
- Fix: Distinguish internal CTA vs external assessment validation copy.

## G2-18-004-054  [P2] GAP  facet F11  effort M
- Legacy: Legacy learner class scope resolves classId from shared hook. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:349-354`
- vNext now: vNext member scope collegeId then personal userId for notifications. `src/modules/activity/learner-notification-membership-service.ts:20-39`, `src/modules/activity/notification-service.ts:273-337`
- Fix: Verify class-/section-targeted notices actually reach learner membership.

## G2-18-004-096  [P2] GAP  facet F22  effort L
- Legacy: Legacy Notification numeric id, class_id/course_id/learner_id/recipient_type, isRead boolean row. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:50-77`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/NotificationService.java:25-59`
- vNext now: vNext notification UUID, userId/eventId/createdAt/readAt, module in activity_event. `src/modules/activity/notification-service.ts:273-337`, `src/modules/activity/notification-service.ts:365-421`
- Fix: Specify old→new recipient fanout and read-state migration mapping.

## G2-18-004-099  [P2] GAP  facet F22  effort M
- Legacy: Legacy notification body may be HTML-marked with allowed tags; vNext plain body max2000. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:33-34`, `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:750-752`
- vNext now: vNext delivery input Zod title max240, body max2000, actionHref max1000. `src/modules/activity/notification-service.ts:34-58`
- Fix: Check legacy max body sizes and migrate/truncate safely, sanitize safely.

## G2-4-032-001  [P2] GAP  facet F01  effort M
- Legacy: Notification center API `/api/v1/notification` with create/fetch routes (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:34-35,59-88`)
- vNext now: New recipient-scoped notification services, no `/api/v1/notification` alias (`src/modules/activity/notification-service.ts:246-273`)
- Fix: Provide route redirects/adapters for old notification callers where still active.

## G2-4-032-003  [P2] MISSING  facet F01  effort M
- Legacy: Subscribe SSE on `/subscribe?classId=` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:244-268`)
- vNext now: Pollable per-user notification listing and counts (`src/modules/activity/notification-service.ts:273-341`)
- Fix: Decide real-time SSE replacement vs polling; avoid undelivered new bells.

## G2-4-032-004  [P2] GAP  facet F02  effort M
- Legacy: Class/course/recipient GET endpoints for classroom inbox (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:125-175`)
- vNext now: Own-recipient activity-backed list instead of class/course group (`src/modules/activity/notification-service.ts:273-341`)
- Fix: Provide class/course view filtered from recipient fanout, preserving role tabs.

## G2-4-032-008  [P2] GAP  facet F03  effort M
- Legacy: Live bell delivered by SSE event stream (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:244-268`)
- vNext now: Read APIs expose counts and list but not SSE badge push (`src/modules/activity/notification-service.ts:273-341`)
- Fix: Add websocket/SSE or timed refresh plus exact new badge timing.
