# Verification packet (P1 sample): 11 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-8-027-043 [P1] GAP facet F15
- Files: (none, new feature)
- Legacy: Legacy feedback includes rating and recommendAction hidden to learners (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:95-112,147-159).
- Expected fix: Ensure interview feedback submission does not leak private feedback via notifications.

## G2-14-031-033 [P1] GAP facet F11
- Files: src/modules/academics/college-batch-promotion-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/BatchController.java:109-132 Super Admin all/org/college batch listings
- Expected fix: Provide permitted Super Admin read/act-in-college promotion path

## G2-9-003-043 [P1] MISSING facet F09
- Files: src/components/academics/college-academic-directory.tsx
- Legacy: Students modal width720 class selector, roster search/table (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:601-658`)
- Expected fix: Restore class-roster drill-in panel.

## G2-9-003-053 [P1] GAP facet F12
- Files: src/modules/academics/college-cohort-mutation-model.ts
- Legacy: Academic year start month default July (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:39-63`)
- Expected fix: Retain July default or make college period policy explicit.

## G2-9-003-073 [P1] MISSING facet F17
- Files: src/components/academics/college-academic-directory.tsx
- Legacy: Roster columns Name/Roll No./Email/Move, meaningful move aria-label (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:633-654`)
- Expected fix: Add semantic roster table and move button aria label.

## G2-9-007-063 [P1] GAP facet F17
- Files: src/components/electives/college-slot-manager.tsx
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:256-263` — Modal blocks backdrop dismiss and traps focus; submit pending
- Expected fix: Restore modal semantics and keyboard/focus/escape rules

## G2-9-015-013 [P1] MISSING facet F03
- Files: src/app/(authenticated)/college/placements/drives/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:676-699` — Create Job primary PlusOutlined opens form, disabled without selected college.
- Expected fix: Add Create Job CTA with Plus icon and permission guard.

## G2-15-027-003 [P1] GAP facet F01
- Files: src/app/api/academics/faculty-assignments/route.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:480-493 getFacultyCourseMapping route accepts courseSlug or ID
- Expected fix: Expose course-to-teacher listing/compat view with slug precedence and scoped course resolution.

## G2-15-027-023 [P1] GAP facet F06
- Files: src/app/api/academics/faculty-assignments/route.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:233-244 create mapping requires facultyId/courseId/classId
- Expected fix: Translate legacy class/course pair to validated section delivery and membership IDs.

## G2-9-029-033 [P1] GAP facet F07
- Files: src/components/academics/college-cohort-management.tsx
- Legacy: Server snake_case field errors map to corresponding Ant fields; closeable Batch was not created Alert `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:395-403`
- Expected fix: Map backend field paths and add persistent closeable form Alert

## G2-9-023-033 [P1] GAP facet F07
- Files: src/components/academics/college-cohort-management.tsx
- Legacy: Server snake_case field errors map to corresponding Ant fields; closeable Batch was not created Alert `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:395-403`
- Expected fix: Map backend field paths and add persistent closeable form Alert
