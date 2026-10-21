# Work packet (wave 2): edit src/modules/courses/college-course-catalogue-service.ts

22 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u003-superadmin-courses.md, docs/audit/gap2/lane-3/college-admin-courses.md, docs/audit/gap2/lane-3/course-search-controller.md

## G2-18-003-021  [P2] GAP  facet F04  effort M
- Legacy: Legacy CSV fields id, courseName, shortTitle, departmentId, active, enabled, visibleToLearners. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:562-568`
- vNext now: vNext catalogue export selects id/name/code/shortTitle/officialCode/color/takeaways/description/status/departmentName. `src/modules/courses/college-course-catalogue-service.ts:66-77`
- Fix: Version export or match legacy column order and visible-state Booleans.

## G2-18-003-026  [P2] GAP  facet F05  effort S
- Legacy: Legacy client table default order from GET coursesByCollege, no explicit sort configured. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:165-182`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:614-629`
- vNext now: vNext SQL catalogue sorted NAME_ASC by default, supports descending/name/code. `src/modules/courses/college-course-catalogue-service.ts:31-37`, `src/app/(authenticated)/college/courses/page.tsx:16-22`
- Fix: Verify legacy backend response order live; if different, match initial order and sort affordances.

## G2-18-003-027  [P2] GAP  facet F05  effort M
- Legacy: Legacy search name, shortTitle, metadata.course_code case insensitive. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:403-412`
- vNext now: vNext search course name, code, department name case-insensitive. `src/modules/courses/college-course-catalogue-service.ts:24-29`
- Fix: Search shortTitle and officialCode to preserve legacy lookups; department search as extra.

## G2-18-003-029  [P2] GAP  facet F05  effort M
- Legacy: Legacy 10/25/50/100 page options persistent via localStorage admin-courses-page-size. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:18-19`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:143-151`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:623-628`
- vNext now: vNext course catalogue server pages fixed value; superadmin query has pageSize. `src/modules/courses/college-course-catalogue-service.ts:41-64`, `src/app/(authenticated)/admin/courses/page.tsx:12-17`
- Fix: Unify page size 10/25/50/100 in both admin modes and persist safely.

## G2-18-003-082  [P2] GAP  facet F14  effort M
- Legacy: Legacy CSV courses.csv filtered rows: id, name, shortTitle, departmentId, active, enabled, visibleToLearners. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:561-571`
- vNext now: vNext course export includes metadata and status, different field names. `src/modules/courses/college-course-catalogue-service.ts:66-77`
- Fix: Match columns/order or publish backward-compatible export.

## G2-18-003-098  [P2] GAP  facet F19  effort M
- Legacy: Legacy full list GET then in-browser search, page 10..100, preserves local size. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:153-182`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:614-629`
- vNext now: vNext SQL catalogue paginates server side with fixed query page size. `src/modules/courses/college-course-catalogue-service.ts:41-64`
- Fix: Support legacy pagination options while keeping DB bounded and stable ordering.

## G2-3-008-021  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:408-411`
- vNext now: `src/modules/courses/college-course-catalogue-service.ts:24-38`; `src/components/courses/admin-course-overview.tsx:483-500`
- Fix: Legacy case-insensitive search course name/short title/metadata course_code; new q search name/code/department. Restore shortTitle search and explicit department extension.

## G2-3-008-022  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:614-630`
- vNext now: `src/modules/courses/college-course-catalogue-service.ts:24-64`
- Fix: Legacy table shows hidden/deactivated courses, vNext catalogue SQL filters status ACTIVE, hiding archived courses even when workspace has them. Add archived filter/list.

## G2-3-008-070  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:148-180`
- vNext now: `src/modules/courses/admin-course-workspace.ts:11-38`; `src/modules/courses/college-course-catalogue-service.ts:39-65`
- Fix: Legacy one unbounded getCoursesByCollege + client pagination, vNext full multi-relation workspace plus paginated SQL second query; benchmark number of DB joins.

## G2-3-014-002  [P2] MISSING  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/api/Services/CourseSearchService.js:14-28`, `34-96`
- vNext now: `src/modules/courses/college-course-catalogue-service.ts:41-65`, `src/components/shell/topbar/command-search.tsx:35-53`
- Fix: Legacy offers 11 specific v2 routes (search, popular, departments, department/{id}, categories, category, select, slug-select, stats, exists, refresh). vNext scattered SQL catalogue/learner fetch lack equivalent surface. Map each route explicitly.

## G2-3-014-005  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchController.java:99-163`
- vNext now: `src/modules/courses/college-course-catalogue-service.ts:24-64`
- Fix: Legacy search API is ranked in-memory and returns a compact DTO list; vNext College catalogue is SQL paginated page view with fields+sorting. Keep distinct header suggestion service, not catalogue-only UI.

## G2-3-014-010  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchCache.java:134-146`
- vNext now: `src/modules/courses/college-course-catalogue-service.ts:53-64`, `src/db/schema/courses.ts:34-64`
- Fix: Legacy cache includes only active courses but preserves enabled flag and slug; vNext catalogue active filter and course UUID records do not expose legacy slug/enabled in search. Define display/disabled behavior for status and active offering.

## G2-3-014-014  [P2] MISSING  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchController.java:238-267`
- vNext now: `src/modules/courses/college-course-catalogue-service.ts:24-29`, `src/db/schema/courses.ts:34-41`
- Fix: Legacy list categories sorted case-insensitive and category named department lookup; vNext catalogue has departmentName in rows but no matching global category API. Implement allowed category name list and lookup.

## G2-3-014-015  [P2] MISSING  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchController.java:305-335`, `337-351`
- vNext now: `src/modules/courses/college-course-catalogue-service.ts:47-64`
- Fix: Legacy admin stats totalCourses/categories/departments and exists(name) checker; vNext catalogue exposes only total/paged rows. Add appropriate permission-scoped stats/existence read.

## G2-3-014-017  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchController.java:104-107`, `165-168`, `224-228`
- vNext now: `src/modules/courses/college-course-catalogue-service.ts:41-65`
- Fix: Legacy permits integer `limit` (no explicit max/min in controller), vNext catalogue fixed paginated page size. Implement safe bound with documented clamps, avoiding negative limit exceptions.

## G2-3-014-027  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchController.java:99-163`, `165-267`
- vNext now: `src/modules/courses/college-course-catalogue-service.ts:24-64`
- Fix: Legacy GET path params `query`, `limit`, `deptId` vs new server-read catalogue q/page/sort; preserve compatibility or update all consumers and document route mapping.

## G2-3-014-031  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchCache.java:103-129`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:118-189`
- vNext now: `src/modules/courses/college-course-catalogue-service.ts:24-38`, `src/modules/courses/learner-course-card-search-model.ts:3-15`
- Fix: Legacy cache loads active courses once and uses exact/prefix/fuzzy/ranking, whereas vNext SQL/live local rows match substring and sort name/code. Restore weighted result order where legacy user-visible.

## G2-3-014-044  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchCache.java:46-56`, `93-129`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:65-73`
- vNext now: `src/modules/courses/college-course-catalogue-service.ts:41-65`, `src/components/shell/topbar/command-search.tsx:32-53`
- Fix: Legacy cache preloads every active course on app start and can refresh in-memory; vNext per-request SQL catalogue plus one learner preload. Compare latency and authorization under multi-college scale before choosing cache.

## G2-3-014-045  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:118-218`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchCache.java:160-205`
- vNext now: `src/modules/courses/college-course-catalogue-service.ts:47-64`
- Fix: Legacy list search may scan prefix/fuzzy allItems and scoped getByCollege before filtering; vNext SQL offset/page query scales with index but different ranking and result completeness. Add bounded search index and deterministic order.

## G2-3-014-049  [P2] MISSING  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchCache.java:46-56`, `149-155`
- vNext now: `src/modules/courses/college-course-catalogue-service.ts:41-65`
- Fix: Legacy @PostConstruct initial cache load plus admin refresh endpoint; vNext uses DB queries only, no scheduled/search-index refresh. Implement equivalent only if restoring indexed fuzzy search.

## G2-18-003-020  [P3] GAP  facet F04  effort S
- Legacy: Legacy course name fallback `Untitled course`, short title `—`, department `Department name unavailable (ID N)`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:25-25`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:468-487`
- vNext now: vNext normalized required name, shortTitle possibly null, departmentName strict joined. `src/components/courses/admin-course-overview.tsx:100-133`, `src/modules/courses/college-course-catalogue-service.ts:52-64`
- Fix: Use legacy empty placeholders for mapping/corrupt records, not blank badges.

## G2-3-014-043  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchController.java:160-163`, `187-189`, `221-222`
- vNext now: `src/modules/courses/college-course-catalogue-service.ts:41-65`
- Fix: Legacy response text Courses retrieved in {ms}ms/Popular courses retrieved/Categories retrieved/Checked absent in vNext SQL service. Map only if maintaining v2 API compatibility.
