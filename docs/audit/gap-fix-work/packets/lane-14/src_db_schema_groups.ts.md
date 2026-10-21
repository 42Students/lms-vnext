# Work packet: edit src/db/schema/groups.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/admin-group-controller.md

## G2-3-024-044  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:95-146`
- vNext now: `src/db/schema/groups.ts:6-41`
- Fix: Legacy long group identifiers, college/org scope and soft delete vs VNext UUID groups, deletedAt and version. Explicit identity conversion needed if migrating; new project has no migration planned.

## G2-3-024-045  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:156-229`
- vNext now: `src/db/schema/groups.ts:42-88`
- Fix: Legacy learner integer IDs/rolls and member events vs VNext membership UUIDs, versioned states and actor IDs. Migration/compatibility mapping required.
