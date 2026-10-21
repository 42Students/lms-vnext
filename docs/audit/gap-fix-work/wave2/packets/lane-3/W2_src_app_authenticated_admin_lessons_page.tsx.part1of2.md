# Work packet (wave 2): edit src/app/(authenticated)/admin/lessons/page.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/lesson-search-controller.md, docs/audit/gap2/lane-15/u003-superadmin-lessons.md, docs/audit/gap2/lane-18/u002-superadmin-lessons.md

## G2-13-013-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:48-52` GET /search query/limit/courseId optional
- vNext now: `src/app/(authenticated)/admin/lessons/page.tsx:57-84` /admin/lessons page q/status/page; `src/app/(authenticated)/college/lessons/page.tsx:17-65` college page filters
- Fix: Expose full-search entry with legacy courseId/global mode or document role-specific route replacement

## G2-13-013-006  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:50-51` search parameter 'query' and limit, no browser placeholder
- vNext now: `src/app/(authenticated)/admin/lessons/page.tsx:66-68` input placeholder 'Lesson or course', name q maxLength 100
- Fix: Keep q UI but wire legacy alias query for API consumers if required

## G2-13-013-009  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:87-93` stats key totalLessons (cache size)
- vNext now: `src/app/(authenticated)/admin/lessons/page.tsx:85` displays matching lessons, current-page content counts from `src/modules/courses/admin-learning-read-model.ts:22-27`
- Fix: Expose global total active lesson count in authorized stats endpoint, not page-level content counts

## G2-13-013-011  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:50-52` query default '', limit default15, courseId optional
- vNext now: `src/modules/courses/college-learning-directory-model.ts:8-13` q default'', pageSize default25 and choices10/25/50/100; `src/app/(authenticated)/admin/lessons/page.tsx:119-123` fixed25
- Fix: Provide limit=15 behavior to search clients separately from 25-row directory paging

## G2-13-013-045  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchDTO.java:15` lessonName, `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchDTO.java:17` courseSlug, `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchDTO.java:18` courseName in response
- vNext now: `src/app/(authenticated)/admin/lessons/page.tsx:95-101` labels courseName/courseCode, 'Learning path', 'Offering'
- Fix: Expose DTO field aliases and empty placeholders for older typeahead views

## G2-15-003-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy `/superadmin/lessons` in SuperAdminGroupShell groupKey `content`, selection from SuperAdminScopeContext (`superadmin/lessons.js:3-8,23-32`).
- vNext now: Mapped `/admin/lessons`, scoped server page, no explicit group shell in page (`admin/lessons/page.tsx:25-40,57-62`).
- Fix: Place within equivalent Courses & Content tab strip and retain selected college context.

## G2-15-003-004  [P2] GAP  facet F02  effort M
- Legacy: Two-column desktop layout `lg=10` Create New Lesson left, `lg=14` Lessons table right (`sections/Lessons.js:407-434`).
- vNext now: Vertical flow PageHeader, filter bar, collapsible Add Lesson, list (`admin/lessons/page.tsx:57-93`).
- Fix: Restore 10/14 create-form/table split on wide view and 24-gutter stack on narrow.

## G2-15-003-007  [P2] GAP  facet F03  effort M
- Legacy: Legacy Table columns `Lesson Name`, `Course`, `Order`, `Students see it`, `Actions` (`sections/Lessons.js:390-405`).
- vNext now: Article title, status, path/offering/content counters and action details (`admin/lessons/page.tsx:93-115`).
- Fix: Recreate five column table and row-level actions; extra counts move to expandable details.

## G2-15-003-008  [P2] GAP  facet F03  effort S
- Legacy: Visibility Tag `Visible` green or `Hidden` neutral from active AND enabled (`sections/Lessons.js:397-398`).
- vNext now: Uses `ACTIVE/ARCHIVED` StatusBadge and separate `visibleToStudents` control (`admin/lessons/page.tsx:95-110`).
- Fix: Show distinct `Visible`/`Hidden` card label based on actual student eligibility, not lifecycle only.

## G2-15-003-010  [P2] GAP  facet F03  effort M
- Legacy: Table sorting may display drag sort handle column; `Order` is view-position 1-based (`sections/Lessons.js:390-397`).
- vNext now: Row displays `Order {sequence+1}` and separate Move up/Move down (`admin/lessons/page.tsx:99,108-109`).
- Fix: Render legacy numbered order and keyboard/drag handle within table with valid scope conditions.

## G2-15-003-013  [P2] GAP  facet F03  effort M
- Legacy: No page-head CSV Export; table toolbar export has filename `lessons.csv` and exact six fields (`sections/Lessons.js:433-441`).
- vNext now: Export anchor in PageHeader to `/api/admin/lessons/export` with filtered query (`admin/lessons/page.tsx:58-62`).
- Fix: Retain CSV export field/header contract and place action within right table toolbar.

## G2-15-003-015  [P2] GAP  facet F04  effort S
- Legacy: Lesson title fallback `Untitled lesson` when missing (`sections/Lessons.js:21-24`).
- vNext now: `lesson.name` used directly, DB name nonnull (`admin/lessons/page.tsx:93-96`; `courses.ts:329-334`).
- Fix: Show `Untitled lesson` diagnostic for corrupt/incomplete migrated values; keep consistent disabled actions.

## G2-15-003-018  [P2] GAP  facet F04  effort S
- Legacy: Legacy `sequence` 0-based persisted but displayed as row position in sorted filtered table (`sections/Lessons.js:23-29,395-396`).
- vNext now: `sequence+1` displayed, including gaps after deletion (`admin/lessons/page.tsx:99-101`).
- Fix: Display ordinal position within chosen course/visible order, not raw stored gap.

## G2-15-003-019  [P2] GAP  facet F05  effort M
- Legacy: Legacy course Select default none; view list only after selecting course, all-courses opt-in (`sections/Lessons.js:80-84,142-159,442-457,524-526`).
- vNext now: All selected-college lesson records listed immediately unless filters added (`admin/lessons/page.tsx:41-56,85-92`).
- Fix: Default to empty `Choose a course` state; all-courses click opt-in with explanatory warning.

## G2-15-003-020  [P2] GAP  facet F05  effort M
- Legacy: Legacy option `View all courses (slower)` and `Close all-courses view` (`sections/Lessons.js:450-457`).
- vNext now: No matching toggle; global listing with filters by courseCode (`admin/lessons/page.tsx:77-84,92-117`).
- Fix: Restore explicit all-courses controls/cost warning, or approve new paginated default.

## G2-15-003-021  [P2] GAP  facet F05  effort M
- Legacy: Selected course persisted localStorage `admin-lessons-selected-course:{collegeId}` and validated within college (`sections/Lessons.js:106,117-140,241-249`).
- vNext now: URL query courseCode only, no saved course restoration (`admin/lessons/page.tsx:28-45,77-84`).
- Fix: Persist most recently chosen eligible course per tenant; reject stale course after context switch.

## G2-15-003-023  [P2] GAP  facet F05  effort S
- Legacy: Toolbar search name only, exact placeholder `Search lessons` and live client filter (`sections/Lessons.js:221-223,433-441`).
- vNext now: GET query matches lesson name OR course name OR code, placeholder `Lesson or course`, length max100 (`admin/lessons/page.tsx:64-68`; `college-learning-directory-service.ts:161-163`).
- Fix: Use exact placeholder; optionally keep broader matching as documented enhancement.

## G2-15-003-025  [P2] GAP  facet F05  effort M
- Legacy: Default page size25, selectable 10/25/50/100, persisted `admin-lessons-page-size` localStorage (`sections/Lessons.js:19-20,98-115,519-523`).
- vNext now: Server fixed 25 per page, text `25 per page`, links Pagination (`admin/lessons/page.tsx:118-123`; `college-learning-directory-service.ts:166-172`).
- Fix: Restore page size selector with persistence and count-range copy.

## G2-15-003-026  [P2] GAP  facet F05  effort S
- Legacy: No selected course + no opt-in empty table `Choose a course, or opt in to all-courses view.` (`sections/Lessons.js:524-526`).
- vNext now: Global `No lessons found` when list empty (`admin/lessons/page.tsx:117`).
- Fix: Use exact no-course prompt and correct search miss/empty statuses.

## G2-15-003-027  [P2] GAP  facet F05  effort S
- Legacy: No matching filtered rows `No matching lessons. Clear search to see the course.` (`sections/Lessons.js:524-526`).
- vNext now: `No lessons found` / `The current college and filters have no recorded lessons.` (`admin/lessons/page.tsx:117`).
- Fix: Restore exact filtered-zero message.

## G2-15-003-061  [P2] GAP  facet F13  effort S
- Legacy: Loading courses error `Courses could not be loaded` Retry, no courses `No courses in this college yet` (`sections/Lessons.js:412-418`).
- vNext now: Picker error warning `Lesson creation options are temporarily unavailable`; no paths `Open a course offering...` (`admin/lessons/page.tsx:89-90`; `super-admin-lesson-create.tsx:39`).
- Fix: Restore separate course-list failure vs zero-course states, link `Go to Courses`.

## G2-15-003-063  [P2] GAP  facet F13  effort M
- Legacy: Refresh retains old table and shows `Refreshing lessons…` or amber `Couldn't refresh lessons` warning (`sections/Lessons.js:154-158,458-465`).
- vNext now: Server error gives `Lessons unavailable` with retry URL; no retained listing (`admin/lessons/page.tsx:41-52`).
- Fix: Keep same-scope prior rows during reload/failure with inline Retry.

## G2-15-003-064  [P2] GAP  facet F13  effort M
- Legacy: All-courses partial failures show count, first3 messages and `Retry before bulk changes` (`sections/Lessons.js:168-195`).
- vNext now: Query fails as unit if any service error, no per-course partial (`admin/lessons/page.tsx:41-52`).
- Fix: Implement partial-page failure summary only if retaining batched fetch; otherwise document atomic backend query substitute.

## G2-15-003-066  [P2] GAP  facet F13  effort S
- Legacy: No lessons filtered: `No matching lessons...`/`No lessons in this course yet. Create one on the left.` (`sections/Lessons.js:524-526`).
- vNext now: `No lessons found` / `current college and filters...` (`admin/lessons/page.tsx:117`).
- Fix: Use contextual matching vs course-empty copy exactly.

## G2-15-003-070  [P2] GAP  facet F16  effort M
- Legacy: Legacy `Row gutter=24`, `Col xs24 lg10/lg14`, antd Table scroll `x=max-content` (`sections/Lessons.js:410-412,432-434,509-523`).
- vNext now: Mobile stacked form/list, no table; breakpoints md for filter/controls (`admin/lessons/page.tsx:64-84,92-123`).
- Fix: Clone grid and horizontal table scroll at 1280/768/375; maintain 44px touch targets.

## G2-15-003-071  [P2] GAP  facet F17  effort M
- Legacy: Course picker has `aria-label=Filter lessons by course`, allowClear showSearch (`sections/Lessons.js:442-449`).
- vNext now: Filter fields nested details with separate courseCode selection (`admin/lessons/page.tsx:77-82`).
- Fix: Give matching accessible name, searchable option focus and clear-keyboard handling.

## G2-15-003-075  [P2] GAP  facet F18  effort S
- Legacy: Search placeholder `Search lessons` and all-courses label `View all courses (slower)` (`sections/Lessons.js:434-457`).
- vNext now: `Lesson or course`, collapsible `Filters` and `Clear filters` (`admin/lessons/page.tsx:64-84`).
- Fix: Use legacy exact search/opt-in labels; retain new filters only as supplemental.

## G2-15-003-088  [P2] GAP  facet F23  effort M
- Legacy: Legacy tenant-first course selector and explicit all-course opt-in, original table/actions (`sections/Lessons.js:442-457,509-526`).
- vNext now: Global all-course page with optional filters and 25-page pagination (`admin/lessons/page.tsx:64-84,92-123`).
- Fix: Document intentional global directory change; preserve direct course-first workflow if owner demands strict clone.

## G2-18-002-001  [P2] GAP  facet F01  effort M
- Legacy: Superadmin Lessons is a section under `/superadmin` and component also supports `/college-admin` based on router pathname. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:65-68`
- vNext now: vNext primary paths `/admin/lessons` and `/college/lessons`; `/superadmin/[...legacy]` redirects. `src/app/(authenticated)/admin/lessons/page.tsx:25-37`, `src/app/(authenticated)/college/lessons/page.tsx:17-19`, `src/app/(authenticated)/superadmin/[...legacy]/page.tsx:6-20`
- Fix: Preserve legacy URL deep-link including meaningful course filter; validate redirects before dropping query.

## G2-18-002-002  [P2] GAP  facet F01  effort S
- Legacy: Unscoped superadmin shows `Select a college to manage Lessons` warning and still renders empty creation/list cards. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:65-69`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:407-409`
- vNext now: vNext shows `Select a college to continue` EmptyState and does not render list/create without selected college. `src/app/(authenticated)/admin/lessons/page.tsx:35-40`
- Fix: Use exact warning copy and legacy safe shell state while preventing unscoped queries.

## G2-18-002-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy desktop first row is 10/24-width Create New Lesson card and 14/24-width Lessons table card. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:407-434`
- vNext now: vNext sequential PageHeader, query filter form, stats, Add Lesson Disclosure, bulk Disclosure, articles list. `src/app/(authenticated)/admin/lessons/page.tsx:57-92`
- Fix: Restore side-by-side 10/14 column layout on desktop with legacy card margins, while preserving vNext data semantics.

## G2-18-002-007  [P2] GAP  facet F02  effort M
- Legacy: Legacy Lessons card includes toolbar search/refresh/export, course select, all-courses button, info alerts, table. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:433-472`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:506-528`
- vNext now: vNext dedicated search/status/advanced filters above a vertical list of article rows. `src/app/(authenticated)/admin/lessons/page.tsx:64-84`, `src/app/(authenticated)/admin/lessons/page.tsx:92-117`
- Fix: Rebuild compact table+toolbar layout with supported filters and actions.

## G2-18-002-008  [P2] GAP  facet F02  effort M
- Legacy: Legacy bulk actions strip appears within card, immediately above table after selection. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:493-505`
- vNext now: vNext bulk action appears in independent collapsed `Bulk lesson visibility` Disclosure before articles. `src/app/(authenticated)/admin/lessons/page.tsx:91-92`, `src/components/courses/super-admin-lesson-bulk-visibility.tsx:30-52`
- Fix: Align bulk action placement to selected rows above table; retain accessible count.

## G2-18-002-009  [P2] GAP  facet F02  effort M
- Legacy: Legacy edit/delete are in row Actions column, not isolated details panels. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:390-405`
- vNext now: vNext per-lesson Actions disclosure nests Edit, Archive, Visibility and Move controls. `src/app/(authenticated)/admin/lessons/page.tsx:102-111`, `src/components/courses/admin-learning-structure-actions.tsx:494-518`
- Fix: Restore visible Edit/Remove button pair in table Actions column; secondary actions can stay in overflow.

## G2-18-002-011  [P2] GAP  facet F03  effort S
- Legacy: Legacy list title `Lessons` inside card alongside toolbar search and export. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:433-441`
- vNext now: vNext single PageHeader `Lessons`; Export action lives in header. `src/app/(authenticated)/admin/lessons/page.tsx:57-64`
- Fix: Move table title and toolbar to legacy card head, keeping page title unchanged.

## G2-18-002-012  [P2] GAP  facet F03  effort S
- Legacy: Legacy toolbar provides Refresh button alongside search and `lessons.csv`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:434-441`
- vNext now: vNext filtering uses GET form and no table-local Refresh action; Export lives in page heading. `src/app/(authenticated)/admin/lessons/page.tsx:57-84`
- Fix: Add refresh control that reissues current filtered query, preserve `lessons.csv` action.

## G2-18-002-013  [P2] GAP  facet F03  effort S
- Legacy: Legacy `View all courses (slower)` button opt-in and `Close all-courses view`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:443-457`
- vNext now: vNext default server-scoped college aggregate without opt-in and without these controls. `src/app/(authenticated)/admin/lessons/page.tsx:41-55`, `src/app/(authenticated)/admin/lessons/page.tsx:92-117`
- Fix: When full-college aggregate is intentional, mark legacy opt-in removal approved; otherwise mirror filter option.

## G2-18-002-015  [P2] GAP  facet F03  effort M
- Legacy: Legacy drag handle column appears only when single course active and no search/errors. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:224-239`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:390-396`
- vNext now: vNext admin list provides Move up/Move down buttons under Actions. `src/app/(authenticated)/admin/lessons/page.tsx:105-108`, `src/components/courses/college-lesson-reorder-actions.tsx:45-60`
- Fix: Provide drag handle+keyboard sortable table mode with server persisted whole-list order.

## G2-18-002-019  [P2] GAP  facet F04  effort M
- Legacy: Legacy list has exactly columns drag (conditional), Lesson Name, Course, Order, Students see it, Actions. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:390-405`
- vNext now: vNext list is cards with title, ACTIVE badge, courseCode, cohort/period/order, path/offering status, counts. `src/app/(authenticated)/admin/lessons/page.tsx:92-111`
- Fix: Use compact table with exact six columns plus optional details, not multi-paragraph cards.

## G2-18-002-022  [P2] GAP  facet F04  effort S
- Legacy: Legacy Order is the one-based visible index, not database sequence value, for pagination. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:394-397`
- vNext now: vNext shows persisted `lesson.sequence + 1` in row. `src/app/(authenticated)/admin/lessons/page.tsx:99-100`
- Fix: Render one-based position of filtered/sorted result, separate raw sequence if necessary.
