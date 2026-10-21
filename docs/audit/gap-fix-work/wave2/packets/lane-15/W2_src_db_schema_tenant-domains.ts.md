# Work packet (wave 2): edit src/db/schema/tenant-domains.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/tpo-mail-service.md, docs/audit/gap2/lane-19/tenant-domain-entity.md, docs/audit/gap2/lane-3/college-org-domain-workspace-scope.md

## G2-18-010-020  [P2] GAP  facet F05  effort S
- Legacy: Legacy tenant domains sorted verified then primary (`TpoMailService.java:137-144`).
- vNext now: New DB stores isPrimary/isVerified, no email-specific precedence (`tenant-domains.ts:22-41`; `recruiter-message-email-provider.ts:40-50`).
- Fix: Specify primary verified preference and deterministic host normalization.

## G2-18-010-068  [P2] GAP  facet F22  effort M
- Legacy: Legacy `tenant_domain` integer college_id, host/isVerified/isPrimary (`TenantDomain.java:10-33`).
- vNext now: New tenant_domains UUID college, normalized host unique lowercase, verified primary enforced (`tenant-domains.ts:15-41`).
- Fix: Map legacy integer college/domain to UUID and reconcile potentially unverified primary records.

## G2-19-015-009  [P2] MISSING  facet F04  effort M
- Legacy: Legacy last_checked_at/result/found_values fields `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/TenantDomain.java:33-43` `docs/legacy-source/backend/src/main/resources/db/migration/V117__tenant_domain_verification_diagnostics.sql:6-25`
- vNext now: vNext lastCheckedAt/result but no lastFoundValues in DB schema `src/db/schema/tenant-domains.ts:27-30`
- Fix: Document loss of raw discovered-values diagnostic before DB parity signoff.

## G2-3-032-045  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:184-213`
- vNext now: `src/db/schema/tenant-domains.ts:23-40`
- Fix: Legacy policy may permit unverified primary depending env and warns; vNext DB check requires isPrimary=>isVerified.

## G2-3-032-051  [P2] GAP  facet F14  effort M
- Legacy: `docs/legacy-source/backend/src/main/resources/db/migration/V59__tenant_domains_branding_settings.sql:18-42`
- vNext now: `src/db/schema/tenant-domains.ts:15-42`
- Fix: Legacy branding logo URL stored in college_branding, vNext object keys in college schema; verify authorized upload and public image URL conversion.
