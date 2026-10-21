# Work packet (wave 2): edit src/app/(authenticated)/admin/semester-courses/page.tsx

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/semester-courses.md, docs/audit/gap2/lane-17/superadmin-semester-course-mapping.md, docs/audit/gap2/lane-5/l12-u016-semester-entity.md, docs/audit/gap2/lane-5/u025-semester-controller.md

## G2-12-002-002  [P2] GAP  facet F01  effort S
- Legacy: Group academic tabs and workflow guide around editor `docs/legacy-source/frontend/src/components/admin/SuperAdminGroupShell.jsx:12-28`
- vNext now: AcademicSetupSteps and collapsed editor embedded in read-only directory `src/app/(authenticated)/admin/semester-courses/page.tsx:34-49`
- Fix: Restore direct workspace/tab affordance

## G2-12-002-003  [P2] GAP  facet F01  effort S
- Legacy: No scope AntD yellow Alert with icon `docs/legacy-source/frontend/src/pages/superadmin/semester-courses.js:10-21`
- vNext now: No scope empty state with matching title/description `src/app/(authenticated)/admin/semester-courses/page.tsx:24-27`
- Fix: Use warning severity and icon

## G2-12-002-005  [P2] GAP  facet F02  effort S
- Legacy: Title `Semester–Course Mapping`, subtitle `Define the curriculum ...` `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:327-331`
- vNext now: Same title, subtitle `Registered semester curriculum ...` `src/app/(authenticated)/admin/semester-courses/page.tsx:46-49`
- Fix: Restore legacy subtitle

## G2-12-002-053  [P2] GAP  facet F13  effort S
- Legacy: Partial lookup error with key-specific text and Retry `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:335-344`
- vNext now: Editor outage warning and directory remains `src/app/(authenticated)/admin/semester-courses/page.tsx:28-44`
- Fix: Show individual retry actions

## G2-12-002-064  [P2] GAP  facet F18  effort S
- Legacy: Exact subtitle includes staffing coverage `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:329-330`
- vNext now: VNext subtitle focuses directory/credits/order `src/app/(authenticated)/admin/semester-courses/page.tsx:46-49`
- Fix: Restore text

## G2-17-002-002  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:327-330 exact title and subtitle 'Define the curriculum for each semester and spot courses that still need faculty coverage.'
- vNext now: src/app/(authenticated)/admin/semester-courses/page.tsx:46-49 replaces subtitle with registered curriculum directory description; src/app/(authenticated)/college/semester-courses/page.tsx:13-17 omits it.
- Fix: Use the exact legacy subtitle beneath title in both routes.

## G2-17-002-053  [P2] GAP  facet F11  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:325-326 warning 'Select a college to manage Semester–Course Mapping' plus choose-header description with blank editor.
- vNext now: src/app/(authenticated)/admin/semester-courses/page.tsx:24-27 shows whole-page EmptyState 'Select a college to continue'.
- Fix: Use legacy warning banner in page context while disabling editor.

## G2-12-016-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy fetch by ID/program/all and paged versions. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:264-332`
- vNext now: vNext admin reads via filtered setup directory, not equivalent response endpoint. `src/app/(authenticated)/admin/semester-courses/page.tsx:18-49`
- Fix: Expose supported read adapters for legacy consumers.

## G2-12-016-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy program filter and list with actions. `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:61-103`
- vNext now: vNext academic directory and mapping list separated. `src/app/(authenticated)/admin/semester-courses/page.tsx:34-49`
- Fix: Restore program filter/list and action adjacency.

## G2-12-016-012  [P2] GAP  facet F05  effort M
- Legacy: Legacy paged semesters default page0,size20,max100. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:653-685`
- vNext now: vNext admin read directory has independent pagination. `src/app/(authenticated)/admin/semester-courses/page.tsx:34-49`
- Fix: Offer same metadata/page size if caller requires.

## G2-5-025-015  [P2] GAP  facet F05  effort M
- Legacy: Legacy paged all semesters defaults page=0,size=20 capped at100, metadata content/totalElements/totalPages/first/last. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:653-685`
- vNext now: vNext admin directory uses query server-side but no identical page metadata contract in mapped component. `src/app/(authenticated)/admin/semester-courses/page.tsx:34-49`
- Fix: Support documented paging defaults/metadata on directory route.

## G2-5-025-056  [P2] GAP  facet F19  effort M
- Legacy: Legacy fetchAllPaged page0,size20, clamp size<=100 with totalElements/totalPages. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:653-685`
- vNext now: vNext admin directory has independent query/pagination semantics. `src/app/(authenticated)/admin/semester-courses/page.tsx:34-49`
- Fix: Expose exact page-size/default compatibility for program integrations.
