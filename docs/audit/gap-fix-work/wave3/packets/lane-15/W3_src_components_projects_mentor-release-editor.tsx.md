# Work packet (wave 3): edit src/components/projects/mentor-release-editor.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/project-release-entity.md

## G2-17-017-006  [P2] MISSING  facet F03  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectRelease.java:33-34 — Target date is LocalDate, optional.
- vNext now: src/components/projects/mentor-release-editor.tsx:73-79 — No target date control, only title/description.
- Fix: Add date-only input and vNext persistence field.
