# Work packet (wave 2): edit src/modules/placements/super-admin-company-identities-service.ts

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/company-domain.md, docs/audit/gap2/lane-16/u024-super-admin-company-controller.md

## G2-12-020-003  [P2] GAP  facet F02  effort M
- Legacy: Legacy model is server-side domain row, UI comes from company Settings/curation `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:14-48`
- vNext now: New superadmin domain editor separate from TPO trusted-domain flow `src/modules/placements/super-admin-company-identities-service.ts:20-62` `src/modules/placements/tpo-trusted-domain-validation.ts:3-23`
- Fix: Match domain list/add/remove visuals across roles.

## G2-12-020-004  [P2] GAP  facet F02  effort S
- Legacy: Old display tied to company, sorted by id ASC `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/CompanyDomainRepository.java:16-21`
- vNext now: New child service fetches current rows with no ORDER BY `src/modules/placements/super-admin-company-identities-service.ts:32-34`
- Fix: Sort domain list by createdAt and id to preserve insertion order.

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

## G2-12-020-019  [P2] GAP  facet F06  effort S
- Legacy: Old mail acceptance check optional requireMail flag; DNS unknown doesn't block `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:86-103`
- vNext now: New admin company domain ADD does not call DNS; public join uses MX-only path `src/modules/placements/super-admin-company-identities-service.ts:20-53`
- Fix: Define requireMail policy per actor/use and preserve DNS fallback.

## G2-12-020-028  [P2] GAP  facet F10  effort M
- Legacy: Legacy entity inserted via CompanyDomainRepository, companyId required `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:28-32` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/CompanyDomainRepository.java:13-21`
- vNext now: New admin action INSERT child and set primaryDomain only if absent `src/modules/placements/super-admin-company-identities-service.ts:35-45`
- Fix: Guarantee parent primaryDomain derived from child rows on all insert paths.

## G2-12-020-030  [P2] GAP  facet F10  effort S
- Legacy: Legacy remove row possible from company curation, provenance history in row `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:37-47`
- vNext now: New superadmin can DELETE child row and replace primaryDomain `src/modules/placements/super-admin-company-identities-service.ts:46-53`
- Fix: Retain deletion audit/history outside row, handle last-domain restriction.

## G2-12-020-033  [P2] GAP  facet F11  effort S
- Legacy: Legacy addedByCollegeId records tenant source, but entity itself global company-owned `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:28-44`
- vNext now: New superadmin global-only action with no scoped admin eligibility `src/modules/placements/super-admin-company-identities-service.ts:15-19`
- Fix: Separate provenance and permitted role matrix, avoid privilege regression.

## G2-12-020-044  [P2] GAP  facet F18  effort S
- Legacy: Legacy errors differentiate personal/disposable/academic/IP/no-mail `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:39-49`
- vNext now: New generic regex and limited academic domain check `src/modules/placements/super-admin-company-identities-service.ts:28-31` `src/modules/placements/tpo-trusted-domain-validation.ts:15-23`
- Fix: Provide precise legacy validation copy in UI.

## G2-12-020-046  [P2] GAP  facet F19  effort M
- Legacy: Old bulk lookup companyIds one DB query `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/CompanyDomainRepository.java:20-21`
- vNext now: New per-company select in superadmin mutations `src/modules/placements/super-admin-company-identities-service.ts:25-34`
- Fix: Batch domains in directory lists to avoid N+1.

## G2-12-020-050  [P2] GAP  facet F21  effort M
- Legacy: Legacy optional DNS resolver check in validation path `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:86-103`
- vNext now: New API/domain write no DNS check; public join DNS path separate `src/modules/placements/super-admin-company-identities-service.ts:20-31`
- Fix: Unify DNS integration and transient error handling per actor.

## G2-16-024-048  [P3] GAP  facet F18  effort S
- Legacy: CompanyCurationService.java:134 last-domain error wording.
- vNext now: super-admin-company-identities-service.ts:48 different string.
- Fix: Use catalog exact wording.
