# Work packet (wave 2): edit src/modules/academics/college-academic-directory-service.ts

24 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l15-u029-superadmin-semesters.md, docs/audit/gap2/lane-12/new-program-structure.md, docs/audit/gap2/lane-6/batch-search-controller.md, docs/audit/gap2/lane-6/semester-search-controller.md, docs/audit/gap2/lane-9/college-admin-semesters.md

## G2-15-029-040  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:33-42 — client search all loaded rows name/number/program
- vNext now: src/modules/academics/college-academic-directory-service.ts:75-103 — server search name/program/code but not term number unless dedicated filter
- Fix: Include numeric semester number in search input

## G2-15-029-046  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/frontend/src/api/Services/SemesterService.js:5-18 — numeric IDs, snake_case
- vNext now: src/modules/academics/college-academic-directory-service.ts:53-68 — program_terms UUID, camelCase termNumber
- Fix: Record source-to-target ID mapping and immutable program term relationships

## G2-12-018-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy program details nests structures with course list `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NewProgramServiceImpl.java:223-273`
- vNext now: New semester list and mappings separately queried `src/modules/academics/college-academic-directory-service.ts:53-105` `src/modules/academics/college-term-mapping-service.ts:60-95`
- Fix: Return combined program structure list and mapped course summaries.

## G2-12-018-012  [P2] GAP  facet F05  effort S
- Legacy: Legacy fetchAll unpaged, filters per program for caller `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:100-120`
- vNext now: New semesters directory paginated and scoped college with explicit filters `src/modules/academics/college-academic-directory-service.ts:53-105`
- Fix: Preserve per-program unpaged list for integrated program structure views.

## G2-12-018-014  [P2] GAP  facet F05  effort S
- Legacy: Legacy fetchActiveSemesters returns only ACTIVE structures `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ProgramStructureServiceImpl.java:106-115`
- vNext now: New directory can filter isActive, no COMPLETED separate `src/modules/academics/college-academic-directory-service.ts:81-83`
- Fix: Differentiate inactive from completed in active filter and archives.

## G2-6-014-007  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/batches/BatchSearchController.java:85-104`
- vNext now: `src/modules/academics/college-academic-directory-service.ts:193-205`
- Fix: Match program-specific substring filter versus global fuzzy search

## G2-6-014-008  [P2] MISSING  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/batches/BatchSearchController.java:134-191`
- vNext now: `src/modules/academics/college-academic-directory-service.ts:193-205`
- Fix: Expose program and category GET endpoints with correct matching

## G2-6-014-009  [P2] MISSING  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/batches/BatchSearchController.java:237-251`
- vNext now: `src/modules/academics/college-academic-directory-service.ts:193-205`
- Fix: Implement scoped exact-name exists check

## G2-6-014-018  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/batches/BatchSearchCache.java:56-69`
- vNext now: `src/modules/academics/college-academic-directory-service.ts:167-188`
- Fix: Legacy includes all Batch records while current SQL constrains joins/status

## G2-6-014-027  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:164-187`
- vNext now: `src/modules/academics/college-academic-directory-service.ts:193-205`
- Fix: Legacy fuzzy Levenshtein 2 for >=3 characters absent in ilike

## G2-6-014-032  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/batches/BatchSearchCache.java:71-107`
- vNext now: `src/modules/academics/college-academic-directory-service.ts:167-193`
- Fix: Legacy deleted program may retain batch with null programName; current join excludes

## G2-6-013-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/semesters/SemesterSearchController.java:48-78`
- vNext now: `src/modules/academics/college-academic-directory-service.ts:54-105`
- Fix: Provide small autocomplete semantics separately from full directory list

## G2-6-013-005  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/semesters/SemesterSearchDTO.java:13-24`
- vNext now: `src/modules/academics/college-academic-directory-service.ts:58-73`
- Fix: Return id,programId,programName,semesterNumber,name in compatibility API

## G2-6-013-008  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/semesters/SemesterSearchController.java:69-75`
- vNext now: `src/modules/academics/college-academic-directory-service.ts:92-105`
- Fix: Legacy ranks fuzzy matches first before program filter; new SQL applies program filter first

## G2-6-013-009  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/semesters/SemesterSearchCache.java:34-40`
- vNext now: `src/modules/academics/college-academic-directory-service.ts:92-96`
- Fix: Old searches Semester name and Program name, new also program code; document expanded matching

## G2-6-013-018  [P2] MISSING  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/semesters/SemesterSearchController.java:94-100`
- vNext now: `src/modules/academics/college-academic-directory-service.ts:54-105`
- Fix: Provide privileged refresh compatibility if legacy consumers still call endpoint

## G2-6-013-022  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/semesters/SemesterSearchCache.java:44-50`
- vNext now: `src/modules/academics/college-academic-directory-service.ts:54-73`
- Fix: Old loads ALL semesters including deleted, new joins college active context

## G2-6-013-023  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/semesters/SemesterSearchController.java:69-75`
- vNext now: `src/modules/academics/college-academic-directory-service.ts:92-105`
- Fix: Legacy limits unscoped ranked list to 200 before filtering selected program

## G2-6-013-033  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:164-187`
- vNext now: `src/modules/academics/college-academic-directory-service.ts:92-105`
- Fix: Legacy fuzzy distance 2 for queries>=3; new ilike lacks typo tolerant results

## G2-6-013-037  [P2] MISSING  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/semesters/SemesterSearchController.java:94-100`
- vNext now: `src/modules/academics/college-academic-directory-service.ts:54-105`
- Fix: Check audit/metrics coverage for old manual cache refresh endpoint

## G2-6-013-039  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/semesters/SemesterSearchCache.java:44-53`
- vNext now: `src/modules/academics/college-academic-directory-service.ts:58-73`
- Fix: Old deleted program cache skips deleted program name but still lists semesters; new INNER JOIN may drop

## G2-9-019-016  [P2] GAP  facet F05  effort M
- Legacy: Search matches semester name, semester number and program name `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:33-41`
- vNext now: Search only term name, program name, program code `src/modules/academics/college-academic-directory-service.ts:92-97`
- Fix: Include search by semester number string.

## G2-9-019-020  [P2] GAP  facet F05  effort S
- Legacy: Legacy list sorted by program service semester_number; merged Map keeps fetch order `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:75-97`
- vNext now: Stable SQL sort programName, termNumber,id `src/modules/academics/college-academic-directory-service.ts:99-106`
- Fix: Document sorting and enable legacy expected order.

## G2-9-019-066  [P2] GAP  facet F19  effort M
- Legacy: Legacy table pagination client pageSize10 `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:529-543`
- vNext now: Server paginates page/pageSize, default10, label hardcodes25 `src/modules/academics/college-academic-directory-model.ts:13-18` `src/modules/academics/college-academic-directory-service.ts:99-105` `src/components/academics/college-academic-directory.tsx:317-320`
- Fix: Fix default-label mismatch and add user page-size choice.
