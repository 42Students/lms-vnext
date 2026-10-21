# Work packet: edit src/modules/colleges/branding-service.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l19-u025-public-tenant-controller.md, docs/audit/gap2/lane-5/u024-tenant-admin-controller.md, docs/audit/gap2/lane-9/superadmin-college-branding.md

## G2-19-025-006  [P1] GAP  facet F03  effort M
- Legacy: Legacy TENANT JSON requestHost, tenantKey, collegeId, organizationId, collegeName; PublicTenantController.java:80-86
- vNext now: RequestTenant returns host/collegeId/organizationId, branding separately collegeName, no tenantKey; request-tenant.ts:18-27;branding-service.ts:96-106
- Fix: Document field contract and tenantKey adapter, never leak unverified host info

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

## G2-9-030-065  [P1] GAP  facet F22  effort L
- Legacy: Old branding data only logoUrl `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:57-62`
- vNext now: Ten nullable fields plus version `src/modules/colleges/branding-service.ts:20-31,74-89`
- Fix: Document migration/default crosswalk

## G2-9-030-066  [P1] GAP  facet F22  effort L
- Legacy: Stale R2 keys under logoUrl `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:43-46,104-108`
- vNext now: New college.logoObjectPath and public logo route `src/modules/colleges/branding-service.ts:46-56,96-108`
- Fix: Migrate object path without broken references
