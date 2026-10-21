# Work packet: edit src/modules/projects/admin-projects-query-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-projects-workspaces.md, docs/audit/gap2/lane-5/u028-superadmin-projects-section.md

## G2-10-028-018  [P1] GAP  facet F05  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:444-461 — default table and inline table pagination.
- vNext now: src/app/(authenticated)/admin/projects/page.tsx:158-162; src/modules/projects/admin-projects-query-model.ts:10-16 — rendered default cards, schema defaults table.
- Fix: Unify default table selection.

## G2-5-028-015  [P1] GAP  facet F04  effort M
- Legacy: Legacy status stored as arbitrary uppercase status and displayed as readable words. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:34-46`
- vNext now: vNext status enum PLANNED/ACTIVE/COMPLETED/ARCHIVED, labels from current enum. `src/modules/projects/admin-projects-query-model.ts:10-16`, `src/components/projects/project-admin-workspace-list.tsx:29-51`
- Fix: Translate legacy IN_PROGRESS/NOT_STARTED/BLOCKED/DONE to vNext states and preserve blockers.
