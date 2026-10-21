# Work packet: edit src/app/(authenticated)/admin/projects/[projectId]/[section]/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l18-u028-superadmin-workspace-overview.md

## G2-18-028-001  [P1] GAP  facet F01  effort M
- Legacy: Legacy /superadmin/projects/workspaces/[workspaceId]/overview under college selection and named shell tabs; overview.js:31-37,107-151;SuperAdminWorkspaceShell.jsx:14-26
- vNext now: Canonical vNext /admin/projects/[projectId]/overview and Super Admin legacy-route redirect; src/app/(authenticated)/admin/projects/[projectId]/[section]/page.tsx:13-25;src/app/(authenticated)/superadmin/[...legacy]/page.tsx:10-20
- Fix: Confirm old deep-link route maps to overview, preserves from/college and does not 404
