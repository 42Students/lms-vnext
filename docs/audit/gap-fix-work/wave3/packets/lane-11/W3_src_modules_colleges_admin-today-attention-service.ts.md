# Work packet (wave 3): edit src/modules/colleges/admin-today-attention-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-dashboard.md, docs/audit/gap2/lane-9/superadmin-dashboard.md

## G2-10-005-041  [P1] MISSING  facet F12  effort L
- Legacy: Old threshold supplied attendanceThreshold with fallback75 percent `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:113-122`
- vNext now: New aggregate service has no attendanceThreshold or last30 risk count `src/modules/colleges/admin-today-attention-service.ts:21-56`
- Fix: Implement threshold from college settings and last30-days attendance risk

## G2-9-035-041  [P1] MISSING  facet F12  effort L
- Legacy: Old threshold supplied attendanceThreshold with fallback75 percent `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:113-122`
- vNext now: New aggregate service has no attendanceThreshold or last30 risk count `src/modules/colleges/admin-today-attention-service.ts:21-56`
- Fix: Implement threshold from college settings and last30-days attendance risk
