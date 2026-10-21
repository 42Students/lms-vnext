# Work packet: edit src/components/projects/super-admin-template-page-export.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/superadmin-projects-templates-index.md

## G2-6-029-056  [P1] GAP  facet F19  effort M
- Legacy: Legacy CSV exports whole currently fetched filtered list (templates/index.js:270-295).
- vNext now: vNext CSV receives only current paged data.items (admin/projects/templates/page.tsx:74-75; super-admin-template-page-export.tsx:5-9).
- Fix: Add server filtered export endpoint or clear current-page-only label and scope.
