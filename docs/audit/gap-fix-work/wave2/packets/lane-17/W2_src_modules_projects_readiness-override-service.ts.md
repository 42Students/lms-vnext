# Work packet (wave 2): edit src/modules/projects/readiness-override-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/project-workspace-model.md, docs/audit/gap2/lane-7/u012-college-admin-workspace-readiness.md

## G2-4-017-062  [P2] GAP  facet F18  effort M
- Legacy: Legacy recovery field named recoverableContent, readinessOverrideNote. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:93-117`)
- vNext now: New readiness state lives in events and archive uses archivedAt. (`src/modules/projects/readiness-override-service.ts:16-27`; `src/db/schema/projects.ts:219-233`)
- Fix: Match old restore/readiness support messaging while preserving new policy.

## G2-7-012-038  [P2] GAP  facet F12  effort M
- Legacy: ProjectReadinessDTO.java:22-27 overrideActive/value/note/actor/date
- vNext now: readiness-override-service.ts:14-25 uses latest event FORCE_UNLOCK/FORCE_BLOCK/CLEAR
- Fix: Map historical override boolean and CLEAR explicitly

## G2-7-012-061  [P2] GAP  facet F22  effort L
- Legacy: ProjectWorkspace.java:107-117 override fields on project row
- vNext now: readiness-override-service.ts:14-25 history event projection
- Fix: Migrate override state actor/time into activity event
