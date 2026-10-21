# Work packet: edit src/modules/academics/college-academic-directory-service.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l18-u015-class-entity.md, docs/audit/gap2/lane-6/batch-search-controller.md, docs/audit/gap2/lane-6/semester-search-controller.md, docs/audit/gap2/lane-9/college-admin-batches.md

## G2-18-015-022  [P1] GAP  facet F13  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/_ClassRepository.java:22-26 — unpaged list includes group-backed even if paged list excludes
- vNext now: src/modules/academics/college-academic-directory-service.ts:140-246 — cohort totals and sections counted, group-backed absent
- Fix: Include group-backed in content audiences without polluting paged classes list

## G2-6-014-002  [P1] GAP  facet F01  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/batches/BatchSearchController.java:65-114`
- vNext now: `src/modules/academics/college-academic-directory-service.ts:141-205`
- Fix: Offer legacy autocomplete independent of full management directory

## G2-6-014-005  [P1] GAP  facet F04  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/batches/BatchSearchDTO.java:15-24`
- vNext now: `src/modules/academics/college-academic-directory-service.ts:150-175`
- Fix: Translate numeric batch program and college IDs and dates into UUID cohort DTO

## G2-6-014-031  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/batches/BatchSearchDTO.java:15-24`
- vNext now: `src/modules/academics/college-academic-directory-service.ts:150-175`
- Fix: Map start/end dates and org and college IDs to cohort/academic period

## G2-6-013-038  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/semesters/SemesterSearchDTO.java:13-24`
- vNext now: `src/modules/academics/college-academic-directory-service.ts:58-73`
- Fix: Map semester_number/program_id fields to programTerms.termNumber/programs UUID

## G2-9-003-022  [P1] GAP  facet F05  effort M
- Legacy: Client-side search includes year, program, status, semester (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:539-551`)
- vNext now: Server search q matches batch name/code/program name (`src/modules/academics/college-academic-directory-service.ts:168-212`)
- Fix: Extend search to academic year/status/current term to preserve legacy search semantics.

## G2-9-003-046  [P1] GAP  facet F10  effort M
- Legacy: GET batches, programs, classes, learner roster; POST create, PUT edit, DELETE remove and PUT move class (`docs/legacy-source/frontend/src/api/Services/AdminService.js:137-165`)
- vNext now: Server listCollegeBatches from Drizzle with tenant scope (`src/modules/academics/college-academic-directory-service.ts:158-250`)
- Fix: Map missing roster and move-class API workflow.

## G2-9-003-089  [P1] GAP  facet F22  effort M
- Legacy: Legacy derived class/learner counts via primary SECTION class (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BatchRepository.java:8-75`)
- vNext now: New active section and enrollment count from active scoped rows (`src/modules/academics/college-academic-directory-service.ts:220-250`)
- Fix: Align count semantics and active-only policy; don't inflate with group-backed rosters.
