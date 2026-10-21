# Work packet (wave 2): edit src/modules/academics/section-service.ts

22 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/class-controller.md, docs/audit/gap2/lane-5/u014-class-search-controller.md, docs/audit/gap2/lane-8/l14-u031-academic-structure-cross-cutting.md

## G2-2-031-003  [P2] GAP  facet F01  effort M
- Legacy: ClassController.java:145-154 GET /getClassesByProgram numeric-id:name object.
- vNext now: src/modules/academics/section-service.ts:154-213 listSections returns entity rows scoped by cohort.
- Fix: Document new program-section ID/label option adapter.

## G2-2-031-018  [P2] GAP  facet F04  effort M
- Legacy: ClassController.java:145-154 maps integer class IDs to names for program chooser.
- vNext now: section-service.ts:154-213 returns UUID id, name, code and period relation.
- Fix: Return compatible UUID value/name array while preserving option order.

## G2-2-031-085  [P2] GAP  facet F22  effort M
- Legacy: ClassServiceImpl.java:155-159 hard deletes legacy _Class.
- vNext now: section-service.ts:352-395 changes status ARCHIVED rather than deleting row.
- Fix: Reconcile historical references and restore/archive behavior during migration.

## G2-5-014-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy lookup categories and popular classes enable search picker sections via API (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:119-183`)
- vNext now: vNext directory groups sections per cohort and academic period in listSections (`src/modules/academics/section-service.ts:154-211`)
- Fix: Compare frontend field/toolbar order on the class chooser, not this controller

## G2-5-014-006  [P2] GAP  facet F03  effort M
- Legacy: Legacy returns ClassSearchDTO id/name/description/start/end/org/college/programName (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchDTO.java:15-25`)
- vNext now: vNext listSections returns DB section object with code/status/capacity and periodId (`src/modules/academics/section-service.ts:204-211`)
- Fix: Provide DTO compatibility fields and exact picker subtitles

## G2-5-014-007  [P2] GAP  facet F03  effort M
- Legacy: Legacy empty search returns popular classes ordered by tracked usage (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:118-122`)
- vNext now: vNext listSections always returns sorted cohort classes without popularity labels (`src/modules/academics/section-service.ts:189-211`)
- Fix: Reinstate Popular classes visual group where old picker depended on it

## G2-5-014-014  [P2] GAP  facet F05  effort M
- Legacy: Legacy /search query optional defaults blank (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:71-79`)
- vNext now: vNext listSections no q argument, only cohort and period (`src/modules/academics/section-service.ts:154-157`)
- Fix: Add q with blank initial default and dynamic search

## G2-5-014-016  [P2] MISSING  facet F05  effort M
- Legacy: Legacy /popular default limit=10, candidate overfetch 5x then scope filter (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:119-129`)
- vNext now: vNext sections list has no popularity usage tally nor endpoint (`src/modules/academics/section-service.ts:154-211`)
- Fix: Build scoped popularity read with deterministic top ten

## G2-5-014-017  [P2] GAP  facet F05  effort M
- Legacy: Legacy /program/{programId} defaults limit=50 (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:136-149`)
- vNext now: vNext requires cohort UUID and optional period instead of program-wide list (`src/modules/academics/section-service.ts:154-211`)
- Fix: Expose program-wide class listing with 50 default for older chooser calls

## G2-5-014-039  [P2] GAP  facet F10  effort M
- Legacy: GET /api/v2/classes/program/{programId} respects access to program (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:136-151`)
- vNext now: vNext listSections takes cohort UUID instead (`src/modules/academics/section-service.ts:154-163`)
- Fix: Add program-wide search endpoint or deprecate consumers with redirect

## G2-5-014-047  [P2] GAP  facet F11  effort M
- Legacy: Legacy ordinary scoped users may only call search with programId validated by requireAccessProgram (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:88-106`)
- vNext now: vNext cohortId permission academics.read checked against cohort college (`src/modules/academics/section-service.ts:159-168`)
- Fix: Map program scope to authorized cohort scope and preserve 403 for missing program

## G2-5-014-051  [P2] GAP  facet F12  effort M
- Legacy: Legacy cache only includes nondeleted _Class and nondeleted NewProgram names (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchCache.java:57-85`)
- vNext now: vNext sections list only status ACTIVE, archived excluded (`src/modules/academics/section-service.ts:189-211`)
- Fix: Align soft-delete/archived visibility semantics across picker and history

## G2-5-014-053  [P2] GAP  facet F12  effort M
- Legacy: Legacy usageCounts map updates per selected class and popularity sorts by uses descending (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:194-220`)
- vNext now: vNext sorted by academicPeriod then name, no usage counts (`src/modules/academics/section-service.ts:204-211`)
- Fix: Persist or cache popularity if search relevance requires it

## G2-5-014-069  [P2] GAP  facet F19  effort M
- Legacy: Legacy popularity usage is process-local and clears on restart/cache reload (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:47-48`)
- vNext now: vNext has no recorded selection ranking state (`src/modules/academics/section-service.ts:204-211`)
- Fix: If popular retained, persist usage counts by tenant or document reset semantics

## G2-5-014-075  [P2] GAP  facet F21  effort M
- Legacy: Legacy initializes search cache @PostConstruct and refresh manually by superadmin (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchCache.java:34-40`)
- vNext now: vNext queries DB per request without cache background worker (`src/modules/academics/section-service.ts:204-211`)
- Fix: Document no-cache design and deprecate refresh endpoint with explicit UX

## G2-14-031-003  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassController.java:31-35 /api/v1/class maps class screens
- vNext now: src/modules/academics/section-service.ts:154-214 section operations
- Fix: Keep old Classes naming in navigation or provide named alias

## G2-14-031-011  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassController.java:156-177 class name/programId/batchId fields and search
- vNext now: src/modules/academics/section-service.ts:154-213 section list structured by cohort and academic period
- Fix: Expose class-to-program/batch relationship columns

## G2-14-031-013  [P2] GAP  facet F05  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassController.java:159-176 search class name/programId/batchId case-insensitive
- vNext now: src/modules/academics/section-service.ts:154-213 parent scoped list
- Fix: Add old class ID/program/batch substring search semantics

## G2-14-031-031  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassController.java:74-106 class creation with CLASS_CREATE audit
- vNext now: src/modules/academics/section-service.ts:214-278 insert section with activity event
- Fix: Preserve class-role semantics and resulting audit entry

## G2-14-031-039  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:134-156 duplicate/invalid/backend errors distinct
- vNext now: src/modules/academics/section-service.ts:91-96 maps named conflict errors
- Fix: Show error states by semester vs section cause, preserve drafts

## G2-14-031-040  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassController.java:95-101 missing batch response 400
- vNext now: src/modules/academics/section-service.ts:100-150 throws scoped service error
- Fix: Show missing/cohort mismatch error and retry link

## G2-14-031-046  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:139-140 'A semester with this number already exists for this program'
- vNext now: src/modules/academics/section-service.ts:91-96 SECTION_NAME_CONFLICT does not cover semester ordinal
- Fix: Add unique-term conflict copy separately
