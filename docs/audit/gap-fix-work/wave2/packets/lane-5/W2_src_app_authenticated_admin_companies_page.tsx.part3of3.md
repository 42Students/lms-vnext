# Work packet (wave 2): edit src/app/(authenticated)/admin/companies/page.tsx (part 3 of 3)

36 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-company-curation.md, docs/audit/gap2/lane-10/cross-10-list-conventions.md, docs/audit/gap2/lane-10/superadmin-companies.md, docs/audit/gap2/lane-16/u024-super-admin-company-controller.md, docs/audit/gap2/lane-9/superadmin-companies-college.md

## G2-9-034-017  [P2] GAP  facet F06  effort M
- Legacy: Old global merge is AsyncModal Merge X into… with searchable target list `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:161-173`
- vNext now: New merge source/keep dropdowns inline in duplicate cards and separate confirmation `src/components/admin/super-admin-company-merge.tsx:36-61` `src/app/(authenticated)/admin/companies/page.tsx:205-211`
- Fix: Expose Merge on each global company row and searchable company selector including targets beyond page

## G2-9-034-034  [P2] GAP  facet F13  effort M
- Legacy: Old global list starts loading=true and Antd table spinner; error Couldn't load companies with Retry `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:22-42` `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:90-95`
- vNext now: New async server page renders results and invalid query ErrorState; no local Retry on fetch errors `src/app/(authenticated)/admin/companies/page.tsx:29-39` `src/app/(authenticated)/admin/companies/page.tsx:143-192`
- Fix: Use legacy table loading/error states and retry for transient query failure

## G2-9-034-035  [P2] GAP  facet F13  effort S
- Legacy: Old global empty Antd table with default empty state; error separate alert `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:90-95`
- vNext now: New EmptyState No company relationships under relationship list `src/app/(authenticated)/admin/companies/page.tsx:191-193`
- Fix: Differentiate empty curated catalogue vs zero college relations

## G2-9-034-039  [P2] GAP  facet F16  effort M
- Legacy: Old global table min scroll x1060 and page controls 50/page `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:90-95`
- vNext now: New article list break-word and 50 relationship rows; no horizontal table scroll `src/app/(authenticated)/admin/companies/page.tsx:143-197`
- Fix: Test narrow widths 375/768/1280 and apply legacy responsive table wrapper if restoring grid

## G2-9-034-040  [P2] GAP  facet F16  effort S
- Legacy: Old search width260 college, width300 global with debounced typing `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:373-380` `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:89-92`
- vNext now: New full-width GET search and explicit Filter; md form grid `src/app/(authenticated)/admin/companies/page.tsx:64-70` `src/app/(authenticated)/admin/companies/page.tsx:128-130`
- Fix: Restore toolbar search widths on desktop and one-column mobile

## G2-9-034-041  [P2] GAP  facet F17  effort S
- Legacy: Old global action labels Verify Unverify Edit Domains Other names Merge `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:70-80`
- vNext now: New per-company subactions require disclosure; control labels are descriptive but more hidden `src/app/(authenticated)/admin/companies/page.tsx:159-175` `src/components/admin/super-admin-company-identities.tsx:34-59`
- Fix: Keep keyboard reachability and visible focus/order for high-frequency actions

## G2-9-034-043  [P2] GAP  facet F18  effort S
- Legacy: Legacy global paragraph Every company on 42LMS one per real company known by email and web domains `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:83-88`
- vNext now: New header says Read-only employer relationships within selected Super Admin organization or college scope `src/app/(authenticated)/admin/companies/page.tsx:43-45`
- Fix: Restore old curated-company explanation in GLOBAL tab, retain privacy warning below

## G2-9-034-044  [P2] GAP  facet F18  effort S
- Legacy: Legacy global search placeholder Search a name, other name or domain `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:89-92`
- vNext now: New Search company name or domain `src/app/(authenticated)/admin/companies/page.tsx:65-68`
- Fix: Restore Other name wording to advertise alias search

## G2-9-034-059  [P2] GAP  facet F02  effort S
- Legacy: Intro paragraph is first above search and table `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:83-95`
- vNext now: vNext has PageHeader, tabs, quick links, complex filters, six metric tiles before records `src/app/(authenticated)/admin/companies/page.tsx:43-143`
- Fix: Restore text-first compact global curation layout; secondary metrics below.

## G2-9-034-060  [P2] GAP  facet F03  effort S
- Legacy: Company main cell displays canonical name and website on second line `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:60-65`
- vNext now: vNext article name and website hidden in details accordion `src/app/(authenticated)/admin/companies/page.tsx:143-163`
- Fix: Expose website under each company name.

## G2-9-034-061  [P2] GAP  facet F03  effort S
- Legacy: 'Also known as <aliases>' shown beneath name `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:64`
- vNext now: Aliases hidden in Company details disclosure `src/app/(authenticated)/admin/companies/page.tsx:162-169`
- Fix: Show 'Also known as' on primary row.

## G2-9-034-062  [P2] GAP  facet F03  effort S
- Legacy: Domains column shows comma separated list or 'None' `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:66`
- vNext now: Domains hidden with fallback 'Not registered' `src/app/(authenticated)/admin/companies/page.tsx:162-166`
- Fix: Restore visible Domains and 'None' fallback.

## G2-9-034-063  [P2] GAP  facet F03  effort S
- Legacy: Added by column renders college or lower-case type, '-' missing `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:67`
- vNext now: 'Added by:' coarse type only, 'Not recorded' `src/app/(authenticated)/admin/companies/page.tsx:163-165`
- Fix: Resolve source college and exact dash fallback.

## G2-9-034-066  [P2] GAP  facet F05  effort S
- Legacy: Unverified filter is a checkbox beside search `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:89-92`
- vNext now: Dropdown 'Global verification' under More filters `src/app/(authenticated)/admin/companies/page.tsx:94-100`
- Fix: Expose 'Only not verified' checkbox beside Search.

## G2-9-034-067  [P2] GAP  facet F05  effort M
- Legacy: Search updates after 300ms debounce `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:18-19,34-43`
- vNext now: GET form submits only after Filter click `src/app/(authenticated)/admin/companies/page.tsx:64-70,129`
- Fix: Implement 300ms debounced filtering with cancellation/page reset.

## G2-9-034-069  [P2] GAP  facet F05  effort S
- Legacy: No sortable columns on global table; backend unverified first newest created `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:59-81`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:50-51`
- vNext now: Visible Order filter sorting NAME or RECENT `src/app/(authenticated)/admin/companies/page.tsx:107-110`
- Fix: Use legacy default unverified-first/newest created and avoid implying table-column sorts.

## G2-9-034-100  [P2] GAP  facet F13  effort M
- Legacy: Old table indicates pending loading with Ant loading prop `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:22-24,93-95`
- vNext now: New SSR list output has no same table spinner `src/app/(authenticated)/admin/companies/page.tsx:26-43,143-192`
- Fix: Match table loading skeleton/pending state.

## G2-9-034-101  [P2] GAP  facet F13  effort M
- Legacy: Legacy failure banner Couldn't load companies with Retry `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:34-40,93-95`
- vNext now: New query parse invalid ErrorState and server fetch errors may boundary `src/app/(authenticated)/admin/companies/page.tsx:29-39`
- Fix: Add transient Retry and preserve last verified data.

## G2-9-034-105  [P2] GAP  facet F16  effort M
- Legacy: Old global table x-scroll width1060 and toolbar search width300 `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:89-95`
- vNext now: New responsive article list, control grid `src/app/(authenticated)/admin/companies/page.tsx:64-142,143-192`
- Fix: Restore horizontal-scroll table at 1280/768/375px, fluid search on mobile.

## G2-9-034-108  [P2] GAP  facet F18  effort S
- Legacy: 'Every company on 42LMS...' introductory paragraph exact `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:85-88`
- vNext now: New generic 'Read-only employer relationships...' page description `src/app/(authenticated)/admin/companies/page.tsx:43-45`
- Fix: Restore legacy introduction on global tab.

## G2-9-034-109  [P2] GAP  facet F18  effort S
- Legacy: Global search says 'Search a name, other name or domain' `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:89-92`
- vNext now: New says 'Search company name or domain' `src/app/(authenticated)/admin/companies/page.tsx:65-68`
- Fix: Restore alias-aware placeholder.

## G2-9-034-113  [P2] GAP  facet F20  effort S
- Legacy: Legacy search filter change resets page0 `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:41-43`
- vNext now: New URL-based filters may preserve arbitrary page number `src/app/(authenticated)/admin/companies/page.tsx:64-130`
- Fix: Reset page1 whenever any global filter changes.

## G2-10-031-006  [P3] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:83-95 — explanatory copy before search/filter then table.
- vNext now: src/app/(authenticated)/admin/companies/page.tsx:63-133 — search and multiple filter options before candidates.
- Fix: Retain each list's help text and visual order.

## G2-10-004-007  [P3] GAP  facet F02  effort S
- Legacy: Old inner tabs remount on selectedCollegeId change to reset selection `docs/legacy-source/frontend/src/pages/superadmin/companies/index.js:13-22`
- vNext now: New links view=COLLEGE or GLOBAL and selection from URL/adminScope `src/app/(authenticated)/admin/companies/page.tsx:40-52`
- Fix: On scope change invalidate stale URL view and keep selected college correct

## G2-10-004-015  [P3] GAP  facet F03  effort S
- Legacy: Old deleted college row low opacity 0.55, marked Deleted tag `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:250-255` `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:421-427`
- vNext now: New ARCHIVED status badge at normal opacity `src/app/(authenticated)/admin/companies/page.tsx:143-157`
- Fix: Match legacy deleted row opacity, chip copy and styling

## G2-10-004-064  [P3] GAP  facet F14  effort S
- Legacy: Legacy Export CSV disabled if no matches and filenames companies.csv `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:385-407`
- vNext now: New export link always enabled; filename companies.csv `src/app/(authenticated)/admin/companies/page.tsx:225-229` `src/app/api/admin/companies/export/route.ts:20-27`
- Fix: Disable empty exports and label maximum 2000 rows clearly

## G2-10-004-076  [P3] GAP  facet F18  effort S
- Legacy: Legacy checkbox Only not verified `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:89-92`
- vNext now: New global verification Select options Only not verified Verified by 42 All companies `src/app/(authenticated)/admin/companies/page.tsx:94-100`
- Fix: Make Only not verified quick checkbox available in default global toolbar

## G2-10-004-082  [P3] GAP  facet F20  effort S
- Legacy: Old global search debounced 300ms and clears page on filters `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:18-43`
- vNext now: New server filter submit and page encoded in query; page default1 on new filter `src/app/(authenticated)/admin/companies/page.tsx:64-130` `src/modules/placements/admin-company-directory-model.ts:15-23`
- Fix: Preserve debounce if table-first interaction retained and reset page when filters change

## G2-16-024-047  [P3] GAP  facet F18  effort S
- Legacy: CompanyCurationService.java:20-24 `42's curated company list`, verified by 42.
- vNext now: admin/companies/page.tsx:48 `42's company list` and 97 `Verified by 42`.
- Fix: Match exact label if reference requires `curated`.

## G2-9-033-006  [P3] GAP  facet F02  effort S
- Legacy: Old inner tabs remount on selectedCollegeId change to reset selection `docs/legacy-source/frontend/src/pages/superadmin/companies/index.js:13-22`
- vNext now: New links view=COLLEGE or GLOBAL and selection from URL/adminScope `src/app/(authenticated)/admin/companies/page.tsx:40-52`
- Fix: On scope change invalidate stale URL view and keep selected college correct

## G2-9-033-011  [P3] GAP  facet F03  effort S
- Legacy: Old deleted college row low opacity 0.55, marked Deleted tag `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:250-255` `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:421-427`
- vNext now: New ARCHIVED status badge at normal opacity `src/app/(authenticated)/admin/companies/page.tsx:143-157`
- Fix: Match legacy deleted row opacity, chip copy and styling

## G2-9-033-037  [P3] GAP  facet F14  effort S
- Legacy: Legacy Export CSV disabled if no matches and filenames companies.csv `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:385-407`
- vNext now: New export link always enabled; filename companies.csv `src/app/(authenticated)/admin/companies/page.tsx:225-229` `src/app/api/admin/companies/export/route.ts:20-27`
- Fix: Disable empty exports and label maximum 2000 rows clearly

## G2-9-033-068  [P3] GAP  facet F05  effort S
- Legacy: Table row deleted opacity .55 `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:421-427`
- vNext now: ARCHIVED badge without dimming `src/app/(authenticated)/admin/companies/page.tsx:143-158`
- Fix: Render deleted company rows with opacity .55 while maintaining readability.

## G2-9-034-006  [P3] GAP  facet F02  effort S
- Legacy: Old inner tabs remount on selectedCollegeId change to reset selection `docs/legacy-source/frontend/src/pages/superadmin/companies/index.js:13-22`
- vNext now: New links view=COLLEGE or GLOBAL and selection from URL/adminScope `src/app/(authenticated)/admin/companies/page.tsx:40-52`
- Fix: On scope change invalidate stale URL view and keep selected college correct

## G2-9-034-045  [P3] GAP  facet F18  effort S
- Legacy: Legacy checkbox Only not verified `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:89-92`
- vNext now: New global verification Select options Only not verified Verified by 42 All companies `src/app/(authenticated)/admin/companies/page.tsx:94-100`
- Fix: Make Only not verified quick checkbox available in default global toolbar

## G2-9-034-048  [P3] GAP  facet F20  effort S
- Legacy: Old global search debounced 300ms and clears page on filters `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:18-43`
- vNext now: New server filter submit and page encoded in query; page default1 on new filter `src/app/(authenticated)/admin/companies/page.tsx:64-130` `src/modules/placements/admin-company-directory-model.ts:15-23`
- Fix: Preserve debounce if table-first interaction retained and reset page when filters change
