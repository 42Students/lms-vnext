# Work packet: edit src/db/schema/activity.ts (part 2 of 3)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/notification-service.md, docs/audit/gap2/lane-2/l17-u026-notification-controller.md, docs/audit/gap2/lane-4/cross-notifications.md, docs/audit/gap2/lane-5/u018-project-activity-event.md, docs/audit/gap2/lane-7/u004-college-admin-projects-readiness.md, docs/audit/gap2/lane-8/cross-08-audit-activity-tracker-analytics.md

## G2-18-012-041  [P1] GAP  facet F15  effort L
- Legacy: Legacy scheduled deliveryStatus `SCHEDULED`/`SENT`/`FAILED` (`NotificationServiceImpl.java:98-100,139-149`).
- vNext now: New personal in-app notification has no deliveryStatus/error and inserts immediately (`activity.ts:126-151`).
- Fix: Add scheduled/delivery outbox state with worker and failure retry.

## G2-18-012-052  [P1] GAP  facet F20  effort L
- Legacy: Legacy scheduler status saves before SSE and later release job sends; no immediate push for scheduled (`NotificationServiceImpl.java:139-165`).
- vNext now: New immediate user insert with no release timestamp (`activity.ts:126-151`).
- Fix: Model schedule separate from publication, serialize release retries idempotently.

## G2-18-012-057  [P1] GAP  facet F22  effort L
- Legacy: Legacy single notification row int classId/courseId/learnerId, recipientType and shared read (`Notification.java:17-67`).
- vNext now: New UUID activityEvent + per-user UUID inAppNotification, per-user readAt (`activity.ts:18-68,126-167`).
- Fix: Migrate class broadcast to one event and N recipient rows; resolve faculty/learner identity.

## G2-18-012-058  [P1] GAP  facet F22  effort L
- Legacy: Legacy optional notificationType/contextLabel and job/application/assessment/interview deep links (`Notification.java:63-86`).
- vNext now: New module/eventType/subjectLabel/metadata + one actionHref (`activity.ts:40-60,126-151`).
- Fix: Preserve event source and all deep-link targets in metadata/canonical internal route.

## G2-18-012-059  [P1] GAP  facet F22  effort L
- Legacy: Legacy scheduledAt/deliveryStatus/deliveryError500/deliveredAt in row (`Notification.java:88-105`).
- vNext now: New inApp row only readAt/createdAt (`activity.ts:126-151`).
- Fix: Add delivery/outbox table for scheduled sends and error/retry metadata.

## G2-17-026-063  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Notification.java:17-105 legacy notification columns class/course/recipient/type/deep-links/creator/schedule/delivery/delete/read
- vNext now: src/db/schema/activity.ts:126-168 in_app_notifications user_id,event_id,title,body,action_href,read_at,created_at only
- Fix: Implement explicit author-notification and delivery/recipient projection tables or migration mapping

## G2-17-026-064  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/NotificationRepository.java:28-107 pageable college/org scope; docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/NotificationRepository.java:109-127 per-learner scheduled visibility filters
- vNext now: src/db/schema/activity.ts:152-166 unique user/event and read-time index; src/modules/activity/notification-service.ts:289-333 joined activity event filter
- Fix: Add author scope/publish indexes and scheduled_due index alongside per-recipient delivery indexes

## G2-4-032-010  [P1] GAP  facet F04  effort M
- Legacy: Title, message, classId, courseId, learnerId, recipientType (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Notification.java:18-32`)
- vNext now: New record eventId/userId/title/body/actionHref/readAt/createdAt (`src/db/schema/activity.ts:126-151`)
- Fix: Resolve course/class broadcast recipients into user IDs and preserve source context.

## G2-4-032-035  [P1] MISSING  facet F10  effort M
- Legacy: Timed in-app send-later release and SSE broadcast (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:102-155`)
- vNext now: in_app_notifications lacks scheduledAt/delivery status (`src/db/schema/activity.ts:126-151`)
- Fix: Add delayed delivery fields/job with failure persistence.

## G2-4-032-045  [P1] MISSING  facet F13  effort M
- Legacy: Scheduled notifications hidden until due, failed per-row (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:98-155`)
- vNext now: No scheduledAt/status/failure reason in in-app record (`src/db/schema/activity.ts:126-151`)
- Fix: Model pending, sent, failed and retry states.

## G2-4-032-072  [P1] GAP  facet F22  effort M
- Legacy: Legacy one `notification` row has class/course, recipient type, read boolean, schedule fields (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Notification.java:12-85`)
- vNext now: New activity_events + in_app_notifications per-user rows (`src/db/schema/activity.ts:126-169`)
- Fix: Migrate source context and read state without cross-user disclosure.

## G2-4-032-073  [P1] MISSING  facet F22  effort M
- Legacy: Legacy scheduled_at/delivery_status/delivered_at/failure text (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:86-104`)
- vNext now: No scheduled or delivery outcome columns (`src/db/schema/activity.ts:126-151`)
- Fix: Add schedule release and error columns or separate delivery ledger.

## G2-5-018-010  [P1] GAP  facet F04  effort L
- Legacy: Legacy actorUserType/actorName snapshot, actorUserId int nullable `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectActivityEvent.java:39-46`
- vNext now: New actorUserId UUID and actorMembershipId, display joined from current users table `src/db/schema/activity.ts:27-37`
- Fix: Preserve historical display names/user types even after user rename/deletion.

## G2-5-018-024  [P1] GAP  facet F10  effort L
- Legacy: Legacy ProjectActivityEvent rows persisted with stable eventKey and machine eventCode `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectActivityEvent.java:20-31`
- vNext now: New records authored through activity event taxonomy and dedupeKey `src/db/schema/activity.ts:29-62`
- Fix: Map all legacy project producer events to typed taxonomy with stable historical codes.

## G2-5-018-040  [P1] GAP  facet F19  effort M
- Legacy: Legacy composite index project_id,created_at,id fixes filesort `docs/legacy-source/backend/src/main/resources/db/migration/V97__project_performance_indexes.sql:58-71`
- vNext now: New indexes by collegeId/time and module/time, not projectId on activity row `src/db/schema/activity.ts:65-85`
- Fix: Profile project JSON metadata predicate at 10k+ events and index project key.

## G2-5-018-046  [P1] GAP  facet F22  effort L
- Legacy: Legacy table columns id INT, project ID, slug, eventKey/code/type,title,summary,actor snapshot,metadataJson `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectActivityEvent.java:10-48`
- vNext now: New activity_events UUID with organization/college, subject, module, metadata and actor user FK `src/db/schema/activity.ts:16-63`
- Fix: Produce exact column mapping and import with tenant/subject resolution.

## G2-7-004-073  [P1] GAP  facet F22  effort L
- Legacy: LBE/model/ProjectWorkspace.java:104-119: readiness_override and note/by/at persisted columns.
- vNext now: V/modules/projects/readiness-override-service.ts:16-26,48-55; db/schema/activity.ts:18-68: latest activity event metadata is source of override state.
- Fix: Plan migration and clear-state replay from persistent row to event history; do not silently lose old overrides.

## G2-8-031-051  [P1] GAP  facet F15  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminAuditLogService.java:47-80 logRequired aims not to fail domain mutation on audit write; notify/email independent.
- vNext now: src/modules/activity/service.ts:340-355 typed event writes can run inside calling DB transaction; notification split into inAppNotifications src/db/schema/activity.ts:126-169.
- Fix: Decide critical vs best-effort audit policy, ensure rollback safety and no lost sensitive audit on mutation failure.

## G2-8-031-067  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AdminAuditLog.java:12-61 table admin_audit_log with actor type/id, actionKey, entityType/Id, scope, ip, user agent, payload, createdAt and indexes.
- vNext now: src/db/schema/activity.ts:18-118 activity_events has UUID id, actor UUID, module/eventType/importance, scoped subject, summary/metadata, occurredAt, distinct indexes.
- Fix: Create old->new field map for actor roles, IP/user agent and event types, retain traceability of original request for privileged changes.

## G2-8-018-012  [P1] GAP  facet F04  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/NotificationResponseDTO.java:40-50: deliveryStatus, scheduledAt, deliveryError shown to admins
- vNext now: src/db/schema/activity.ts:126-151: inbox has no delivery/scheduled/error columns
- Fix: Show actual scheduled/error delivery state in admin notification composer/history.
