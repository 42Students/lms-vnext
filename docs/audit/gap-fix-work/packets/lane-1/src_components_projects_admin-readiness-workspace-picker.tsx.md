# Work packet: edit src/components/projects/admin-readiness-workspace-picker.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u004-college-admin-projects-readiness.md

## G2-7-004-020  [P1] GAP  facet F05  effort M
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:490-512: workspace choices server-paged at 25; shows `a–b of N`.
- vNext now: V/modules/projects/college-readiness-releases-service.ts:18-24: first 1000 choices; components/projects/admin-readiness-workspace-picker.tsx:20-55: client 25 radio-pagination.
- Fix: Implement full backend-paginated search with accurate totals over >1000 workspaces.
