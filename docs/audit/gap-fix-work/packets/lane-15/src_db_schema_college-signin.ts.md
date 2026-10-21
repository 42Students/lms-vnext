# Work packet: edit src/db/schema/college-signin.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-signin-methods.md

## G2-4-031-072  [P1] GAP  facet F22  effort L
- Legacy: `college_branding.login_methods` nullable, enums EMAIL_PHONE etc (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:38-49`)
- vNext now: Separate college_signin_policies, not nullable and versioned, renamed enum (`src/db/schema/college-signin.ts:9-26`)
- Fix: Provide SQL backfill and mapping; preserve null default.
