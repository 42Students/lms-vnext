# Work packet (wave 2): edit src/modules/colleges/admin-directory-query-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-search-controller.md, docs/audit/gap2/lane-9/superadmin-colleges.md

## G2-4-014-024  [P2] GAP  facet F06  effort S
- Legacy: Query string is optional default empty; limit accepts arbitrary integer parameter. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:75-84`)
- vNext now: New q max100 chars, pageSize only 10,25,50,100. (`src/modules/colleges/admin-directory-query-model.ts:17-28`)
- Fix: Add explicit query limit and range checks, compatibility for <=15.

## G2-4-014-062  [P2] GAP  facet F16  effort M
- Legacy: Limit15 targeted autocomplete-like result volume. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:75-84`)
- vNext now: New default25 page rows and mobile prioritized table. (`src/modules/colleges/admin-directory-query-model.ts:17-21`; `src/app/(authenticated)/admin/colleges/page.tsx:153-171`)
- Fix: Build compact mobile dropdown with max15 and keyboard selection.

## G2-9-032-018  [P2] GAP  facet F05  effort M
- Legacy: Table pageSize10, size changer, x-y total `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:595-605`
- vNext now: Default pageSize25, URL-driven pagination `src/modules/colleges/admin-directory-query-model.ts:3-21` `src/app/(authenticated)/admin/colleges/page.tsx:115-121,157-171`
- Fix: Use 10 default and legacy paginator controls
