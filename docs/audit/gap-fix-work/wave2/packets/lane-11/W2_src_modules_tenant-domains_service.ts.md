# Work packet (wave 2): edit src/modules/tenant-domains/service.ts

19 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/tenant-domain-entity.md, docs/audit/gap2/lane-3/college-org-domain-workspace-scope.md, docs/audit/gap2/lane-5/u024-tenant-admin-controller.md

## G2-19-015-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy domain list fetched with collegeId and active soft-delete filter `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:139-146`
- vNext now: vNext listTenantDomains requires active college and privileged scope `src/modules/tenant-domains/service.ts:139-152`
- Fix: Map legacy selected college IDs to UUID and archive visibility.

## G2-19-015-015  [P2] GAP  facet F06  effort M
- Legacy: Legacy token nullable, ensureToken generates when absent even for formerly verified domain `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/TenantDomain.java:24-25` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java:32-54`
- vNext now: vNext new domain generates token on create; verify requires token for unverified `src/modules/tenant-domains/service.ts:155-183` `src/modules/tenant-domains/service.ts:208-220`
- Fix: Support migrated verified domains with null token; don't silently invalidate them.

## G2-19-015-016  [P2] GAP  facet F06  effort M
- Legacy: Legacy `lastCheckResult` one of NO_RECORD,WRONG_VALUE,TIMEOUT_OR_ERROR,VERIFIED `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/TenantDomain.java:36-38`
- vNext now: vNext enum VERIFIED,TXT_RECORD_MISSING,DNS_LOOKUP_FAILED `src/modules/tenant-domains/service.ts:33-40`
- Fix: Map all old outcomes without collapsing wrong value into no record unknowingly.

## G2-19-015-042  [P2] GAP  facet F18  effort M
- Legacy: Legacy diagnostic keys `NO_RECORD`, `WRONG_VALUE`, `TIMEOUT_OR_ERROR`, `VERIFIED` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/TenantDomain.java:36-38`
- vNext now: vNext keys `TXT_RECORD_MISSING`, `DNS_LOOKUP_FAILED`, `VERIFIED` `src/modules/tenant-domains/service.ts:33-40`
- Fix: Crosswalk exact support copy and imported history.

## G2-19-015-046  [P2] GAP  facet F20  effort M
- Legacy: Legacy ensureToken on legacy verified row preserves isVerified but issues missing token `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java:32-54`
- vNext now: vNext verified row verify returns immediately and does not issue token `src/modules/tenant-domains/service.ts:208-215`
- Fix: Plan retroactive token generation if revalidation/repointing is required.

## G2-3-032-007  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:139-146`
- vNext now: `src/modules/tenant-domains/service.ts:139-153`
- Fix: Legacy domain list from Super Admin Tenant Admin; vNext separated college web-address page/service with independent verification workflow.

## G2-3-032-032  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:139-146`
- vNext now: `src/modules/tenant-domains/service.ts:139-153`
- Fix: Legacy domains managed under Tenant Admin panels; vNext web address page and separate verification actions.

## G2-3-032-037  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java:58-99`
- vNext now: `src/modules/tenant-domains/service.ts:131-138`
- Fix: Legacy TXT verification supports _42lms-verify.host and host-level 42lms-verification token; vNext _lms-vnext.host / lms-vnext-verification token.

## G2-3-032-038  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:150-223`
- vNext now: `src/modules/tenant-domains/service.ts:139-153`
- Fix: Legacy onboarding readiness counts domains, primary, verified, branding logo; vNext tenant domain service supports list/verify and separate readiness summaries.

## G2-3-032-044  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java:58-89`
- vNext now: `src/modules/tenant-domains/service.ts:131-138`
- Fix: TXT verification challenge prefix migration requires DNS instructions, existing records are not interchangeable.

## G2-3-032-050  [P2] GAP  facet F14  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:139-146`
- vNext now: `src/modules/tenant-domains/service.ts:155-185`
- Fix: Legacy domain host added in college create or dedicated form; vNext dedicated domain creation and TXT verification, no import/export in switcher.

## G2-3-032-062  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantResolutionService.java:32-55`
- vNext now: `src/modules/tenant-domains/service.ts:139-185`
- Fix: Legacy tenant resolver exact host lookup database index, vNext same but verifications tracked separately, make sure request handling caches resolved tenant safely.

## G2-3-032-066  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java:58-155`
- vNext now: `src/modules/tenant-domains/service.ts:131-138`
- Fix: Legacy DNS ownership check uses configurable recursive resolver fallback, vNext DNS verifier adapter. Align timeouts/retries/log fields.

## G2-3-032-067  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantResolutionService.java:32-55`
- vNext now: `src/modules/tenant-domains/service.ts:73-74`
- Fix: Unknown hosts map no tenant in legacy; vNext verified host resolution via repository, deployment wildcard route/host normalization may differ.

## G2-3-032-075  [P2] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:184-223`
- vNext now: `src/modules/tenant-domains/service.ts:139-153`
- Fix: Legacy onboarding readiness launches within Tenant Admin; vNext web address/readiness split needs equivalent navigation.

## G2-5-024-006  [P2] GAP  facet F03  effort M
- Legacy: Legacy exposes token generation and DNS name/value. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:540-553`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java:32-55`
- vNext now: vNext creates token with domain, derives DNS instructions in client. `src/components/admin/tenant-domain-manager.tsx:31-37`, `src/modules/tenant-domains/service.ts:155-183`
- Fix: Expose existing-token creation semantics and correct copy-to-DNS UX.

## G2-5-024-029  [P2] GAP  facet F09  effort M
- Legacy: Legacy token-generation and DNS verify separate operations. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:540-566`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java:32-55`
- vNext now: vNext manager shows token created at initial insert and verify button. `src/components/admin/tenant-domain-manager.tsx:31-37`, `src/modules/tenant-domains/service.ts:196-224`
- Fix: Handle existing missing-token verified record without resetting verification.

## G2-5-024-060  [P2] GAP  facet F21  effort M
- Legacy: Legacy DNS TXT queries and optional public resolvers, plus wildcard DNS/TLS for managed. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java:57-90,115-122`
- vNext now: vNext DNS verifier and managed wildcard readiness gate. `src/modules/tenant-domains/service.ts:196-224`, `src/modules/tenant-domains/managed-subdomain-service.ts:16-19`
- Fix: Document resolver timeout/propagation, DNS challenge format and deployment dependencies.

## G2-19-015-041  [P3] GAP  facet F17  effort S
- Legacy: Legacy TXT record available for copy from verification token `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java:32-54`
- vNext now: vNext named dnsName/value helpers and UI copy `src/modules/tenant-domains/service.ts:131-136` `src/components/admin/tenant-domain-manager.tsx:31-36`
- Fix: Ensure copy instructions match currently accepted TXT protocol.
