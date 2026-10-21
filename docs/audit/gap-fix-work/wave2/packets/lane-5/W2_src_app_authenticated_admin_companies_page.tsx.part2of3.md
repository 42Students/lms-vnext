# Work packet (wave 2): edit src/app/(authenticated)/admin/companies/page.tsx (part 2 of 3)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-companies.md, docs/audit/gap2/lane-16/u024-super-admin-company-controller.md, docs/audit/gap2/lane-9/superadmin-companies-college.md, docs/audit/gap2/lane-9/superadmin-company-curation.md

## G2-10-004-071  [P2] GAP  facet F17  effort M
- Legacy: Old row History keyboard Enter or Space opens job in new tab with aria label `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:555-569`
- vNext now: New Drive history is semantic Link, navigates same tab `src/app/(authenticated)/admin/companies/page.tsx:183-186`
- Fix: Provide optional secure new-tab behavior and job row keyboard operation in history view

## G2-10-004-072  [P2] GAP  facet F17  effort S
- Legacy: Old global action labels Verify Unverify Edit Domains Other names Merge `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:70-80`
- vNext now: New per-company subactions require disclosure; control labels are descriptive but more hidden `src/app/(authenticated)/admin/companies/page.tsx:159-175` `src/components/admin/super-admin-company-identities.tsx:34-59`
- Fix: Keep keyboard reachability and visible focus/order for high-frequency actions

## G2-10-004-074  [P2] GAP  facet F18  effort S
- Legacy: Legacy global paragraph Every company on 42LMS one per real company known by email and web domains `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:83-88`
- vNext now: New header says Read-only employer relationships within selected Super Admin organization or college scope `src/app/(authenticated)/admin/companies/page.tsx:43-45`
- Fix: Restore old curated-company explanation in GLOBAL tab, retain privacy warning below

## G2-10-004-075  [P2] GAP  facet F18  effort S
- Legacy: Legacy global search placeholder Search a name, other name or domain `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:89-92`
- vNext now: New Search company name or domain `src/app/(authenticated)/admin/companies/page.tsx:65-68`
- Fix: Restore Other name wording to advertise alias search

## G2-10-004-077  [P2] GAP  facet F18  effort S
- Legacy: Legacy college search placeholder Search by name or industry `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:373-379`
- vNext now: New placeholder Search company name or domain `src/app/(authenticated)/admin/companies/page.tsx:65-68`
- Fix: Use college-specific placeholder or support industry search

## G2-16-024-001  [P2] GAP  facet F01  effort M
- Legacy: SuperAdminCompanyController.java:20-24 ROLE_SUPER_ADMIN route /api/v1/superadmin/companies.
- vNext now: admin/companies/page.tsx:26-45 Super Admin Companies page, API admin/companies.
- Fix: Preserve Super Admin Companies navigation and old API compatibility if any clients.

## G2-9-033-001  [P2] GAP  facet F01  effort M
- Legacy: Superadmin companies route under Placements group shell, then inner tabs `docs/legacy-source/frontend/src/pages/superadmin/companies/index.js:1-27`
- vNext now: vNext /admin/companies PageHeader title Companies and local tab component; no group shell in page file `src/app/(authenticated)/admin/companies/page.tsx:26-53`
- Fix: Preserve legacy Placements grouped tabs and redirect old deep link

## G2-9-033-005  [P2] GAP  facet F02  effort S
- Legacy: College tab old overview metrics and Add company primary action at top `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:349-361`
- vNext now: New Add company inline action below multi-filter header, with metrics after create form `src/app/(authenticated)/admin/companies/page.tsx:64-142` `src/components/admin/super-admin-college-company-actions.tsx:29-51`
- Fix: Put Add company primary CTA alongside college overview heading

## G2-9-033-007  [P2] MISSING  facet F03  effort S
- Legacy: Old college company cell shows 32px logo avatar `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:242-259`
- vNext now: New card displays company name but no logo image `src/app/(authenticated)/admin/companies/page.tsx:143-145`
- Fix: Restore company avatar/logo fallback on every company list row

## G2-9-033-009  [P2] GAP  facet F03  effort S
- Legacy: Old Website column provides Visit external action target blank `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:272-279`
- vNext now: New details display website as plain text rather than link `src/app/(authenticated)/admin/companies/page.tsx:162-167`
- Fix: Render verified HTTPS website link with Visit and secure new-tab attributes

## G2-9-033-010  [P2] GAP  facet F03  effort M
- Legacy: Old college list columns sortable Company Drives Last active; last active descending by default `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:242-295`
- vNext now: New supports only sort by Name or Recently changed relationship via filter `src/app/(authenticated)/admin/companies/page.tsx:107-110` `src/modules/placements/admin-company-directory-service.ts:109-112`
- Fix: Add legacy Drives and Last active sort affordances and default for college tab

## G2-9-033-014  [P2] GAP  facet F05  effort S
- Legacy: College search matches name or industry only case-insensitively `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:89-93` `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:373-379`
- vNext now: New q matches name aliases and domains but not industry `src/modules/placements/admin-company-directory-service.ts:51-61` `src/app/(authenticated)/admin/companies/page.tsx:66-75`
- Fix: Support college industry search with old wording and clearly show expanded domain matching

## G2-9-033-016  [P2] GAP  facet F05  effort S
- Legacy: Old college client-side pagination 10 default and size changer `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:55-56` `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:428-433`
- vNext now: New service always pages exactly 50 relationships and uses Previous Next `src/modules/placements/admin-company-directory-service.ts:109-120` `src/app/(authenticated)/admin/companies/page.tsx:193-197`
- Fix: Restore 10 default and page size selector or document new cap explicitly

## G2-9-033-028  [P2] GAP  facet F09  effort M
- Legacy: Old detail History opens modal 720px and Close action `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:523-530`
- vNext now: New Drive history navigates to separate route `src/app/(authenticated)/admin/companies/page.tsx:183-186`
- Fix: Offer old history modal or ensure new route reproduces all stats, headings and row actions

## G2-9-033-029  [P2] GAP  facet F10  effort M
- Legacy: Old college GET company jobs and stats powers Drive history modal `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CompanyController.java:128-160` `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:215-239`
- vNext now: New Drive history is link /admin/companies/id/drives; separate implementation `src/app/(authenticated)/admin/companies/page.tsx:183-185`
- Fix: Verify separate route includes Drives run Applications Hired and job status table parity

## G2-9-033-034  [P2] GAP  facet F13  effort M
- Legacy: Old college fetch retains last results for refresh and shows Couldn't refresh companies warning `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:64-86` `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:362-372`
- vNext now: New server page re-fetches by navigation and no last-good-results status in component `src/app/(authenticated)/admin/companies/page.tsx:26-43`
- Fix: Preserve stale-while-refresh behavior under transient failures

## G2-9-033-035  [P2] GAP  facet F13  effort S
- Legacy: Old college zero list No companies yet — add one to start reusing it across job postings. `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:434-444`
- vNext now: New empty No company relationships No company relationships match current scope `src/app/(authenticated)/admin/companies/page.tsx:191-193`
- Fix: Restore exact no-data message when collection empty and distinction for filtered empty

## G2-9-033-040  [P2] GAP  facet F16  effort M
- Legacy: Old college modal fixed width560 and history modal width720 `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:448-476` `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:523-530`
- vNext now: New forms inline across responsive grid; link navigates to detail route `src/components/admin/super-admin-college-company-actions.tsx:29-51` `src/app/(authenticated)/admin/companies/page.tsx:183-186`
- Fix: Reproduce modal dimensions and mobile overflow/focus handling

## G2-9-033-041  [P2] GAP  facet F16  effort S
- Legacy: Old search width260 college, width300 global with debounced typing `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:373-380` `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:89-92`
- vNext now: New full-width GET search and explicit Filter; md form grid `src/app/(authenticated)/admin/companies/page.tsx:64-70` `src/app/(authenticated)/admin/companies/page.tsx:128-130`
- Fix: Restore toolbar search widths on desktop and one-column mobile

## G2-9-033-042  [P2] GAP  facet F17  effort M
- Legacy: Old row History keyboard Enter or Space opens job in new tab with aria label `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:555-569`
- vNext now: New Drive history is semantic Link, navigates same tab `src/app/(authenticated)/admin/companies/page.tsx:183-186`
- Fix: Provide optional secure new-tab behavior and job row keyboard operation in history view

## G2-9-033-044  [P2] GAP  facet F18  effort S
- Legacy: Legacy college search placeholder Search by name or industry `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:373-379`
- vNext now: New placeholder Search company name or domain `src/app/(authenticated)/admin/companies/page.tsx:65-68`
- Fix: Use college-specific placeholder or support industry search

## G2-9-033-056  [P2] GAP  facet F02  effort M
- Legacy: Four overview metrics appear before toolbar `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:351-361`
- vNext now: Six page-local statistics appear after filter form `src/app/(authenticated)/admin/companies/page.tsx:64-142`
- Fix: Move four original global vs filtered college counts ahead of toolbar.

## G2-9-033-057  [P2] MISSING  facet F03  effort S
- Legacy: Table uses 32px company avatar fallback `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:246-259`
- vNext now: Company list heading has no logo icon `src/app/(authenticated)/admin/companies/page.tsx:143-158`
- Fix: Restore 32px company avatar per row.

## G2-9-033-059  [P2] GAP  facet F03  effort S
- Legacy: Website shows globe-icon Visit external secure tab link `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:272-279`
- vNext now: Website value shown as plain text under disclosure `src/app/(authenticated)/admin/companies/page.tsx:159-170`
- Fix: Make validated website a target-blank Visit link with rel=noopener noreferrer.

## G2-9-033-060  [P2] GAP  facet F03  effort S
- Legacy: Verified by 42 and Deleted badges co-located with company name `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:250-255`
- vNext now: Global status and relationship status pills below heading `src/app/(authenticated)/admin/companies/page.tsx:145-158`
- Fix: Preserve original badge labels and placement; secondary relationship badge stays optional.

## G2-9-033-063  [P2] GAP  facet F04  effort S
- Legacy: Drives count 0 fallback in separate 90px column `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:281-286`
- vNext now: Drive count only in disclosure description `src/app/(authenticated)/admin/companies/page.tsx:176-180`
- Fix: Restore visible right-aligned Drives sortable table column.

## G2-9-033-064  [P2] GAP  facet F04  effort S
- Legacy: Last active moment.utc(...).local() DD MMM YYYY; blank 'Never posted' `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:289-295`
- vNext now: Asia/Kolkata en-IN date or em dash `src/app/(authenticated)/admin/companies/page.tsx:179-180`
- Fix: Match visible date format/placeholder; choose explicit IST rule for final implementation.

## G2-9-033-065  [P2] GAP  facet F04  effort S
- Legacy: Under toolbar 'Showing X of Y companies' with search/deleted annotation `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:411-416`
- vNext now: Matching college-company relationships and page local stats `src/app/(authenticated)/admin/companies/page.tsx:133`
- Fix: Show distinct company totals and annotation as old wording.

## G2-9-033-067  [P2] GAP  facet F05  effort M
- Legacy: Original Last active descending default, name and drives clickable sort `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:260-295`
- vNext now: Sort select has name or recently changed only `src/app/(authenticated)/admin/companies/page.tsx:107-110`
- Fix: Add last-active/drive-count sort and default newest activity.

## G2-9-033-087  [P2] GAP  facet F13  effort M
- Legacy: TableSkeleton rows8 cols6 during initial load `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:418-420`
- vNext now: Server component renders rows without that skeleton `src/app/(authenticated)/admin/companies/page.tsx:143-192`
- Fix: Add loading.tsx with matching six-column table skeleton.

## G2-9-033-091  [P2] GAP  facet F16  effort M
- Legacy: Search/filter toolbar flex-wrap, table scroll x=max-content `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:373-410,421-425`
- vNext now: Responsive article feed and More filters disclosure `src/app/(authenticated)/admin/companies/page.tsx:64-142,143-192`
- Fix: Use old horizontally scrollable table at 375/768 px, wrapping toolbar.

## G2-9-033-093  [P2] GAP  facet F18  effort S
- Legacy: Company list search placeholder 'Search by name or industry' `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:373-379`
- vNext now: 'Search company name or domain' `src/app/(authenticated)/admin/companies/page.tsx:66-68`
- Fix: Use legacy placeholder in college tab and support industry search.

## G2-9-033-094  [P2] GAP  facet F18  effort S
- Legacy: Button 'Export CSV' `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:385-408`
- vNext now: 'Export matching companies as CSV →' `src/app/(authenticated)/admin/companies/page.tsx:225-229`
- Fix: Restore exact college-mode action wording.

## G2-9-033-097  [P2] GAP  facet F20  effort M
- Legacy: Current page clamped after list shrink `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:95-106`
- vNext now: URL page links rely on requested index `src/app/(authenticated)/admin/companies/page.tsx:193-197`
- Fix: Clamp invalid page after filters/delete and reset on new search.

## G2-9-034-001  [P2] GAP  facet F01  effort M
- Legacy: Superadmin companies route under Placements group shell, then inner tabs `docs/legacy-source/frontend/src/pages/superadmin/companies/index.js:1-27`
- vNext now: vNext /admin/companies PageHeader title Companies and local tab component; no group shell in page file `src/app/(authenticated)/admin/companies/page.tsx:26-53`
- Fix: Preserve legacy Placements grouped tabs and redirect old deep link

## G2-9-034-005  [P2] GAP  facet F02  effort L
- Legacy: Old global tab is introductory text then 300px search, checkbox, six-column data table, then edit/domain/alias/merge dialogs `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:59-107` `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:108-174`
- vNext now: New shared 12-filter form, six summary stats and article feed, nested Company curation disclosure `src/app/(authenticated)/admin/companies/page.tsx:60-143` `src/app/(authenticated)/admin/companies/page.tsx:198-225`
- Fix: Restore old global table-first architecture and compact toolbar; expose enhancements secondarily

## G2-9-034-008  [P2] GAP  facet F03  effort S
- Legacy: Old global row shows Verified by 42 or Not verified tag next to company name `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:60-66`
- vNext now: New only shows Verified by 42 badge when true, leaves unverified unlabelled `src/app/(authenticated)/admin/companies/page.tsx:153-158`
- Fix: Show Not verified neutral chip explicitly

## G2-9-034-009  [P2] GAP  facet F03  effort M
- Legacy: Old global actions Verify Unverify Edit Domains Other names Merge visible in row `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:70-80`
- vNext now: New operations hidden inside Company details disclosure and Company curation section `src/app/(authenticated)/admin/companies/page.tsx:159-175` `src/app/(authenticated)/admin/companies/page.tsx:198-225`
- Fix: Restore visible per-company action cluster with old labels

## G2-9-034-011  [P2] GAP  facet F04  effort M
- Legacy: Old global summary addedByCollege or addedByUserType lowercased `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:66-70` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:44-50`
- vNext now: New addedByType is derived coarse label 42 platform or College user without creating-college name `src/modules/placements/admin-company-directory-service.ts:81-85` `src/app/(authenticated)/admin/companies/page.tsx:164-165`
- Fix: Resolve original college name for added-by display under permitted global scope

## G2-9-034-013  [P2] GAP  facet F05  effort M
- Legacy: Global search matches name domains aliases; debounced 300ms and checkbox Only not verified `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:18-43` `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:89-95`
- vNext now: New GET form q and searchField selector, explicit Filter and verified dropdown `src/app/(authenticated)/admin/companies/page.tsx:64-100` `src/modules/placements/admin-company-directory-service.ts:51-61`
- Fix: Preserve 300ms live search and simple Only not verified checkbox in global default toolbar
