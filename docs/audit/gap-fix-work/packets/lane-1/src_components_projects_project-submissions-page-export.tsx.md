# Work packet: edit src/components/projects/project-submissions-page-export.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/superadmin-projects-submissions.md

## G2-4-009-011  [P1] GAP  facet F03  effort M
- Legacy: `Export CSV` disabled if visible active tab filtered list has zero rows. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:705-760`)
- vNext now: New Export CSV only in ALL view and disabled if returned page empty. (`src/components/projects/project-admin-submissions-page.tsx:191-205;src/components/projects/project-submissions-page-export.tsx:18-34`)
- Fix: Enable CSV on Not submitted tab and exact disabled conditions.
