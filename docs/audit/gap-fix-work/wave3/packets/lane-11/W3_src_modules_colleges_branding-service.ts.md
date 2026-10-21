# Work packet (wave 3): edit src/modules/colleges/branding-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/l15-u020-college-branding.md

## G2-15-020-016  [P1] MISSING  facet F04  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeBranding.java:38-50 login_methods four enum values, null→EMAIL_PHONE
- vNext now: src/db/schema/college-branding.ts:27-50 and src/modules/colleges/branding-service.ts:20-31 lack loginMethods
- Fix: Add tenant login mode in schema/service/auth or explicitly retire policy.

## G2-15-020-038  [P1] MISSING  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicTenantController.java:135-150 loginMethods populated into tenant bootstrap
- vNext now: src/modules/colleges/branding-service.ts:96-109 public branding only presentation fields
- Fix: Add effective sign-in mode to verified tenant bootstrap/auth policy.
