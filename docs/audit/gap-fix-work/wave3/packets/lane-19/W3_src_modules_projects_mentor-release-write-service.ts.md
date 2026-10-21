# Work packet (wave 3): edit src/modules/projects/mentor-release-write-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/project-release-entity.md

## G2-17-017-013  [P1] MISSING  facet F06  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectReleaseUpsertDTO.java:9-16 — Update can send releaseKey,title,targetDate,notes,sortOrder,version.
- vNext now: src/modules/projects/mentor-release-write-service.ts:16-20 — Create/update accepts title,description,expectedUpdatedAt only.
- Fix: Implement missing target date and sort order update workflow.
