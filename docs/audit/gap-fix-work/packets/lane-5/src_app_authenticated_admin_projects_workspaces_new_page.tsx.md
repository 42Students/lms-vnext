# Work packet: edit src/app/(authenticated)/admin/projects/workspaces/new/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/super-admin-project-workspace-new.md

## G2-8-028-002  [P1] GAP  facet F01  effort M
- Legacy: Old page Back to workspaces pushes list after unsaved guard docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:353-366.
- vNext now: New PageBackLink goes /admin/projects, no guard in server route src/app/(authenticated)/admin/projects/workspaces/new/page.tsx:38-41.
- Fix: Intercept navigation from dirty workspace creator, show exact discard confirmation.
