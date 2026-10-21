# Work packet (wave 2): edit src/app/api/placements/tpo/companies/[companyId]/domain/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/tpo-company-controller.md

## G2-4-023-021  [P2] GAP  facet F06  effort M
- Legacy: Legacy POST /domains body requires domain string, nullable passed to validator (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:82-92`)
- vNext now: New POST domain route parses strict `{domain:string}` and UUID companyId (`src/app/api/placements/tpo/companies/[companyId]/domain/route.ts:8-20`)
- Fix: Match empty/invalid validation and maintain first-domain-only rule.

## G2-4-023-036  [P2] GAP  facet F09  effort M
- Legacy: Legacy domain and trust actions are per-company, no standalone global picker (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:82-102`)
- vNext now: New management creates separate domain route and trust service (`src/app/api/placements/tpo/companies/[companyId]/domain/route.ts:8-20`; `src/modules/placements/tpo-company-trust-service.ts:24-38`)
- Fix: Expose domain/trust menu at same company detail location.
