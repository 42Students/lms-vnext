# Work packet (wave 2): edit src/modules/tenant-domains/repository.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l19-u025-public-tenant-controller.md, docs/audit/gap2/lane-19/tenant-domain-entity.md

## G2-19-025-043  [P2] GAP  facet F21  effort M
- Legacy: Legacy depends on TenantResolutionService, DNS verification and AppSettingsService; TenantResolutionService.java:18-30
- vNext now: vNext tenant-domains/repository.ts and config platform hosts; request-tenant.ts:3-7
- Fix: Document how DNS verification, domain delete and cache invalidation reach login SSR

## G2-19-015-047  [P2] GAP  facet F20  effort M
- Legacy: Legacy last-found TXT strings help debug, truncated to500 `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java:109-112`
- vNext now: vNext stores result enum only; no raw values `src/modules/tenant-domains/repository.ts:222-239`
- Fix: Choose safe diagnostic artifact while avoiding secret exposure.
