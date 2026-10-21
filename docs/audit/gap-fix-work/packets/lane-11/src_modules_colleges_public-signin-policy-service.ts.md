# Work packet: edit src/modules/colleges/public-signin-policy-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l19-u025-public-tenant-controller.md, docs/audit/gap2/lane-4/college-signin-methods.md

## G2-19-025-012  [P1] GAP  facet F04  effort M
- Legacy: Legacy loginMethods default EMAIL_PHONE, optionally PHONE_EMAIL, EMAIL_ONLY, PHONE_ONLY; CollegeBranding.java:38-50
- vNext now: vNext EMAIL_AND_PHONE policy separate from branding; public-signin-policy-service.ts:7-22
- Fix: Map mode, order, and disabled option into signin policy migration

## G2-19-025-039  [P1] GAP  facet F18  effort M
- Legacy: Legacy GLOBAL/TENANT enum and tenantKey/loginMethods JSON keys; PublicTenantController.java:58-86,135-171
- vNext now: vNext platform/college and EMAIL_AND_PHONE enums; request-tenant.ts:18-27;public-signin-policy-service.ts:9-22
- Fix: Document explicit semantic mapping and mobile-client compatibility tests

## G2-4-031-071  [P1] GAP  facet F21  effort S
- Legacy: Mobile auth consults branding login_methods at tenant host (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:425-447`)
- vNext now: New host-resolved sign-in policy service (`src/modules/colleges/public-signin-policy-service.ts:9-23`)
- Fix: Verify new auth handler uses effectiveCollegeSignInMethod for every OTP path.
