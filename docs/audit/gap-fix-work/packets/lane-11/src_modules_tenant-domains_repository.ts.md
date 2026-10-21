# Work packet: edit src/modules/tenant-domains/repository.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/tenant-domain-entity.md

## G2-19-015-012  [P1] GAP  facet F05  effort L
- Legacy: Legacy activeByCollege query excludes soft-deleted records `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:139-146` `docs/legacy-source/backend/src/main/resources/db/migration/V59__tenant_domains_branding_settings.sql:7-7`
- vNext now: vNext listByCollege includes all existing domains; delete is physical `src/modules/tenant-domains/repository.ts:112-134` `src/modules/tenant-domains/repository.ts:307-318`
- Fix: Migrate tombstoned domains without allowing accidental reuse before policy settled.

## G2-19-015-033  [P1] GAP  facet F12  effort L
- Legacy: Legacy tenant_domain has is_deleted soft tombstone inherited BaseModel `docs/legacy-source/backend/src/main/resources/db/migration/V59__tenant_domains_branding_settings.sql:3-8`
- vNext now: vNext physical DELETE in repo `src/modules/tenant-domains/repository.ts:307-318`
- Fix: Resolve domain takeover/tombstone retention and historical tenant links.

## G2-19-015-048  [P1] GAP  facet F21  effort L
- Legacy: Legacy JPA BaseModel soft-deletion and MySQL DATETIME `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/TenantDomain.java:10-13` `docs/legacy-source/backend/src/main/resources/db/migration/V59__tenant_domains_branding_settings.sql:3-8`
- vNext now: vNext PostgreSQL UUID/TIMESTAMPTZ and physical deletion `src/db/schema/tenant-domains.ts:15-31` `src/modules/tenant-domains/repository.ts:307-318`
- Fix: Write explicit migration and rollback rules for historical domains.

## G2-19-015-052  [P1] GAP  facet F22  effort L
- Legacy: Legacy `is_deleted` boolean/timestamps BaseModel fields `docs/legacy-source/backend/src/main/resources/db/migration/V59__tenant_domains_branding_settings.sql:3-8`
- vNext now: vNext no tombstone/is_deleted, hard-delete `src/db/schema/tenant-domains.ts:15-31` `src/modules/tenant-domains/repository.ts:307-318`
- Fix: Map archived/deleted domain ownership safely.

## G2-19-015-019  [P2] GAP  facet F07  effort M
- Legacy: Legacy verification writes failure reason and values to row `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java:102-106`
- vNext now: vNext verifier returns summarized result only and repository persists lastCheckedAt/result `src/modules/tenant-domains/dns-verifier.ts:22-45` `src/modules/tenant-domains/repository.ts:222-239`
- Fix: Preserve distinct wrong TXT value state without exposing secrets.
