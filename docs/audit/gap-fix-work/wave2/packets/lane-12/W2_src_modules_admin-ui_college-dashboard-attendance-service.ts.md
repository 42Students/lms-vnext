# Work packet (wave 2): edit src/modules/admin-ui/college-dashboard-attendance-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-dashboard.md

## G2-9-005-069  [P2] GAP  facet F22  effort M
- Legacy: Backend dashboard payload attendancePending/risk/grading/unstaffed/gaps/due (`docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:124-139`)
- vNext now: VNext decomposes into distinct queries (`src/modules/admin-ui/college-dashboard-attendance-service.ts:8-42`)
- Fix: Reconcile DTO category mapping and null/failure semantics.
