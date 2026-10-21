# Work packet (wave 2): edit src/app/api/projects/[projectId]/resources/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/l15-u017-project-resource-audit.md

## G2-15-017-016  [P2] MISSING  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:149-160 pageSize 10, no size changer, total range sentence
- vNext now: src/app/api/projects/[projectId]/resources/route.ts:16-28 no audit pagination API
- Fix: Paginate 10 items and show N–N of N matching changes
