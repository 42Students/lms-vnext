# Work packet (wave 2): edit src/modules/module-access/admin-student-rule-write.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/superadmin-module-access.md

## G2-4-030-043  [P2] GAP  facet F10  effort M
- Legacy: Clear lock calls setModuleAccess LEARNER enabled=null locked=false (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:337-346`)
- vNext now: INHERIT deletes membership rule; loses legacy lock-only row (`src/modules/module-access/admin-student-rule-write.ts:69-78`)
- Fix: Handle legacy imported orphan lock case explicitly.
