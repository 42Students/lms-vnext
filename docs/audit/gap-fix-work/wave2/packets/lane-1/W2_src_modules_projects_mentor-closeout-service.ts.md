# Work packet (wave 2): edit src/modules/projects/mentor-closeout-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/project-release-entity.md

## G2-17-017-012  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectReleaseRepository.java:25-26 — Count only nondeleted releases by project.
- vNext now: src/modules/projects/mentor-closeout-service.ts:39-42 — Closeout counts releases not shipped, not filtered for soft deletion.
- Fix: Ensure hard-deleted releases excluded; clarify counts.
