# Work packet: edit src/modules/colleges/admin-signin-policy-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-signin-methods.md

## G2-4-031-037  [P1] GAP  facet F10  effort M
- Legacy: Fetch tenant branding by collegeId, coerces old enum (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:97-100`)
- vNext now: Reads separate college sign-in policies table (`src/modules/colleges/admin-signin-policy-service.ts:14-32`)
- Fix: Backfill/translate branding login_methods to new policy table.
