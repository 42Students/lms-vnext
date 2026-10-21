# Work packet: edit src/components/projects/mentor-release-editor.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/project-release-entity.md

## G2-17-017-005  [P1] GAP  facet F03  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectReleaseDTO.java:9-27 — DTO reports readyToShip, completedSprintCount, committed/completed points.
- vNext now: src/components/projects/mentor-release-editor.tsx:10-12 — Editor receives only id,title,description,status,updatedAt and linkedSprints count.
- Fix: Show release readiness totals and disable Ship from same authoritative rollup.

## G2-17-017-015  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectReleaseDTO.java:24-27 — ReadyToShip requires at least one sprint and all completed.
- vNext now: src/components/projects/mentor-release-editor.tsx:40-42 — Editor only prevents deletion when linkedSprints>0.
- Fix: Add readiness indicator and Ship button disabled for unfinished sprints.
