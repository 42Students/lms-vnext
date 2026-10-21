# Work packet (wave 2): edit src/app/(authenticated)/admin/projects/workspaces/new/page.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-project-controller.md, docs/audit/gap2/lane-8/super-admin-project-workspace-new.md

## G2-2-020-007  [P2] GAP  facet F02  effort M
- Legacy: Legacy frontend superadmin/projects/workspaces/new.js:350-395 dedicated creation wizard with three modes
- vNext now: src/app/(authenticated)/admin/projects/workspaces/new/page.tsx:38-45 class team creator; single create elsewhere
- Fix: Unify old one-workspace/team/cohort affordances and tab/radio controls.

## G2-8-028-001  [P2] GAP  facet F01  effort M
- Legacy: Old route /superadmin/projects/workspaces/new enters via Workspaces or Use this template query docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:31-35,68-75.
- vNext now: New /admin/projects/workspaces/new accepts UUID templateId but page back links /admin/projects src/app/(authenticated)/admin/projects/workspaces/new/page.tsx:12-17,36-44.
- Fix: Map old route and template numeric IDs to new canonical UUID, preserve template handoff.

## G2-8-028-013  [P2] GAP  facet F04  effort M
- Legacy: Old selectedCollegeId and organizationId numeric, forced from session into POST docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:31-34,230-237,298-307.
- vNext now: New collegeId UUID scoped server-side by selected adminScope src/app/(authenticated)/admin/projects/workspaces/new/page.tsx:15-23; src/modules/projects/class-team-workspace-service.ts:24-28.
- Fix: Map tenant/college scope and ensure stale role switch clears selections.

## G2-8-028-047  [P2] GAP  facet F13  effort M
- Legacy: Old missing college shows No college selected warning + skeleton while loading docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:329-347.
- vNext now: New EmptyState Select a college, error retry on denial/loading src/app/(authenticated)/admin/projects/workspaces/new/page.tsx:15-35.
- Fix: Match missing-scope alert and loading skeleton placement.

## G2-8-028-048  [P2] GAP  facet F13  effort M
- Legacy: Old failed template search shows warning within Template select, not empty dataset docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:77-85,443-455.
- vNext now: New whole-page ErrorState on assignment catalog failure src/app/(authenticated)/admin/projects/workspaces/new/page.tsx:18-35.
- Fix: Allow retry catalog without discarding already edited creator data.
