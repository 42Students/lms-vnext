# Work packet: edit src/db/schema/tenant-domains.ts

19 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l19-u025-public-tenant-controller.md, docs/audit/gap2/lane-18/tpo-mail-service.md, docs/audit/gap2/lane-19/tenant-domain-entity.md, docs/audit/gap2/lane-3/college-org-domain-workspace-scope.md, docs/audit/gap2/lane-5/u024-tenant-admin-controller.md

## G2-19-025-044  [P1] GAP  facet F22  effort L
- Legacy: Legacy tenant_domain soft delete, verification, last-found TXT values; TenantDomain.java:10-44;TenantDomainRepository.java:15-28
- vNext now: vNext uuid tenant_domains unique lower(host), partial primary constraint, no deleted marker or last-found values; src/db/schema/tenant-domains.ts:15-43
- Fix: Adopt explicit tombstone/diagnostic mapping and register migration before claiming parity

## G2-19-025-046  [P1] GAP  facet F22  effort L
- Legacy: Legacy IDs numeric and college.uniqueId tenantKey; PublicTenantController.java:80-86
- vNext now: vNext UUID FK IDs; src/db/schema/tenant-domains.ts:18-22
- Fix: Create explicit crosswalk only if legacy data migration required, do not infer numeric IDs

## G2-18-010-019  [P1] GAP  facet F05  effort M
- Legacy: Legacy domain lookup uses verified first then primary, but may choose unverified if no verified (`TpoMailService.java:133-153`).
- vNext now: New tenantDomains unique verified-primary constraint exists, digest supplies no URL (`tenant-domains.ts:15-41`; `recruiter-message-email-provider.ts:40-50`).
- Fix: Use verified college domain for outgoing links, then canonical public fallback; never send unverified host.

## G2-18-010-044  [P1] GAP  facet F12  effort M
- Legacy: Legacy `collegeLink()` picks unverified domain when none verified (`TpoMailService.java:133-149`).
- vNext now: New domain schema only enforces primary verified, no email URL fallback routine (`tenant-domains.ts:35-41`; `recruiter-message-email-provider.ts:40-50`).
- Fix: Only use verified domains and safe fallback public base; never trust attacker-controlled unverified DNS.

## G2-18-010-066  [P1] GAP  facet F21  effort L
- Legacy: Legacy integrates ZeptoMail, tenant-domain DB, Cloudflare replies via Worker (`TpoMailService.java:43-46,133-153,183-185`).
- vNext now: New ZeptoMail+OutboundFetch, HMAC authenticated inbound, tenant-domain schema but no recruiter URL helper (`recruiter-message-email-provider.ts:34-53`; `recruiter-message-email-inbound-service.ts:21-40`; `tenant-domains.ts:15-41`).
- Fix: Verify provider token/From DNS, Cloudflare HMAC webhook and tenant URL mapping.

## G2-19-015-003  [P1] GAP  facet F02  effort L
- Legacy: Legacy table one tenant_domain row, BaseModel for soft delete/timestamps `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/TenantDomain.java:10-13` `docs/legacy-source/backend/src/main/resources/db/migration/V59__tenant_domains_branding_settings.sql:3-15`
- vNext now: vNext tenant_domains row with UUID id/collegeId and explicit timestamps but no is_deleted `src/db/schema/tenant-domains.ts:15-31`
- Fix: Plan soft-deleted historical domain/tombstone migration and re-registration semantics.

## G2-19-015-008  [P1] GAP  facet F04  effort L
- Legacy: Legacy numeric college_id, host, is_primary, token, verified_at, is_verified `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/TenantDomain.java:15-31`
- vNext now: vNext UUID collegeId, host, isPrimary, verificationToken, verifiedAt, isVerified `src/db/schema/tenant-domains.ts:18-27`
- Fix: Map legacy numeric IDs and timestamps, preserve domain assignment.

## G2-19-015-010  [P1] GAP  facet F04  effort M
- Legacy: Legacy verified timestamp LocalDateTime without timezone `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/TenantDomain.java:27-28`
- vNext now: vNext TIMESTAMPTZ with UTC instant handling `src/db/schema/tenant-domains.ts:26-29`
- Fix: Convert legacy local times to IST/UTC carefully, avoid double offset.

## G2-19-015-018  [P1] GAP  facet F07  effort L
- Legacy: Legacy primary flag can exist unverified (DB permits) `docs/legacy-source/backend/src/main/resources/db/migration/V59__tenant_domains_branding_settings.sql:9-14` `docs/legacy-source/backend/src/main/resources/db/migration/V62__tenant_domain_verification.sql:32-38`
- vNext now: vNext check disallows primary if not verified `src/db/schema/tenant-domains.ts:38-40`
- Fix: Backfill verified/primary data before enforcing DB constraint.

## G2-19-015-048  [P1] GAP  facet F21  effort L
- Legacy: Legacy JPA BaseModel soft-deletion and MySQL DATETIME `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/TenantDomain.java:10-13` `docs/legacy-source/backend/src/main/resources/db/migration/V59__tenant_domains_branding_settings.sql:3-8`
- vNext now: vNext PostgreSQL UUID/TIMESTAMPTZ and physical deletion `src/db/schema/tenant-domains.ts:15-31` `src/modules/tenant-domains/repository.ts:307-318`
- Fix: Write explicit migration and rollback rules for historical domains.

## G2-19-015-050  [P1] MISSING  facet F22  effort M
- Legacy: Legacy tenant_domain `last_found_values` persisted by V117 `docs/legacy-source/backend/src/main/resources/db/migration/V117__tenant_domain_verification_diagnostics.sql:20-25`
- vNext now: vNext tenant_domains table lacks last_found_values `src/db/schema/tenant-domains.ts:15-31`
- Fix: Add mapped JSON/text diagnostic or officially defer with data loss flagged.

## G2-19-015-052  [P1] GAP  facet F22  effort L
- Legacy: Legacy `is_deleted` boolean/timestamps BaseModel fields `docs/legacy-source/backend/src/main/resources/db/migration/V59__tenant_domains_branding_settings.sql:3-8`
- vNext now: vNext no tombstone/is_deleted, hard-delete `src/db/schema/tenant-domains.ts:15-31` `src/modules/tenant-domains/repository.ts:307-318`
- Fix: Map archived/deleted domain ownership safely.

## G2-3-032-016  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/resources/db/migration/V59__tenant_domains_branding_settings.sql:3-16`
- vNext now: `src/db/schema/tenant-domains.ts:15-42`
- Fix: Legacy tenant_domain numeric id, host/college/primary boolean and soft-deleted status; vNext UUID host/verification constraints and derived active tenancy. Build ETL.

## G2-3-032-068  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/resources/db/migration/V59__tenant_domains_branding_settings.sql:3-56`
- vNext now: `src/db/schema/tenant-domains.ts:15-42`
- Fix: MySQL tenant_domain int FK/host primary flags and branding/settings vs PostgreSQL UUID, verified-primary check and diagnostics; map migrations.

## G2-5-024-010  [P1] GAP  facet F04  effort M
- Legacy: Legacy stores TXT lastFoundValues and lastCheckResult for diagnosis. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/TenantDomain.java:33-43`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java:92-107`
- vNext now: vNext schema has lastCheckResult but no lastFoundValues. `src/db/schema/tenant-domains.ts:15-31`, `src/components/admin/tenant-domain-manager.tsx:20-29`
- Fix: Persist bounded DNS found-value diagnostics, hide sensitive tokens.

## G2-5-024-040  [P1] GAP  facet F12  effort M
- Legacy: Legacy strict verification requirement dynamically comes from TenantResolutionService. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:183-214,243-265`
- vNext now: vNext enforces primary must be verified in DB always. `src/db/schema/tenant-domains.ts:32-41`, `src/modules/tenant-domains/service.ts:227-242`
- Fix: Approve hardening and ensure login resolution agrees with readiness.

## G2-5-024-058  [P1] GAP  facet F20  effort M
- Legacy: Legacy soft delete mutates stored host with tombstone to free original. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:507-538`
- vNext now: vNext lacks isDeleted and deletes domain row. `src/db/schema/tenant-domains.ts:15-31`, `src/app/api/tenant-domains/[domainId]/route.ts:56-78`
- Fix: Preserve deletion history/tombstone in separate immutable event.

## G2-5-024-062  [P1] GAP  facet F22  effort M
- Legacy: Legacy tenant_domain int IDs, lastFoundValues and soft-delete via BaseModel. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/TenantDomain.java:10-43`
- vNext now: vNext tenant_domains UUID, lower-host unique, single primary and no lastFoundValues/isDeleted. `src/db/schema/tenant-domains.ts:15-43`
- Fix: Plan lossless data migration/diagnostic history mapping.

## G2-19-015-017  [P2] MISSING  facet F07  effort M
- Legacy: Legacy diagnostics `last_found_values` varchar512 (truncated to500) `docs/legacy-source/backend/src/main/resources/db/migration/V117__tenant_domain_verification_diagnostics.sql:20-25` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java:109-112`
- vNext now: vNext model no raw TXT diagnostic field `src/db/schema/tenant-domains.ts:15-31`
- Fix: Decide privacy-safe equivalent diagnostic or record intentional omission.
