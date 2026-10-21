# Work packet (wave 2): edit src/modules/projects/constants.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/project-task.md

## G2-13-017-005  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:35-39` taskStatus TO_DO, priority MEDIUM; `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:55-57` taskType STORY
- vNext now: `src/modules/projects/constants.ts:39-45` status TODO and `src/modules/projects/constants.ts:9-16` priority MEDIUM; `src/db/schema/projects.ts:438` taskType nullable
- Fix: Normalize legacy TO_DO→TODO and legacy STORY default to taskType STORY on migrated tasks

## G2-13-017-039  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:35-39` default TO_DO/MEDIUM, `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:57` STORY
- vNext now: `src/db/schema/projects.ts:422-427` default TODO/MEDIUM and taskType null; `src/modules/projects/constants.ts:39-45` enums
- Fix: Import status alias and default taskType STORY for legacy rows unless explicitly other type

## G2-13-017-048  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:35` default status `TO_DO`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:55` default type STORY
- vNext now: `src/modules/projects/constants.ts:39-45` `TODO`, `src/db/schema/projects.ts:438` taskType null
- Fix: Set display label 'To do' while translating stored legacy TO_DO, preserve STORY badge
