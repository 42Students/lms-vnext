# Work packet (wave 2): edit src/app/(authenticated)/college/projects/workspaces/[workspaceId]/[section]/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u012-college-admin-workspace-readiness.md

## G2-7-012-001  [P2] GAP  facet F01  effort M
- Legacy: readiness.js:14-27 page /college-admin/projects/workspaces/:slug/readiness with active Projects menu
- vNext now: workspaces/[workspaceId]/[section]/page.tsx:1-16 redirect to /college/projects/:id/readiness
- Fix: Preserve legacy route/bookmarks and from context
