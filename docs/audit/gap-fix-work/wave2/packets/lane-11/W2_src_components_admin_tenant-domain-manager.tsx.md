# Work packet (wave 2): edit src/components/admin/tenant-domain-manager.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/tenant-domain-entity.md, docs/audit/gap2/lane-5/u024-tenant-admin-controller.md

## G2-19-015-006  [P2] MISSING  facet F03  effort M
- Legacy: Legacy diagnostics `lastFoundValues` stores raw TXT values for debugging `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/TenantDomain.java:40-43` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java:92-112`
- vNext now: vNext manager row includes lastCheckResult/lastCheckedAt but not found TXT values `src/components/admin/tenant-domain-manager.tsx:20-28`
- Fix: Add bounded safely-sanitized discovered TXT summary field and UI, if security-approved.

## G2-19-015-035  [P2] GAP  facet F13  effort M
- Legacy: Legacy failed DNS stores NO_RECORD vs WRONG_VALUE, allows retry `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java:76-89` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java:102-106`
- vNext now: vNext API returns persisted `TXT_RECORD_MISSING` state, UI says DNS record not found yet `src/modules/tenant-domains/dns-verifier.ts:29-37` `src/components/admin/tenant-domain-manager.tsx:175-189`
- Fix: Differentiate missing vs wrong TXT copy and safe retry.

## G2-5-024-006  [P2] GAP  facet F03  effort M
- Legacy: Legacy exposes token generation and DNS name/value. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:540-553`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java:32-55`
- vNext now: vNext creates token with domain, derives DNS instructions in client. `src/components/admin/tenant-domain-manager.tsx:31-37`, `src/modules/tenant-domains/service.ts:155-183`
- Fix: Expose existing-token creation semantics and correct copy-to-DNS UX.

## G2-5-024-029  [P2] GAP  facet F09  effort M
- Legacy: Legacy token-generation and DNS verify separate operations. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:540-566`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java:32-55`
- vNext now: vNext manager shows token created at initial insert and verify button. `src/components/admin/tenant-domain-manager.tsx:31-37`, `src/modules/tenant-domains/service.ts:196-224`
- Fix: Handle existing missing-token verified record without resetting verification.

## G2-19-015-041  [P3] GAP  facet F17  effort S
- Legacy: Legacy TXT record available for copy from verification token `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java:32-54`
- vNext now: vNext named dnsName/value helpers and UI copy `src/modules/tenant-domains/service.ts:131-136` `src/components/admin/tenant-domain-manager.tsx:31-36`
- Fix: Ensure copy instructions match currently accepted TXT protocol.
