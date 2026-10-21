# Work packet: edit src/modules/auth/request-tenant.ts

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l19-u025-public-tenant-controller.md, docs/audit/gap2/lane-20/index.md, docs/audit/gap2/lane-5/l19-u025-public-tenant-controller.md

## G2-19-025-001  [P1] MISSING  facet F01  effort M
- Legacy: GET /api/v1/public/tenant-bootstrap anonymous bootstrap; controller/PublicTenantController.java:23-45; frontend/api/Services/TenantService.js:3-25
- vNext now: No equivalent public API in vNext /api/public tree; server resolver src/modules/auth/request-tenant.ts:38-105
- Fix: Decide mobile/backward compatibility, expose versioned public bootstrap if needed

## G2-19-025-002  [P1] GAP  facet F01  effort M
- Legacy: Legacy _app bootstraps once on page mount and redirects non-canonical alias; frontend/pages/_app.js:121-159
- vNext now: vNext SSR resolves Host but does not provide canonicalHost; src/app/page.tsx:94-108;src/modules/auth/request-tenant.ts:18-27
- Fix: Restore safe primary-verified canonical host redirect preserving path/search/hash

## G2-19-025-003  [P1] GAP  facet F01  effort M
- Legacy: Legacy GLOBAL dev host and global host entrypoint, college host otherwise; PublicTenantController.java:55-79
- vNext now: vNext getPlatformHosts then verified tenant/unknown/unavailable; request-tenant.ts:38-76
- Fix: Test exact local/apex/www/tenant host classification and unknown redirects

## G2-19-025-006  [P1] GAP  facet F03  effort M
- Legacy: Legacy TENANT JSON requestHost, tenantKey, collegeId, organizationId, collegeName; PublicTenantController.java:80-86
- vNext now: RequestTenant returns host/collegeId/organizationId, branding separately collegeName, no tenantKey; request-tenant.ts:18-27;branding-service.ts:96-106
- Fix: Document field contract and tenantKey adapter, never leak unverified host info

## G2-19-025-007  [P1] MISSING  facet F03  effort M
- Legacy: Legacy canonicalHost + shouldRedirectToCanonicalHost only for aliases; PublicTenantController.java:88-127
- vNext now: Absent from vNext RequestTenant; request-tenant.ts:18-27
- Fix: Compute preferred verified primary host and expose redirect flag safely

## G2-19-025-010  [P1] GAP  facet F04  effort L
- Legacy: Legacy TENANT mode, numeric collegeId/organizationId, unique tenantKey; PublicTenantController.java:80-86
- vNext now: vNext college UUID identifiers and kind college; request-tenant.ts:18-27
- Fix: Never cast UUID to legacy number; publish migration-safe compatibility contract

## G2-19-025-015  [P1] GAP  facet F05  effort M
- Legacy: Legacy canonical query ordered verified primary then any primary and sorted active fallback; TenantDomainRepository.java:21-28;PublicTenantController.java:93-119
- vNext now: vNext single host resolveVerifiedHost and no canonical-host selection in request-tenant.ts:18-27
- Fix: Add deterministic primary-verified canonical lookup with safe fallback

## G2-19-025-017  [P1] GAP  facet F06  effort M
- Legacy: Legacy host strips scheme, path, port, www and respects trusted-forwarded flag; RequestHostUtil.java:34-106
- vNext now: vNext Host-only, validate as hostname, distrust forwarded Host; request-tenant.ts:14-16,34-54
- Fix: Reconcile CDN/ingress Host canonicalization without enabling spoofed forwarded hosts

## G2-19-025-029  [P1] GAP  facet F12  effort M
- Legacy: Legacy precedence local/dev, globalHost, tenant, unknown; PublicTenantController.java:55-79
- vNext now: vNext platform-host set first, strict host parse, verified, then unknown; request-tenant.ts:38-70
- Fix: Define local/dev and www case normalization tests

## G2-19-025-030  [P1] MISSING  facet F12  effort M
- Legacy: Legacy canonical prefers verified primary then any primary then verified/any active; PublicTenantController.java:93-119
- vNext now: No canonical in vNext RequestTenant; request-tenant.ts:18-27
- Fix: Select verified primary only for safe canonical redirect

## G2-19-025-039  [P1] GAP  facet F18  effort M
- Legacy: Legacy GLOBAL/TENANT enum and tenantKey/loginMethods JSON keys; PublicTenantController.java:58-86,135-171
- vNext now: vNext platform/college and EMAIL_AND_PHONE enums; request-tenant.ts:18-27;public-signin-policy-service.ts:9-22
- Fix: Document explicit semantic mapping and mobile-client compatibility tests

## G2-19-025-041  [P1] GAP  facet F20  effort M
- Legacy: Legacy forwarded header trusted only by opt-in, strips CSV and port; RequestHostUtil.java:17-26,34-106
- vNext now: vNext only trust Host and reject malformed; request-tenant.ts:14-16,34-54
- Fix: Test spoofed Host, X-Forwarded-Host, IPv6, unicode/IDN, www aliases under actual ingress

## G2-19-025-048  [P1] MISSING  facet F23  effort M
- Legacy: Legacy canonicalHost/tenantKey public response, secondary colour, loginMethods; PublicTenantController.java:80-171
- vNext now: vNext server-only RequestTenant and split brand/policy without public endpoint; request-tenant.ts:18-27;src/app/page.tsx:94-113
- Fix: Decide backward-compatibility for public and mobile consumers; specify versioned endpoint if approved

## G2-20-006-002  [P1] GAP  facet F01  effort L
- Legacy: Legacy root uses hostname matching `emedha.jntukelearn.in` and `dgi.42lms.com` to choose JNTU/DGIPUC variants; `docs/legacy-source/frontend/src/pages/index.js:15-23,54-62`
- vNext now: Root tenant resolution only platform/verified college/unknown/unavailable, then shared LoginForm, no exact host variants; `src/app/page.tsx:94-114,156-177`, `src/modules/auth/request-tenant.ts:18-27,38-73`
- Fix: Map named college hosts to approved dedicated sign-in page treatments/flow or explicitly retire special handling; retain verified host security.

## G2-19-025-050  [P1] GAP  facet F22  effort M
- Legacy: Legacy College int identifiers, uniqueId, orgId returned in bootstrap. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicTenantController.java:81-87`
- vNext now: vNext UUID college/organization, no code. `src/modules/auth/request-tenant.ts:20-25`
- Fix: Define public-safe ID mapping where needed.

## G2-19-025-019  [P2] GAP  facet F07  effort M
- Legacy: Old frontend network failure TENANT_BOOTSTRAP_NETWORK_FAILED status0; frontend/api/Services/TenantService.js:3-24
- vNext now: vNext SSR unavailable on lookup error, no exposed client failure code; request-tenant.ts:55-76
- Fix: Add retry and clear outage vs invalid-host distinction for callers

## G2-19-025-022  [P2] MISSING  facet F08  effort M
- Legacy: Legacy browser alias redirect silent using sessionStorage loop TTL; frontend/pages/_app.js:121-159
- vNext now: vNext has no alias redirect in RequestTenant; request-tenant.ts:18-105
- Fix: Restore silent safe redirect with expiry/loop prevention
