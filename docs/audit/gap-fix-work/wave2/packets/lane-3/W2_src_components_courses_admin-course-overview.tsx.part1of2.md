# Work packet (wave 2): edit src/components/courses/admin-course-overview.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l19-u027-course-controller.md, docs/audit/gap2/lane-12/courses.md, docs/audit/gap2/lane-18/u003-superadmin-courses.md, docs/audit/gap2/lane-3/college-admin-courses.md

## G2-19-027-002  [P2] GAP  facet F01  effort M
- Legacy: Frontend uses Super Admin Courses section with table/new/edit/delete and route `/college-admin/courses/{slug or id}`; Courses.js:11,474-479
- vNext now: vNext `/admin/courses` tabs and table plus `CourseActions` by UUID; admin/courses/page.tsx:14-48; admin-course-overview.tsx:86-161
- Fix: Maintain old course list/detail deep-links by verified slug-to-UUID resolution and active-college-safe redirect.

## G2-19-027-004  [P2] GAP  facet F02  effort L
- Legacy: Courses.js AntD Card/Row/Table page with toolbar, inline batch visibility, per-course image/preview and top create action; Courses.js:4-15,34-96,410-435,474-512
- vNext now: vNext PageHeader/Tabs and Create Course and offering Disclosure ahead of table; admin/courses/page.tsx:24-51; admin-course-overview.tsx:452-483
- Fix: Recreate old primary header, top toolbar, table/cell rhythm; place new offering wizard behind secondary tab without changing course list structure.

## G2-19-027-006  [P2] GAP  facet F03  effort M
- Legacy: Course title is link with thumbnail/image and optional short title/tag, per-row Edit, Duplicate and Delete button + Popconfirm; Courses.js:20-25,474-512
- vNext now: vNext `Course` column name/code + nested Course details Disclosure; Edit button + More Dropdown with Duplicate/Archive; admin-course-overview.tsx:86-164; admin-course-actions.tsx:100-146
- Fix: Restore thumbnail, exact course-name secondary text, direct Delete/Archive affordance, AntD icon/badge sizes and confirmation; keep action menu keyboard safe.

## G2-19-027-014  [P2] GAP  facet F05  effort M
- Legacy: Paginated `fetchAllPaged` / `fetchByCollegePaged`: page0 default, size20 clamp1..100, page DTO totalElements/totalPages/first/last; CourseController.java:127-157,171-193
- vNext now: vNext superadmin catalogue query filters/sorts and perPage25/50/100, page UI; admin-course-overview.tsx:485-557
- Fix: Map 0-index API pagination to 1-index UI/page links and totals; support 20 default if serving old clients.

## G2-19-027-016  [P2] GAP  facet F05  effort S
- Legacy: Legacy table page sizes localStorage 10,25,50,100 and search course name/short title/course_code; Courses.js:18-32,405-412
- vNext now: vNext 25/50/100 select with q Name/code/department and sort Name/Code; admin-course-overview.tsx:482-514
- Fix: Restore 10 option and old search fields/persistence where clone requires; retain server paging.

## G2-19-027-029  [P2] GAP  facet F09  effort M
- Legacy: Legacy create/edit course modal with image uploader, Popconfirm `Delete “name”?` and detailed consequence; Courses.js:4-6,34-95,505-512
- vNext now: vNext Create Course and offering Disclosure, Edit Course Dialog and Archive ConfirmDialog; admin-course-overview.tsx:450-480; admin-course-actions.tsx:135-219
- Fix: Match legacy 600/800px dialog geometry, form grid, image preview, exact confirm copy, focus restore; separate newer multi-step offering wizard.

## G2-19-027-041  [P2] GAP  facet F13  effort M
- Legacy: Legacy table loader TableSkeleton and RefreshStatus, network errors remain inline, delete failure Retry; Courses.js:14-16,132-135,570-575
- vNext now: vNext page-level error/filtered-zero components and no per-delete retry; admin/courses/page.tsx:41-82; admin-course-overview.tsx:535-557
- Fix: Recreate old loading table rows, stale refresh status and persistent row error; distinguish no results and transport failure.

## G2-19-027-042  [P2] GAP  facet F13  effort S
- Legacy: Legacy empty-state table on no college scope/loading vs no courses within selected college; Courses.js:125-161,565-575
- vNext now: vNext `Select a college to continue` and `No records to show. Create Course and offering above`; admin/courses/page.tsx:25-48; admin-course-overview.tsx:548-553
- Fix: Clone original no-data copy/CTA in table while keeping safe no-college guard.

## G2-19-027-046  [P2] GAP  facet F16  effort M
- Legacy: Legacy antd course table horizontal scroll and form Row gutter12 xs24 sm12 with image preview; Courses.js:34-62,473-512
- vNext now: vNext DataTable responsive mobile-priority actions, Edit dialog grid and disclosure; admin-course-overview.tsx:86-165,545-558; admin-course-actions.tsx:135-219
- Fix: Screenshot-compare 320/768/1280 table action wrapping, form gutter12 and image aspect; retain 44px mobile touch target.

## G2-19-027-048  [P2] GAP  facet F18  effort S
- Legacy: Legacy field labels `Course Name`, `Short display name`, `Official course code`, `Visible to students`, button `Delete`; Courses.js:41-61,90-93,505-512
- vNext now: vNext `Course`, `Dependencies`, `Students see it`, `Archive`, `Create Course and offering`; admin-course-overview.tsx:86-161,452-480
- Fix: Use original labels and button casing on cloned course surface; keep true archive clarification in confirmation.

## G2-12-003-005  [P2] GAP  facet F02  effort M
- Legacy: Left Create New Course Card lg=10 of 24 and right Existing Courses lg=14, gutter24 `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:536-561`
- vNext now: 4 stat tiles then accordion editor then full-width list `src/components/courses/admin-course-overview.tsx:426-482`
- Fix: Clone split card layout and panel proportions

## G2-12-003-006  [P2] GAP  facet F02  effort S
- Legacy: Two AntD Cards titled `Create New Course` and `Existing Courses` `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:539-539,561-561`
- vNext now: Disclosure create workflow, separate section Existing Courses `src/components/courses/admin-course-overview.tsx:458-482`
- Fix: Restore card treatment, border, title/header

## G2-12-003-009  [P2] MISSING  facet F03  effort S
- Legacy: Image preview 50x35 or PictureOutlined placeholder `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:468-473`
- vNext now: No cover thumbnail anywhere in course listing `src/components/courses/admin-course-overview.tsx:87-108`
- Fix: Add cover thumbnail and missing-state icon

## G2-12-003-010  [P2] GAP  facet F03  effort S
- Legacy: Green visible Tag, gray Hidden Tag and Lesson dependency badge `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:484-490`
- vNext now: StatusBadge + offering and lesson dependency count text `src/components/courses/admin-course-overview.tsx:116-139`
- Fix: Match specific tag colors/count format and unavailable dependency state

## G2-12-003-015  [P2] GAP  facet F04  effort S
- Legacy: Short Title has separate table cell, Department fallback `Department name unavailable (ID ...)` `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:479-483`
- vNext now: Short title in optional details disclosure; department name from inner join `src/components/courses/admin-course-overview.tsx:87-115`
- Fix: Show Short Title column and missing-department fallback

## G2-12-003-021  [P2] GAP  facet F05  effort S
- Legacy: Search placeholder `Search courses`, auto results toolbar count `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:562-564`
- vNext now: Search field placeholder `Name, code or department`, button Filter `src/components/courses/admin-course-overview.tsx:483-490`
- Fix: Match exact placeholder and result count pattern

## G2-12-003-052  [P2] GAP  facet F10  effort S
- Legacy: Local toolbar `courses.csv` exports filtered rows with id,name,shortTitle,departmentId,active,enabled,visibleToLearners `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:561-570`
- vNext now: Server `Export CSV` from course catalogue query `src/components/courses/admin-course-overview.tsx:507-513`
- Fix: Compare CSV headers/fields and filter scope

## G2-12-003-060  [P2] GAP  facet F13  effort S
- Legacy: Initial load TableSkeleton 8 rows,7 cols `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:611-613`
- vNext now: No specific course table skeleton within component `src/components/courses/admin-course-overview.tsx:426-539`
- Fix: Restore loading rows and label

## G2-12-003-061  [P2] GAP  facet F13  effort S
- Legacy: Empty varies load error/search/no departments/no courses `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:628-630`
- vNext now: Generic no records message; filter match emptiness separated `src/components/courses/admin-course-overview.tsx:522-533`
- Fix: Restore four contextual empty states

## G2-12-003-065  [P2] GAP  facet F14  effort S
- Legacy: Downloads filtered courses.csv client side (all matches) `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:563-570`
- vNext now: Server CSV export up to 1000 matching rows `src/components/courses/admin-course-overview.tsx:507-520`
- Fix: Define export ceiling and parity headers

## G2-12-003-068  [P2] GAP  facet F16  effort S
- Legacy: Two-column cards lg10/lg14; sm two-up short-title/code `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:536-560`
- vNext now: Stat tiles + full-width disclosure; md two-up form `src/components/courses/admin-course-overview.tsx:426-475`
- Fix: Restore left/right card grid and responsive breakpoints

## G2-12-003-069  [P2] GAP  facet F16  effort S
- Legacy: AntD horizontally scrollable table x max-content `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:622-630`
- vNext now: DataTable responsive mobilePriority actions `src/components/courses/admin-course-overview.tsx:528-532`
- Fix: Compare mobile column hiding and horizontal scroll

## G2-12-003-072  [P2] MISSING  facet F17  effort S
- Legacy: Image preview `alt=Course preview` and cover `alt=<name> cover` `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:76-84`
- vNext now: No image display/alt `src/components/courses/admin-course-overview.tsx:87-108`
- Fix: Ensure replacement accessible image labels

## G2-12-003-075  [P2] GAP  facet F18  effort S
- Legacy: `Lessons: unavailable` fallback tag `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:490-490`
- vNext now: When undefined lessons, prints empty value then active offerings count `src/components/courses/admin-course-overview.tsx:116-124`
- Fix: Show explicit unavailable count

## G2-18-003-006  [P2] GAP  facet F02  effort L
- Legacy: Legacy page starts with h1 Courses; scoped shows split Create New Course left 10/24 and Existing Courses right 14/24. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:527-561`
- vNext now: vNext PageHeader + tabstrip + AdminCourseOverview, setup workflow, stat tiles, tables in vertically stacked regions. `src/app/(authenticated)/admin/courses/page.tsx:70-95`, `src/components/courses/admin-course-overview.tsx:40-160`
- Fix: Restore two-column Create/List first view and original card borders/padding with new offering modules below.

## G2-18-003-009  [P2] GAP  facet F02  effort M
- Legacy: Legacy Existing Courses card toolbar, errors, bulk strip, refresh status, skeleton, 7-column table. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:561-633`
- vNext now: vNext Overview includes stats/filters/catalogue/delivery and course tables. `src/components/courses/admin-course-overview.tsx:100-160`, `src/app/(authenticated)/admin/courses/page.tsx:88-95`
- Fix: Match card+toolbar+table order; keep vNext extra metrics in later sections.

## G2-18-003-016  [P2] GAP  facet F03  effort S
- Legacy: Legacy Status tags green Visible/Hidden based on active and enabled. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:482-487`
- vNext now: vNext StatusBadge derives course.status ACTIVE/ARCHIVED via copy model. `src/components/courses/admin-course-overview.tsx:146-160`
- Fix: Check effective learner visibility; display Visible/Hidden with matching badge color.

## G2-18-003-017  [P2] GAP  facet F03  effort S
- Legacy: Legacy dependencies badge `N lessons` or `Lessons: unavailable`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:487-490`
- vNext now: vNext text displays lesson count (when passed) and active offering count. `src/components/courses/admin-course-overview.tsx:130-145`
- Fix: Preserve lesson badge and unavailable fallback; move offering count into secondary metadata.

## G2-18-003-019  [P2] GAP  facet F04  effort M
- Legacy: Legacy list columns Image, Course Name, Short Title, Department, Students see it, Dependencies, Actions. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:468-514`
- vNext now: vNext columns Course (name+code), Department, Dependencies, Students see it, Actions. `src/components/courses/admin-course-overview.tsx:100-161`
- Fix: Add Image thumbnail and Short Title columns; move code under detail per legacy; retain actions.

## G2-18-003-058  [P2] MISSING  facet F09  effort M
- Legacy: Legacy image preview opens Antd Image lightbox. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:76-84`
- vNext now: vNext course details have no image in overview. `src/components/courses/admin-course-overview.tsx:100-132`
- Fix: Add preview/lightbox and accessible alt on image if file field restored.

## G2-18-003-077  [P2] GAP  facet F13  effort M
- Legacy: Legacy initial table skeleton 8x7 and refreshing uses RefreshStatus without blanking prior rows. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:606-614`
- vNext now: vNext server page has loading/error route controls, UI derives workspace. `src/app/(authenticated)/admin/courses/page.tsx:64-95`, `src/components/courses/admin-course-overview.tsx:1-40`
- Fix: Provide table-specific loading and refreshing copy with stable previous rows.

## G2-18-003-079  [P2] GAP  facet F13  effort S
- Legacy: Legacy no courses empty text varies by no-departments, search, initial load error. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:623-633`
- vNext now: vNext generic catalogue empty state in Overview. `src/components/courses/admin-course-overview.tsx:100-160`
- Fix: Use exact no-departments/no-matches/no-course distinctions and filtered clear link.

## G2-18-003-087  [P2] GAP  facet F16  effort M
- Legacy: Legacy Create/Existing cards 10/14 columns lg, xs stacks; table x max-content. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:539-561`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:614-633`
- vNext now: vNext responsive overview filters/tables, separate wizard, min-h44 touch targets. `src/components/courses/admin-course-overview.tsx:100-161`, `src/components/courses/admin-course-create-panel.tsx:267-275`
- Fix: Clone 10/14 split at lg and table horizontal scrolling while retaining 44px touch.

## G2-18-003-090  [P2] MISSING  facet F17  effort S
- Legacy: Legacy image thumbnail alt includes course name, default PictureOutlined glyph. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:468-476`
- vNext now: vNext course table no thumbnail. `src/components/courses/admin-course-overview.tsx:100-133`
- Fix: Add meaningful image alt and fallback glyph.

## G2-18-003-094  [P2] GAP  facet F18  effort S
- Legacy: Legacy `Create New Course` and `Existing Courses` card titles. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:539-561`
- vNext now: vNext course setup workflow and catalogue labels. `src/components/courses/admin-course-create-panel.tsx:267-275`, `src/components/courses/admin-course-overview.tsx:100-161`
- Fix: Use exact headings on first view and shift new wizard titles to secondary steps.

## G2-18-003-096  [P2] GAP  facet F18  effort S
- Legacy: Legacy `Hidden from students` warning and help nothing deleted. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:90-94`
- vNext now: vNext status/ARCHIVED display only. `src/db/schema/courses.ts:51-54`, `src/components/courses/admin-course-overview.tsx:146-160`
- Fix: Add same warning on off state, do not equate archived with hidden.

## G2-18-003-108  [P2] GAP  facet F21  effort M
- Legacy: Legacy lesson dependency probe blocks deletion. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:8-8`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:487-513`
- vNext now: vNext queries active offering count and linked lesson count for archive. `src/app/(authenticated)/admin/courses/page.tsx:64-69`, `src/components/courses/admin-course-overview.tsx:130-145`
- Fix: Expose both dependency sources, failure and stale-count handling.

## G2-3-008-005  [P2] GAP  facet F02  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:526-634`
- vNext now: `src/components/courses/admin-course-overview.tsx:426-601`
- Fix: Old page Title Courses then desktop create-left 10/24 and existing-right 14/24; new stats, collapsed create Disclosure, full-width list and three later disclosures.

## G2-3-008-006  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:536-560`
- vNext now: `src/components/courses/admin-course-overview.tsx:458-475`
- Fix: Create New Course card is always visible on left in legacy; new Create Course and offering is collapsed unless duplicate query.

## G2-3-008-007  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:560-634`
- vNext now: `src/components/courses/admin-course-overview.tsx:477-539`
- Fix: Old Existing Courses card with toolbar and table alongside creation, new Existing Courses below form and filters.
