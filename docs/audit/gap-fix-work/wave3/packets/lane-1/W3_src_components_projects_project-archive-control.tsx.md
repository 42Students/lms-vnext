# Work packet (wave 3): edit src/components/projects/project-archive-control.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-projects-workspaces.md

## G2-10-028-059  [P1] MISSING  facet F23  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:352-360 — Deleted workspaces destination.
- vNext now: src/app/(authenticated)/admin/projects/page.tsx:146-151; src/components/projects/project-archive-control.tsx:81-105 — no Deleted header link; archived Restore extra.
- Fix: Add separate deleted listing and distinguish archive vs delete.
