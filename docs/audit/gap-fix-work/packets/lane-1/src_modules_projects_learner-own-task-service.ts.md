# Work packet: edit src/modules/projects/learner-own-task-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/project-task.md

## G2-13-017-033  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:97-104` createdByType disambiguates int actor IDs
- vNext now: `src/modules/projects/learner-own-task-service.ts:57-63` event metadata createdByMembershipId; `src/db/schema/projects.ts:439-448` no creator columns
- Fix: Guarantee every create/edit activity event carries durable actor and original role type

## G2-13-017-035  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:68-75` assigneeId+assigneeType allow learner/faculty separate ID namespaces
- vNext now: `src/db/schema/projects.ts:430-433` FK to collegeMemberships only; `src/modules/projects/learner-own-task-service.ts:20-27` learner mutation guard
- Fix: Map faculty/nonlearner assignment records with explicit owner decision; avoid accidental learner conversion
