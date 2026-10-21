# Work packet (wave 2): edit src/app/(authenticated)/college/assignments/page.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-admin-assignments.md, docs/audit/gap2/lane-4/superadmin-sections-assignments.md

## G2-4-004-001  [P2] GAP  facet F01  effort M
- Legacy: Route `/college-admin/assignments`, Redux `loginUser.collegeId` scoping; groupKey `content` puts route under Courses & Content tabs. (`docs/legacy-source/frontend/src/pages/college-admin/assignments.js:7-30; docs/legacy-source/frontend/src/components/admin/AdminGroupShell.jsx:14-29`)
- vNext now: Route `/college/assignments`, server context membership, page header, links View quizzes and Course catalogue. (`src/app/(authenticated)/college/assignments/page.tsx:17-44; src/components/courses/college-assessment-aggregate.tsx:77-102`)
- Fix: Verify navigation alias/tab selection preserves legacy content-group route after route migration.

## G2-4-004-002  [P2] GAP  facet F01  effort M
- Legacy: Missing college shows warning `Admin not assigned to a college` and instruction to contact administrator. (`docs/legacy-source/frontend/src/pages/college-admin/assignments.js:9-23`)
- vNext now: Missing membership renders `CollegeCourseMissingScope`; differs in wrapper/copy and reason handling. (`src/app/(authenticated)/college/assignments/page.tsx:20-21`)
- Fix: Render exact warning/call-to-action when admin has no college rather than generic missing-scope state.

## G2-4-004-066  [P2] GAP  facet F13  effort M
- Legacy: Course list error displays warning `Course list unavailable` with `Retry courses`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:391-395`)
- vNext now: Options preloaded on server, no equivalent per-course retry banner in page. (`src/app/(authenticated)/college/assignments/page.tsx:37-43`)
- Fix: Add targeted retryable authoring option loading error distinct from list error.

## G2-4-010-001  [P2] GAP  facet F01  effort M
- Legacy: Route `/college-admin/assignments`, Redux `loginUser.collegeId` scoping; groupKey `content` puts route under Courses & Content tabs. (`docs/legacy-source/frontend/src/pages/college-admin/assignments.js:7-30; docs/legacy-source/frontend/src/components/admin/AdminGroupShell.jsx:14-29`)
- vNext now: Route `/college/assignments`, server context membership, page header, links View quizzes and Course catalogue. (`src/app/(authenticated)/college/assignments/page.tsx:17-44; src/components/courses/college-assessment-aggregate.tsx:77-102`)
- Fix: Verify navigation alias/tab selection preserves legacy content-group route after route migration.

## G2-4-010-002  [P2] GAP  facet F01  effort M
- Legacy: Missing college shows warning `Admin not assigned to a college` and instruction to contact administrator. (`docs/legacy-source/frontend/src/pages/college-admin/assignments.js:9-23`)
- vNext now: Missing membership renders `CollegeCourseMissingScope`; differs in wrapper/copy and reason handling. (`src/app/(authenticated)/college/assignments/page.tsx:20-21`)
- Fix: Render exact warning/call-to-action when admin has no college rather than generic missing-scope state.

## G2-4-010-066  [P2] GAP  facet F13  effort M
- Legacy: Course list error displays warning `Course list unavailable` with `Retry courses`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:391-395`)
- vNext now: Options preloaded on server, no equivalent per-course retry banner in page. (`src/app/(authenticated)/college/assignments/page.tsx:37-43`)
- Fix: Add targeted retryable authoring option loading error distinct from list error.
