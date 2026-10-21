# Work packet: edit src/modules/placements/admin-company-directory-service.ts (part 2 of 2)

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-company-curation.md, docs/audit/gap2/lane-1/l15-u019-industry-company.md

## G2-9-034-111  [P1] GAP  facet F19  effort L
- Legacy: Old query caps page size100, UI 50, distinct global companies `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:35-39`
- vNext now: New limit50 relationship rows `src/modules/placements/admin-company-directory-service.ts:109-120`
- Fix: Page on canonical company IDs; use joins only for row stats.

## G2-9-034-112  [P1] GAP  facet F19  effort M
- Legacy: Old data includes platform-wide counts from live relations and jobs `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:44-51`
- vNext now: New relationship projections compute tenant-limited count per row `src/modules/placements/admin-company-directory-service.ts:93-103`
- Fix: Return correct platform-wide counts for authorized global curated list.

## G2-15-019-012  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/IndustryCompanyRepository.java:21-22 — deleted ID not returned
- vNext now: src/modules/placements/admin-company-directory-service.ts:44-49,108-112 — status filtering opt-in across global and relationship
- Fix: Ensure default active-only API and archived lookups semantics

## G2-15-019-013  [P3] GAP  facet F08  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/IndustryCompany.java:20-21 — JSON ignore unknown and Hibernate proxies
- vNext now: src/modules/placements/admin-company-directory-service.ts:115-119 — projected typed response
- Fix: Publish DTO crosswalk for existing consumers
