# Work packet (wave 2): edit src/components/courses/admin-course-overview.tsx (part 2 of 2)

23 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/college-admin-courses.md, docs/audit/gap2/lane-6/course-home-edit-drawer.md, docs/audit/gap2/lane-12/courses.md, docs/audit/gap2/lane-18/u003-superadmin-courses.md

## G2-3-008-008  [P2] GAP  facet F02  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:519-525`
- vNext now: `src/components/courses/admin-course-overview.tsx:426-474`
- Fix: Old department-notice warning inside create card, new notice embedded only inside expanded create panel; warning may be hidden when panel closed.

## G2-3-008-010  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:469-517`
- vNext now: `src/components/courses/admin-course-overview.tsx:87-169`; `src/components/courses/admin-course-actions.tsx:124-140`
- Fix: Old row includes image thumbnail, Edit, Duplicate, Delete icon buttons; new row omits image and puts Duplicate/Archive under More.

## G2-3-008-011  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:561-570`
- vNext now: `src/components/courses/admin-course-overview.tsx:483-518`
- Fix: Legacy toolbar offers search and Refresh plus export CSV and results count; vNext FilterBar and Export/Clear, Refresh only on /admin, not /college.

## G2-3-008-013  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:484-490`
- vNext now: `src/components/courses/admin-course-overview.tsx:116-139`
- Fix: Legacy Students see it Visible/Hidden and `Lessons: unavailable` or count; new active-only status plus active offerings and missing lesson count in college view.

## G2-3-008-014  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:468-517`
- vNext now: `src/components/courses/admin-course-overview.tsx:87-169`
- Fix: Legacy columns Image, Course Name, Short Title, Department, Students see it, Dependencies, Actions; vNext Course, Department, Dependencies, Students see it, Actions.

## G2-3-008-017  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:479-483`
- vNext now: `src/components/courses/admin-course-overview.tsx:91-115`
- Fix: Legacy separate Short Title value and missing Dept fallback `Department name unavailable (ID x)`; new course details collapsed and direct departmentName, no fallback.

## G2-3-008-018  [P2] MISSING  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:468-473`
- vNext now: `src/components/courses/admin-course-overview.tsx:91-108`
- Fix: Legacy Image column with 50x35 cover or 50x35 PictureOutlined fallback, new table no Image field.

## G2-3-008-020  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:614-630`
- vNext now: `src/components/courses/admin-course-overview.tsx:528-538`; `src/modules/courses/college-course-catalogue-model.ts:3-10`
- Fix: Legacy pagination 10/25/50/100 persisted in localStorage, new college fixed 25/page despite catalogue schema allowing pageSize; restore page-size chooser + 10 option.

## G2-3-008-021  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:408-411`
- vNext now: `src/modules/courses/college-course-catalogue-service.ts:24-38`; `src/components/courses/admin-course-overview.tsx:483-500`
- Fix: Legacy case-insensitive search course name/short title/metadata course_code; new q search name/code/department. Restore shortTitle search and explicit department extension.

## G2-3-008-024  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:622-627`
- vNext now: `src/components/courses/admin-course-overview.tsx:533-538`
- Fix: Legacy footer exact `X-Y of N` plus Ant full pager; vNext `N matching courses · 25 per page` and Next Pagination links.

## G2-3-008-025  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:469-517`
- vNext now: `src/components/courses/admin-course-overview.tsx:87-169`
- Fix: Old Course Name clickable and row actions direct, new course name text and More; restore row-link focus/hover.

## G2-3-008-055  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:611-630`
- vNext now: `src/app/(authenticated)/college/courses/page.tsx:19-24`; `src/components/courses/admin-course-overview.tsx:528-538`
- Fix: Legacy TableSkeleton 8 rows 7 columns during initial load, vNext SSR and data table without equivalent skeleton on page.

## G2-3-008-056  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:628-630`
- vNext now: `src/components/courses/admin-course-overview.tsx:522-524`
- Fix: Exact empty text distinguishes no departments, no courses and no matches; new generic `No records to show` under different conditions.

## G2-3-008-058  [P2] GAP  facet F14  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:561-570`
- vNext now: `src/components/courses/admin-course-overview.tsx:483-518`
- Fix: Legacy browser CSV `courses.csv` from all filtered loaded rows (id, name, shortTitle, deptId, active, enabled, visible); new 1000-cap SQL export and alternate columns.

## G2-3-008-060  [P2] GAP  facet F14  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:560-565`
- vNext now: `src/components/courses/admin-course-overview.tsx:508-515`
- Fix: Legacy toolbar Refresh, Export, Search with count, vNext Export/Clear/filter but no Refresh for college route.

## G2-3-008-062  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:536-560`
- vNext now: `src/components/courses/admin-course-overview.tsx:426-475`
- Fix: Legacy lg 10/24 create and 14/24 list; vNext stacked full width at every viewport, impacts desktop density.

## G2-3-008-063  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:622-627`
- vNext now: `src/components/courses/admin-course-overview.tsx:528-538`
- Fix: Legacy tablet Table scroll x=max-content and stable image/action columns; new DataTable mobile priorities and no cover image.

## G2-3-008-068  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:561-570`
- vNext now: `src/components/courses/admin-course-overview.tsx:479-490`
- Fix: Legacy Existing Courses toolbar placeholder `Search courses`, new `Name, code or department`. Preserve wording in primary search.

## G2-3-008-071  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:450-454`
- vNext now: `src/components/courses/admin-course-overview.tsx:116-123`
- Fix: Legacy dependency lessons fetched only visible page and 100 page-size max; new `lessonCountByCourse` absent for college and skips counts, faster but wrong blocker state.

## G2-6-009-001  [P2] GAP  facet F01  effort S
- Legacy: Legacy file under Pages Router path is actually dynamically imported as `HomeEditor` `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseHome.jsx:7-9`
- vNext now: New course actions are inline on Courses admin catalogue `src/components/courses/admin-course-overview.tsx:142-167` `src/app/(authenticated)/admin/courses/page.tsx:88-95`
- Fix: Document accidental old route as component-only; keep editing entry under course details

## G2-12-003-016  [P3] GAP  facet F04  effort S
- Legacy: Course name fallback `Untitled course` `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:25-26`
- vNext now: Direct course.name from non-null schema `src/components/courses/admin-course-overview.tsx:91-99`
- Fix: Implement defensive fallback for malformed records

## G2-18-003-020  [P3] GAP  facet F04  effort S
- Legacy: Legacy course name fallback `Untitled course`, short title `—`, department `Department name unavailable (ID N)`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:25-25`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:468-487`
- vNext now: vNext normalized required name, shortTitle possibly null, departmentName strict joined. `src/components/courses/admin-course-overview.tsx:100-133`, `src/modules/courses/college-course-catalogue-service.ts:52-64`
- Fix: Use legacy empty placeholders for mapping/corrupt records, not blank badges.

## G2-18-003-028  [P3] GAP  facet F05  effort S
- Legacy: Legacy search placeholder `Search courses` with clear/search affordance. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:561-564`
- vNext now: vNext FilterBar/Input query; wording in AdminCourseOverview differs. `src/components/courses/admin-course-overview.tsx:1-24`, `src/components/courses/admin-course-overview.tsx:160-250`
- Fix: Use `Search courses` exact copy and restore toolbar placement.
