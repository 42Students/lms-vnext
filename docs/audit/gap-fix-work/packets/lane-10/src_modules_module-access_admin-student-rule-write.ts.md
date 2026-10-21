# Work packet: edit src/modules/module-access/admin-student-rule-write.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/superadmin-module-access.md

## G2-4-030-031  [P2] GAP  facet F07  effort S
- Legacy: Mutation fallback Could not save — please retry (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:368-369`)
- vNext now: Throws STALE_RULE, ANCESTOR_LOCKED typed errors (`src/modules/module-access/admin-student-rule-write.ts:62-81`)
- Fix: Translate typed errors and show exact legacy fallback when unknown.

## G2-4-030-035  [P2] MISSING  facet F08  effort M
- Legacy: Legacy lock cleared toast (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:342-345`)
- vNext now: Membership rule writes require existing state; no explicit legacy lock clear handler in mapped editor (`src/modules/module-access/admin-student-rule-write.ts:62-81`)
- Fix: Provide safe recovery for imported locked=true with no explicit value.
