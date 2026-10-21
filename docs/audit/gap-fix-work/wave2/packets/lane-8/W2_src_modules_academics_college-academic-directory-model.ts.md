# Work packet (wave 2): edit src/modules/academics/college-academic-directory-model.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/batch-search-controller.md, docs/audit/gap2/lane-6/semester-search-controller.md, docs/audit/gap2/lane-9/college-admin-batches.md, docs/audit/gap2/lane-9/college-admin-semesters.md

## G2-6-014-006  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/batches/BatchSearchController.java:69-73`
- vNext now: `src/modules/academics/college-academic-directory-model.ts:13-18`
- Fix: Preserve 15 default autocomplete results vs 10-page directory

## G2-6-014-010  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/batches/BatchSearchController.java:69-73`
- vNext now: `src/modules/academics/college-academic-directory-model.ts:13-18`
- Fix: Document changed query max100 and pageSize enum

## G2-6-013-007  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/semesters/SemesterSearchController.java:50-52`
- vNext now: `src/modules/academics/college-academic-directory-model.ts:13-18`
- Fix: Legacy default limit15 vs new default pageSize10

## G2-6-013-010  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/semesters/SemesterSearchController.java:50-52`
- vNext now: `src/modules/academics/college-academic-directory-model.ts:13-18`
- Fix: Old query unbounded string and int limit200; new max100 q and select page sizes

## G2-6-013-011  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/semesters/SemesterSearchController.java:50-52`
- vNext now: `src/modules/academics/college-academic-directory-model.ts:15-18`
- Fix: Old optional programId integer vs new UUID

## G2-9-003-020  [P2] GAP  facet F05  effort M
- Legacy: Page size default 25, options 10/25/50/100, saved in localStorage (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:572-580`)
- vNext now: Page default 1, pageSize default 10, URL params (`src/modules/academics/college-academic-directory-model.ts:12-21`)
- Fix: Default list page size to 25 and persist page-size preference.

## G2-9-003-025  [P2] GAP  facet F06  effort M
- Legacy: Page-size preference key admin-batches-page-size (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:30-43`)
- vNext now: Default page size 10 from query schema (`src/modules/academics/college-academic-directory-model.ts:14-21`)
- Fix: Restore per-browser page-size preference.

## G2-9-003-080  [P2] GAP  facet F19  effort M
- Legacy: Client filtering and page size 25 default; local 10,25,50,100 (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:574-580`)
- vNext now: Server pageSize10 default; limits 10..100 (`src/modules/academics/college-academic-directory-model.ts:12-20`)
- Fix: Align default/persistence; retain server bounds.

## G2-9-019-066  [P2] GAP  facet F19  effort M
- Legacy: Legacy table pagination client pageSize10 `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:529-543`
- vNext now: Server paginates page/pageSize, default10, label hardcodes25 `src/modules/academics/college-academic-directory-model.ts:13-18` `src/modules/academics/college-academic-directory-service.ts:99-105` `src/components/academics/college-academic-directory.tsx:317-320`
- Fix: Fix default-label mismatch and add user page-size choice.
