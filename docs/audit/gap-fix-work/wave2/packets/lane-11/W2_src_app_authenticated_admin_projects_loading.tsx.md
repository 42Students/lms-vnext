# Work packet (wave 2): edit src/app/(authenticated)/admin/projects/loading.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-projects-workspaces.md

## G2-10-028-039  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:41-45,440-452 — Skeleton only initial; later table overlay retains rows.
- vNext now: src/app/(authenticated)/admin/projects/page.tsx:104-130; src/app/(authenticated)/admin/projects/loading.tsx:3-6 — SSR fallback/replacement.
- Fix: Keep previous rows on filter refetch.
