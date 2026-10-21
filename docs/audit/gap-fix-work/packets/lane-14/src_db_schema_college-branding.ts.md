# Work packet: edit src/db/schema/college-branding.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l19-u025-public-tenant-controller.md, docs/audit/gap2/lane-2/l15-u020-college-branding.md, docs/audit/gap2/lane-5/u024-tenant-admin-controller.md

## G2-19-025-045  [P1] GAP  facet F22  effort M
- Legacy: Legacy CollegeBranding includes login_methods plus ten image/colour/contact fields; CollegeBranding.java:15-63
- vNext now: vNext versioned college_branding excludes loginMethods; separate signin policy; src/db/schema/college-branding.ts:27-50
- Fix: Migrate/login-method enum and defaults; preserve branding uniqueness+validation

## G2-15-020-028  [P1] MISSING  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeBranding.java:47-50 invalid mode falls back EMAIL_PHONE
- vNext now: src/db/schema/college-branding.ts:27-50 no mode field
- Fix: Fail safely to default login selection for malformed setting.

## G2-15-020-067  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:23-37 is_deleted,int ID
- vNext now: src/db/schema/college-branding.ts:27-49 no is_deleted and UUID college PK
- Fix: Migrate only active legacy data and historical audit.

## G2-5-024-011  [P1] GAP  facet F04  effort M
- Legacy: Legacy persists login_methods, default EMAIL_PHONE, four enumerated options. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeBranding.java:38-50`
- vNext now: vNext branding omits loginMethods and has no effective equivalent in branding. `src/db/schema/college-branding.ts:27-50`, `src/modules/colleges/branding-service.ts:20-31`
- Fix: Port effective sign-in method setting via auth owner and cover default.

## G2-5-024-018  [P1] GAP  facet F06  effort M
- Legacy: Legacy partial branding update merges only non-null fields including loginMethods. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:582-610,793-804`
- vNext now: vNext whole versioned input, no loginMethods. `src/modules/colleges/branding-service.ts:126-162`, `src/db/schema/college-branding.ts:33-43`
- Fix: Align partial semantics and port sign-in method persistence.

## G2-5-024-023  [P1] GAP  facet F07  effort M
- Legacy: Legacy rejects unknown sign-in methods with precise message. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:588-595`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeBranding.java:38-50`
- vNext now: vNext branding has no sign-in-method validation. `src/db/schema/college-branding.ts:27-50`, `src/modules/colleges/branding-service.ts:126-137`
- Fix: Validate four sign-in methods in proper auth settings contract.

## G2-5-024-063  [P1] GAP  facet F22  effort M
- Legacy: Legacy college_branding int pk/college id, login_methods, nullable presentation fields. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeBranding.java:10-62`
- vNext now: vNext collegeId UUID primary, version/CAS, HTTPS and hex checks, no loginMethods. `src/db/schema/college-branding.ts:27-75`
- Fix: Map sign-in and remediate invalid legacy URLs/colours.
