# Work packet (wave 2): edit src/modules/auth/request-tenant.ts

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l19-u025-public-tenant-controller.md, docs/audit/gap2/lane-20/index.md, docs/audit/gap2/lane-5/l19-u025-public-tenant-controller.md, docs/audit/gap2/lane-4/public-placements-page-controller.md

## G2-19-025-009  [P2] MISSING  facet F04  effort S
- Legacy: Legacy GLOBAL exactly mode GLOBAL, globalHost, baseDomain; PublicTenantController.java:55-72
- vNext now: vNext kind platform, host only; request-tenant.ts:18-27
- Fix: Version globalHost/baseDomain public response for legacy consumers

## G2-19-025-025  [P2] GAP  facet F10  effort M
- Legacy: Legacy globalHost read from AppSettingsService DB/property fallback; AppSettingsService.java:45-60
- vNext now: vNext getPlatformHosts config; request-tenant.ts:6,46-49;auth/config.ts:18-60
- Fix: Align configured dev/apex/wildcard platform entrypoints

## G2-19-025-043  [P2] GAP  facet F21  effort M
- Legacy: Legacy depends on TenantResolutionService, DNS verification and AppSettingsService; TenantResolutionService.java:18-30
- vNext now: vNext tenant-domains/repository.ts and config platform hosts; request-tenant.ts:3-7
- Fix: Document how DNS verification, domain delete and cache invalidation reach login SSR

## G2-20-006-038  [P2] GAP  facet F10  effort S
- Legacy: Root useEffect mutates Redux currOrg based on literal hostname; `docs/legacy-source/frontend/src/pages/index.js:15-23`
- vNext now: Server tenant resolver maps verified host to collegeId via repo and DB with 15s cache; `src/modules/auth/request-tenant.ts:29-32,38-99`
- Fix: Preserve host-to-college mapping semantics and test transitional domains; avoid unverified hostname spoofing.

## G2-20-006-042  [P2] GAP  facet F11  effort S
- Legacy: Legacy host-specific routing based on window.location.hostname literals; `docs/legacy-source/frontend/src/pages/index.js:15-23`
- vNext now: New host verified against platform list/tenant-domain repo; `src/modules/auth/request-tenant.ts:38-73`
- Fix: Document exact legacy hostname behavior vs tenant onboarding; require verified college context and strict host validation.

## G2-20-006-063  [P2] GAP  facet F19  effort S
- Legacy: Default legacy renders sign-in immediately; tenant bootstrap async; `docs/legacy-source/frontend/src/loginPages/Login.js:96-98,283-302`
- vNext now: New server awaits host validation, DB domain lookup with 15s TTL and college branding; `src/app/page.tsx:94-115`, `src/modules/auth/request-tenant.ts:29-32,55-99`
- Fix: Cache public branding/policy carefully, use nonblocking fallback for transient DB outage.

## G2-20-006-069  [P2] GAP  facet F22  effort S
- Legacy: Legacy root stores currOrg in Redux and local user session; `docs/legacy-source/frontend/src/pages/index.js:15-23`, `docs/legacy-source/frontend/src/loginPages/Login.js:946-971`
- vNext now: New server request context and tenant domain repo identity, optional college branding DB; `src/app/page.tsx:20-27,94-114`, `src/modules/auth/request-tenant.ts:3-7,55-73`
- Fix: Document model migration to server verified tenant/membership data; preserve identity security, don't port Redux localStorage as authority.

## G2-19-025-049  [P2] GAP  facet F21  effort M
- Legacy: Legacy Spring services TenantResolution, AppSettings, repositories. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicTenantController.java:3-21`
- vNext now: vNext Next.js SSR tenant resolver and Drizzle branded rows. `src/modules/auth/request-tenant.ts:3-6`, `src/modules/colleges/branding-service.ts:3-9`
- Fix: Map bootstrap API consumers to SSR.

## G2-19-025-055  [P2] GAP  facet F23  effort M
- Legacy: Legacy emits redirect flag for alias. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicTenantController.java:88-127`
- vNext now: vNext stricter verified domains but omits canonical redirect. `src/modules/auth/request-tenant.ts:18-27`
- Fix: Confirm product policy on alias redirect.

## G2-4-026-050  [P3] GAP  facet F11  effort S
- Legacy: Custom host verified-by-default with optional dev relaxation (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantResolutionService.java:42-55,75-85`)
- vNext now: Only verified host, no X-Forwarded-Host (`src/modules/auth/request-tenant.ts:9-16,38-73`)
- Fix: Retain stronger host trust policy; document removal of dev relax.
