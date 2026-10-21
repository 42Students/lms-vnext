# Work packet: edit src/db/schema/project-audit-staged.ts

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/project-task-comment.md, docs/audit/gap2/lane-19/project-meeting-history-entity.md, docs/audit/gap2/lane-3/project-delivery-event.md, docs/audit/gap2/lane-4/superadmin-project-workspace-audit.md, docs/audit/gap2/lane-9/l15-u017-project-resource-audit.md

## G2-12-017-013  [P1] MISSING  facet F04  effort M
- Legacy: Old progressValue nullable integer stores progress percent `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTaskComment.java:34-35`
- vNext now: No progressValue in registered projectTaskComments; staged schema has it but not deployed `src/db/schema/projects.ts:500-530` `src/db/schema/project-audit-staged.ts:88-102`
- Fix: Promote progress_value with 0..100 validation, expose it in activity feed.

## G2-12-017-015  [P1] MISSING  facet F04  effort M
- Legacy: Old taskStatusSnapshot varchar30 nullable `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTaskComment.java:40-41`
- vNext now: New registered schema omits status snapshot; staged has it only `src/db/schema/projects.ts:500-530` `src/db/schema/project-audit-staged.ts:88-102`
- Fix: Promote task status snapshot to registered schema and write on state action.

## G2-19-017-008  [P1] GAP  facet F04  effort L
- Legacy: Legacy projectId and projectMeetingId are numeric, meeting key string `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeetingHistory.java:17-24`
- vNext now: vNext staged projectId/meetingId UUID, meetingKey varchar120 `src/db/schema/project-audit-staged.ts:19-24`
- Fix: Map integer project/meeting IDs to UUID and preserve stable meetingKey.

## G2-19-017-010  [P1] GAP  facet F04  effort L
- Legacy: Legacy BaseModel id, created/updated and soft-delete `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeetingHistory.java:15-15` `docs/legacy-source/backend/src/main/resources/db/migration/V84__project_meetings.sql:38-43`
- vNext now: vNext staged id UUID and createdAt timestamptz, no isDeleted/updatedAt `src/db/schema/project-audit-staged.ts:19-33`
- Fix: Define tombstone and historical ordering backfill.

## G2-19-017-011  [P1] GAP  facet F04  effort L
- Legacy: Legacy actorUserId nullable int and actorUserType varchar20 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeetingHistory.java:29-33`
- vNext now: vNext nullable UUID user FK and actorUserType varchar20 `src/db/schema/project-audit-staged.ts:25-27`
- Fix: Resolve mixed legacy actor types and deleted actor IDs without inventing membership.

## G2-19-017-016  [P1] GAP  facet F06  effort M
- Legacy: Legacy JSON changedFields free-form, including arrays according to DTO Object `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeetingHistory.java:46-48` `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectMeetingHistoryDTO.java:17-20`
- vNext now: vNext staged `jsonb` typed Record<string,unknown> for changedFields `src/db/schema/project-audit-staged.ts:17-30`
- Fix: Check legacy `changed_fields` array shape; use JSON type or explicit migration transform.

## G2-19-017-031  [P1] GAP  facet F12  effort M
- Legacy: Legacy revision JSON is free-form Object and may contain private fields `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeetingHistory.java:38-48`
- vNext now: vNext candidate notes typed JSONB but generic event UI redacts metadata `src/db/schema/project-audit-staged.ts:17-30` `src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx:140-142`
- Fix: Allowlist before/after field projection, redact private links/contact info.

## G2-19-017-032  [P1] GAP  facet F12  effort L
- Legacy: Legacy nullable actorUserId, actorName captures past identity `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeetingHistory.java:29-36`
- vNext now: vNext staged FK users(id) RESTRICT; past deleted/nonexistent actors might fail `src/db/schema/project-audit-staged.ts:25-27`
- Fix: Retain actorName snapshot when FK migration cannot resolve deleted user.

## G2-19-017-048  [P1] GAP  facet F21  effort L
- Legacy: Legacy Hibernate JSON mapping and Spring Data repository `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeetingHistory.java:38-48` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectMeetingHistoryRepository.java:13-24`
- vNext now: vNext staged Drizzle JSONB schema is not in active barrel export `src/db/schema/project-audit-staged.ts:19-40` `src/db/schema/index.ts:18-19`
- Fix: Promote typed table and service+DAL handlers under DB07 migration.

## G2-19-017-050  [P1] GAP  facet F22  effort L
- Legacy: Legacy table int PK/foreign keys, JSON and time, indexes project/meeting, soft-delete `docs/legacy-source/backend/src/main/resources/db/migration/V84__project_meetings.sql:38-59`
- vNext now: vNext staged UUID project/meeting/actor FK JSONB createdAt and composite FK, no deleted flag `src/db/schema/project-audit-staged.ts:19-40`
- Fix: Draft complete history data migration map for legacy meeting IDs and JSON payload.

## G2-3-018-009  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDeliveryEvent.java:37-47`
- vNext now: `src/db/schema/projects.ts:930-956`, `src/db/schema/project-audit-staged.ts:65-86`
- Fix: Legacy notes, attachmentUrl, feedback, revisionCount default0; registered vNext projectDeliveryEvents lacks all these; staged schema mirrors but not used. Integrate immutable payload on supported events without unsafe URLs.

## G2-3-018-044  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDeliveryEvent.java:12-48`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectDeliveryEventDTO.java:6-24`
- vNext now: `src/db/schema/projects.ts:914-959`, `src/db/schema/project-audit-staged.ts:65-86`
- Fix: Legacy project_delivery_event has action,status,actor id/name/type,notes,attachmentUrl,feedback,revisionCount; registered vNext technical project_delivery_events narrower, staged file matches old but is not active. Reconcile schema and plan migration without conflicting table names.

## G2-4-029-063  [P1] GAP  facet F22  effort L
- Legacy: Legacy project_resource_audit int PK, MySQL datetime/json indexes (`docs/legacy-source/backend/src/main/resources/db/migration/V80__project_resource_audit.sql:1-21`)
- vNext now: UUID FK project/resource, timestamptz/jsonb and new indexes (`src/db/schema/project-audit-staged.ts:42-63`)
- Fix: Create stable legacy ID mapping and preserve audit chronology.

## G2-15-017-031  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V80__project_resource_audit.sql:18-20 FK only to project, history survives resource deletion
- vNext now: src/db/schema/project-audit-staged.ts:57-59 proposed composite resource FK can restrict deletion
- Fix: Retain orphan-safe key in history and choose explicit deletion policy

## G2-15-017-046  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:22-37 int auto ID, created/updated/deleted inheritance
- vNext now: src/db/schema/project-audit-staged.ts:42-55 proposed UUID ID/created only
- Fix: Reconcile every old base field and planned retirement in schema ledger

## G2-15-017-047  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V80__project_resource_audit.sql:14-20 JSON columns and two indexes
- vNext now: src/db/schema/project-audit-staged.ts:52-62 draft JSONB, different index shape, not live
- Fix: Migrate JSONB and actual project+resource/time indexes

## G2-15-017-048  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V80__project_resource_audit.sql:18-20 project_workspace FK
- vNext now: src/db/schema/project-audit-staged.ts:44-59 proposed project_instances plus composite resource FK
- Fix: Test project/tenant FK integrity before promotion
