# Work packet: edit src/modules/admin-ui/admin-dashboard-navigation.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-dashboard.md

## G2-9-035-096  [P1] GAP  facet F05  effort M
- Legacy: Old Jobs and Hiring Dashboard route to distinct views via keys `docs/legacy-source/frontend/src/components/admin/dashboard/config.js:35-36`
- vNext now: New both map to /admin/placements `src/modules/admin-ui/admin-dashboard-navigation.ts:91-92`
- Fix: Map Hiring Dashboard to its own workspace, not Jobs landing.
