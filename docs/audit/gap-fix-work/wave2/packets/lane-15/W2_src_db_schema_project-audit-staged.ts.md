# Work packet (wave 2): edit src/db/schema/project-audit-staged.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/project-meeting-history-entity.md, docs/audit/gap2/lane-4/superadmin-project-workspace-audit.md, docs/audit/gap2/lane-9/l15-u017-project-resource-audit.md

## G2-19-017-009  [P2] GAP  facet F04  effort M
- Legacy: Legacy before_json, after_json, changed_fields mapped Hibernate JSON Object `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeetingHistory.java:38-48`
- vNext now: vNext staged JSONB typed Record<string,unknown> `src/db/schema/project-audit-staged.ts:17-30`
- Fix: Validate imported JSON shape and protect private fields in revisions.

## G2-19-017-045  [P2] GAP  facet F20  effort S
- Legacy: Legacy history order DESC createdAt, id stable tie `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectMeetingHistoryRepository.java:20-24`
- vNext now: vNext staged index projectId,createdAt and meetingId,createdAt, no ID tie-break `src/db/schema/project-audit-staged.ts:37-38`
- Fix: Stable sorting and cursor or OFFSET tie-break.

## G2-4-029-065  [P2] GAP  facet F22  effort S
- Legacy: Legacy updated_at and is_deleted persisted (`docs/legacy-source/backend/src/main/resources/db/migration/V80__project_resource_audit.sql:4-5`)
- vNext now: CreatedAt only, no updatedAt/isDeleted (`src/db/schema/project-audit-staged.ts:42-63`)
- Fix: Decide retention/deletion metadata migration and audit immutability.

## G2-15-017-043  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:28-37 nullable updatedAt and isDeleted flag
- vNext now: src/db/schema/project-audit-staged.ts:42-63 no update/soft-delete fields
- Fix: Document intentional retirement or add mapped fields

## G2-19-017-041  [P3] GAP  facet F18  effort S
- Legacy: Legacy DTO uses `actionType`, `actorUserType`, `beforeJson`, `afterJson`, `changedFields` `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectMeetingHistoryDTO.java:8-21`
- vNext now: vNext staged schema retains most keys but public Activity says Recorded project activity `src/db/schema/project-audit-staged.ts:23-31` `src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx:39-41`
- Fix: Use Meeting change history label separate from generic activity.
