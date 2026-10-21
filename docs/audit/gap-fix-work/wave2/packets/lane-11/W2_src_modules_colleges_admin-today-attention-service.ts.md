# Work packet (wave 2): edit src/modules/colleges/admin-today-attention-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-dashboard.md

## G2-9-035-117  [P2] GAP  facet F20  effort S
- Legacy: Old when() uses dayjs format ddd D MMM, h:mm A `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:18-21`
- vNext now: New Today shows no per-row dates and IST dayBounds service `src/modules/colleges/admin-today-attention-service.ts:10-20`
- Fix: Render localized session deadlines in exact day/date/am-pm style.
