# Work packet (wave 2): edit src/modules/projects/lifecycle-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u017-project-sprint.md

## G2-14-017-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy sprint keyed by projectId and sprintKey in URLs `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:38-45` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ProjectWorkspaceService.java:94-111`
- vNext now: New IDs are UUID sprintId and projectId `src/db/schema/projects.ts:331-345` `src/modules/projects/lifecycle-service.ts:134-145`
- Fix: Provide deep-link mapper from project/sprintKey to UUID
