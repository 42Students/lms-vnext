# Work packet (wave 2): edit src/modules/projects/mentor-backlog-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/project-task.md

## G2-13-017-017  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:106-112` @Version optimistic lock
- vNext now: `src/db/schema/projects.ts:444-448` updatedAt used as optimistic token in `src/modules/projects/mentor-backlog-service.ts:59-68`
- Fix: Document version-long vs millisecond updatedAt CAS; expose stale-edits consistently

## G2-13-017-018  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectTaskRepository.java:15-16` order by sortOrder ASC,id ASC for active project tasks
- vNext now: `src/db/schema/projects.ts:428` sequence required and `src/db/schema/projects.ts:459-462` unique sprint/sequence; `src/modules/projects/mentor-backlog-service.ts:55-68` appends sequence at sprint/backlog tail
- Fix: Map old sortOrder to sprint-local sequence, resolve collisions and preserve relative order
