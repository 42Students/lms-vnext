# Work packet: edit src/components/courses/super-admin-course-bulk-visibility.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/courses.md, docs/audit/gap2/lane-18/u003-superadmin-courses.md

## G2-12-003-050  [P0] GAP  facet F10  effort L
- Legacy: Bulk active+enabled updates courses and linked lesson visibility `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:414-448`
- vNext now: Bulk edits published lesson content visibility, leaves course status unchanged `src/components/courses/super-admin-course-bulk-visibility.tsx:23-45`
- Fix: Fix course visibility bulk semantics so students cannot see hidden course

## G2-12-003-051  [P0] GAP  facet F10  effort L
- Legacy: Show/Hide to students toggles course active and enabled `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:600-602`
- vNext now: Show/Hide describes published lesson content only, no course status `src/components/courses/super-admin-course-bulk-visibility.tsx:46-48`
- Fix: Match audience visibility action or rename to accurately warn scope

## G2-12-003-083  [P0] GAP  facet F21  effort S
- Legacy: Course visibility affects learner content queries `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:90-94`
- vNext now: Bulk only modifies published lesson items; course status remains `src/components/courses/super-admin-course-bulk-visibility.tsx:23-48`
- Fix: Align downstream learner effective visibility check

## G2-12-003-020  [P1] GAP  facet F05  effort S
- Legacy: Row selection across pages preserved until scope/search change `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:615-627`
- vNext now: Bulk selector scoped to current page; clearing/replacing selection across pagination `src/components/courses/super-admin-course-bulk-visibility.tsx:14-64`
- Fix: Preserve cross-page selection with explicit scope guard

## G2-12-003-074  [P1] GAP  facet F18  effort S
- Legacy: `Visible to students`, helper Off hides course and lessons ... `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:90-95`
- vNext now: `Students see it`, helper describes published lesson content only `src/components/courses/super-admin-course-bulk-visibility.tsx:46-48`
- Fix: Use accurate course-level visibility copy

## G2-18-003-053  [P1] GAP  facet F08  effort M
- Legacy: Legacy bulk success/partial report per course, failed IDs reselected; Retry failed. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:414-455`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:576-590`
- vNext now: vNext reports published-content changes and failedCourseIds separately. `src/components/courses/super-admin-course-bulk-visibility.tsx:10-44`
- Fix: Align one-course-unit success count and targeted retry with detail on lesson/content effects.

## G2-18-003-063  [P1] GAP  facet F10  effort L
- Legacy: Legacy bulk POST `/api/v1/admin/courses/bulk-status` toggles course active/enabled. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:414-455`, `docs/legacy-source/frontend/src/api/Services/AdminService.js:527-534`
- vNext now: vNext POST `/api/admin/courses/bulk-status` toggles published descendant content flags only. `src/components/courses/super-admin-course-bulk-visibility.tsx:23-36`, `src/modules/courses/super-admin-course-bulk-visibility.ts:1-80`
- Fix: Rename to `bulk published content visibility` or implement actual course status bulk toggles.

## G2-18-003-071  [P1] GAP  facet F12  effort L
- Legacy: Legacy active&&enabled drives Visible/Hidden; allowedForDisplay ignored. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:90-94`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:595-605`
- vNext now: vNext Course status ACTIVE/ARCHIVED, bulk published content flag independent. `src/db/schema/courses.ts:51-54`, `src/components/courses/super-admin-course-bulk-visibility.tsx:23-48`
- Fix: Unify meaning of `visible to students` for base Course vs descendant content.
