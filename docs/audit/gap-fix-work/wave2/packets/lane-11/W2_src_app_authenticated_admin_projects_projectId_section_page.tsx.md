# Work packet (wave 2): edit src/app/(authenticated)/admin/projects/[projectId]/[section]/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/l13-u028-superadmin-workspace-tasks.md, docs/audit/gap2/lane-3/superadmin-workspace-delivery.md

## G2-13-028-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/tasks.js:22-28 route /superadmin/projects/workspaces/:workspaceId/tasks scoped college
- vNext now: src/app/(authenticated)/admin/projects/[projectId]/[section]/page.tsx:1-29 uses /admin/projects/:id/tasks
- Fix: Map old workspace/tasks URL, back links and selected college into new route.

## G2-3-029-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/delivery.js:10-16`
- vNext now: `src/app/(authenticated)/admin/projects/[projectId]/[section]/page.tsx:3-25`
- Fix: Legacy uses workspaceId-scoped URL /superadmin/projects/workspaces/[workspaceId]/delivery; vNext /admin/projects/[projectId]/delivery. Redirect historical deep links and preserve from query.

## G2-3-029-005  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/delivery.js:61-61`
- vNext now: `src/app/(authenticated)/admin/projects/[projectId]/[section]/page.tsx:16-25`
- Fix: Legacy SuperAdminLayout wraps page; vNext authenticated app shell + ProjectWorkspace. Audit shell/sidebar/nav parity globally.
