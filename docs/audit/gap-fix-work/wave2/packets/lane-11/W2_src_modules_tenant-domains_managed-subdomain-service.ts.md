# Work packet (wave 2): edit src/modules/tenant-domains/managed-subdomain-service.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u024-tenant-admin-controller.md, docs/audit/gap2/lane-9/superadmin-college-subdomain.md

## G2-5-024-007  [P2] GAP  facet F03  effort M
- Legacy: Legacy managed subdomain control displays base domain/current host and Allot or Remove. `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:6-24`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:325-396`
- vNext now: vNext managed section is environment-gated and displays ready status. `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx:32-40`, `src/modules/tenant-domains/managed-subdomain-service.ts:30-38`
- Fix: Show same visible address fields and actionable env readiness help.

## G2-5-024-012  [P2] GAP  facet F04  effort M
- Legacy: Legacy subdomain returns baseDomain, host, subdomain label. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:325-335`
- vNext now: vNext returns ready/baseDomain/currentHost, not subdomain label. `src/modules/tenant-domains/managed-subdomain-service.ts:30-38`
- Fix: Return or derive label with clear safety-status field.

## G2-5-024-043  [P2] GAP  facet F12  effort S
- Legacy: Legacy same-host PUT idempotent and remove missing returns ok. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:365-396`
- vNext now: vNext strict action state/CAS returns errors on already-applied retry. `src/modules/tenant-domains/managed-subdomain-service.ts:52-56`
- Fix: Keep safety CAS but idempotently recognize successful retries.

## G2-5-024-060  [P2] GAP  facet F21  effort M
- Legacy: Legacy DNS TXT queries and optional public resolvers, plus wildcard DNS/TLS for managed. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java:57-90,115-122`
- vNext now: vNext DNS verifier and managed wildcard readiness gate. `src/modules/tenant-domains/service.ts:196-224`, `src/modules/tenant-domains/managed-subdomain-service.ts:16-19`
- Fix: Document resolver timeout/propagation, DNS challenge format and deployment dependencies.

## G2-9-031-013  [P2] GAP  facet F04  effort S
- Legacy: Backend returns baseDomain, host, subdomain `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:34-40`
- vNext now: New managed read returns ready, baseDomain,currentHost `src/modules/tenant-domains/managed-subdomain-service.ts:30-37`
- Fix: Map old response shape with readiness state.

## G2-9-031-039  [P2] GAP  facet F10  effort M
- Legacy: DELETE removes subdomain and reload state `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:105-108`
- vNext now: POST action REMOVE deletes tenantDomains row `src/modules/tenant-domains/managed-subdomain-service.ts:86-96`
- Fix: Validate primary host fallback and service redirects.

## G2-9-031-037  [P3] GAP  facet F10  effort S
- Legacy: GET response baseDomain,host,subdomain `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:34-40`
- vNext now: GET response ready,baseDomain,currentHost `src/modules/tenant-domains/managed-subdomain-service.ts:30-37`
- Fix: Document DTO name changes.
