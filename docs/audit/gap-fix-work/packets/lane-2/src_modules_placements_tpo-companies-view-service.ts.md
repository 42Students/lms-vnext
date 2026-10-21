# Work packet: edit src/modules/placements/tpo-companies-view-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/tpo-company-controller.md

## G2-4-023-002  [P1] GAP  facet F01  effort M
- Legacy: GET /search?q used to search curated and known global companies with college context (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:47-50`)
- vNext now: /tpo/companies directory lists current college-linked relationships; not global search picker (`src/modules/placements/tpo-companies-view-service.ts:70-82`; `src/app/(authenticated)/tpo/companies/page.tsx:108-120`)
- Fix: Expose a scoped global curated/company discovery query for drive company selection.

## G2-4-023-017  [P1] GAP  facet F05  effort M
- Legacy: Legacy search function returns matches from curated list plus known companies (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:22-24,47-50`)
- vNext now: New first fetches college relationship list and only then filters/aggregates (`src/modules/placements/tpo-companies-view-service.ts:58-82`)
- Fix: Index canonical company search by name/domain; preserve search relevance and no duplicate names.
