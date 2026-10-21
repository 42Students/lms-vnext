# Work packet: edit src/app/(authenticated)/admin/projects/templates/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u031-superadmin-projects-index.md, docs/audit/gap2/lane-6/superadmin-projects-templates-index.md

## G2-7-031-021  [P1] GAP  facet F11  effort M
- Legacy: superadmin/projects/index.js:10-15 templates first is Super Admin catalogue authoring not per-college workspace
- vNext now: admin/projects/page.tsx:37-49 selected college required to see workspaces; admin/projects/templates/page.tsx:26-47 global template permission
- Fix: Land on template catalogue to avoid bogus select-college state for Super Admin

## G2-6-029-030  [P2] GAP  facet F07  effort S
- Legacy: Legacy invalid status query falls back to unfiltered view without blocking UI (templates/index.js:63-70).
- vNext now: vNext parser rejects unknown status and renders Invalid template filters (super-admin-template-directory-model.ts:2-10,27-34; admin/projects/templates/page.tsx:31-35).
- Fix: Document strict-filter safety and add clear recovery preserving search.
