# Work packet (wave 2): edit src/modules/colleges/admin-signin-policy-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-signin-methods.md

## G2-4-031-002  [P2] GAP  facet F01  effort M
- Legacy: GET `/api/v1/superadmin/tenant/branding/{id}` loads loginMethods (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:4,90-100`)
- vNext now: Read from dedicated sign-in policies rather than full branding (`src/modules/colleges/admin-signin-policy-service.ts:14-32`)
- Fix: Map old branding getter for legacy consumer with method translation.

## G2-4-031-015  [P2] GAP  facet F04  effort M
- Legacy: Load reads branding.loginMethods or defaults EMAIL_PHONE (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:100`)
- vNext now: Reads collegeSigninPolicies dedicated row or defaults in read-model (`src/modules/colleges/admin-signin-policy-service.ts:24-31`)
- Fix: Migrate branded method values and preserve missing-row default.

## G2-4-031-070  [P2] GAP  facet F21  effort M
- Legacy: Reuses TenantAdminService GET/PUT branding (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:4,97-120`)
- vNext now: Dedicated policy read/write service separate from branding (`src/modules/colleges/admin-signin-policy-service.ts:14-81`)
- Fix: Maintain compatibility alias while keeping dedicated policies.
