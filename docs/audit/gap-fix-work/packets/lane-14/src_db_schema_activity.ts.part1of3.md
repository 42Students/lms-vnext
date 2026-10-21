# Work packet: edit src/db/schema/activity.ts (part 1 of 3)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l18-u024-superadmin-audit-controller.md, docs/audit/gap2/lane-10/superadmin-audit.md, docs/audit/gap2/lane-11/l17-u026-notification-controller.md, docs/audit/gap2/lane-15/notification-service-impl.md, docs/audit/gap2/lane-16/u021-admin-audit-log.md, docs/audit/gap2/lane-18/notification-service.md

## G2-18-024-007  [P1] GAP  facet F04  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AdminAuditLog.java:21-60 — id, actorUserId/type/mobile, actionKey, entityType/Id, organizationId/collegeId, ip/userAgent/payloadJson, createdAt.
- vNext now: src/db/schema/activity.ts:18-68 — UUID event, org/college/user/membership, module/type/importance, subject fields/summary/metadata, occurredAt.
- Fix: Write field-level map for legacy IP/userAgent, actor type/mobile and payload.

## G2-18-024-052  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AdminAuditLog.java:21-60 — admin_audit_log BIGINT PK, numeric actor/scope, IP/UA, action/entity, JSON payload, createdAt.
- vNext now: src/db/schema/activity.ts:18-68 — activity_events UUID, actor UUID/membership, eventType/importance, subject/summary, JSONB metadata, occurredAt.
- Fix: Create migration/crosswalk and audit IP/UA retention policy.

## G2-10-003-034  [P1] GAP  facet F10  effort L
- Legacy: Old audit action classified by actionKey and entityType from AdminAuditLog `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AdminAuditLog.java:34-41` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/AdminAuditLogRepository.java:84-105`
- vNext now: New event classified eventType module importance subjectType with metadata `src/db/schema/activity.ts:40-68` `src/modules/activity/service.ts:535-589`
- Fix: Create crosswalk for every legacy action key and category before parity is claimed

## G2-10-003-066  [P1] GAP  facet F22  effort L
- Legacy: Legacy admin_audit_log BIGINT id actionKey entityType entityId actor type/id IP userAgent payload JSON createdAt `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AdminAuditLog.java:10-60`
- vNext now: New activity_events UUID id module eventType importance subject type/id summary metadata occurredAt; no IP or userAgent columns `src/db/schema/activity.ts:18-68`
- Fix: Document schema mapping; add privacy-approved origin metadata or explicitly retire IP and user-agent reporting

## G2-17-026-007  [P1] GAP  facet F04  effort L
- Legacy: Legacy classId, courseId, learnerId, courseSlug, courseName, deliveryStatus, scheduledAt, deliveryError; NotificationResponseDTO.java:16-47
- vNext now: in_app_notifications has userId/eventId/title/body/href/readAt only; activity.ts:105-131
- Fix: Create explicit mapping for class/course metadata and scheduled/delivery state; do not silently discard administrative visibility.

## G2-17-026-046  [P1] GAP  facet F22  effort L
- Legacy: Legacy notification integer key and class/course/learner ID, soft delete, creator, status; Notification.java:13-113
- vNext now: UUID inAppNotifications belongs to one user/event and has readAt; activity.ts:105-140
- Fix: Provide schema crosswalk and data model decision for broadcast, retention, schedule and staff ownership.

## G2-17-026-047  [P1] GAP  facet F22  effort M
- Legacy: Legacy class/course scope through joins, soft-delete older-than query; NotificationRepository.java:20-103,188-194
- vNext now: vNext owner/event indexes + unique user/event; activity.ts:132-144
- Fix: Document retention job, scope indexes, and migration naming without assuming legacy table is copied.

## G2-15-011-008  [P1] GAP  facet F04  effort L
- Legacy: Old title/message, class/course, optional learner ID. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Notification.java:18-32`)
- vNext now: New title/body/actionHref and userId/eventId per recipient. (`src/db/schema/activity.ts:126-145`)
- Fix: Map numeric learner/course/class IDs and broadcast recipient explosion to new UUID events.

## G2-15-011-011  [P1] GAP  facet F04  effort L
- Legacy: Old scheduledAt/deliveryStatus/deliveryError/deliveredAt stored on notification. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Notification.java:88-105`)
- vNext now: New inAppNotifications has readAt/createdAt only; scheduling in producer tables. (`src/db/schema/activity.ts:126-151`)
- Fix: Add audit mapping for scheduled/pending/failed delivery states or preserve in source event.

## G2-15-011-069  [P1] GAP  facet F22  effort L
- Legacy: Old notification one row class/course/learner with single isRead and scheduled fields. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Notification.java:18-105`)
- vNext now: New inAppNotifications userId/eventId/readAt with activityEvents metadata. (`src/db/schema/activity.ts:126-151`)
- Fix: Migration plan for old broadcasts to recipients and statuses without losing read history.

## G2-15-011-070  [P1] GAP  facet F22  effort L
- Legacy: Old active/soft-delete admin views and org/college query derived via class/program. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/NotificationRepository.java:17-107`)
- vNext now: New per-recipient table no deletedAt, event has explicit org/college. (`src/db/schema/activity.ts:126-169`)
- Fix: Support archived/deleted state and admin tenancy via direct event scope.

## G2-16-021-003  [P1] GAP  facet F02  effort M
- Legacy: AdminAuditLog.java:25-61 captures actor/scope/IP/UA/payload/time.
- vNext now: activity.ts:21-68 stores organization/college/actor/subject/summary/metadata/time.
- Fix: Expose network attribution only with strict admin privacy, retain investigation-critical fields.

## G2-16-021-005  [P1] GAP  facet F04  effort M
- Legacy: AdminAuditLog.java:25-33 actor id/type/contact mobile.
- vNext now: activity.ts:30-39 actorUserId/membershipId, no phone/type snapshot.
- Fix: Snapshot actor role at event time and handle later account deletion; mask mobile.

## G2-16-021-007  [P1] MISSING  facet F04  effort M
- Legacy: AdminAuditLog.java:49-53 IP varchar64 and userAgent varchar512.
- vNext now: activity.ts:18-68 no dedicated network fields.
- Fix: Add privacy-governed audit network metadata with retention and masking.

## G2-16-021-019  [P1] GAP  facet F11  effort M
- Legacy: AdminAuditLog.java:25-33 historical actor type persisted string.
- vNext now: activity.ts:30-39 actorUserId/membershipId FK only.
- Fix: Retain actor role snapshot when user changes roles.

## G2-16-021-032  [P1] GAP  facet F22  effort M
- Legacy: V61__admin_audit_log.sql:1-19 bigint PK, four indexes, actor IP UA JSON.
- vNext now: activity.ts:18-123 UUID PK/timestamptz/metadata and alternate indexes.
- Fix: Produce explicit column mapping including missing IP, UA, actor-role snapshot, action key.

## G2-16-021-034  [P1] MISSING  facet F23  effort M
- Legacy: AdminAuditLog.java:25-57 captures contactMobile/IP/UA.
- vNext now: activity.ts:30-60 omits direct columns.
- Fix: Record privacy-safe fields with retention policy.

## G2-18-012-002  [P1] GAP  facet F01  effort M
- Legacy: Legacy `findAllPagedScoped` serves org/college/global admin views (`NotificationService.java:17-21`; `NotificationServiceImpl.java:181-191`).
- vNext now: New own notifications GET only; college administration has different event/activity views (`notifications/route.ts:8-37`; `activity.ts:18-68`).
- Fix: Expose authorized admin notification directory with explicit college/organization scope.

## G2-18-012-009  [P1] GAP  facet F04  effort L
- Legacy: Legacy personal recipient is int learnerId plus recipientType LEARNER/FACULTY (`Notification.java:30-53`).
- vNext now: New UUID userId globally unique, no recipientType column (`activity.ts:126-139`).
- Fix: Migrate recipient identity using learner/faculty type to user UUID; prove no collision.

## G2-18-012-010  [P1] GAP  facet F04  effort L
- Legacy: Legacy linked applicationId/jobId/assessmentUrl/interviewId fields (`Notification.java:69-82`).
- vNext now: New has one actionHref internal URL with event metadata (`activity.ts:53-60,140-144`).
- Fix: Map each deep link and external assessment CTA securely; keep original entity IDs for migration.
