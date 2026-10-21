# Work packet (wave 2): edit src/modules/tenant-domains/dns-verifier.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/tenant-domain-entity.md

## G2-19-015-027  [P2] GAP  facet F10  effort M
- Legacy: Legacy check queries DNS default plus explicit 8.8.8.8 and 1.1.1.1 fallbacks `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java:115-135`
- vNext now: vNext Node resolveTxt system DNS only `src/modules/tenant-domains/dns-verifier.ts:1-3` `src/modules/tenant-domains/dns-verifier.ts:22-45`
- Fix: Test DNS reliability in GCP South India and add controlled fallback if needed.

## G2-19-015-035  [P2] GAP  facet F13  effort M
- Legacy: Legacy failed DNS stores NO_RECORD vs WRONG_VALUE, allows retry `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java:76-89` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java:102-106`
- vNext now: vNext API returns persisted `TXT_RECORD_MISSING` state, UI says DNS record not found yet `src/modules/tenant-domains/dns-verifier.ts:29-37` `src/components/admin/tenant-domain-manager.tsx:175-189`
- Fix: Differentiate missing vs wrong TXT copy and safe retry.

## G2-19-015-045  [P2] GAP  facet F19  effort M
- Legacy: Legacy verification DNS lookup can fallback to two public resolvers, 2s timeout and 1 retry `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java:115-149`
- vNext now: vNext Node DNS resolveTxt uses default resolver without explicit timeout in module `src/modules/tenant-domains/dns-verifier.ts:1-3` `src/modules/tenant-domains/dns-verifier.ts:22-45`
- Fix: Set bounded resolution time and observability for DNS outages.

## G2-19-015-049  [P2] GAP  facet F21  effort M
- Legacy: Legacy JNDI DNS TXT lookup with fallback public resolvers `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java:115-149`
- vNext now: vNext node:dns/promises resolveTxt and exact record `src/modules/tenant-domains/dns-verifier.ts:1-3` `src/modules/tenant-domains/dns-verifier.ts:22-45`
- Fix: Document resolver differences and GCP deployment testing.
