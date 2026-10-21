# Work packet (wave 2): edit src/app/(authenticated)/tpo/companies/page.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/l16-u031-placements-end-to-end.md, docs/audit/gap2/lane-16/u031-placements-end-to-end.md, docs/audit/gap2/lane-4/tpo-company-controller.md

## G2-16-031-015  [P2] GAP  facet F05  effort L
- Legacy: tpo/companies.js:5-20 uses TpoDataTable and company history counts
- vNext now: src/app/(authenticated)/tpo/companies/page.tsx:1-18 uses TpoCompaniesSpreadsheet plus query-schema
- Fix: Verify AG Grid columns, selection semantics, columns toolbar, 25/page vs legacy TpoDataTable; record every column

## G2-16-031-042  [P2] GAP  facet F13  effort M
- Legacy: tpo/companies.js:37-75 guards stale cross-company responses, exposes retry and skeleton
- vNext now: src/app/(authenticated)/tpo/companies/page.tsx:59-70 invalid query and 73-105 authorized server fetch
- Fix: Match Company detail skeleton, retry wording and prevent stale company data across navigation in client descendants

## G2-16-031-090  [P2] GAP  facet F21  effort M
- Legacy: TpoCompanyController.java:77-98 domain/add company join link workflows integrated in TPO module.
- vNext now: tpo/companies/page.tsx:123-325 company directory, tpo-company-trust-service.ts:24-97 persists trust; dedicated public join routes separate.
- Fix: Provide equivalent accessible join link/domain actions in company detail, not hidden in alternate settings.

## G2-4-023-001  [P2] GAP  facet F01  effort M
- Legacy: Company lookup, Add other and link actions served at /api/v1/tpo/companies for TPO picker on drive form (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:22-29`)
- vNext now: vNext /tpo/companies defaults via redirect to recruiters Companies view; separate company create and list surfaces (`src/app/(authenticated)/tpo/companies/page.tsx:86-105`)
- Fix: Make company search on drive form reachable with same entry, include Add other from picker.

## G2-4-023-003  [P2] GAP  facet F01  effort M
- Legacy: GET /{companyId}/engagement and POST /{companyId}/join-link are direct actions from company control (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:70-80`)
- vNext now: New company page and public join-link service separate company detail from link status/create (`src/app/(authenticated)/tpo/companies/page.tsx:130-143`; `src/modules/placements/tpo-public-join-link-service.ts:73-105`)
- Fix: Ensure detail links and company scoped link controls reachable without extra redirects.

## G2-4-023-006  [P2] GAP  facet F02  effort M
- Legacy: Legacy engagement combines trust, join state, opens, joins and domains in one object (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:104-115`)
- vNext now: New company page leads with three aggregate metrics and full spreadsheet, joins handled separately (`src/app/(authenticated)/tpo/companies/page.tsx:161-177`; `src/modules/placements/tpo-companies-view-service.ts:70-82`)
- Fix: Present legacy company-specific engagement strip and controls on company detail.

## G2-4-023-016  [P2] GAP  facet F05  effort M
- Legacy: Legacy search endpoint accepts q with no explicit pagination (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:47-50`)
- vNext now: New directory page search max150, sort NAME/CONTACTS/DRIVES/JOINS, pageSize25 default and 100 max (`src/app/(authenticated)/tpo/companies/page.tsx:179-218`; `src/modules/placements/tpo-companies-view-service.ts:41-49`)
- Fix: Keep company-picker autocomplete separate from paginated management spreadsheet.
