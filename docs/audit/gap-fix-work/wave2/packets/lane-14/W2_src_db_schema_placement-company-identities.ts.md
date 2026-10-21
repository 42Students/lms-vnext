# Work packet (wave 2): edit src/db/schema/placement-company-identities.ts

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/company-domain.md, docs/audit/gap2/lane-9/superadmin-company-curation.md

## G2-12-020-001  [P2] GAP  facet F01  effort M
- Legacy: One company can have multiple domains; company_domain globally unique by domain `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:14-35`
- vNext now: New placementCompanyDomains child with global lower(domain) unique; primaryDomain duplicated on company `src/db/schema/placement-company-identities.ts:6-15` `src/db/schema/placements.ts:23-32`
- Fix: Keep child/global primary-domain synchronization and explicit source of truth.

## G2-12-020-006  [P2] GAP  facet F03  effort M
- Legacy: Legacy domain record has addedByUserType and addedByCollegeId `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:37-44`
- vNext now: New addedByUserId only; no role/college snapshots `src/db/schema/placement-company-identities.ts:6-11`
- Fix: Capture actor role and source college for audit provenance.

## G2-12-020-007  [P2] GAP  facet F04  effort M
- Legacy: Old domain PK Long, companyId int `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:24-29`
- vNext now: New UUID id and companyId FK UUID `src/db/schema/placement-company-identities.ts:6-9`
- Fix: Map legacy IDs and company parent relation.

## G2-12-020-010  [P2] GAP  facet F04  effort M
- Legacy: Old addedByUserId nullable int `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:37-38`
- vNext now: New addedByUserId required UUID FK `src/db/schema/placement-company-identities.ts:10`
- Fix: Backfill system/unknown audit authors without fabricating actor.

## G2-12-020-011  [P2] GAP  facet F04  effort M
- Legacy: Old addedByUserType length20 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:40-41`
- vNext now: New none; global acting roles inferred from activity log but no row snapshot `src/db/schema/placement-company-identities.ts:6-11` `src/modules/placements/super-admin-company-identities-service.ts:54-59`
- Fix: Store actor type at insert for immutable audit.

## G2-12-020-012  [P2] GAP  facet F04  effort M
- Legacy: Old addedByCollegeId nullable int `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:43-44`
- vNext now: New no per-domain collegeId, company global; action scoped global admin `src/db/schema/placement-company-identities.ts:6-11` `src/modules/placements/super-admin-company-identities-service.ts:15-19`
- Fix: Preserve provenance college without making domain tenant-owned.

## G2-12-020-014  [P2] GAP  facet F05  effort S
- Legacy: Old get company domains ordered id ASC and global findByDomain `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/CompanyDomainRepository.java:16-21`
- vNext now: New lower(domain) unique, service list existing current no order `src/db/schema/placement-company-identities.ts:13-15` `src/modules/placements/super-admin-company-identities-service.ts:32-34`
- Fix: Define deterministic domain ordering.

## G2-12-020-015  [P2] GAP  facet F05  effort M
- Legacy: Legacy company domain findByCompanyIds efficient bulk call `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/CompanyDomainRepository.java:20-21`
- vNext now: New company identities child table indexed companyId but shown service fetches one company per mutation `src/db/schema/placement-company-identities.ts:14-15` `src/modules/placements/super-admin-company-identities-service.ts:32-34`
- Fix: Provide bulk child domain lookup for company directory.

## G2-12-020-045  [P2] GAP  facet F18  effort S
- Legacy: Legacy domain verification attribute named verifiedBy42 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:34-35`
- vNext now: New company-wide verifiedAt used, no row verification badge `src/db/schema/placements.ts:35-37` `src/db/schema/placement-company-identities.ts:6-15`
- Fix: Restore per-domain 'Verified by 42' badge copy/status.

## G2-9-034-116  [P2] GAP  facet F22  effort M
- Legacy: Legacy company_alias alias varchar150 alias_key normalized and unique per company `docs/legacy-source/backend/src/main/resources/db/migration/V218__company_aliases.sql:6-15`
- vNext now: New alias varchar160 and unique lower(alias) across all companies `src/db/schema/placement-company-identities.ts:16-28`
- Fix: Align 150-character cap and collision normalized-key representation.

## G2-12-020-013  [P3] GAP  facet F04  effort S
- Legacy: Old createdAt LocalDateTime DB-generated, insert/update false `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:46-47`
- vNext now: New createdAt timestamptz defaultNow not null `src/db/schema/placement-company-identities.ts:11`
- Fix: Timezone mapping IST/UTC for history display.
