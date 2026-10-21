# Work packet (wave 2): edit src/components/projects/project-admin-workspace-page-export.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u019-college-admin-project-workspaces-list.md

## G2-7-019-012  [P3] GAP  facet F03  effort S
- Legacy: workspaces/index.js:391-423 download icon and `Export this page` button disabled for empty
- vNext now: project-admin-workspace-page-export.tsx:5-19 secondary export button; toolbar wrapper
- Fix: Match Download icon, label, size and enabled state.
