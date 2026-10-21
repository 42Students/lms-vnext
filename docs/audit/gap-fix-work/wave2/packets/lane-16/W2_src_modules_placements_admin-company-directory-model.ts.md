# Work packet (wave 2): edit src/modules/placements/admin-company-directory-model.ts

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-companies.md, docs/audit/gap2/lane-16/u024-super-admin-company-controller.md, docs/audit/gap2/lane-9/superadmin-companies-college.md, docs/audit/gap2/lane-9/superadmin-company-curation.md

## G2-10-004-023  [P2] GAP  facet F05  effort M
- Legacy: Old college default lastActiveAt descending, sortable Company/Drives `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:260-295`
- vNext now: New default company name ascending `src/modules/placements/admin-company-directory-model.ts:15-23` `src/modules/placements/admin-company-directory-service.ts:109-112`
- Fix: Default college company list by last drive activity descending and enable column sorts

## G2-16-024-004  [P2] GAP  facet F02  effort M
- Legacy: CompanyCurationService.java:44-51 columns id/name/logo/website/industry/verified/addedBy/domains/aliases/colleges/drives.
- vNext now: admin-company-directory-model.ts:42-52 contains relationship/owner/status plus name/company data.
- Fix: Restore exact per-company columns and avoid duplicate global companies across college relationships.

## G2-16-024-005  [P2] GAP  facet F02  effort S
- Legacy: CompanyCurationService.java:51 ORDER unverified ASC, createdAt DESC.
- vNext now: admin-company-directory-model.ts:18 default sort NAME.
- Fix: Restore verified-first? Legacy false before true plus newest first as default sort.

## G2-16-024-010  [P2] GAP  facet F04  effort M
- Legacy: CompanyCurationService.java:44-50 returns addedByUserType and addedByCollege.
- vNext now: admin-company-directory-model.ts:42-51 addedByType but no explicit addedByCollege name in row type.
- Fix: Include source-college identity in global directory.

## G2-16-024-012  [P2] GAP  facet F04  effort S
- Legacy: CompanyCurationService.java:59-64 response items,total,page,size (0-based).
- vNext now: admin-company-directory-model.ts:4-15 page1-based, page size in query service; response rows.
- Fix: Convert 0-based historic page to 1-based UI, document offset translation.

## G2-16-024-013  [P2] GAP  facet F05  effort M
- Legacy: SuperAdminCompanyController.java:46-50 q/unverified/page default0/size50.
- vNext now: admin-company-directory-model.ts:9-22 q, verified enum, page1 and extended filters.
- Fix: Support exact unverified true alias and default page size50 for old list.

## G2-16-024-040  [P2] GAP  facet F12  effort M
- Legacy: CompanyCurationService.java:35-65 unverified-first then newest as default.
- vNext now: admin-company-directory-model.ts:18 name sort default.
- Fix: Add legacy default as named sort and enforce stable ties.

## G2-9-033-015  [P2] GAP  facet F05  effort M
- Legacy: Old college default lastActiveAt descending, sortable Company/Drives `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:260-295`
- vNext now: New default company name ascending `src/modules/placements/admin-company-directory-model.ts:15-23` `src/modules/placements/admin-company-directory-service.ts:109-112`
- Fix: Default college company list by last drive activity descending and enable column sorts

## G2-10-004-082  [P3] GAP  facet F20  effort S
- Legacy: Old global search debounced 300ms and clears page on filters `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:18-43`
- vNext now: New server filter submit and page encoded in query; page default1 on new filter `src/app/(authenticated)/admin/companies/page.tsx:64-130` `src/modules/placements/admin-company-directory-model.ts:15-23`
- Fix: Preserve debounce if table-first interaction retained and reset page when filters change

## G2-9-034-048  [P3] GAP  facet F20  effort S
- Legacy: Old global search debounced 300ms and clears page on filters `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:18-43`
- vNext now: New server filter submit and page encoded in query; page default1 on new filter `src/app/(authenticated)/admin/companies/page.tsx:64-130` `src/modules/placements/admin-company-directory-model.ts:15-23`
- Fix: Preserve debounce if table-first interaction retained and reset page when filters change
