# Work packet (wave 2): edit src/modules/placements/tpo-companies-view-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/tpo-company-controller.md

## G2-4-023-006  [P2] GAP  facet F02  effort M
- Legacy: Legacy engagement combines trust, join state, opens, joins and domains in one object (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:104-115`)
- vNext now: New company page leads with three aggregate metrics and full spreadsheet, joins handled separately (`src/app/(authenticated)/tpo/companies/page.tsx:161-177`; `src/modules/placements/tpo-companies-view-service.ts:70-82`)
- Fix: Present legacy company-specific engagement strip and controls on company detail.

## G2-4-023-011  [P2] GAP  facet F03  effort M
- Legacy: Legacy company list result can display logoURL and verification mark (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:59-67`)
- vNext now: New company view source includes name/website only and spreadsheet metric projections (`src/modules/placements/tpo-companies-view-service.ts:75-82`)
- Fix: Include verified-by-42 and logo treatments where legacy picker shows them.

## G2-4-023-016  [P2] GAP  facet F05  effort M
- Legacy: Legacy search endpoint accepts q with no explicit pagination (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:47-50`)
- vNext now: New directory page search max150, sort NAME/CONTACTS/DRIVES/JOINS, pageSize25 default and 100 max (`src/app/(authenticated)/tpo/companies/page.tsx:179-218`; `src/modules/placements/tpo-companies-view-service.ts:41-49`)
- Fix: Keep company-picker autocomplete separate from paginated management spreadsheet.

## G2-4-023-062  [P2] GAP  facet F19  effort M
- Legacy: Legacy search across curated + all known companies delegated to searchIndex (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDirectoryService.java:24-28`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:47-50`)
- vNext now: New current-college list is fully loaded before client aggregation (`src/modules/placements/tpo-companies-view-service.ts:58-82`)
- Fix: Benchmark search against large global company registry; bound results and debounce requests.
