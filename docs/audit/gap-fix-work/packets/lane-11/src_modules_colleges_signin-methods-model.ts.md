# Work packet: edit src/modules/colleges/signin-methods-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-signin-methods.md

## G2-4-031-013  [P1] GAP  facet F04  effort M
- Legacy: Values EMAIL_PHONE/PHONE_EMAIL/EMAIL_ONLY/PHONE_ONLY (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:9-14`)
- vNext now: Values EMAIL_AND_PHONE/PHONE_AND_EMAIL/EMAIL_ONLY/PHONE_ONLY (`src/modules/colleges/signin-methods-model.ts:1-6`)
- Fix: Use explicit migration mapping for two renamed enum values.
