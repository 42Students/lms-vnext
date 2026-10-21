# Work packet (wave 2): edit src/modules/colleges/branding-service.ts

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l19-u025-public-tenant-controller.md, docs/audit/gap2/lane-2/l15-u020-college-branding.md, docs/audit/gap2/lane-5/l19-u025-public-tenant-controller.md, docs/audit/gap2/lane-9/superadmin-college-branding.md

## G2-19-025-008  [P2] GAP  facet F03  effort M
- Legacy: Legacy response includes logo, favicon, two backgrounds, two colours, signin methods, contacts, legal URLs; PublicTenantController.java:129-169
- vNext now: vNext branding getters have most fields, signin read from separate policy; branding-service.ts:20-31,96-108;public-signin-policy-service.ts:7-22
- Fix: Define explicit allowlist and field-by-field response mapping

## G2-19-025-011  [P2] GAP  facet F04  effort M
- Legacy: Legacy logo falls back College.logo unless nonempty branding override; PublicTenantController.java:129-146
- vNext now: vNext logoObjectPath with prefix check and branding URL; branding-service.ts:96-108
- Fix: Keep historic College.logo fallback if existing, validate signed logo path

## G2-19-025-031  [P2] GAP  facet F12  effort S
- Legacy: Legacy no branding row defaults to College.logo and EMAIL_PHONE; PublicTenantController.java:129-159
- vNext now: vNext getPublicCollegeBranding returns default branding and signin default both; branding-service.ts:20-31,96-108;public-signin-policy-service.ts:9-22
- Fix: Keep logo fallback, translate default method ordering

## G2-15-020-003  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:120-128 no college selected alert
- vNext now: src/modules/colleges/branding-service.ts:111-123 requires explicit selected valid collegeId
- Fix: Show same choose-college state before route read.

## G2-15-020-019  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/CollegeBrandingRepository.java:12-13 excludes isDeleted
- vNext now: src/modules/colleges/branding-service.ts:65-71 new lookup by college ID only
- Fix: Skip deleted branding records during migration.

## G2-15-020-037  [P2] GAP  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:99-109 old R2 image cleaned only after success
- vNext now: src/modules/colleges/branding-service.ts:150-175 record upsert/activity, no staleKeys cleanup
- Fix: GC previous storage keys post commit, not before.

## G2-15-020-040  [P2] GAP  facet F11  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicTenantController.java:43-74 resolve tenant from request host
- vNext now: src/modules/colleges/branding-service.ts:96-109 public read expects resolved collegeId
- Fix: Verify public host→college resolver and trusted host binding.

## G2-15-020-042  [P2] GAP  facet F11  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicTenantController.java:129-150 college logo fallback
- vNext now: src/modules/colleges/branding-service.ts:96-108 uploaded logoObjectPath fallback
- Fix: Compare legacy College.logo fallback priority.

## G2-15-020-048  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:120-128 missing college notice
- vNext now: src/modules/colleges/branding-service.ts:111-123 throws missing college instead
- Fix: Show prompt to select college.

## G2-15-020-050  [P2] GAP  facet F14  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:106-108 delete stale files after saved
- vNext now: src/modules/colleges/branding-service.ts:126-175 no cleanup workflow in branding upsert
- Fix: Define old object retention and cleanup.

## G2-15-020-065  [P2] GAP  facet F21  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:4-6 R2 image uploader and TenantAdminService
- vNext now: src/modules/colleges/branding-service.ts:5-8 activity and persisted permission writes
- Fix: Map storage backend and queued deletion.

## G2-19-025-049  [P2] GAP  facet F21  effort M
- Legacy: Legacy Spring services TenantResolution, AppSettings, repositories. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicTenantController.java:3-21`
- vNext now: vNext Next.js SSR tenant resolver and Drizzle branded rows. `src/modules/auth/request-tenant.ts:3-6`, `src/modules/colleges/branding-service.ts:3-9`
- Fix: Map bootstrap API consumers to SSR.

## G2-19-025-052  [P2] GAP  facet F22  effort M
- Legacy: Legacy CollegeBranding loginMethods stored with asset/contact/policy fields. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicTenantController.java:140-169`
- vNext now: vNext branding plus separate college_signin_policies. `src/modules/colleges/branding-service.ts:65-110`, `src/modules/colleges/public-signin-policy-service.ts:9-21`
- Fix: Migrate sign-in methods independently.

## G2-9-030-063  [P2] GAP  facet F21  effort L
- Legacy: R2 deletion and TenantAdmin branding API `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:4-7,97-109`
- vNext now: New logo API, versioned DB event `src/app/api/colleges/[collegeId]/branding/logo/route.ts:9-69` `src/modules/colleges/branding-service.ts:126-175`
- Fix: Map old R2 references to new storage
