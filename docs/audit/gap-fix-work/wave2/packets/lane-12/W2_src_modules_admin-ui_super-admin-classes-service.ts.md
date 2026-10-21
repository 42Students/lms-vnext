# Work packet (wave 2): edit src/modules/admin-ui/super-admin-classes-service.ts

16 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u014-class-search-controller.md

## G2-5-014-008  [P2] GAP  facet F03  effort M
- Legacy: Legacy /stats returns totalClasses and distinct programs counters (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:202-218`)
- vNext now: vNext superadmin directory returns total+totalPages and per-row status, not programs count (`src/modules/admin-ui/super-admin-classes-service.ts:29-41`)
- Fix: Restore distinct-program stat metric in relevant administration panel

## G2-5-014-011  [P2] GAP  facet F04  effort M
- Legacy: Legacy includes programId and programName per returned class (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchDTO.java:22-25`)
- vNext now: vNext listSections DB row omits program name unless joined in superadmin reader (`src/modules/admin-ui/super-admin-classes-service.ts:18-25`)
- Fix: Join program metadata in ordinary course/program class search response

## G2-5-014-012  [P2] GAP  facet F04  effort S
- Legacy: Legacy ClassSearchDTO searchableText joins name, description, programName (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchDTO.java:35-40`)
- vNext now: vNext superadmin query searches name/code/cohort rather than description/programName (`src/modules/admin-ui/super-admin-classes-service.ts:25-28`)
- Fix: Match all three fields and case-insensitive semantics

## G2-5-014-018  [P2] GAP  facet F05  effort M
- Legacy: Legacy /category/{program} matches programName equalsIgnoreCase and limit 50 (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:169-183`)
- vNext now: vNext superadmin q uses ilike partial matching and status, no exact-name category endpoint (`src/modules/admin-ui/super-admin-classes-service.ts:25-32`)
- Fix: Support category exact match and stable case-insensitive comparison

## G2-5-014-019  [P2] GAP  facet F05  effort S
- Legacy: Legacy /categories sorted program names distinct case-insensitively (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:153-166`)
- vNext now: vNext superadmin directory sorts rows by program, cohort, class rather than returning distinct program names (`src/modules/admin-ui/super-admin-classes-service.ts:29-40`)
- Fix: Expose sorted distinct program-name options, trim blanks

## G2-5-014-020  [P2] GAP  facet F05  effort M
- Legacy: Legacy search ranks exact then prefix then fuzzy matches (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:118-188`)
- vNext now: vNext directory ILIKE search ordered alphabetically by program/cohort/name (`src/modules/admin-ui/super-admin-classes-service.ts:25-32`)
- Fix: Preserve scoring and exact-first ranking in suggestion UX, not arbitrary alphabetical order

## G2-5-014-021  [P2] GAP  facet F05  effort M
- Legacy: Legacy fuzzy matching Levenshtein max distance 2 if under five results (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:163-176`)
- vNext now: vNext ilike searches exact substrings, no fuzzy fallback (`src/modules/admin-ui/super-admin-classes-service.ts:25-32`)
- Fix: Add bounded typo-tolerant candidate stage for query >=3 chars

## G2-5-014-040  [P2] GAP  facet F10  effort S
- Legacy: GET /api/v2/classes/categories returns distinct sorted program names (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:153-167`)
- vNext now: vNext superadmin directory groups by joined program but not a category endpoint (`src/modules/admin-ui/super-admin-classes-service.ts:9-41`)
- Fix: Expose GET categories compatible shape

## G2-5-014-041  [P2] GAP  facet F10  effort S
- Legacy: GET /api/v2/classes/category/{program} filters exact programName (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:169-184`)
- vNext now: vNext directory free-text search matches other columns (`src/modules/admin-ui/super-admin-classes-service.ts:25-28`)
- Fix: Implement strict category filter distinct from substring search

## G2-5-014-043  [P2] GAP  facet F10  effort M
- Legacy: GET /api/v2/classes/stats returns {totalClasses,programs} within scope (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:202-218`)
- vNext now: vNext directory returns {total,totalPages,items} (`src/modules/admin-ui/super-admin-classes-service.ts:29-41`)
- Fix: Add compatible summary counters

## G2-5-014-046  [P2] GAP  facet F11  effort M
- Legacy: Legacy GLOBAL superadmin may omit programId and search all classes (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:44-69`)
- vNext now: vNext superadmin read requires selected college in context (`src/modules/admin-ui/super-admin-classes-service.ts:9-10`)
- Fix: Document deliberate tighter global scope and alternate selected-college selection UI

## G2-5-014-050  [P2] GAP  facet F12  effort M
- Legacy: Legacy search covers name, description and programName; synonyms section/batch/semester (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchCache.java:42-54`)
- vNext now: vNext ilike covers name,code,cohort name (`src/modules/admin-ui/super-admin-classes-service.ts:25-28`)
- Fix: Restore synonyms and description/program name matches for suggestion search

## G2-5-014-055  [P2] GAP  facet F12  effort S
- Legacy: Legacy category exact filter ignores case (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:175-179`)
- vNext now: vNext ILIKE broad partial q (`src/modules/admin-ui/super-admin-classes-service.ts:25-28`)
- Fix: Ensure category mode uses full normalized equality not fuzzy text match

## G2-5-014-068  [P2] GAP  facet F19  effort M
- Legacy: Legacy search scans only prefix matches, fuzzy only when <5 candidates (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:151-176`)
- vNext now: vNext SQL filters in DB with LIMIT 25/50, no fuzzy candidate stage (`src/modules/admin-ui/super-admin-classes-service.ts:25-32`)
- Fix: Add bounded weighted search index and latency guard for 10k+ classes

## G2-5-014-074  [P2] GAP  facet F20  effort M
- Legacy: Legacy global search uses cached all tenant results and exact matched priority (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:129-148`)
- vNext now: vNext scope-selected SQL sorted alphabetically (`src/modules/admin-ui/super-admin-classes-service.ts:25-32`)
- Fix: Avoid cross-tenant race and deterministic tie sort in compatibility search

## G2-5-014-079  [P2] GAP  facet F22  effort M
- Legacy: Legacy DTO includes resolved orgId/collegeId via program lookup (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchCache.java:87-110`)
- vNext now: vNext sections use cohortId FK and college derived by joins (`src/modules/admin-ui/super-admin-classes-service.ts:18-25`)
- Fix: Ensure tenant scope isn't inferred from missing/stale program identity
