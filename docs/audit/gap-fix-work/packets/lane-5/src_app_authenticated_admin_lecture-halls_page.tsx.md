# Work packet: edit src/app/(authenticated)/admin/lecture-halls/page.tsx

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-lecture-halls.md, docs/audit/gap2/lane-14/u013-lecture-hall-search-controller.md, docs/audit/gap2/lane-19/lecture-hall-entity.md, docs/audit/gap2/lane-6/superadmin-sections-lecture-halls.md

## G2-10-018-005  [P1] GAP  facet F02  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:301-307 — Inline Create card left 10/24, Existing table card right 14/24.
- vNext now: src/app/(authenticated)/admin/lecture-halls/page.tsx:67-145 — Full-width filters then result table with Add button; create form modal.
- Fix: Restore desktop side-by-side create/list layout.

## G2-10-018-039  [P1] GAP  facet F08  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:411-412 — Alert 'Could not load lecture halls' with Retry above table.
- vNext now: src/app/(authenticated)/admin/lecture-halls/page.tsx:35-42 — Page-wide thrown API errors, invalid-filter ErrorState with Clear.
- Fix: Render list-level Retry without losing create form.

## G2-10-018-056  [P1] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:68-82,411-420 — Load error inline table card with Retry; skeleton while rows fetch.
- vNext now: src/app/(authenticated)/admin/lecture-halls/page.tsx:49-66 — Async Server Component; no local list error Retry except filter-invalid.
- Fix: Separate initial error from stale table errors.

## G2-10-018-058  [P1] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:305-311 — Departments failed Alert 'Departments could not be loaded', Retry; create form still visible.
- vNext now: src/app/(authenticated)/admin/lecture-halls/page.tsx:54-66 — Promise.all listDepartments failure aborts whole page.
- Fix: Load optional departments non-fatally, with Retry.

## G2-10-018-077  [P1] GAP  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:97-112 — Departments GET separate, fail does not hide room table.
- vNext now: src/app/(authenticated)/admin/lecture-halls/page.tsx:54-66 — Promise.all departments failure hides table.
- Fix: Split ancillary reads.

## G2-10-018-087  [P1] GAP  facet F23  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:300-423 — One screen creates inline and shows existing table side-by-side.
- vNext now: src/app/(authenticated)/admin/lecture-halls/page.tsx:67-153 — Full page filters/list, creation moved to modal.
- Fix: Rebuild structure while keeping advanced filters reachable.

## G2-14-013-004  [P1] GAP  facet F01  effort M
- Legacy: Legacy global super-admin may search all colleges without scope `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:41-46` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:54-68`
- vNext now: New super-admin page requires selected college before query `src/app/(authenticated)/admin/lecture-halls/page.tsx:20-34` `src/modules/academics/lecture-hall-service.ts:124-138`
- Fix: Provide safe explicitly authorized global search or document removed capability

## G2-14-013-036  [P1] GAP  facet F11  effort M
- Legacy: Legacy allows global SA unrestricted college search `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:41-46` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:54-68`
- vNext now: New SA selected college mandatory `src/app/(authenticated)/admin/lecture-halls/page.tsx:20-34` `src/modules/academics/lecture-hall-service.ts:124-138`
- Fix: Define explicit global SA search scope with role check or document removal

## G2-19-018-002  [P1] GAP  facet F01  effort L
- Legacy: Super Admin global all-hall and org-scoped listing; non-SA principal sees its college. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:80-101`
- vNext now: vNext requires exact selected college even for global Super Admin. `src/modules/academics/lecture-hall-service.ts:124-138` `src/app/(authenticated)/admin/lecture-halls/page.tsx:26-34`
- Fix: Resolve broader Super Admin read parity under permission checks.

## G2-19-018-067  [P1] GAP  facet F23  effort L
- Legacy: Legacy unrestricted Super Admin list and left creation card are no longer exposed as such. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:80-101` `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:300-305`
- vNext now: vNext exact selected college and dialog create. `src/app/(authenticated)/admin/lecture-halls/page.tsx:26-34` `src/components/admin/lecture-hall-manager.tsx:250-266`
- Fix: Seek product decision and do not silently call removed capabilities equivalent.

## G2-6-030-043  [P1] GAP  facet F11  effort M
- Legacy: Legacy scoped SA can read all within org, all if global; college admin scope and selected college authorization (LectureHallController.java:80-101,115-128).
- vNext now: vNext exact selected college required for SA; academics.manage permission for all operations (lecture-hall-service.ts:124-138; admin/lecture-halls/page.tsx:26-34).
- Fix: Document intentional stricter scope and ensure role switching guides users rather than silent denial.

## G2-14-013-024  [P2] GAP  facet F07  effort S
- Legacy: Legacy missing scope error exact collegeId or deptId is required (or use GLOBAL superadmin mode) `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:60-67`
- vNext now: New collegeId required Zod, SA shows Select a college to continue `src/modules/academics/lecture-hall-service.ts:93-104` `src/app/(authenticated)/admin/lecture-halls/page.tsx:26-34`
- Fix: Show actionable compatibility error without leaking cross-tenant info

## G2-14-013-025  [P2] GAP  facet F07  effort S
- Legacy: Legacy scoped stats without college says college scope required `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:101-107`
- vNext now: New SA no selected college renders dedicated empty state `src/app/(authenticated)/admin/lecture-halls/page.tsx:26-34`
- Fix: Match API error code/copy for stats compatibility
