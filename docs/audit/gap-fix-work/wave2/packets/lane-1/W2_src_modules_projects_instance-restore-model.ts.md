# Work packet (wave 2): edit src/modules/projects/instance-restore-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l11-u028-superadmin-deleted-workspaces.md

## G2-11-028-020  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:115-123`
- vNext now: `src/modules/projects/instance-restore-model.ts:2-7`
- Fix: Legacy restore only requires id and selected college; vNext POST JSON must include expectedUpdatedAt for optimistic lock.
