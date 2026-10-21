# Work packet: edit src/db/schema/placement-company-identities.ts

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/company-domain.md, docs/audit/gap2/lane-12/l16-u031-placements-end-to-end.md, docs/audit/gap2/lane-9/superadmin-company-curation.md

## G2-12-020-005  [P1] MISSING  facet F03  effort M
- Legacy: Legacy verifiedBy42 boolean indicates domain individually verified `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:34-35`
- vNext now: New child domain row no verifier/verified flag; company-level verifiedAt applies entire company `src/db/schema/placement-company-identities.ts:6-15` `src/db/schema/placements.ts:35-37`
- Fix: Persist domain-level verification state independently of company verification.

## G2-12-020-009  [P1] MISSING  facet F04  effort S
- Legacy: Old verifiedBy42 false default `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:34-35`
- vNext now: New no domain verification boolean `src/db/schema/placement-company-identities.ts:6-15`
- Fix: Add per-domain verifiedBy42/verifiedAt with default false.

## G2-12-020-020  [P1] MISSING  facet F06  effort S
- Legacy: Old verifiedBy42 false by default, only verified action should set true `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:34-35`
- vNext now: New has no field; company.verifiedAt separate `src/db/schema/placement-company-identities.ts:6-15` `src/db/schema/placements.ts:35-37`
- Fix: Require explicit domain verification workflow and display badge.

## G2-12-020-035  [P1] GAP  facet F12  effort M
- Legacy: Legacy verifiedBy42 false until manual verification `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:34-35`
- vNext now: New domain is accepted immediately without row-level verified status `src/modules/placements/super-admin-company-identities-service.ts:35-45` `src/db/schema/placement-company-identities.ts:6-15`
- Fix: Keep domain unverified until explicit attestation, do not confer recruiter claim rights prematurely.

## G2-12-020-037  [P1] MISSING  facet F13  effort S
- Legacy: Legacy null verifiedBy42 impossible (nullable=false) default false `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:34-35`
- vNext now: New has no field and may infer parent verification `src/db/schema/placement-company-identities.ts:6-15` `src/db/schema/placements.ts:35-37`
- Fix: Backfill false for legacy unverified company domains.

## G2-12-020-051  [P1] GAP  facet F22  effort L
- Legacy: Legacy company_domain fields id,company_id,domain,verified_by_42,added_by_user_id,added_by_user_type,added_by_college_id,created_at `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:24-48`
- vNext now: New table id,company_id,domain,addedByUserId,createdAt only `src/db/schema/placement-company-identities.ts:6-15`
- Fix: Register missing verification and provenance columns; map types/scope.

## G2-12-020-052  [P1] GAP  facet F22  effort M
- Legacy: Legacy domain unique intent case-insensitive registrable name `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:14-16` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:128-138`
- vNext now: New lower(domain) unique but may store unnormalized subdomain `src/db/schema/placement-company-identities.ts:13-15` `src/modules/placements/company-curation-domain-model.ts:4-8`
- Fix: Normalize before persistence and backfill duplicates.

## G2-12-020-053  [P1] GAP  facet F22  effort M
- Legacy: Legacy explicit CompanyDomain table allows multiple domains for same company `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:14-32`
- vNext now: New also child table, but primaryDomain synchronized only by global admin service `src/db/schema/placement-company-identities.ts:6-15` `src/modules/placements/super-admin-company-identities-service.ts:40-52` `src/modules/placements/tpo-company-domain-service.ts:39-49`
- Fix: Unify write paths and enforce primaryDomain child FK/invariant.

## G2-12-020-054  [P1] GAP  facet F23  effort L
- Legacy: Old verifiedBy42 per domain and actor/college provenance for ownership trust `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:34-44`
- vNext now: New row lacks these and TPO primary domain bypasses child `src/db/schema/placement-company-identities.ts:6-15` `src/modules/placements/tpo-company-domain-service.ts:39-49`
- Fix: Close verification/provenance/aggregation integrity before parity signoff.

## G2-16-031-059  [P1] GAP  facet F22  effort L
- Legacy: TpoCompanyController.java:47-105 uses Company and domain trust relations
- vNext now: src/db/schema/placements.ts:23-124 companies and relationships; placement-company-identities.ts identities
- Fix: Check global company identity vs college relationships and trusted-domain constraints; avoid cross-tenant duplicate merging

## G2-9-034-117  [P1] GAP  facet F22  effort M
- Legacy: Legacy company_domain has verified_by_42, added_by college and user type `docs/legacy-source/backend/src/main/resources/db/migration/V202__company_global_with_domains.sql:30-42`
- vNext now: New domains table lacks verified flag and addedByCollege/Type `src/db/schema/placement-company-identities.ts:5-15`
- Fix: Add domain verification/provenance fields where required by curation workflow.
