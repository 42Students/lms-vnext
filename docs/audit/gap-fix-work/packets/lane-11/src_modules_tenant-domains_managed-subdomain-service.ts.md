# Work packet: edit src/modules/tenant-domains/managed-subdomain-service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u024-tenant-admin-controller.md, docs/audit/gap2/lane-9/superadmin-college-subdomain.md

## G2-5-024-033  [P1] GAP  facet F10  effort M
- Legacy: Legacy managed change soft-retires old host; remove soft-deletes it. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:343-396,408-423`
- vNext now: vNext managed change updates host in place and REMOVE hard-deletes. `src/modules/tenant-domains/managed-subdomain-service.ts:45-94`
- Fix: Preserve old host/tombstone history across rename/removal.

## G2-5-024-049  [P1] GAP  facet F15  effort M
- Legacy: Legacy every domain mutation logs TENANT_DOMAIN_CREATE/UPDATE/DELETE/TOKEN/VERIFY. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:425-565`
- vNext now: vNext managed subdomain writes activity; custom-domain service has no comparable in-service audit append. `src/modules/tenant-domains/service.ts:155-260`, `src/modules/tenant-domains/managed-subdomain-service.ts:89-94`
- Fix: Log actor + previous/current host and domain verification transition in activity events.

## G2-9-031-063  [P1] GAP  facet F22  effort L
- Legacy: Legacy single college-to-subdomain assignment with no ownership check platform domain `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:6-9`
- vNext now: New tenantDomains multiple host rows, isPrimary,isVerified, verification metadata and action event `src/modules/tenant-domains/managed-subdomain-service.ts:49-95`
- Fix: Document tenant-domain schema migration and primary/managed record uniqueness.

## G2-5-024-021  [P2] GAP  facet F07  effort M
- Legacy: Legacy invalid/reserved/taken subdomain returns 400/409 with exact code and help sentence. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:350-363`
- vNext now: vNext validation and conflict codes differ (SUBDOMAIN_CONFLICT, HOST_CONFLICT). `src/modules/tenant-domains/managed-subdomain-model.ts:5-13`, `src/modules/tenant-domains/managed-subdomain-service.ts:52-61`
- Fix: Map clear actionable messages to each field failure.

## G2-5-024-027  [P3] GAP  facet F08  effort S
- Legacy: Legacy delete returns `{ok:true}` even missing managed address. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:386-396,507-538`
- vNext now: vNext deletes custom `{deleted:true}` and managed REMOVE requires present record. `src/app/api/tenant-domains/[domainId]/route.ts:56-78`, `src/modules/tenant-domains/managed-subdomain-service.ts:52-55`
- Fix: Map repeat/remove action receipts and user copy.
