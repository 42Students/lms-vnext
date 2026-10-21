# Work packet (wave 2): edit src/modules/projects/workspace-brief-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/project-workspace-model.md

## G2-4-017-039  [P2] GAP  facet F10  effort L
- Legacy: Legacy PUT id updates workspace detail; nested endpoints update overview/sprints/resources/delivery. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java:120-152`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java:294-375`)
- vNext now: New project PATCH summary, brief edit, child resource/meeting/release services. (`src/modules/projects/college-project-summary-service.ts:13-61`; `src/modules/projects/workspace-brief-service.ts:13-26`)
- Fix: Map all mutating endpoints to new contracts with exact conflict handling.

## G2-4-017-068  [P2] GAP  facet F21  effort M
- Legacy: Legacy project workspace controller exposes R2 download and activity/meeting/task services. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java:294-342`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java:426-613`)
- vNext now: New typed project services and storage, plus activity and member notifications. (`src/modules/projects/workspace-brief-service.ts:28-50`; `src/modules/projects/college-project-summary-service.ts:62-80`)
- Fix: Review storage and asynchronous notifications per endpoint in downstream audits.
