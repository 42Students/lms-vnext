# Work packet (wave 2): edit src/modules/admin-ui/college-dashboard-cards-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-dashboard.md

## G2-9-005-036  [P2] GAP  facet F10  effort M
- Legacy: GET college summary / dashboard data from Java (`docs/legacy-source/frontend/src/api/Services/AdminService.js:1-1250`)
- vNext now: SQL card projection from setup checklist (`src/modules/admin-ui/college-dashboard-cards-service.ts:1-20`)
- Fix: Reconcile counts/active filters and net-new query schemas.

## G2-9-005-066  [P2] GAP  facet F21  effort M
- Legacy: Backend summary and dashboard service receives collegeId (`docs/legacy-source/frontend/src/api/Services/AdminService.js:1-1200`)
- vNext now: DB setup checklist projection and independent read services (`src/modules/admin-ui/college-dashboard-cards-service.ts:9-20`)
- Fix: Compare active-membership and current-term thresholds.
