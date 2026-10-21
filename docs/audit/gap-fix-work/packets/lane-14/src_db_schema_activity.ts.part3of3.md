# Work packet: edit src/db/schema/activity.ts (part 3 of 3)

16 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/notification.md, docs/audit/gap2/lane-9/college-admin-audit.md, docs/audit/gap2/lane-9/l15-u017-project-resource-audit.md, docs/audit/gap2/lane-9/superadmin-audit-hub.md, docs/audit/gap2/lane-9/superadmin-audit-logs.md, docs/audit/gap2/lane-4/cross-notifications.md

## G2-8-018-045  [P1] GAP  facet F12  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Notification.java:88-105: delayed until due, delivery states SCHEDULED/SENT/FAILED
- vNext now: src/db/schema/activity.ts:126-151: no queued state
- Fix: Model due delivery and failed retries before fanout.

## G2-8-018-058  [P1] GAP  facet F15  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/NotificationRepository.java:164-170: due scheduled notification query
- vNext now: src/db/schema/activity.ts:126-151: no schedule field on inbox
- Fix: Ensure due job and failure/retry visibility, not eager fanout.

## G2-8-018-076  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:23-37: int PK, local timestamps, isDeleted
- vNext now: src/db/schema/activity.ts:126-151: UUID PK, UTC-aware createdAt, no soft-delete
- Fix: Maintain numeric-ID map, time conversion, deleted retention on import.

## G2-8-018-079  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Notification.java:24-28: class_id/course_id primitive int (zero sentinel)
- vNext now: src/db/schema/activity.ts:126-151: no course/class target; event scoped org/college src/db/schema/activity.ts:18-28
- Fix: Keep class/course targeting in event metadata or fanout table.

## G2-8-018-084  [P1] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Notification.java:69-74: application_id and job_id integers
- vNext now: src/db/schema/activity.ts:126-151: only actionHref text
- Fix: Store typed job/application refs in event metadata and deep link.

## G2-8-018-085  [P1] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Notification.java:76-78: assessment_url VARCHAR2048
- vNext now: src/db/schema/activity.ts:142, src/modules/activity/notification-service.ts:46-55: internal-only actionHref
- Fix: Provide validated external assessment target separate from internal href.

## G2-8-018-087  [P1] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Notification.java:84-86: creator_faculty_id owns edits/deletes
- vNext now: src/db/schema/activity.ts:126-151: no creator on notification; event actor at src/db/schema/activity.ts:30-38
- Fix: Enforce faculty ownership via event actor on editable source records.

## G2-8-018-088  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Notification.java:88-105: scheduledAt/deliveryStatus/deliveryError<=500/deliveredAt
- vNext now: src/db/schema/activity.ts:126-151: absent delivery-state columns
- Fix: Preserve scheduling/outbox fields in delivery producer and admin views.

## G2-9-001-038  [P1] GAP  facet F10  effort M
- Legacy: Audit logRequired writes actor/IP/UA/action/payload, saveAndFlush (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminAuditLogService.java:31-82`)
- vNext now: activity_events captures actor IDs/metadata but no IP/UA/role snapshot (`src/db/schema/activity.ts:17-80`)
- Fix: Implement forensic field disposition with privacy review.

## G2-9-001-070  [P1] GAP  facet F22  effort M
- Legacy: Bigint id, actor user type/mobile, IP, UA, JSON, local datetime (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AdminAuditLog.java:14-59`)
- vNext now: UUID, metadata jsonb, timestamptz; forensic fields absent (`src/db/schema/activity.ts:17-80`)
- Fix: Implement approved DB-039 actor-role/IP/UA field strategy.

## G2-15-017-008  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectResourceAudit.java:30-38 actor id/type/name snapshots
- vNext now: src/db/schema/activity.ts:30-38 actor id and membership but no immutable actor name/type
- Fix: Snapshot actor display name/type at write time

## G2-9-026-041  [P1] GAP  facet F12  effort M
- Legacy: Raw IP included in legacy CSV export `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:156-175`
- vNext now: New event schema has no IP field; export likely cannot include it `src/app/(authenticated)/activity/page.tsx:194-221` `src/db/schema/activity.ts:9-65`
- Fix: Decide security-sensitive IP retention/export policy; document deliberate omission.

## G2-9-026-060  [P1] GAP  facet F22  effort L
- Legacy: Legacy AdminAuditLog fields int actor ID, actionKey, entityType/id, IP, createdAt `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:105-125`
- vNext now: New activity_events UUID, module,eventType,subjectType/id,importance,summary,metadata,groupKey,dedupeKey,occurredAt `src/db/schema/activity.ts:12-65`
- Fix: Document migration mapping actionKey→eventType, actor IDs and entity IDs, IP retention.

## G2-9-027-046  [P1] GAP  facet F14  effort L
- Legacy: CSV fields Time, Action, Entity, Actor, Org, College, IP, User agent `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:157-169`
- vNext now: New event schema no raw IP/User Agent fields `src/db/schema/activity.ts:9-65`
- Fix: Verify sensitive forensic field retention/redaction and CSV contract.

## G2-9-027-060  [P1] GAP  facet F22  effort L
- Legacy: AdminAuditLog legacy actionKey, actorUserId numeric, entityId, IP, agent, org/college `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:105-128`
- vNext now: New activity_events UUID identity, eventType, subjectType/id, metadata and occurredAt; no IP/agent `src/db/schema/activity.ts:9-65`
- Fix: Build full migration field-level map and retention policy.

## G2-4-032-027  [P2] GAP  facet F08  effort M
- Legacy: In-app event-specific visible subject/body (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/NotificationEventRegistry.java:79-124`)
- vNext now: Title/body stored by producer, not globally template registered (`src/db/schema/activity.ts:140-151`)
- Fix: Test exact event copy per dispatcher mapping.
