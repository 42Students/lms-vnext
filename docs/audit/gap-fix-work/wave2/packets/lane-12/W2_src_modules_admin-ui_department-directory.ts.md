# Work packet (wave 2): edit src/modules/admin-ui/department-directory.ts

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/department-search-controller.md, docs/audit/gap2/lane-9/superadmin-departments.md

## G2-20-013-006  [P2] MISSING  facet F03  effort S
- Legacy: Legacy response contains optional chair/vicechair, collegeId/name `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/departments/DepartmentSearchDTO.java:15-20`
- vNext now: New row only id,name,createdAt,usage counts `src/modules/admin-ui/department-directory.ts:6-15`
- Fix: Expose chair/vice chair where legacy picker depended on those fields

## G2-20-013-009  [P2] GAP  facet F05  effort S
- Legacy: Cache search handles synonyms cse/ece/eee/mech etc `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/departments/DepartmentSearchCache.java:39-56`
- vNext now: New filterDepartmentRows only lowercase name substring `src/modules/admin-ui/department-directory.ts:17-25`
- Fix: Port synonym normalization or accept literal-only search per owner decision

## G2-20-013-010  [P2] GAP  facet F05  effort S
- Legacy: Legacy search matches department name AND college name `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/departments/DepartmentSearchDTO.java:30-35`
- vNext now: New filter only department name `src/modules/admin-ui/department-directory.ts:20-24`
- Fix: Include collegeName in searchable index for global SA

## G2-20-013-033  [P2] GAP  facet F19  effort M
- Legacy: In-memory cached search intended ultra-fast and records duration `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/departments/DepartmentSearchController.java:60-62,89-110`
- vNext now: Client filtering all loaded rows and pagination in JS `src/modules/admin-ui/department-directory.ts:17-41`
- Fix: Check 10k departments and load time; avoid huge full dataset on role landing

## G2-20-013-036  [P2] GAP  facet F21  effort S
- Legacy: Java cache postConstruct DB snapshot with manual refresh `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/departments/DepartmentSearchCache.java:30-35,103-105`
- vNext now: New per-page server data and client filters, no cache class `src/modules/admin-ui/department-directory.ts:1-5`
- Fix: Verify revalidation and mutation read-your-writes behavior

## G2-20-013-037  [P2] GAP  facet F22  effort S
- Legacy: Search DTO numeric id/college/chair data from JPA Department and College [C:88-100,D:15-20]
- vNext now: New typed row UUID id/name/createdAt/usage only `src/modules/admin-ui/department-directory.ts:6-15`
- Fix: Map JPA numeric IDs and ownership/chair fields to scoped Postgres UUID relations

## G2-20-013-038  [P2] GAP  facet F23  effort S
- Legacy: Legacy in-memory synonym search has selection popularity side effect [C:39-56,L:193-206]
- vNext now: vNext opts for direct local list search with CSV and no popularity `src/modules/admin-ui/department-directory.ts:17-66`
- Fix: Owner decide whether popularity and synonyms deliberately retired

## G2-9-024-015  [P2] GAP  facet F04  effort S
- Legacy: CSV columns id,name,programs,courses,faculty `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:237-242`
- vNext now: CSV ID,Department Name,Programs,Courses,Faculty `src/modules/admin-ui/department-directory.ts:49-75`
- Fix: Match source column headers needed by CSV consumers

## G2-9-024-051  [P2] GAP  facet F14  effort S
- Legacy: Legacy CSV export columns id,name,programs,courses,faculty `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:231-243`
- vNext now: New export uses quoted headers and formula escaping `src/modules/admin-ui/department-directory.ts:49-75`
- Fix: Preserve legacy header naming while retaining safe CSV escaping

## G2-20-013-011  [P3] GAP  facet F05  effort S
- Legacy: Legacy by-college getByCollegeId takes first N in cache insertion order `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/departments/DepartmentSearchCache.java:108-113`
- vNext now: New sorts localeCompare name ASC even with no search `src/modules/admin-ui/department-directory.ts:20-25`
- Fix: Document changed default ordering, use legacy order for literal parity

## G2-20-013-024  [P3] GAP  facet F12  effort S
- Legacy: Search synonyms expand common department acronyms `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/departments/DepartmentSearchCache.java:45-55`
- vNext now: No synonyms, raw name filter `src/modules/admin-ui/department-directory.ts:17-25`
- Fix: Preserve cse/ece etc aliases for user search

## G2-20-013-025  [P3] GAP  facet F12  effort S
- Legacy: Search uses case-insensitive contains on searchableText `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/departments/DepartmentSearchController.java:93-103`
- vNext now: New trims en-IN casefold and name includes query `src/modules/admin-ui/department-directory.ts:17-24`
- Fix: Include college field and verify accent normalization
