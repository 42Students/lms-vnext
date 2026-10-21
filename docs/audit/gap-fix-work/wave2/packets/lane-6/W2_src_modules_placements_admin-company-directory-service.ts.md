# Work packet (wave 2): edit src/modules/placements/admin-company-directory-service.ts

22 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l15-u019-industry-company.md, docs/audit/gap2/lane-10/superadmin-companies.md, docs/audit/gap2/lane-16/u024-super-admin-company-controller.md, docs/audit/gap2/lane-9/superadmin-companies-college.md, docs/audit/gap2/lane-9/superadmin-company-curation.md

## G2-15-019-002  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/IndustryCompanyRepository.java:15-22 — three active find operations
- vNext now: src/modules/placements/admin-company-directory-service.ts:11-19,62-112 — joined relationship directory
- Fix: Separate shared canonical lookup from scoped relationship listing

## G2-15-019-008  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/IndustryCompanyRepository.java:15-19 — alphabetical active list and exact casefold name lookup
- vNext now: src/modules/placements/admin-company-directory-service.ts:51-60,109-112 — contains name/alias/domain and name+college sort
- Fix: Support exact name path separately from fuzzy directory

## G2-15-019-009  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/IndustryCompanyRepository.java:15-16 — unpaginated global unique companies
- vNext now: src/modules/placements/admin-company-directory-service.ts:63-68,105-118 — 50/page college-company joins, duplicates per college
- Fix: Implement global unique company lookup/complete pagination

## G2-15-019-015  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/IndustryCompanyRepository.java:15-22 — findActiveByNameIgnoreCase and findActiveById
- vNext now: src/modules/placements/admin-company-directory-service.ts:11-119 — filtered paginated scoped list
- Fix: Provide equivalent simple identity lookup endpoint

## G2-15-019-022  [P2] GAP  facet F15  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/IndustryCompany.java:35-39 — creator type retained at insertion
- vNext now: src/modules/placements/admin-company-directory-service.ts:81-84 — derived type using current system roles
- Fix: Store immutable created-by role where audit demands

## G2-15-019-026  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/IndustryCompanyRepository.java:15-16 — all active companies sorted name
- vNext now: src/modules/placements/admin-company-directory-service.ts:109-112 — 50 entries/page, mixed college rows
- Fix: Expose deterministic global-company ordered listing

## G2-10-004-013  [P2] GAP  facet F03  effort M
- Legacy: Old college list columns sortable Company Drives Last active; last active descending by default `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:242-295`
- vNext now: New supports only sort by Name or Recently changed relationship via filter `src/app/(authenticated)/admin/companies/page.tsx:107-110` `src/modules/placements/admin-company-directory-service.ts:109-112`
- Fix: Add legacy Drives and Last active sort affordances and default for college tab

## G2-10-004-018  [P2] GAP  facet F04  effort M
- Legacy: Old global summary addedByCollege or addedByUserType lowercased `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:66-70` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:44-50`
- vNext now: New addedByType is derived coarse label 42 platform or College user without creating-college name `src/modules/placements/admin-company-directory-service.ts:81-85` `src/app/(authenticated)/admin/companies/page.tsx:164-165`
- Fix: Resolve original college name for added-by display under permitted global scope

## G2-10-004-020  [P2] GAP  facet F05  effort M
- Legacy: Global search matches name domains aliases; debounced 300ms and checkbox Only not verified `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:18-43` `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:89-95`
- vNext now: New GET form q and searchField selector, explicit Filter and verified dropdown `src/app/(authenticated)/admin/companies/page.tsx:64-100` `src/modules/placements/admin-company-directory-service.ts:51-61`
- Fix: Preserve 300ms live search and simple Only not verified checkbox in global default toolbar

## G2-10-004-021  [P2] GAP  facet F05  effort S
- Legacy: College search matches name or industry only case-insensitively `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:89-93` `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:373-379`
- vNext now: New q matches name aliases and domains but not industry `src/modules/placements/admin-company-directory-service.ts:51-61` `src/app/(authenticated)/admin/companies/page.tsx:66-75`
- Fix: Support college industry search with old wording and clearly show expanded domain matching

## G2-10-004-022  [P2] GAP  facet F05  effort M
- Legacy: Old global default ORDER verified_by_42 ASC then createdAt DESC `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:35-51`
- vNext now: New directory ORDER company.name then college.name or recently changed relationship `src/modules/placements/admin-company-directory-service.ts:109-112`
- Fix: Restore unverified-first created-desc sort to distinct global company tab

## G2-10-004-023  [P2] GAP  facet F05  effort M
- Legacy: Old college default lastActiveAt descending, sortable Company/Drives `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:260-295`
- vNext now: New default company name ascending `src/modules/placements/admin-company-directory-model.ts:15-23` `src/modules/placements/admin-company-directory-service.ts:109-112`
- Fix: Default college company list by last drive activity descending and enable column sorts

## G2-10-004-024  [P2] GAP  facet F05  effort S
- Legacy: Old college client-side pagination 10 default and size changer `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:55-56` `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:428-433`
- vNext now: New service always pages exactly 50 relationships and uses Previous Next `src/modules/placements/admin-company-directory-service.ts:109-120` `src/app/(authenticated)/admin/companies/page.tsx:193-197`
- Fix: Restore 10 default and page size selector or document new cap explicitly

## G2-16-024-049  [P2] GAP  facet F19  effort M
- Legacy: CompanyCurationService.java:35-64 size caps100, offset page*size.
- vNext now: admin-company-directory-service.ts:63-120 scoped relational joins with pagination.
- Fix: Bound data volume, avoid duplicate company rows distorting total.

## G2-9-033-010  [P2] GAP  facet F03  effort M
- Legacy: Old college list columns sortable Company Drives Last active; last active descending by default `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:242-295`
- vNext now: New supports only sort by Name or Recently changed relationship via filter `src/app/(authenticated)/admin/companies/page.tsx:107-110` `src/modules/placements/admin-company-directory-service.ts:109-112`
- Fix: Add legacy Drives and Last active sort affordances and default for college tab

## G2-9-033-014  [P2] GAP  facet F05  effort S
- Legacy: College search matches name or industry only case-insensitively `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:89-93` `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:373-379`
- vNext now: New q matches name aliases and domains but not industry `src/modules/placements/admin-company-directory-service.ts:51-61` `src/app/(authenticated)/admin/companies/page.tsx:66-75`
- Fix: Support college industry search with old wording and clearly show expanded domain matching

## G2-9-033-015  [P2] GAP  facet F05  effort M
- Legacy: Old college default lastActiveAt descending, sortable Company/Drives `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:260-295`
- vNext now: New default company name ascending `src/modules/placements/admin-company-directory-model.ts:15-23` `src/modules/placements/admin-company-directory-service.ts:109-112`
- Fix: Default college company list by last drive activity descending and enable column sorts

## G2-9-033-016  [P2] GAP  facet F05  effort S
- Legacy: Old college client-side pagination 10 default and size changer `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:55-56` `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:428-433`
- vNext now: New service always pages exactly 50 relationships and uses Previous Next `src/modules/placements/admin-company-directory-service.ts:109-120` `src/app/(authenticated)/admin/companies/page.tsx:193-197`
- Fix: Restore 10 default and page size selector or document new cap explicitly

## G2-9-033-096  [P2] GAP  facet F19  effort M
- Legacy: All college companies loaded, then client filtering and page size10 `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:63-104,428-433`
- vNext now: Server returns page50 relationships `src/modules/placements/admin-company-directory-service.ts:109-120`
- Fix: Page 10 distinct companies by default; preserve server scaling behind interface.

## G2-9-034-011  [P2] GAP  facet F04  effort M
- Legacy: Old global summary addedByCollege or addedByUserType lowercased `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:66-70` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:44-50`
- vNext now: New addedByType is derived coarse label 42 platform or College user without creating-college name `src/modules/placements/admin-company-directory-service.ts:81-85` `src/app/(authenticated)/admin/companies/page.tsx:164-165`
- Fix: Resolve original college name for added-by display under permitted global scope

## G2-9-034-013  [P2] GAP  facet F05  effort M
- Legacy: Global search matches name domains aliases; debounced 300ms and checkbox Only not verified `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:18-43` `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:89-95`
- vNext now: New GET form q and searchField selector, explicit Filter and verified dropdown `src/app/(authenticated)/admin/companies/page.tsx:64-100` `src/modules/placements/admin-company-directory-service.ts:51-61`
- Fix: Preserve 300ms live search and simple Only not verified checkbox in global default toolbar

## G2-9-034-014  [P2] GAP  facet F05  effort M
- Legacy: Old global default ORDER verified_by_42 ASC then createdAt DESC `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:35-51`
- vNext now: New directory ORDER company.name then college.name or recently changed relationship `src/modules/placements/admin-company-directory-service.ts:109-112`
- Fix: Restore unverified-first created-desc sort to distinct global company tab
