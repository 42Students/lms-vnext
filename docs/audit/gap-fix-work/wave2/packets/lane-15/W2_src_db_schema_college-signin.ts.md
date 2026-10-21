# Work packet (wave 2): edit src/db/schema/college-signin.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-signin-methods.md

## G2-4-031-073  [P2] GAP  facet F22  effort M
- Legacy: MySQL V199 adds branding column idempotently (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:1-23`)
- vNext now: PG typed table with unique college PK and version index (`src/db/schema/college-signin.ts:9-26`)
- Fix: Verify Drizzle 0066 migrated, map old per-college setting and FK.
