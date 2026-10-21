# Work packet (wave 2): edit src/app/api/projects/[projectId]/restore/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l11-u028-superadmin-deleted-workspaces.md

## G2-11-028-033  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:69-92`
- vNext now: `src/app/api/projects/[projectId]/restore/route.ts:8-15`
- Fix: Legacy POST /api/v1/admin/projects/{id}/restore with collegeId, response envelope; vNext POST /api/projects/{UUID}/restore with JSON version and {project}.
