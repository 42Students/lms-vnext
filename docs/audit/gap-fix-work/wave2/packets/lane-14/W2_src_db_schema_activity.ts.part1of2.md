# Work packet (wave 2): edit src/db/schema/activity.ts (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l18-u024-superadmin-audit-controller.md, docs/audit/gap2/lane-10/superadmin-audit.md, docs/audit/gap2/lane-11/l17-u026-notification-controller.md, docs/audit/gap2/lane-16/u021-admin-audit-log.md, docs/audit/gap2/lane-18/notification-service.md, docs/audit/gap2/lane-4/cross-notifications.md

## G2-18-024-006  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:189-195 — targetNames map sourced by per-kind resolver.
- vNext now: src/db/schema/activity.ts:51-56 — subjectLabel saved on event, no dynamic cross-entity name map.
- Fix: Provide fallback target display name lookup for legacy rows.

## G2-18-024-009  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AuditTargetNameResolver.java:23-43 — resolves learner/faculty/batch/quiz/course/class/department/program/semester/hall/lesson/project names by stored entity ID.
- vNext now: src/db/schema/activity.ts:51-56 — event.subjectLabel written at event creation; no resolver for historic IDs.
- Fix: Provide safe read-time target resolver or migration backfill.

## G2-18-024-010  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AdminAuditLog.java:59-60 — LocalDateTime createdAt.
- vNext now: src/db/schema/activity.ts:63-67 — timestamptz occurredAt.
- Fix: Define source-zone conversion, render IST.

## G2-18-024-053  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AdminAuditLog.java:12-18 — four indices createdAt, actor ID/type, org/college, actionKey.
- vNext now: src/db/schema/activity.ts:69-103 — scoped/time, module/time, actor/time, group and dedupe indices.
- Fix: Compare legacy actionKey query index after eventType remap.

## G2-10-003-067  [P2] GAP  facet F22  effort M
- Legacy: Legacy indexes created_at actor ID and type scope IDs actionKey `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AdminAuditLog.java:12-18`
- vNext now: New indexes college/time org/time module/time actor/time group/time and dedupe unique `src/db/schema/activity.ts:69-123`
- Fix: Verify actionKey-equivalent event type query index and legacy search performance

## G2-17-026-037  [P2] GAP  facet F18  effort M
- Legacy: Legacy payload keys `html_content`, `is_read`, `notification_type`, `course_slug`; NotificationDTO.java:9-41
- vNext now: vNext `body`, `readAt`, `actionHref`, `module` etc.; notification-service.ts:26-50; activity.ts:105-129
- Fix: Add translation at migration/API boundary where legacy client remains reachable; do not mix semantics silently.

## G2-16-021-001  [P2] GAP  facet F01  effort S
- Legacy: AdminAuditLog.java:10-19 JPA admin_audit_log persistent actor/action trail.
- vNext now: activity.ts:18-68 unified activity_events table.
- Fix: Map old admin audit to common activity event taxonomy.

## G2-16-021-004  [P2] GAP  facet F03  effort S
- Legacy: AdminAuditLog.java:34-40 actionKey/entityType/entityId.
- vNext now: activity.ts:43-56 eventType/subjectType/subjectId/subjectLabel.
- Fix: Map old action strings exactly to taxonomy plus displayed labels.

## G2-16-021-006  [P2] GAP  facet F04  effort S
- Legacy: AdminAuditLog.java:43-47 organizationId/collegeId numeric.
- vNext now: activity.ts:22-29 UUID FK.
- Fix: Map numeric legacy tenant keys to UUID and forbid cross-tenant leakage.

## G2-16-021-009  [P2] GAP  facet F05  effort S
- Legacy: AdminAuditLog.java:13-18 indexes createdAt, actor, scope, action.
- vNext now: activity.ts:70-96 indexes by tenant/module/actor/group-time.
- Fix: Add eventType/time index for high-volume action-key filtering.

## G2-16-021-010  [P2] GAP  facet F05  effort S
- Legacy: AdminAuditLog.java:59-60 datetime when created.
- vNext now: activity.ts:63-67 occurredAt timestamptz.
- Fix: Format Asia/Kolkata and retain original instant.

## G2-16-021-012  [P2] GAP  facet F06  effort S
- Legacy: AdminAuditLog.java:37-41 entityType/entityId optional varchar60.
- vNext now: activity.ts:51-54 subjectType and subjectId required (text).
- Fix: Supply safe sentinel or scoped generic subject for old actor-only events.

## G2-16-021-017  [P2] GAP  facet F10  effort S
- Legacy: AdminAuditLog.java:12-18 indexes action_key.
- vNext now: activity.ts:97-103 dedupeKey unique; no action index.
- Fix: Index eventType/occurredAt for query performance.

## G2-16-021-020  [P2] GAP  facet F12  effort S
- Legacy: AdminAuditLog.java:34-35 arbitrary nonempty action_key.
- vNext now: activity.ts:109-121 event module allowlist and shape check.
- Fix: Map legacy arbitrary action keys to registry, track unmapped events.

## G2-16-021-028  [P2] GAP  facet F19  effort S
- Legacy: V61__admin_audit_log.sql:16-19 four indexes.
- vNext now: activity.ts:70-96 five indexes but not eventType.
- Fix: Add eventType+occurredAt index with explicit query plan.

## G2-16-021-030  [P2] GAP  facet F20  effort S
- Legacy: AdminAuditLog.java:25-33 actor can be null, user type and phone retained.
- vNext now: activity.ts:30-39 nullable actor user FK but no snapshot.
- Fix: Log system actors explicitly without attributing user falsely.

## G2-16-021-033  [P2] GAP  facet F22  effort S
- Legacy: AdminAuditLog.java:59-60 LocalDateTime naive.
- vNext now: activity.ts:63-67 timestamptz.
- Fix: Convert India wall-clock to absolute UTC carefully.

## G2-18-012-007  [P2] GAP  facet F03  effort M
- Legacy: Legacy notifications carry `notificationType` and `contextLabel` strings (`NotificationService.java:74-88`).
- vNext now: New notification rows have title/body/actionHref, event module/type and subjectLabel separately (`activity.ts:40-60,126-151`).
- Fix: Map type/context to event type/label, preserve badge and context copy.

## G2-18-012-008  [P2] GAP  facet F04  effort M
- Legacy: Legacy DTO includes courseSlug/courseName resolved for each course (`NotificationServiceImpl.java:345-367`).
- vNext now: New row stores actionHref and event subjectLabel, no course slug/name fields (`activity.ts:126-151`).
- Fix: Generate safe course route and named context from authorized delivery mapping.

## G2-18-012-033  [P2] GAP  facet F12  effort M
- Legacy: Legacy default COURSE if courseId>0, GENERAL otherwise (`NotificationServiceImpl.java:321-343`).
- vNext now: New event.module enum + eventType required and user-facing title (`activity.ts:40-60,109-120`).
- Fix: Map COURSE/GENERAL/JOB/SYSTEM labels without mistagging course notifications.

## G2-18-012-047  [P2] GAP  facet F18  effort S
- Legacy: Legacy notification fallback types `COURSE`/`GENERAL` (`NotificationServiceImpl.java:321-343`).
- vNext now: New event.module `ACADEMICS`/`COURSES` etc, typed eventType (`activity.ts:40-60,109-120`).
- Fix: Use legacy user-visible label while storing new event taxonomy.

## G2-4-032-007  [P2] GAP  facet F03  effort M
- Legacy: Distinct icons/bodies driven by event title and notification type (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/NotificationEventRegistry.java:79-124`)
- vNext now: Generic title/body/actionHref without type column (`src/db/schema/activity.ts:126-151`)
- Fix: Expose eventType/context to frontend so legacy per-event visual treatment is possible.

## G2-4-032-009  [P2] GAP  facet F03  effort M
- Legacy: Legacy read badge `is_read`, notification_type, context label, direct job/application IDs (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Notification.java:60-85`)
- vNext now: New per-user readAt and actionHref only (`src/db/schema/activity.ts:126-151`)
- Fix: Map legacy action context into safe internal links and labels.

## G2-4-032-011  [P2] GAP  facet F04  effort M
- Legacy: ApplicationId, jobId, assessmentUrl, interviewId metadata (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Notification.java:69-86`)
- vNext now: ActivityEvents metadata and subject fields; in-app has only actionHref (`src/db/schema/activity.ts:40-63`)
- Fix: Map each context identifier to event metadata and deterministic deep links.

## G2-4-032-075  [P2] GAP  facet F22  effort M
- Legacy: Legacy pageNo/pageSize integer pagination (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:88-105`)
- vNext now: User/read/time indexes but no classId/courseId index (`src/db/schema/activity.ts:157-166`)
- Fix: Use activity metadata indexes if supporting legacy class/course browse.

## G2-5-018-007  [P2] GAP  facet F04  effort M
- Legacy: Legacy projectSlug varchar120 + project_id numeric `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectActivityEvent.java:15-21`
- vNext now: New subjectType/subjectId and metadata.projectId, no slug in activity row `src/db/schema/activity.ts:38-49`
- Fix: Migrate numeric project IDs and legacy slug for deep links.

## G2-5-018-008  [P2] GAP  facet F04  effort M
- Legacy: Legacy eventKey varchar120, eventCode varchar60 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectActivityEvent.java:21-30`
- vNext now: New UUID id, dedupeKey text and eventType varchar120 `src/db/schema/activity.ts:17-61`
- Fix: Preserve event code/key meaning and collision/dedupe mapping.

## G2-5-018-009  [P2] GAP  facet F04  effort M
- Legacy: Legacy eventType varchar60 human label and title varchar200 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectActivityEvent.java:28-35`
- vNext now: New eventType varchar120 code, summary nonnull text, subjectLabel `src/db/schema/activity.ts:30-53`
- Fix: Write deterministic machine-code and display label mapping.

## G2-5-018-030  [P2] GAP  facet F12  effort M
- Legacy: Legacy soft deletion inherited BaseModel `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:22-37`
- vNext now: New activity table append-only, no isDeleted `src/db/schema/activity.ts:16-62`
- Fix: Exclude soft-deleted source events when importing; document retention.

## G2-5-018-043  [P2] GAP  facet F20  effort M
- Legacy: Legacy source_tab and nullable actor can be absent `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectActivityEvent.java:36-46`
- vNext now: New required nonblank summary/subjectType/id check `src/db/schema/activity.ts:104-113`
- Fix: Define migration fallback for blank/missing legacy title/summary.

## G2-5-018-045  [P2] GAP  facet F21  effort M
- Legacy: Legacy event_code added by migration V94 for downstream filtering `docs/legacy-source/backend/src/main/resources/db/migration/V94__project_activity_event_code.sql:1-28`
- vNext now: New eventType holds code directly `src/db/schema/activity.ts:29-35`
- Fix: Map event_code and historical human eventType separately.

## G2-5-018-047  [P2] GAP  facet F22  effort M
- Legacy: Legacy index on project_id/eventKey, createdAt and project-created composite `docs/legacy-source/backend/src/main/resources/db/migration/V86__project_activity_events.sql:1-26`
- vNext now: New college/module/actor/group indexes and dedupe key unique `src/db/schema/activity.ts:65-95`
- Fix: Add project-specific lookup or indexed metadata path, validate uniqueness impact.

## G2-11-018-044  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoWorkspaceController.java:~245-281 old TPO Bell stores recipient userType/id, createdAt, readAt and link.
- vNext now: src/modules/activity/tpo-notifications-service.ts:80-109 uses inAppNotifications joined to activityEvents scoped college; src/db/schema/activity.ts:126-169 includes readAt,actionHref,createdAt.
- Fix: Document mapping of old bell ids/links/userType to vNext UUID event FK and new scope policy.

## G2-8-018-040  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/NotificationRepository.java:131-132,172-178: soft delete and age prune
- vNext now: src/db/schema/activity.ts:126-151: no deletedAt/isDeleted in inbox
- Fix: Add retention/hide semantics separate from immutable activity events.

## G2-8-018-047  [P2] GAP  facet F12  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/NotificationRepository.java:109-116: classId 0 plus positive courseId means course-wide
- vNext now: src/db/schema/activity.ts:126-151: no class/course target
- Fix: Resolve all eligible course members at producer time.

## G2-8-018-048  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:322-343: missing notificationType inferred COURSE or GENERAL
- vNext now: src/db/schema/activity.ts:40-55: module/event type categories
- Fix: Add compatibility mapper for inferred type and fallback context.

## G2-8-018-049  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Notification.java:60-61,96-105: isRead default false, legacy deliveryStatus nullable
- vNext now: src/db/schema/activity.ts:143-145: readAt null, no deliveryStatus
- Fix: Preserve historical delivered/not-read defaults when importing.

## G2-8-018-077  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Notification.java:18-19: nullable message
- vNext now: src/db/schema/activity.ts:141,163-165: required nonblank body
- Fix: Convert message->body and repair legacy null text.

## G2-8-018-078  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Notification.java:21-22: nullable title
- vNext now: src/db/schema/activity.ts:140,163-165: required nonblank title
- Fix: Define safe title fallback for historical rows.

## G2-8-018-080  [P2] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Notification.java:30-39: learner_id and recipient_type LEARNER/FACULTY
- vNext now: src/db/schema/activity.ts:129-135: one unified userId UUID
- Fix: Backfill separate legacy ID namespaces, class-wide fanout.
