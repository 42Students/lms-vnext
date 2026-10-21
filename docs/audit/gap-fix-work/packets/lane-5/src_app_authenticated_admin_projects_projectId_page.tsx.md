# Work packet: edit src/app/(authenticated)/admin/projects/[projectId]/page.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/super-admin-workspace-index.md, docs/audit/gap2/lane-4/superadmin-project-workspace-audit.md

## G2-20-028-010  [P1] GAP  facet F10  effort S
- Legacy: Old replaces retaining query docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js:17-24
- vNext now: New redirect drops query src/app/(authenticated)/admin/projects/[projectId]/page.tsx:25-29
- Fix: Forward query

## G2-20-028-020  [P1] GAP  facet F20  effort S
- Legacy: Old query rest retained docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js:15-22
- vNext now: New omits all src/app/(authenticated)/admin/projects/[projectId]/page.tsx:12-29
- Fix: Whitelist params

## G2-4-029-001  [P1] GAP  facet F01  effort S
- Legacy: Dedicated `/superadmin/projects/workspaces/[workspaceId]/audit` route with full audit link (`docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/audit.js:68-85`)
- vNext now: Legacy project path redirects to `/admin/projects/[projectId]/summary` (`src/app/(authenticated)/admin/projects/[projectId]/page.tsx:8-29`)
- Fix: Add legacy workspace-audit URL adapter to canonical project audit tab.

## G2-20-028-007  [P2] GAP  facet F07  effort S
- Legacy: Old waits router ready docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js:17-24
- vNext now: New bad ID notFound src/app/(authenticated)/admin/projects/[projectId]/page.tsx:21-24
- Fix: Failure UX
