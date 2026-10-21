# Work packet: edit src/modules/tenant-domains/service.ts

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/tenant-domain-entity.md, docs/audit/gap2/lane-5/u024-tenant-admin-controller.md, docs/audit/gap2/lane-3/college-org-domain-workspace-scope.md

## G2-19-015-025  [P1] GAP  facet F10  effort L
- Legacy: Legacy domain verify checks `_42lms-verify.<host>` or `<host>` with token/42lms-verification value `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java:58-85`
- vNext now: vNext verifies only `_lms-vnext.<host>` with exact `lms-vnext-verification=<token>` `src/modules/tenant-domains/service.ts:131-136` `src/modules/tenant-domains/dns-verifier.ts:22-31`
- Fix: Plan old TXT record compatibility during no-migration onboarding/host transfer.

## G2-19-015-043  [P1] GAP  facet F18  effort M
- Legacy: Legacy TXT prefix `42lms-verification=` and `_42lms-verify` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java:58-85`
- vNext now: vNext literal `lms-vnext-verification=` and `_lms-vnext` `src/modules/tenant-domains/service.ts:131-136`
- Fix: Communicate DNS change clearly to customers with old records.

## G2-5-024-002  [P1] MISSING  facet F01  effort M
- Legacy: Global-only `GET /onboarding/resolve-preview?host` returns tenant, canonical host and redirect preview. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:273-313`
- vNext now: Setup journey has no resolve-preview action; runtime resolver is not a privileged diagnostic endpoint. `src/modules/colleges/admin-tenant-setup-journey.ts:2-12`, `src/modules/tenant-domains/service.ts:263-269`
- Fix: Implement read-only global-admin resolve preview without DNS fetch.

## G2-5-024-013  [P1] MISSING  facet F04  effort M
- Legacy: Legacy preview distinguishes TENANT vs TENANT_NOT_FOUND, canonicalHost nullable and shouldRedirect boolean. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:287-313`
- vNext now: vNext resolver returns tenant object or null with no diagnostic envelope. `src/modules/tenant-domains/service.ts:263-269`
- Fix: Expose global-only preview response fields.

## G2-5-024-036  [P1] GAP  facet F10  effort M
- Legacy: Legacy verify updates DNS diagnostics even for a previously verified domain. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:540-566`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java:62-107`
- vNext now: vNext returns existing verified domain without DNS recheck. `src/modules/tenant-domains/service.ts:196-224`
- Fix: Offer explicit recheck retaining verified status until deliberate revocation.

## G2-5-024-038  [P1] MISSING  facet F11  effort M
- Legacy: Legacy resolve preview global-only. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:273-282`
- vNext now: vNext has no global-guarded preview endpoint. `src/modules/colleges/admin-tenant-setup-journey.ts:2-12`, `src/modules/tenant-domains/service.ts:263-269`
- Fix: Expose only behind global-scope admin check.

## G2-5-024-040  [P1] GAP  facet F12  effort M
- Legacy: Legacy strict verification requirement dynamically comes from TenantResolutionService. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:183-214,243-265`
- vNext now: vNext enforces primary must be verified in DB always. `src/db/schema/tenant-domains.ts:32-41`, `src/modules/tenant-domains/service.ts:227-242`
- Fix: Approve hardening and ensure login resolution agrees with readiness.

## G2-5-024-042  [P1] GAP  facet F12  effort M
- Legacy: Legacy TXT names `_42lms-verify.<host>` or host root, accepted bare/42lms-verification token. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java:57-89`
- vNext now: vNext `_lms-vnext.<host>`, `lms-vnext-verification=token`. `src/modules/tenant-domains/service.ts:131-136`, `src/components/admin/tenant-domain-manager.tsx:31-37`
- Fix: Plan existing DNS-record transition before switching tenant ownership checks.

## G2-5-024-049  [P1] GAP  facet F15  effort M
- Legacy: Legacy every domain mutation logs TENANT_DOMAIN_CREATE/UPDATE/DELETE/TOKEN/VERIFY. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:425-565`
- vNext now: vNext managed subdomain writes activity; custom-domain service has no comparable in-service audit append. `src/modules/tenant-domains/service.ts:155-260`, `src/modules/tenant-domains/managed-subdomain-service.ts:89-94`
- Fix: Log actor + previous/current host and domain verification transition in activity events.

## G2-5-024-066  [P1] GAP  facet F23  effort M
- Legacy: Legacy allows host edit and optional unverified primary under relaxed policy. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:462-505`
- vNext now: vNext forbids both unsafe primary and custom host edit. `src/app/api/tenant-domains/[domainId]/route.ts:20-54`, `src/modules/tenant-domains/service.ts:227-242`
- Fix: Restore safe host edit; require owner signoff on always-verified primary.

## G2-3-032-028  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantResolutionService.java:32-55`
- vNext now: `src/modules/tenant-domains/service.ts:185-270`
- Fix: Legacy unknown/unverified domain silently resolves no tenant; vNext host normalization with verified host resolver. Match public error copy.

## G2-5-024-022  [P2] GAP  facet F07  effort M
- Legacy: Legacy 400 invalid host and 409 HOST_ALREADY_EXISTS/DOMAIN_NOT_VERIFIED. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:435-446,470-495`
- vNext now: vNext uses Zod host detail, HOST_CONFLICT and DOMAIN_NOT_VERIFIED. `src/modules/tenant-domains/validation.ts:4-61`, `src/modules/tenant-domains/service.ts:168-175,237-240`
- Fix: Keep exact duplicate/unverified guidance and prevention.

## G2-5-024-026  [P2] GAP  facet F08  effort M
- Legacy: Legacy verify returns `{ok,domain}` even if DNS mismatches. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:556-566`
- vNext now: vNext returns `{domain}`, with verification status in domain. `src/app/api/tenant-domains/[domainId]/verify/route.ts:15-38`, `src/modules/tenant-domains/service.ts:196-224`
- Fix: Show explicit success/failure and diagnostic reason.
