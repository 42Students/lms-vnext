# Work packet (wave 2): edit src/modules/projects/mentor-sprint-delete-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u017-project-sprint.md

## G2-14-017-041  [P2] GAP  facet F13  effort M
- Legacy: Legacy active finder omits deleted sprints `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectSprintRepository.java:16-20`
- vNext now: New hard deletion means omitted permanently `src/modules/projects/mentor-sprint-delete-service.ts:51-52`
- Fix: Differentiate deleted-by-workspace from never-created state
