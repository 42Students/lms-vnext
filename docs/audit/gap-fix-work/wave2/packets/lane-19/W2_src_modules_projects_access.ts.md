# Work packet (wave 2): edit src/modules/projects/access.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/superadmin-workspace-delivery.md

## G2-3-029-034  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/delivery.js:12-15`
- vNext now: `src/modules/projects/access.ts:1-62`
- Fix: Legacy selected collegeId scopes getProjectWorkspaceById request; vNext central requireProjectManageAccess checks acting organization/college and project UUID.
