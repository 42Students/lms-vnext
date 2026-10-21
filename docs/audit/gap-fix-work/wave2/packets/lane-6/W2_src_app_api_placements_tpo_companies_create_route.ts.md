# Work packet (wave 2): edit src/app/api/placements/tpo/companies/create/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/tpo-company-controller.md

## G2-4-023-004  [P2] GAP  facet F01  effort M
- Legacy: POST /resolve response is full company identity and existing/matched flags (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:52-68`)
- vNext now: New company POST create returns UUID companyId/relationshipId/name and redirects detail (`src/app/api/placements/tpo/companies/create/route.ts:28-38`; `src/components/tpo/tpo-company-create-form.tsx:50-58`)
- Fix: Preserve decision flags after resolving a company, even if response uses modern UUIDs.

## G2-4-023-038  [P2] GAP  facet F10  effort M
- Legacy: POST /resolve may insert company, domain and college link with actor attribution (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:52-68`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDirectoryService.java:15-18`)
- vNext now: New createPlacementCompany transaction creates/enriches company and relationship, records activity (`src/modules/placements/company-service.ts:235-315`; `src/app/api/placements/tpo/companies/create/route.ts:28-38`)
- Fix: Preserve name-lock, domain-owner, attribution and existed flags in transactional result.
