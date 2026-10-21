# Work packet (wave 2): edit src/modules/people/college-role-directory-model.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/learner-search-controller.md, docs/audit/gap2/lane-6/college-admin-teachers.md

## G2-15-013-016  [P2] GAP  facet F05  effort S
- Legacy: Search default query empty limit15, optional college/program/class. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:117-121`)
- vNext now: New q empty, paging page1 pageSize25 (also 10,50). (`src/modules/people/college-role-directory-model.ts:9-39`)
- Fix: Provide legacy autocomplete limit15 while retaining directory page25.

## G2-15-013-017  [P2] GAP  facet F05  effort S
- Legacy: Every legacy endpoint clamps requested limit to 1..50. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:101-103`)
- vNext now: New pageSize only 10/25/50; invalid rejected. (`src/modules/people/college-role-directory-model.ts:35-38`)
- Fix: For compatibility API clamp 1..50, do not interpret arbitrary limit as pageSize.

## G2-15-013-022  [P2] GAP  facet F05  effort S
- Legacy: Program route defaults limit50. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:220-233`)
- vNext now: New programId field accepts UUID with page25. (`src/modules/people/college-role-directory-model.ts:18-20`)
- Fix: Preserve default count per legacy program lookup or paginate consistently.

## G2-15-013-026  [P2] GAP  facet F06  effort M
- Legacy: Path param integer IDs and optional limit50. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:205-238`)
- vNext now: New UUID program/section IDs, not numeric. (`src/modules/people/college-role-directory-model.ts:18-20`)
- Fix: Define legacy numeric ID to vNext UUID mapping if migrated links exist.

## G2-15-013-042  [P2] GAP  facet F10  effort M
- Legacy: GET /college/{id}, /program/{id}, /class/{id}, /categories, /category/{dept}. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:205-275`)
- vNext now: New combined filter schema replaces discrete endpoints. (`src/modules/people/college-role-directory-model.ts:9-39`)
- Fix: Document each old endpoint to new filter route mapping and result projection.

## G2-15-013-053  [P2] GAP  facet F12  effort S
- Legacy: Limit always clamped1..50. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:101-103`)
- vNext now: PageSize in [10,25,50]. (`src/modules/people/college-role-directory-model.ts:35-38`)
- Fix: Align API defaults by context and cap at50 for search autocomplete.

## G2-6-001-016  [P2] GAP  facet F05  effort M
- Legacy: Old Ant Table has Name sort comparator and 25 default rows with 25,50,100,200 `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:769-774` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1362-1370`
- vNext now: New DataTable uses URL-backed default name order and 10,25,50 sizes `src/components/college/college-role-directory-workspace.tsx:403-454` `src/components/college/college-role-directory-workspace.tsx:335-340` `src/modules/people/college-role-directory-model.ts:5-39`
- Fix: Offer 100/200 sizes or document server limit; preserve Name default ascending
