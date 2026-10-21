# Work packet: edit src/modules/projects/mentor-task-create-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/l17-u031-projects-end-to-end.md

## G2-17-031-027  [P1] GAP  facet F10  effort M
- Legacy: LBE/controller/ProjectWorkspaceController.java:294-305 PUT entire tasks/resources section.
- vNext now: V/modules/projects/resource-service.ts:92-100 and mentor-task-create-service.ts:1-20 use item-level commands.
- Fix: Describe semantic change whole-array vs per-item and migrate optimistic tokens.
