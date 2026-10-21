# Work packet (wave 2): edit src/app/api/people/[membershipId]/roles/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/role.md

## G2-13-016-035  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/config/roles.js:24-32` 'Admin' role displayed 'College Admin'
- vNext now: `src/modules/identity/constants.ts:21` COLLEGE_ADMIN backend enum; `src/app/api/people/[membershipId]/roles/route.ts:48` returns bare role values
- Fix: Keep existing 'College Admin' display in app shell and people roles, not machine enum
