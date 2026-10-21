# Work packet (wave 2): edit src/app/(authenticated)/admin/projects/templates/[templateId]/tasks/loading.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-projects-template-tasks.md

## G2-10-029-041  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/tasks.js:43-73,107-109 — Skeleton 8 rows during template fetch; mounted guard.
- vNext now: src/components/projects/super-admin-template-subview-page.tsx:82-132,172-232 — server fetch and unavailable ErrorState; loading route exists src/app/(authenticated)/admin/projects/templates/[templateId]/tasks/loading.tsx:1-7.
- Fix: Align first-load skeleton height and retry behavior.
