# Work packet: edit src/modules/groups/rules-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/admin-group-controller.md

## G2-3-024-014  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:75-91`
- vNext now: `src/modules/groups/college-group-management-service.ts:92-159`, `src/modules/groups/rules-service.ts:28-40`
- Fix: Legacy exact errors Elective groups are managed from the Electives page/Project team groups from Team tab; VNext service owner restrictions use codes and dedicated screens. Preserve explanatory messages.
