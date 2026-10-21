# Work packet (wave 2): edit src/components/courses/super-admin-course-bulk-visibility.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/courses.md, docs/audit/gap2/lane-18/u003-superadmin-courses.md

## G2-12-003-045  [P2] GAP  facet F09  effort S
- Legacy: Bulk modal names up to first five selected courses and count `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:456-466`
- vNext now: window.confirm count only, no name preview `src/components/courses/super-admin-course-bulk-visibility.tsx:23-35`
- Fix: Restore list preview and custom modal

## G2-12-003-063  [P2] GAP  facet F13  effort S
- Legacy: Partial bulk error lists up to five failure reasons + Retry failed `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:571-594`
- vNext now: Bulk report counts/failures and Retry failed, without reasons list `src/components/courses/super-admin-course-bulk-visibility.tsx:76-85`
- Fix: Display per-course failure reason

## G2-18-003-030  [P2] GAP  facet F05  effort M
- Legacy: Legacy row selection persists across pagination, clears on search/college change. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:606-629`
- vNext now: vNext bulk uses page list with explicit currentIds filter. `src/components/courses/super-admin-course-bulk-visibility.tsx:14-33`
- Fix: Preserve cross-page keys in college-scoped context and show selection count.

## G2-18-003-057  [P2] GAP  facet F09  effort M
- Legacy: Legacy bulk Modal.confirm shows first5 course names and danger for Hide. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:456-465`
- vNext now: vNext browser window.confirm with count only. `src/components/courses/super-admin-course-bulk-visibility.tsx:23-34`
- Fix: Replace native confirm with accessible modal listing names and action impacts.

## G2-18-003-105  [P2] GAP  facet F20  effort M
- Legacy: Legacy bulk failed IDs are retained for retry, other selected successes cleared. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:414-455`
- vNext now: vNext bulk has failedCourseIds and report, UI selection scope filtered to current page. `src/components/courses/super-admin-course-bulk-visibility.tsx:21-44`
- Fix: Retry only failed targets even if page has changed, reauthorize IDs and report counts.
