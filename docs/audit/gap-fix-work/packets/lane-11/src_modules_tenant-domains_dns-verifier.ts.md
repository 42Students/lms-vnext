# Work packet: edit src/modules/tenant-domains/dns-verifier.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/tenant-domain-entity.md

## G2-19-015-025  [P1] GAP  facet F10  effort L
- Legacy: Legacy domain verify checks `_42lms-verify.<host>` or `<host>` with token/42lms-verification value `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java:58-85`
- vNext now: vNext verifies only `_lms-vnext.<host>` with exact `lms-vnext-verification=<token>` `src/modules/tenant-domains/service.ts:131-136` `src/modules/tenant-domains/dns-verifier.ts:22-31`
- Fix: Plan old TXT record compatibility during no-migration onboarding/host transfer.

## G2-19-015-019  [P2] GAP  facet F07  effort M
- Legacy: Legacy verification writes failure reason and values to row `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java:102-106`
- vNext now: vNext verifier returns summarized result only and repository persists lastCheckedAt/result `src/modules/tenant-domains/dns-verifier.ts:22-45` `src/modules/tenant-domains/repository.ts:222-239`
- Fix: Preserve distinct wrong TXT value state without exposing secrets.

## G2-19-015-021  [P2] GAP  facet F08  effort M
- Legacy: Legacy failure reasons NO_RECORD / WRONG_VALUE / TIMEOUT_OR_ERROR `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java:76-89`
- vNext now: vNext missing TXT and invalid value both map TXT_RECORD_MISSING `src/modules/tenant-domains/dns-verifier.ts:25-43`
- Fix: Distinguish mismatched value in diagnostics if required.
