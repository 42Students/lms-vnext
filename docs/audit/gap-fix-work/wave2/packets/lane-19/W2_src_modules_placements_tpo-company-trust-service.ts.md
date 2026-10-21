# Work packet (wave 2): edit src/modules/placements/tpo-company-trust-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u031-placements-end-to-end.md, docs/audit/gap2/lane-4/tpo-company-controller.md

## G2-16-031-090  [P2] GAP  facet F21  effort M
- Legacy: TpoCompanyController.java:77-98 domain/add company join link workflows integrated in TPO module.
- vNext now: tpo/companies/page.tsx:123-325 company directory, tpo-company-trust-service.ts:24-97 persists trust; dedicated public join routes separate.
- Fix: Provide equivalent accessible join link/domain actions in company detail, not hidden in alternate settings.

## G2-4-023-022  [P2] GAP  facet F06  effort M
- Legacy: Legacy trusted PUT body `{trusted:boolean}` defaults false for absent/null body (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:94-102`)
- vNext now: New trust change schema requires relation ID, expectedTrusted,nextTrusted,reason (`src/modules/placements/tpo-company-trust-service.ts:24-38,56-60`)
- Fix: Include old boolean display semantics but enforce modern confirmation and stale guards.

## G2-4-023-036  [P2] GAP  facet F09  effort M
- Legacy: Legacy domain and trust actions are per-company, no standalone global picker (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:82-102`)
- vNext now: New management creates separate domain route and trust service (`src/app/api/placements/tpo/companies/[companyId]/domain/route.ts:8-20`; `src/modules/placements/tpo-company-trust-service.ts:24-38`)
- Fix: Expose domain/trust menu at same company detail location.
