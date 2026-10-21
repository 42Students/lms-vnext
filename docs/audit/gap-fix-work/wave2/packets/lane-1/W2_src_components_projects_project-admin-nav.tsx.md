# Work packet (wave 2): edit src/components/projects/project-admin-nav.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-projects-workspaces.md

## G2-10-028-004  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:328-339 — no-college message retains grouped Projects navigation.
- vNext now: src/app/(authenticated)/admin/projects/page.tsx:51-69; src/components/projects/project-admin-nav.tsx:26-29 — EmptyState, nav suppressed.
- Fix: Preserve group tabs in no-college state.
