# Work packet (wave 2): edit src/db/schema/activity.ts (part 2 of 2)

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/notification.md, docs/audit/gap2/lane-9/college-admin-audit.md, docs/audit/gap2/lane-9/l15-u017-project-resource-audit.md, docs/audit/gap2/lane-16/u021-admin-audit-log.md

## G2-8-018-081  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Notification.java:55-59: transient courseSlug/courseName
- vNext now: src/db/schema/activity.ts:126-151: no derived course fields
- Fix: Expose course metadata in recipient DTO through join.

## G2-8-018-083  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Notification.java:63-67: notification_type VARCHAR20, context_label
- vNext now: src/db/schema/activity.ts:40-55,126-151: event module/type but no context label
- Fix: Map category/context explicitly to event taxonomy.

## G2-8-018-086  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Notification.java:80-82: interview_id
- vNext now: src/db/schema/activity.ts:126-151: no interview reference
- Fix: Map interview detail target and CTA.

## G2-8-018-090  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/NotificationRepository.java:17-32,164-178: queries over isDeleted, scheduledAt
- vNext now: src/db/schema/activity.ts:153-165: unique user/event and user/readAt/createdAt indexes
- Fix: Add due/retention indexes on scheduling source, keep inbox uniqueness.

## G2-9-001-071  [P2] GAP  facet F22  effort M
- Legacy: Action key max100, entity type/id max60 (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AdminAuditLog.java:22-54`)
- vNext now: Event type max120, subject type max80, subject id text (`src/db/schema/activity.ts:35-57`)
- Fix: Audit length/legacy event mapping and exports for preserved semantics.

## G2-15-017-012  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:74-84 actor name fallback to id; type Staff/Student/Admin
- vNext now: src/db/schema/activity.ts:30-38 current generic event has no actor type label
- Fix: Use preserved type label and name fallback per legacy

## G2-15-017-017  [P2] MISSING  facet F05  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectResourceAuditRepository.java:18-22 latest first createdAt DESC,id DESC
- vNext now: src/db/schema/activity.ts:63-68 occurredAt only, no history query
- Fix: Add stable descending history query with ID tie-break

## G2-15-017-042  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectResourceAuditRepository.java:18-22 createdAt and integer-ID tie break
- vNext now: src/db/schema/activity.ts:18-21,63-68 timestamp and UUID PK
- Fix: Use stable timestamp/UUID cursor; test same-time ordering

## G2-16-021-011  [P3] GAP  facet F06  effort S
- Legacy: AdminAuditLog.java:34-35 actionKey required length100.
- vNext now: activity.ts:43-45 eventType required length120.
- Fix: Validate old action keys length and taxonomy mapping.
