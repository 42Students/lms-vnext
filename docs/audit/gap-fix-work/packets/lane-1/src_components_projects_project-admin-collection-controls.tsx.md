# Work packet: edit src/components/projects/project-admin-collection-controls.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-projects-workspaces.md, docs/audit/gap2/lane-7/u019-college-admin-project-workspaces-list.md

## G2-10-028-020  [P1] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:388-398 — status choices Active/In progress/Ready/Blocked/Archived.
- vNext now: src/components/projects/project-admin-collection-controls.tsx:30-35,87-100 — Planned/Active/Completed/Archived.
- Fix: Provide exact legacy options.

## G2-7-019-027  [P1] GAP  facet F05  effort S
- Legacy: workspaces/index.js:373-385 filter values ACTIVE/IN_PROGRESS/READY/BLOCKED/ARCHIVED
- vNext now: project-admin-collection-controls.tsx:13-17,30-35 PLANNED/ACTIVE/COMPLETED/ARCHIVED
- Fix: Map all five legacy labels to queryable statuses, including Blocked vs risk, without misleading filtering.
