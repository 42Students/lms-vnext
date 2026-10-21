# Work packet (wave 2): edit src/modules/projects/class-team-workspace-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/super-admin-project-workspace-new.md

## G2-8-028-013  [P2] GAP  facet F04  effort M
- Legacy: Old selectedCollegeId and organizationId numeric, forced from session into POST docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:31-34,230-237,298-307.
- vNext now: New collegeId UUID scoped server-side by selected adminScope src/app/(authenticated)/admin/projects/workspaces/new/page.tsx:15-23; src/modules/projects/class-team-workspace-service.ts:24-28.
- Fix: Map tenant/college scope and ensure stale role switch clears selections.
