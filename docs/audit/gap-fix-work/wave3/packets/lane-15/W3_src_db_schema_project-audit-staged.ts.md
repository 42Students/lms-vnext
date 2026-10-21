# Work packet (wave 3): edit src/db/schema/project-audit-staged.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/project-meeting-history-entity.md, docs/audit/gap2/lane-4/superadmin-project-workspace-audit.md, docs/audit/gap2/lane-9/l15-u017-project-resource-audit.md

## G2-19-017-001  [P1] MISSING  facet F01  effort L
- Legacy: Legacy ProjectMeetingHistory is a JPA entity for project workspace meeting edits, not a route `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeetingHistory.java:10-16` `docs/legacy-source/backend/src/main/resources/db/migration/V84__project_meetings.sql:38-45`
- vNext now: vNext staged history type exists but not exported via registered db/schema/index; activity is separate `src/db/schema/project-audit-staged.ts:19-40` `src/db/schema/index.ts:18-19`
- Fix: Promote history table and identify live writer for meeting revision records.

## G2-4-029-062  [P1] MISSING  facet F22  effort L
- Legacy: Stores resourceKey/actionType/actorUserId/type/name/beforeJson/afterJson/changedFields (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectResourceAudit.java:15-51`)
- vNext now: Draft project_resource_audit mirrors many columns but not live registered (`src/db/schema/project-audit-staged.ts:42-63`)
- Fix: Promote DB07 source-only candidate and ensure migration registered/replayed.

## G2-15-017-007  [P1] MISSING  facet F04  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectResourceAudit.java:17-29 projectId/resourceId/key/action
- vNext now: src/db/schema/project-audit-staged.ts:42-47 fields defined only in unregistered staged schema
- Fix: Promote schema and persist history rows

## G2-15-017-032  [P1] MISSING  facet F12  effort L
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V80__project_resource_audit.sql:8-13 key max 120/action 40/type20/name160
- vNext now: src/db/schema/project-audit-staged.ts:46-54 lengths match but table unregistered
- Fix: Register migration preserving exact field caps
