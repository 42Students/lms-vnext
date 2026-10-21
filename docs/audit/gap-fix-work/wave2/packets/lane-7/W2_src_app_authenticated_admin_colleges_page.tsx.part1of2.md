# Work packet (wave 2): edit src/app/(authenticated)/admin/colleges/page.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-recycle-bin-controller.md, docs/audit/gap2/lane-3/college-controller.md, docs/audit/gap2/lane-4/college-search-controller.md, docs/audit/gap2/lane-5/u030-manage-college-drawer.md, docs/audit/gap2/lane-9/superadmin-colleges.md

## G2-2-023-007  [P2] MISSING  facet F02  effort M
- Legacy: AdminRecycleBinController.java:86-93 platform-level indicator on types
- vNext now: src/app/(authenticated)/admin/colleges/page.tsx has tenant list, no generic level chip
- Fix: Group platform-level college/organization restore separately and badge restricted action.

## G2-3-028-007  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:453-458`
- vNext now: `src/app/(authenticated)/admin/colleges/page.tsx:129-147`
- Fix: Match legacy left 10/24 Create New College Card and right-side table; vNext collapses creation above full-width directory.

## G2-3-028-008  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:395-451`
- vNext now: `src/app/(authenticated)/admin/colleges/page.tsx:27-90`
- Fix: Legacy Manage/Edit/Delete action strip becomes Details/Readiness/Branding/Edit/Archive; match row density/icons.

## G2-3-028-024  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:395-451`
- vNext now: `src/app/(authenticated)/admin/colleges/page.tsx:166-172`
- Fix: Compare legacy Ant Table size changer and local pagination defaults to vNext server-rendered page/pageSize and pagination.

## G2-3-028-043  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:453-458`
- vNext now: `src/app/(authenticated)/admin/colleges/page.tsx:137-151`
- Fix: Legacy create form opens immediately, vNext disclosure starts collapsed.

## G2-3-028-057  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:55-80`
- vNext now: `src/app/(authenticated)/admin/colleges/page.tsx:91-112`
- Fix: Legacy separate Retry actions when college/organization fetch fails; vNext SSR page lacks local retry for list failure.

## G2-3-028-058  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CollegeController.java:87-90`
- vNext now: `src/app/(authenticated)/admin/colleges/page.tsx:91-99`
- Fix: Legacy 401 Authentication required API, vNext authenticated route may redirect. Check exact unauthenticated visual.

## G2-3-028-062  [P2] GAP  facet F14  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:159-251`
- vNext now: `src/app/(authenticated)/admin/colleges/page.tsx:172-172`
- Fix: Verify CSV template headers, per-row sequential creation/errors, duplicates, 25-row limits in vNext CollegeBulkImport.

## G2-3-028-065  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:453-457`
- vNext now: `src/app/(authenticated)/admin/colleges/page.tsx:129-169`
- Fix: Legacy split Row gutter24 Col lg10 and right table vs vNext full-width stacked Disclosure/table at desktop.

## G2-3-028-073  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:385-393`
- vNext now: `src/app/(authenticated)/admin/colleges/page.tsx:113-120`
- Fix: Legacy filters full client-fetched directory, vNext loads full list and paginates after; performance under many colleges requires DB paging.

## G2-3-028-074  [P2] GAP  facet F19  effort M
- Legacy: `src/modules/colleges/admin-tenant-lifecycle-service.ts:61-65`
- vNext now: `src/app/(authenticated)/admin/colleges/page.tsx:113-120`
- Fix: VNext dedicated tenant lifecycle service supports server LIMIT/OFFSET but primary admin colleges page does not use it.

## G2-3-028-085  [P2] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:453-458`
- vNext now: `src/app/(authenticated)/admin/colleges/page.tsx:129-147`
- Fix: Restoring old-module UI requires exact always-expanded left Card rather than upper Disclosure.

## G2-4-014-002  [P2] GAP  facet F01  effort M
- Legacy: Search is API-only controller; old search entry may be called from various college pickers. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:72-84`)
- vNext now: New /admin/colleges screen has browser GET query and table. (`src/app/(authenticated)/admin/colleges/page.tsx:129-171`)
- Fix: Inventory caller widgets and preserve search picker contract, not only admin table.

## G2-4-014-005  [P2] MISSING  facet F02  effort M
- Legacy: Legacy state, city, category lookup endpoints each stand alone. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:187-287`)
- vNext now: New page has one search form, no state/city/category browse sections. (`src/app/(authenticated)/admin/colleges/page.tsx:153-165`)
- Fix: Expose state/city/category selectors or retain API for picker call sites.

## G2-4-014-009  [P2] GAP  facet F03  effort S
- Legacy: Stats response includes totalColleges and states counts. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:305-329`)
- vNext now: Admin college page shows count/page but no state-count card. (`src/app/(authenticated)/admin/colleges/page.tsx:166-171`)
- Fix: Add Super Admin stats endpoint/summary with states total.

## G2-4-014-011  [P2] GAP  facet F03  effort S
- Legacy: Refresh success message Cache refreshed. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:355-364`)
- vNext now: Page Refresh is just GET current page; no cache rebuild action. (`src/app/(authenticated)/admin/colleges/page.tsx:162-165`)
- Fix: If cache retained provide authorized refresh action/notice; otherwise remove outdated copy dependency.

## G2-4-014-013  [P2] GAP  facet F04  effort S
- Legacy: DTO displayName falls back from name to uniqueId. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchDTO.java:39-43`)
- vNext now: New table prints name directly, not code fallback. (`src/app/(authenticated)/admin/colleges/page.tsx:28-44`)
- Fix: Use legacy fallback for unnamed college in search results.

## G2-4-014-018  [P2] MISSING  facet F05  effort M
- Legacy: Search by state takes precedence over city; state/city not combined. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:104-140`)
- vNext now: New college search has neither state nor city filter, only q across city field. (`src/app/(authenticated)/admin/colleges/page.tsx:111-121`)
- Fix: Support state/city facets and define precedence explicitly.

## G2-4-014-021  [P2] MISSING  facet F05  effort S
- Legacy: /states and /categories distinct state names, case-insensitively sorted for org scoped. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:187-209`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:247-269`)
- vNext now: New directory does not list distinct states/categories. (`src/app/(authenticated)/admin/colleges/page.tsx:153-165`)
- Fix: Provide distinct-state options with stable case-insensitive sort.

## G2-4-014-026  [P2] MISSING  facet F06  effort S
- Legacy: POST /refresh accepts no body, superadmin only. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:355-365`)
- vNext now: No cache refresh endpoint; page Refresh is GET. (`src/app/(authenticated)/admin/colleges/page.tsx:162-165`)
- Fix: If cache introduced, add explicit protected admin refresh route.

## G2-4-014-035  [P2] MISSING  facet F09  effort M
- Legacy: GET state/category and stats open no popovers; results consumed by API callers. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:187-287`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:305-329`)
- vNext now: No matching picker/popover surfaced in admin directory. (`src/app/(authenticated)/admin/colleges/page.tsx:153-165`)
- Fix: Restore search-driven selection menus at callers or provide API for them.

## G2-4-014-040  [P2] MISSING  facet F10  effort S
- Legacy: GET /stats returns totalColleges/states with tenant scope. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:305-330`)
- vNext now: New admin page only N colleges count; no state count or endpoint. (`src/app/(authenticated)/admin/colleges/page.tsx:166-171`)
- Fix: Expose scoped stats fields and API.

## G2-4-014-051  [P2] GAP  facet F12  effort S
- Legacy: State/city comparisons equalsIgnoreCase, categories lowercased keys. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchCache.java:154-170`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:390-395`)
- vNext now: New searches city via includes and lacks state filter. (`src/app/(authenticated)/admin/colleges/page.tsx:111-115`)
- Fix: Add equality semantics for facet filters.

## G2-4-014-053  [P2] GAP  facet F13  effort M
- Legacy: Empty query falls back to popular ranking; empty org returns no results. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:118-122`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:65-70`)
- vNext now: New blank q returns alphabetic active college list. (`src/app/(authenticated)/admin/colleges/page.tsx:111-119`; `src/modules/colleges/service.ts:220-249`)
- Fix: Show popular results for empty query on search dropdown.

## G2-4-014-062  [P2] GAP  facet F16  effort M
- Legacy: Limit15 targeted autocomplete-like result volume. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:75-84`)
- vNext now: New default25 page rows and mobile prioritized table. (`src/modules/colleges/admin-directory-query-model.ts:17-21`; `src/app/(authenticated)/admin/colleges/page.tsx:153-171`)
- Fix: Build compact mobile dropdown with max15 and keyboard selection.

## G2-4-014-064  [P2] GAP  facet F17  effort S
- Legacy: Selecting a college records usage after permission check, no focus management in controller. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:289-303`)
- vNext now: New Tenant setup link navigates to college detail without usage tracking. (`src/app/(authenticated)/admin/colleges/page.tsx:61-65`)
- Fix: Ensure picker keyboard Enter and click both record authorized selection.

## G2-4-014-065  [P2] GAP  facet F18  effort S
- Legacy: API copy: Colleges retrieved in Nms, Popular colleges retrieved, States retrieved. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:161-183`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:206-209`)
- vNext now: New response has colleges list only, UI title Colleges. (`src/app/api/colleges/route.ts:18-20`; `src/app/(authenticated)/admin/colleges/page.tsx:131-134`)
- Fix: Map exact machine messages where legacy clients show feedback.

## G2-4-014-067  [P2] GAP  facet F18  effort S
- Legacy: New page Search college, code, city or organization. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:45-59`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:72-84`)
- vNext now: New label accurately lists only four fields, but legacy supports eight. (`src/app/(authenticated)/admin/colleges/page.tsx:153-155`)
- Fix: Restore all searchable fields and update placeholder/help.

## G2-4-014-069  [P2] GAP  facet F19  effort L
- Legacy: Exact/prefix/category indexes, fuzzy fallback and usage counters. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:33-48`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:118-188`)
- vNext now: New page filters all in-memory returned colleges by substring then page slices. (`src/app/(authenticated)/admin/colleges/page.tsx:101-119`)
- Fix: Implement indexed scoped search/server top-N for larger tenant sets.

## G2-4-014-072  [P2] GAP  facet F20  effort S
- Legacy: Search state input may contain mixed case, cache state filter equalsIgnoreCase. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchCache.java:154-161`)
- vNext now: New locale-lowercase substring match for city only. (`src/app/(authenticated)/admin/colleges/page.tsx:111-115`)
- Fix: Use casefolded exact state and city predicate in API.

## G2-5-030-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy Colleges section opens `Manage College` Drawer tied to selected college record. `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:1-4,35-36`, `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:9-10`
- vNext now: vNext `Tenant setup` navigates to `/admin/colleges/{uuid}` full page. `src/app/(authenticated)/admin/colleges/page.tsx:60-65`, `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:12-27`
- Fix: Recreate contextual drawer or equivalent side panel while retaining deep link.

## G2-9-032-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy reusable list accepts readOnly, defaultOrgId and onCreated `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:23-52`
- vNext now: Page is fixed Super Admin route with tenant safety scope; no embedded callbacks `src/app/(authenticated)/admin/colleges/page.tsx:91-135`
- Fix: Preserve reusable read-only/create callbacks for tenant setup embedding

## G2-9-032-002  [P2] GAP  facet F01  effort S
- Legacy: readOnly disables mutations with Clear scope to manage colleges warning `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:77-80,87-91`
- vNext now: Creatable org filter controls render; no exact readOnly warning `src/app/(authenticated)/admin/colleges/page.tsx:122-127,136-152`
- Fix: Show scoped permission reason instead of silently hiding actions

## G2-9-032-004  [P2] GAP  facet F02  effort M
- Legacy: Two card Row gutter24 left lg10 Create New College, right lg14 Existing Colleges `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:453-458,551-555`
- vNext now: Vertically stacked PageHeader, collapsed Create College, form and unboxed DataTable `src/app/(authenticated)/admin/colleges/page.tsx:129-173`
- Fix: Restore two-card desktop 10/14 proportions and small Ant card framing

## G2-9-032-005  [P2] GAP  facet F02  effort S
- Legacy: Create New College always visible; optional Address details collapsed only `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:455-548`
- vNext now: Entire Create College wrapped in collapsed Disclosure `src/app/(authenticated)/admin/colleges/page.tsx:136-146`
- Fix: Keep creation card always visible; collapse address only

## G2-9-032-006  [P2] GAP  facet F02  effort M
- Legacy: Existing Colleges card toolbar in title extra `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:551-582`
- vNext now: Standalone search form and count above table `src/app/(authenticated)/admin/colleges/page.tsx:153-166`
- Fix: Put search/import/refresh in Existing Colleges card header

## G2-9-032-007  [P2] GAP  facet F02  effort L
- Legacy: Manage College drawer overlays current list `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:673-680`
- vNext now: Tenant setup link navigates to separate detail page `src/app/(authenticated)/admin/colleges/page.tsx:60-85` `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:12-45`
- Fix: Recreate Manage drawer with tabs and unsaved close guard

## G2-9-032-009  [P2] GAP  facet F03  effort S
- Legacy: Bulk Import has Upload icon; Refresh has Reload icon `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:566-580`
- vNext now: Bulk Import at bottom; Refresh text link in filter row `src/app/(authenticated)/admin/colleges/page.tsx:162-172` `src/components/admin/college-bulk-import.tsx:48-74`
- Fix: Expose Bulk Import and Refresh icon buttons beside search

## G2-9-032-010  [P2] GAP  facet F03  effort M
- Legacy: Manage visible text button, separate icon-only Edit and danger Delete `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:405-448`
- vNext now: Tenant setup link, More dropdown with Edit and Archive `src/app/(authenticated)/admin/colleges/page.tsx:60-85`
- Fix: Restore inline Manage/Edit/Delete buttons and row aria-labels

## G2-9-032-011  [P2] GAP  facet F03  effort S
- Legacy: Count Tag N colleges and Clear search text link `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:591-594`
- vNext now: Plain text N colleges · Page X of Y `src/app/(authenticated)/admin/colleges/page.tsx:166-166`
- Fix: Restore result-count Tag and legacy Clear search placement
