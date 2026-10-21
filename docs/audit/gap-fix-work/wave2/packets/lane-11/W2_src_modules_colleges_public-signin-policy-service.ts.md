# Work packet (wave 2): edit src/modules/colleges/public-signin-policy-service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l19-u025-public-tenant-controller.md, docs/audit/gap2/lane-4/college-signin-methods.md, docs/audit/gap2/lane-5/l19-u025-public-tenant-controller.md

## G2-19-025-008  [P2] GAP  facet F03  effort M
- Legacy: Legacy response includes logo, favicon, two backgrounds, two colours, signin methods, contacts, legal URLs; PublicTenantController.java:129-169
- vNext now: vNext branding getters have most fields, signin read from separate policy; branding-service.ts:20-31,96-108;public-signin-policy-service.ts:7-22
- Fix: Define explicit allowlist and field-by-field response mapping

## G2-19-025-031  [P2] GAP  facet F12  effort S
- Legacy: Legacy no branding row defaults to College.logo and EMAIL_PHONE; PublicTenantController.java:129-159
- vNext now: vNext getPublicCollegeBranding returns default branding and signin default both; branding-service.ts:20-31,96-108;public-signin-policy-service.ts:9-22
- Fix: Keep logo fallback, translate default method ordering

## G2-4-031-046  [P2] GAP  facet F12  effort S
- Legacy: Invalid old stored methods fall back EMAIL_PHONE (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:46-49`)
- vNext now: Invalid non-null row throws parse error (fail closed) (`src/modules/colleges/public-signin-policy-service.ts:14-18`)
- Fix: Owner decide fail-closed vs default; show admin invalid-policy repair path.

## G2-4-031-074  [P2] GAP  facet F22  effort M
- Legacy: Invalid legacy value falls back to default (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:46-49`)
- vNext now: Malformed stored value fails Zod parse (`src/modules/colleges/public-signin-policy-service.ts:16-18`)
- Fix: Handle corrupted legacy values safely during import.

## G2-19-025-052  [P2] GAP  facet F22  effort M
- Legacy: Legacy CollegeBranding loginMethods stored with asset/contact/policy fields. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicTenantController.java:140-169`
- vNext now: vNext branding plus separate college_signin_policies. `src/modules/colleges/branding-service.ts:65-110`, `src/modules/colleges/public-signin-policy-service.ts:9-21`
- Fix: Migrate sign-in methods independently.
