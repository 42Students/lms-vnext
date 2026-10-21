# Work packet (wave 2): edit src/modules/module-access/admin-overview-metrics-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/superadmin-module-access.md

## G2-4-030-016  [P2] GAP  facet F04  effort M
- Legacy: Learner override count includes locks without explicit value (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:56-63`)
- vNext now: Counts membership rule rows, not separate lock-only legacy rows (`src/modules/module-access/admin-overview-metrics-service.ts:40-52`)
- Fix: Count override-or-lock students distinct, matching legacy filtered list.
