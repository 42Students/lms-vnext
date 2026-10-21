# Work packet (wave 2): edit src/app/api/academics/programs/route.ts

38 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-programs.md, docs/audit/gap2/lane-13/new-program.md, docs/audit/gap2/lane-20/superadmin-sections-programs.md, docs/audit/gap2/lane-3/l14-u026-program-controller.md, docs/audit/gap2/lane-8/program-search-controller.md, docs/audit/gap2/lane-9/college-admin-programs.md

## G2-10-020-055  [P2] GAP  facet F10  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:112-131; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:43-62 — POST /api/v1/program/create with dept_id, name, duration_years.
- vNext now: src/components/admin/admin-program-directory.tsx:104-125; src/app/api/academics/programs/route.ts:28-44 — POST /api/academics/programs with code and durationTerms.
- Fix: Preserve form mapping and feedback, enforce same college.

## G2-13-018-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:59-83` create and `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:145-210` update/delete, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:86-143` list/find routes
- vNext now: `src/app/api/academics/programs/route.ts:13-45` GET list and POST create only, mutation updates via other API route
- Fix: Maintain route translation inventory for create/fetch/update/delete with new resource paths

## G2-13-018-025  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:26` /api/v1/new-program and `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:59-62` /create, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:86-88` /fetchAll
- vNext now: `src/app/api/academics/programs/route.ts:13-22` GET /api/academics/programs?collegeId, `src/app/api/academics/programs/route.ts:28-36` POST create
- Fix: Document route and parameter changes for old frontend service consumers

## G2-13-018-027  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:227-245` paged college PageResponseDTO totalElements/pages/size/number
- vNext now: `src/app/api/academics/programs/route.ts:17-22` GET returns flat {programs}, not paged envelope
- Fix: Provide paged API projection for large colleges or mark endpoint deprecated with caller migration

## G2-20-029-044  [P2] GAP  facet F10  effort M
- Legacy: Create POST new-program/create JSON name,dept_id,duration_years (`docs/legacy-source/frontend/src/api/Services/AdminService.js:117-126`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:59-83`)
- vNext now: POST /api/academics/programs JSON departmentId,name,code,durationTerms, returns 201 (`src/components/admin/admin-program-directory.tsx:107-123`, `src/app/api/academics/programs/route.ts:28-36`)
- Fix: Adapter translates dept_id/duration_years and status handling

## G2-14-026-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:24-29`
- vNext now: `src/app/api/academics/programs/route.ts:13-36`
- Fix: Legacy /api/v1/program/create and fetchAllPrograms/fetchProgramDetails/getProgramsByCollege vs vNext unified /api/academics/programs GET/POST and [programId] PATCH/DELETE.

## G2-14-026-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:43-62`
- vNext now: `src/app/api/academics/programs/route.ts:28-43`
- Fix: Legacy POST returns 200 envelope status OK/data; vNext POST returns 201 {program}.

## G2-14-026-008  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:69-73`
- vNext now: `src/app/api/academics/programs/route.ts:17-22`
- Fix: Legacy query name deptId numeric, vNext collegeId UUID and departmentId UUID.

## G2-14-026-035  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:98-101`
- vNext now: `src/app/api/academics/programs/route.ts:13-25`
- Fix: Legacy 404 empty college listing, vNext 200 [] may change visible error/empty message in old consumers.

## G2-14-026-042  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:47-50`
- vNext now: `src/app/api/academics/programs/route.ts:28-36`
- Fix: Legacy Spring Bean Validation messages in response; vNext Zod issue code and error mapping, match field-aria feedback.

## G2-14-026-050  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:24-26`
- vNext now: `src/app/api/academics/programs/route.ts:13-46`
- Fix: Legacy credentialed CORS wildcard 42lms.com, vNext same-origin request checks for POST and bearer/session auth, incompatible cross-origin old API clients.

## G2-14-026-055  [P2] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:94-102`
- vNext now: `src/app/api/academics/programs/route.ts:13-25`
- Fix: Legacy empty-college 404 vs vNext [] success and no exact response envelope.

## G2-8-013-001  [P2] MISSING  facet F01  effort M
- Legacy: 7 REST operations under /api/v2/programs: search/popular/department/categories/category/select/stats/exists/refresh (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/programs/ProgramSearchController.java:61-256`)
- vNext now: GET/POST /api/academics/programs; management program routes, no same search-specific endpoints (`src/app/api/academics/programs/route.ts:13-46`)
- Fix: Provide route aliases for existing clients; enumerate which search-only endpoint must remain.

## G2-8-013-003  [P2] GAP  facet F02  effort M
- Legacy: Program search results include duration-free name/year and deptName DTO (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/programs/ProgramSearchController.java:61-109`)
- vNext now: Program list includes name,code,durationTerms/status/departmentName (`src/app/api/academics/programs/route.ts:182-205`)
- Fix: Match legacy program picker labels and secondary department text.

## G2-8-013-004  [P2] MISSING  facet F03  effort M
- Legacy: Legacy /popular returns at most 10 and tracks frequent selections (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/programs/ProgramSearchController.java:112-129`)
- vNext now: No popular ranking in program list; alphabetical by department/name (`src/app/api/academics/programs/route.ts:200-205`)
- Fix: Introduce popular ranking if the usage-driven picker remains in scope.

## G2-8-013-005  [P2] GAP  facet F03  effort M
- Legacy: Legacy /categories returns distinct alphabetically sorted department names (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/programs/ProgramSearchController.java:148-167`)
- vNext now: New list returns program rows with department names, not separate category control (`src/app/api/academics/programs/route.ts:182-205`)
- Fix: Expose distinct department names sorted case-insensitively.

## G2-8-013-006  [P2] GAP  facet F04  effort M
- Legacy: ProgramSearchDTO id Long, name,startYear,endYear,deptName,deptId,scope (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/programs/ProgramSearchCache.java:94-115`)
- vNext now: VNext program ID UUID, name,code,durationTerms,department UUID (`src/app/api/academics/programs/route.ts:182-205`)
- Fix: Map old integer program IDs and program summary to canonical UUIDs.

## G2-8-013-008  [P2] GAP  facet F05  effort M
- Legacy: GET /search query default '' limit15 optional deptId (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/programs/ProgramSearchController.java:61-69`)
- vNext now: GET list requires collegeId and optionally departmentId, no query/limit (`src/app/api/academics/programs/route.ts:13-21`)
- Fix: Implement bounded substring search with a 15-result default.

## G2-8-013-009  [P2] GAP  facet F05  effort M
- Legacy: Legacy /department/{deptId} limit default50 (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/programs/ProgramSearchController.java:131-145`)
- vNext now: New program list has departmentId query but returns full rows (`src/app/api/academics/programs/route.ts:155-205`)
- Fix: Retain 50-row first page for department results and reveal overflow.

## G2-8-013-010  [P2] GAP  facet F05  effort M
- Legacy: Legacy /category/{department} case-insensitive name matching with default50 (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/programs/ProgramSearchController.java:169-188`)
- vNext now: New program filter by department UUID not category name (`src/app/api/academics/programs/route.ts:155-179`)
- Fix: Resolve legacy named department links within allowed college.

## G2-8-013-011  [P2] GAP  facet F05  effort M
- Legacy: Legacy /search query matches dept program searchableText and synonyms (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/programs/ProgramSearchCache.java:79-109`)
- vNext now: New list query has no keyword/synonym matching (`src/app/api/academics/programs/route.ts:169-205`)
- Fix: Restore synonym rules (btech, mtech, mba) for autocomplete if required.

## G2-8-013-012  [P2] MISSING  facet F05  effort M
- Legacy: Legacy popular tracks selection counts and returns scoped hits (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/programs/ProgramSearchController.java:117-127`)
- vNext now: New list sorted by alphabetical, no usage rank (`src/app/api/academics/programs/route.ts:200-205`)
- Fix: Either reimplement scoped popular selection tracking or document removal.

## G2-8-013-013  [P2] GAP  facet F06  effort M
- Legacy: No mutation input in GET /search except query, limit, deptId (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/programs/ProgramSearchController.java:61-69`)
- vNext now: New GET requires UUID collegeId and validates UUID department (`src/app/api/academics/programs/route.ts:13-21`)
- Fix: Validate canonical college and department query with safe URL aliases.

## G2-8-013-021  [P2] GAP  facet F10  effort M
- Legacy: 9 REST methods for search/picks/stats/refresh (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/programs/ProgramSearchController.java:61-256`)
- vNext now: GET list and POST create only (`src/app/api/academics/programs/route.ts:13-46`)
- Fix: Inventory all legacy endpoints and caller routes before removing aliases.

## G2-8-013-023  [P2] GAP  facet F11  effort M
- Legacy: Global Super Admin can search unscoped (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/programs/ProgramSearchController.java:44-59`)
- vNext now: New API requires concrete collegeId and academics.read (`src/app/api/academics/programs/route.ts:143-153`)
- Fix: Add tightly permissioned global search for active Super Admin acting scope.

## G2-8-013-026  [P2] GAP  facet F12  effort M
- Legacy: Lookup by category name equalsIgnoreCase (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/programs/ProgramSearchController.java:169-184`)
- vNext now: New department filter strict UUID equality (`src/app/api/academics/programs/route.ts:155-179`)
- Fix: Map case-insensitive department category names safely.

## G2-8-013-027  [P2] GAP  facet F12  effort M
- Legacy: Legacy /exists compares programName ignoring case (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/programs/ProgramSearchController.java:230-242`)
- vNext now: New creation asserts name uniqueness under active department (`src/app/api/academics/programs/route.ts:66-97`)
- Fix: Use a read-only scoped exists endpoint; never mutate during lookups.

## G2-8-013-029  [P2] GAP  facet F13  effort M
- Legacy: Cache load failure logs but does not throw (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/programs/ProgramSearchController.java:65-77`)
- vNext now: DB list errors propagate to apiErrorResponse (`src/app/api/academics/programs/route.ts:13-25`)
- Fix: No file operation needed on either endpoint.

## G2-8-013-034  [P2] GAP  facet F18  effort M
- Legacy: Legacy /categories success copy `Categories retrieved` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/programs/ProgramSearchController.java:148-167`)
- vNext now: No categories JSON route; list returns plain programs (`src/app/api/academics/programs/route.ts:13-25`)
- Fix: Restore useful deptId requirement explanation at the frontend input.

## G2-8-013-035  [P2] GAP  facet F18  effort M
- Legacy: Legacy missing deptId message exact `deptId is required (or use GLOBAL superadmin mode)` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/programs/ProgramSearchController.java:95-99`)
- vNext now: New error via schema/permission helper not same text (`src/app/api/academics/programs/route.ts:143-153`)
- Fix: Bound SQL search and add query indexes to retain responsiveness at scale.

## G2-8-013-036  [P2] GAP  facet F19  effort M
- Legacy: Legacy cached lookup and limit speed, logs duration debug (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/programs/ProgramSearchCache.java:77-109`)
- vNext now: New DB query ordered by department/name with no row cap (`src/app/api/academics/programs/route.ts:169-205`)
- Fix: Define whitespace/casefold normalization and wildcard escaping.

## G2-8-013-037  [P2] GAP  facet F20  effort M
- Legacy: Legacy query lowercases but doesn't trim search on scoped branch when nonempty (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/programs/ProgramSearchController.java:86-93`)
- vNext now: New list has no query string search (`src/app/api/academics/programs/route.ts:169-205`)
- Fix: Reconcile global Super Admin organization scope versus college-scoped list.

## G2-8-013-039  [P2] GAP  facet F21  effort M
- Legacy: Legacy POST select mutates in-memory usage rank without DB persistence (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/programs/ProgramSearchController.java:191-205`)
- vNext now: New POST creates persistent academic Program row (`src/app/api/academics/programs/route.ts:28-46`)
- Fix: No refresh action needed if no program cache exists.

## G2-8-013-041  [P2] GAP  facet F22  effort M
- Legacy: Old NewProgram integer ID and dept integer; scopes resolved via cache (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/programs/ProgramSearchCache.java:94-115`)
- vNext now: New program UUID and department UUID relations (`src/app/api/academics/programs/route.ts:182-205`)
- Fix: Preserve added code/duration fields as optional enriched metadata.

## G2-8-013-043  [P2] GAP  facet F23  effort M
- Legacy: Legacy fuzzy synonyms and popularity statistics as search-only extras (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/programs/ProgramSearchCache.java:43-63`)
- vNext now: New CRUD program list is more predictable but lacks search utility (`src/app/api/academics/programs/route.ts:138-205`)
- Fix: Keep stronger permission and same-origin safety in all write endpoints.

## G2-9-018-042  [P2] GAP  facet F10  effort M
- Legacy: POST /api/v1/new-program/create with name, dept_id,duration_years `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:113-120` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:59-83`
- vNext now: POST /api/academics/programs with UUID departmentId, name, code,durationTerms, returns 201 `src/components/admin/admin-program-directory.tsx:109-125` `src/app/api/academics/programs/route.ts:28-36`
- Fix: Keep UI years while transparently converting to terms; verify API error contract.

## G2-14-026-045  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:85-88`
- vNext now: `src/app/api/academics/programs/route.ts:23-26`
- Fix: Exact error Program not found vs vNext error codes; UI must render friendly message.

## G2-9-018-041  [P3] GAP  facet F10  effort M
- Legacy: GET /api/v1/new-program/fetchByCollege?collegeId; GET college departments `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:126-132` `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:66-107`
- vNext now: Server listPrograms/listDepartments/listArchived through context `src/app/(authenticated)/college/programs/page.tsx:16-22` and GET /api/academics/programs `src/app/api/academics/programs/route.ts:13-26`
- Fix: Record route contract changes; preserve same scoped data.
