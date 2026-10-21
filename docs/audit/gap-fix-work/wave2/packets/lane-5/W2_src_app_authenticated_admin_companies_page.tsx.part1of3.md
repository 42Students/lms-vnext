# Work packet (wave 2): edit src/app/(authenticated)/admin/companies/page.tsx (part 1 of 3)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/cross-10-list-conventions.md, docs/audit/gap2/lane-10/superadmin-companies.md

## G2-10-031-003  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:18-22,83-95 — global company curation tab with own server page.
- vNext now: src/app/(authenticated)/admin/companies/page.tsx:26-50,185-231 — combined company admin directory with its own section links.
- Fix: Preserve explicit curation/local tab navigation.

## G2-10-031-004  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:373-445 — search, Show deleted, Export CSV, count, table in a block.
- vNext now: src/app/(authenticated)/admin/companies/page.tsx:63-133,185-231 — FilterBar, summary, multiple curation sections and export link.
- Fix: Match control ordering and card spacing per list category.

## G2-10-031-007  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:374-385 — search clear control, Show deleted checkbox.
- vNext now: src/app/(authenticated)/admin/companies/page.tsx:64-120 — search/status/owner/website/change filters, no equivalently prominent Show deleted checkbox.
- Fix: Make Show deleted toggle explicit and preserve reset.

## G2-10-031-009  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:385-408 — Export CSV small icon button, empty disabled.
- vNext now: src/app/(authenticated)/admin/companies/page.tsx:225-231 — export text link with query href.
- Fix: Use icon/button/disabled semantics; retain search-scoped data.

## G2-10-031-010  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:413-416 — Showing filtered of full companies, optional (including deleted), search scope.
- vNext now: src/app/(authenticated)/admin/companies/page.tsx:185-198 — counts/section headings have different semantics.
- Fix: Render precise filtered vs total count copy.

## G2-10-031-011  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:289-295 — Last active date uses local DD MMM YYYY, never posted fallback.
- vNext now: src/app/(authenticated)/admin/companies/page.tsx:150-180 — company list fields do not preserve source Last active default sort field.
- Fix: Restore date format and Never posted.

## G2-10-031-012  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:251-256 — company row industry/domains/verified/deleted badges.
- vNext now: src/app/(authenticated)/admin/companies/page.tsx:135-190 — different company directory presentation/fields.
- Fix: Keep name, badge and domain identity cues in list.

## G2-10-031-016  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:18-19,34-43 — global company search debounces 300ms.
- vNext now: src/app/(authenticated)/admin/companies/page.tsx:63-90 — search via form GET, no per-keystroke debounce.
- Fix: Match per-page search delay and reset policy.

## G2-10-031-017  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:52-56,89-106 — company search local substring name/industry, default 10/page.
- vNext now: src/app/(authenticated)/admin/companies/page.tsx:63-90,185-198 — remote directory filters and different query semantics.
- Fix: Recreate search name/industry, correct count and page size.

## G2-10-031-023  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:374-384 — onChange live search and checkbox, no form submit.
- vNext now: src/app/(authenticated)/admin/companies/page.tsx:63-90 — GET filter form requires submit.
- Fix: Make source auto-applied filters with clear control.

## G2-10-031-024  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:89-95 — Only not verified checkbox triggers refresh.
- vNext now: src/app/(authenticated)/admin/companies/page.tsx:82-133 — status/etc filters and form submit.
- Fix: Restore unverified toggle semantics.

## G2-10-031-032  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:72-79 — Verify/Edit/Domains/Other names/Merge row buttons.
- vNext now: src/app/(authenticated)/admin/companies/page.tsx:185-231 — curation is moved to separate sections/actions.
- Fix: Restore row action discoverability or grounded alternative.

## G2-10-031-033  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:34-41 — GET curated companies q/unverified/page0/size50.
- vNext now: src/app/(authenticated)/admin/companies/page.tsx:26-50 — server data query params and read; endpoint contract differs.
- Fix: Map query/filter semantics to vNext data service.

## G2-10-031-037  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:41-43 — q or onlyUnverified resets page=0.
- vNext now: src/app/(authenticated)/admin/companies/page.tsx:63-90 — GET filter controls may retain requested page.
- Fix: Reset page on search/filter updates.

## G2-10-031-039  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:59-62,362-372 — first-load skeleton vs refresh status/warning.
- vNext now: src/app/(authenticated)/admin/companies/page.tsx:26-50 — server rendering with alternative loading/error states.
- Fix: Preserve first-load vs soft-refetch distinctions.

## G2-10-031-041  [P2] GAP  facet F14  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:385-408 — CSV of filtered company rows with fixed columns.
- vNext now: src/app/(authenticated)/admin/companies/page.tsx:225-231 — export endpoint query link; count/header may differ.
- Fix: Specify filename, fields, query scope, and disabled empty state.

## G2-10-031-048  [P2] GAP  facet F18  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:375,407 — Search by name or industry, Export CSV.
- vNext now: src/app/(authenticated)/admin/companies/page.tsx:67-90,225-231 — search company name or domain, Export link.
- Fix: Preserve legacy wording including search scope.

## G2-10-031-050  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:18-22,34-43 — 300ms debounce with server page size50.
- vNext now: src/app/(authenticated)/admin/companies/page.tsx:26-50 — SSR query, no live debounce.
- Fix: Use debounce on high-frequency search without unlimited fetches.

## G2-10-004-001  [P2] GAP  facet F01  effort M
- Legacy: Superadmin companies route under Placements group shell, then inner tabs `docs/legacy-source/frontend/src/pages/superadmin/companies/index.js:1-27`
- vNext now: vNext /admin/companies PageHeader title Companies and local tab component; no group shell in page file `src/app/(authenticated)/admin/companies/page.tsx:26-53`
- Fix: Preserve legacy Placements grouped tabs and redirect old deep link

## G2-10-004-005  [P2] GAP  facet F02  effort L
- Legacy: Old global tab is introductory text then 300px search, checkbox, six-column data table, then edit/domain/alias/merge dialogs `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:59-107` `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:108-174`
- vNext now: New shared 12-filter form, six summary stats and article feed, nested Company curation disclosure `src/app/(authenticated)/admin/companies/page.tsx:60-143` `src/app/(authenticated)/admin/companies/page.tsx:198-225`
- Fix: Restore old global table-first architecture and compact toolbar; expose enhancements secondarily

## G2-10-004-006  [P2] GAP  facet F02  effort S
- Legacy: College tab old overview metrics and Add company primary action at top `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:349-361`
- vNext now: New Add company inline action below multi-filter header, with metrics after create form `src/app/(authenticated)/admin/companies/page.tsx:64-142` `src/components/admin/super-admin-college-company-actions.tsx:29-51`
- Fix: Put Add company primary CTA alongside college overview heading

## G2-10-004-009  [P2] GAP  facet F03  effort S
- Legacy: Old global row shows Verified by 42 or Not verified tag next to company name `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:60-66`
- vNext now: New only shows Verified by 42 badge when true, leaves unverified unlabelled `src/app/(authenticated)/admin/companies/page.tsx:153-158`
- Fix: Show Not verified neutral chip explicitly

## G2-10-004-010  [P2] MISSING  facet F03  effort S
- Legacy: Old college company cell shows 32px logo avatar `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:242-259`
- vNext now: New card displays company name but no logo image `src/app/(authenticated)/admin/companies/page.tsx:143-145`
- Fix: Restore company avatar/logo fallback on every company list row

## G2-10-004-012  [P2] GAP  facet F03  effort S
- Legacy: Old Website column provides Visit external action target blank `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:272-279`
- vNext now: New details display website as plain text rather than link `src/app/(authenticated)/admin/companies/page.tsx:162-167`
- Fix: Render verified HTTPS website link with Visit and secure new-tab attributes

## G2-10-004-013  [P2] GAP  facet F03  effort M
- Legacy: Old college list columns sortable Company Drives Last active; last active descending by default `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:242-295`
- vNext now: New supports only sort by Name or Recently changed relationship via filter `src/app/(authenticated)/admin/companies/page.tsx:107-110` `src/modules/placements/admin-company-directory-service.ts:109-112`
- Fix: Add legacy Drives and Last active sort affordances and default for college tab

## G2-10-004-014  [P2] GAP  facet F03  effort M
- Legacy: Old global actions Verify Unverify Edit Domains Other names Merge visible in row `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:70-80`
- vNext now: New operations hidden inside Company details disclosure and Company curation section `src/app/(authenticated)/admin/companies/page.tsx:159-175` `src/app/(authenticated)/admin/companies/page.tsx:198-225`
- Fix: Restore visible per-company action cluster with old labels

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

## G2-10-004-024  [P2] GAP  facet F05  effort S
- Legacy: Old college client-side pagination 10 default and size changer `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:55-56` `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:428-433`
- vNext now: New service always pages exactly 50 relationships and uses Previous Next `src/modules/placements/admin-company-directory-service.ts:109-120` `src/app/(authenticated)/admin/companies/page.tsx:193-197`
- Fix: Restore 10 default and page size selector or document new cap explicitly

## G2-10-004-029  [P2] GAP  facet F06  effort M
- Legacy: Old global merge is AsyncModal Merge X into… with searchable target list `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:161-173`
- vNext now: New merge source/keep dropdowns inline in duplicate cards and separate confirmation `src/components/admin/super-admin-company-merge.tsx:36-61` `src/app/(authenticated)/admin/companies/page.tsx:205-211`
- Fix: Expose Merge on each global company row and searchable company selector including targets beyond page

## G2-10-004-046  [P2] GAP  facet F09  effort M
- Legacy: Old detail History opens modal 720px and Close action `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:523-530`
- vNext now: New Drive history navigates to separate route `src/app/(authenticated)/admin/companies/page.tsx:183-186`
- Fix: Offer old history modal or ensure new route reproduces all stats, headings and row actions

## G2-10-004-050  [P2] GAP  facet F10  effort M
- Legacy: Old college GET company jobs and stats powers Drive history modal `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CompanyController.java:128-160` `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:215-239`
- vNext now: New Drive history is link /admin/companies/id/drives; separate implementation `src/app/(authenticated)/admin/companies/page.tsx:183-185`
- Fix: Verify separate route includes Drives run Applications Hired and job status table parity

## G2-10-004-059  [P2] GAP  facet F13  effort M
- Legacy: Old global list starts loading=true and Antd table spinner; error Couldn't load companies with Retry `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:22-42` `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:90-95`
- vNext now: New async server page renders results and invalid query ErrorState; no local Retry on fetch errors `src/app/(authenticated)/admin/companies/page.tsx:29-39` `src/app/(authenticated)/admin/companies/page.tsx:143-192`
- Fix: Use legacy table loading/error states and retry for transient query failure

## G2-10-004-060  [P2] GAP  facet F13  effort M
- Legacy: Old college fetch retains last results for refresh and shows Couldn't refresh companies warning `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:64-86` `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:362-372`
- vNext now: New server page re-fetches by navigation and no last-good-results status in component `src/app/(authenticated)/admin/companies/page.tsx:26-43`
- Fix: Preserve stale-while-refresh behavior under transient failures

## G2-10-004-061  [P2] GAP  facet F13  effort S
- Legacy: Old college zero list No companies yet — add one to start reusing it across job postings. `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:434-444`
- vNext now: New empty No company relationships No company relationships match current scope `src/app/(authenticated)/admin/companies/page.tsx:191-193`
- Fix: Restore exact no-data message when collection empty and distinction for filtered empty

## G2-10-004-062  [P2] GAP  facet F13  effort S
- Legacy: Old global empty Antd table with default empty state; error separate alert `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:90-95`
- vNext now: New EmptyState No company relationships under relationship list `src/app/(authenticated)/admin/companies/page.tsx:191-193`
- Fix: Differentiate empty curated catalogue vs zero college relations

## G2-10-004-068  [P2] GAP  facet F16  effort M
- Legacy: Old global table min scroll x1060 and page controls 50/page `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:90-95`
- vNext now: New article list break-word and 50 relationship rows; no horizontal table scroll `src/app/(authenticated)/admin/companies/page.tsx:143-197`
- Fix: Test narrow widths 375/768/1280 and apply legacy responsive table wrapper if restoring grid

## G2-10-004-069  [P2] GAP  facet F16  effort M
- Legacy: Old college modal fixed width560 and history modal width720 `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:448-476` `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:523-530`
- vNext now: New forms inline across responsive grid; link navigates to detail route `src/components/admin/super-admin-college-company-actions.tsx:29-51` `src/app/(authenticated)/admin/companies/page.tsx:183-186`
- Fix: Reproduce modal dimensions and mobile overflow/focus handling

## G2-10-004-070  [P2] GAP  facet F16  effort S
- Legacy: Old search width260 college, width300 global with debounced typing `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:373-380` `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:89-92`
- vNext now: New full-width GET search and explicit Filter; md form grid `src/app/(authenticated)/admin/companies/page.tsx:64-70` `src/app/(authenticated)/admin/companies/page.tsx:128-130`
- Fix: Restore toolbar search widths on desktop and one-column mobile
