# Work packet (wave 3): edit src/modules/people/e2e-identity-directory.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/l15-u024-super-admin-e2e.md

## G2-15-024-025  [P1] MISSING  facet F22  effort L
- Legacy: Creates full organization/college/department/class/course/placement/project graph, reuses existing ID (E2eSeedService.java:170-309).
- vNext now: Drizzle schema supports related tables but no fixture seeder in src/app/api (src/db/schema/*; src/modules/people/e2e-identity-directory.ts:50-125).
- Fix: Provide table/foreign-key order and migration fixture pack.
