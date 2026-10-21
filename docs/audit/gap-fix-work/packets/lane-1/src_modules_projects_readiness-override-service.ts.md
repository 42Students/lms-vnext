# Work packet: edit src/modules/projects/readiness-override-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/project-workspace-model.md

## G2-4-017-035  [P1] GAP  facet F08  effort M
- Legacy: Legacy readiness override persisted with actor/note/time. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:107-117`)
- vNext now: New event-based readiness override stores state/note in activityEvents and reads latest. (`src/modules/projects/readiness-override-service.ts:16-27`; `src/modules/projects/readiness-override-service.ts:48-56`)
- Fix: Ensure long-lived override state and latest event history survive retention/compaction.

## G2-4-017-071  [P1] GAP  facet F22  effort M
- Legacy: Legacy readiness override fields on workspace row. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:107-117`)
- vNext now: New readiness override derives state from latest PROJECTS_READINESS_OVERRIDDEN activity event. (`src/modules/projects/readiness-override-service.ts:16-26`)
- Fix: Ensure audit retention cannot unexpectedly reset active override.
