# Work packet: edit src/modules/projects/access.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/superadmin-workspace-delivery.md

## G2-3-029-025  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/delivery.js:23-33`
- vNext now: `src/modules/projects/access.ts:1-62`
- Fix: Legacy No college selected warns with header switcher action; vNext authorization may reject with PROJECT_ACCESS_DENIED, no explicit guidance.
