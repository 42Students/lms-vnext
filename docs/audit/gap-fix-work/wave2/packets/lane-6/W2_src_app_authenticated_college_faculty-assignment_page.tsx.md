# Work packet (wave 2): edit src/app/(authenticated)/college/faculty-assignment/page.tsx

30 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/l19-u019-faculty-teaching-assignment.md, docs/audit/gap2/lane-19/faculty-teaching-assignment-entity.md, docs/audit/gap2/lane-3/faculty-course-association.md, docs/audit/gap2/lane-4/college-admin-faculty-assignment.md, docs/audit/gap2/lane-4/l14-u027-faculty-course-association-controller.md, docs/audit/gap2/lane-9/l19-u019-faculty-teaching-assignment.md

## G2-19-019-001  [P2] GAP  facet F01  effort M
- Legacy: FacultyTeachingAssignmentController.java:73-308 /api/v1/teaching-assignment/get/create/createBulk/update/delete/deactivate/byFaculty/byClass/byBatch/page
- vNext now: src/app/(authenticated)/college/faculty-assignment/page.tsx:30-189 College Faculty Assignment list, src/modules/courses/teaching-assignment-service.ts:57-498 CRUD by delivery
- Fix: Reconcile old direct URL/API integration and grouped tabs; provide alias/deprecation mapping for faculty/class/batch filter entry points

## G2-19-019-003  [P2] GAP  facet F02  effort M
- Legacy: FacultyTeachingAssignmentResponseDTO.java:10-27 flat row includes faculty/course/class/batch/semester/year/role/active/image/incomplete status
- vNext now: src/app/(authenticated)/college/faculty-assignment/page.tsx:121-167 renders selected fields in DataTable
- Fix: Build column-by-column legacy roster order and show semester/batch/year/context where available

## G2-19-019-013  [P2] GAP  facet F05  effort M
- Legacy: FacultyTeachingAssignmentRepository.java:20-36 pageable college/section roster with is_deleted filtering
- vNext now: src/app/(authenticated)/college/faculty-assignment/page.tsx:37-55 parse q/status/role/page and server list
- Fix: Map optional class filters, server sort, count and 25/page to legacy pagination exact defaults

## G2-19-019-045  [P2] GAP  facet F18  effort S
- Legacy: FacultyTeachingAssignmentController.java:103-109,123-126,148-151,168-187 exact success strings
- vNext now: src/app/(authenticated)/college/faculty-assignment/page.tsx:126-128 'No matching assignments'/'No assignments on this page'
- Fix: Crosswalk old Create/Update/Delete/Deactivation titles and empty text with new labels/response code copy

## G2-19-019-060  [P2] GAP  facet F19  effort M
- Legacy: Old client pageSize 25 by default, localized persisted table preference; backend page defaults25 max200. `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:19-20` `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:81-101` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyTeachingAssignmentController.java:246-264`
- vNext now: vNext college roster states 25/page, can navigate pages but not resize in page source. `src/app/(authenticated)/college/faculty-assignment/page.tsx:172-179`
- Fix: Implement 10/25/50/100 page chooser, range and preferred size persistence.

## G2-3-020-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:20-38`, `53-134`
- vNext now: `src/app/api/academics/faculty-assignments/route.ts:10-55`, `src/app/(authenticated)/college/faculty-assignment/page.tsx:29-72`
- Fix: Legacy faculty-course-associations endpoints create/createBulk/deactivate and GET facultyId/courseId lists; vNext separate section faculty assignment and course delivery teaching API with ID-scoped routes. Provide mapping for six legacy operations.

## G2-3-020-003  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyCourseAssociationServiceImpl.java:51-70`, `122-143`
- vNext now: `src/app/(authenticated)/college/faculty-assignment/page.tsx:121-170`
- Fix: Legacy faculty association view returns mappingId, courseSlug, courseName and deptId, or faculty firstName/department; vNext College Faculty Assignment roster displays course+class+period+role and status. Align labels and legacy identity link.

## G2-3-020-005  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/FacultyCourseAssociation.java:20-23`
- vNext now: `src/app/(authenticated)/college/faculty-assignment/page.tsx:149-160`
- Fix: Legacy association active int 1/0; vNext status badge Active/Ended from endedAt, user-facing `Yes`/`No` and End action. Map exact legacy Active wording and ability to view inactive.

## G2-3-020-037  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:103-133`
- vNext now: `src/app/(authenticated)/college/faculty-assignment/page.tsx:62-65`
- Fix: Legacy endpoint titles `fetchActiveFacultyIdsByCourseId` etc; vNext College Faculty Assignment page heading/subtitle and Role/Class table. Preserve functional vocabulary for staff accustomed to old `faculty-course association` screens.

## G2-4-005-001  [P2] GAP  facet F01  effort M
- Legacy: College admin people-tab route uses loginUser.collegeId. (`docs/legacy-source/frontend/src/pages/college-admin/faculty-assignment.js:7-41`)
- vNext now: New route /college/faculty-assignment from current context. (`src/app/(authenticated)/college/faculty-assignment/page.tsx:29-65`)
- Fix: Restore exact legacy value and interaction unless explicitly approved.

## G2-4-005-003  [P2] GAP  facet F02  effort M
- Legacy: Page overview four metrics then two-card lg10 create / lg14 roster. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:383-402;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:476-514`)
- vNext now: PageHeader, collapsible create Disclosure, filters, full-width roster. (`src/app/(authenticated)/college/faculty-assignment/page.tsx:59-130`)
- Fix: Restore exact legacy value and interaction unless explicitly approved.

## G2-4-005-004  [P2] MISSING  facet F02  effort M
- Legacy: Four metrics Assignments, Active, Primary instructors, Classes covered. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:383-393`)
- vNext now: No four overview metrics. (`src/app/(authenticated)/college/faculty-assignment/page.tsx:59-73`)
- Fix: Render metrics and labels.

## G2-4-005-007  [P2] GAP  facet F03  effort M
- Legacy: Role green/blue/orange and Active green/red badges. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:366-369`)
- vNext now: Role plain text, active Success/Neutral badge. (`src/app/(authenticated)/college/faculty-assignment/page.tsx:149-153`)
- Fix: Restore exact legacy value and interaction unless explicitly approved.

## G2-4-005-008  [P2] GAP  facet F03  effort M
- Legacy: AdminTableToolbar Refresh and Export with class filter. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:477-490`)
- vNext now: Export filtered CSV separate link, no Refresh. (`src/app/(authenticated)/college/faculty-assignment/page.tsx:70-82`)
- Fix: Restore exact legacy value and interaction unless explicitly approved.

## G2-4-005-011  [P2] GAP  facet F04  effort M
- Legacy: Course and Class fallback includes numeric ID if missing. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:26;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:358-365`)
- vNext now: Joined name direct without ID fallback. (`src/app/(authenticated)/college/faculty-assignment/page.tsx:135-147`)
- Fix: Restore exact legacy value and interaction unless explicitly approved.

## G2-4-005-015  [P2] GAP  facet F05  effort M
- Legacy: Page size 10/25/50/100 persisted localStorage. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:18-20;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:96-101;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:504-510`)
- vNext now: Fixed25 with previous/next, no size select. (`src/app/(authenticated)/college/faculty-assignment/page.tsx:172-179`)
- Fix: Restore exact legacy value and interaction unless explicitly approved.

## G2-4-005-037  [P2] GAP  facet F12  effort M
- Legacy: Legacy is_active flag editable and separate deactivate method. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:259-284;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:176-190`)
- vNext now: ACTIVE/ENDED inferred endedAt; history immutable in UI. (`src/app/(authenticated)/college/faculty-assignment/page.tsx:151-167`)
- Fix: Restore exact legacy value and interaction unless explicitly approved.

## G2-4-005-038  [P2] GAP  facet F13  effort M
- Legacy: Lookup errors aggregate five sources, show Some selection options are unavailable + Retry options. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:103-132;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:395-399`)
- vNext now: Static server options and first200 truncation warning, no retry. (`src/app/(authenticated)/college/faculty-assignment/page.tsx:51-58;src/components/college/college-faculty-assignment-actions.tsx:169-171`)
- Fix: Restore exact legacy value and interaction unless explicitly approved.

## G2-4-005-039  [P2] GAP  facet F13  effort M
- Legacy: Initial table shows TableSkeleton 8x8; refresh shows Refreshing faculty assignments. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:495-510`)
- vNext now: Server rendered roster without equivalent local skeleton/refresh. (`src/app/(authenticated)/college/faculty-assignment/page.tsx:121-134`)
- Fix: Restore exact legacy value and interaction unless explicitly approved.

## G2-4-005-040  [P2] GAP  facet F13  effort M
- Legacy: Error Couldn't refresh faculty assignments, keeps stale same-scope records and Retry. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:135-158;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:495-503`)
- vNext now: Invalid filters ErrorState; DB error boundary lacks inline Retry. (`src/app/(authenticated)/college/faculty-assignment/page.tsx:41-49`)
- Fix: Restore exact legacy value and interaction unless explicitly approved.

## G2-4-005-041  [P2] GAP  facet F13  effort M
- Legacy: Empty No assignments found. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:501-510`)
- vNext now: No matching assignments detailed explanatory text. (`src/app/(authenticated)/college/faculty-assignment/page.tsx:125-133`)
- Fix: Restore exact legacy value and interaction unless explicitly approved.

## G2-4-005-042  [P2] GAP  facet F14  effort M
- Legacy: Export faculty-assignments.csv with ID, semester, year, role, active raw rows. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:484-490`)
- vNext now: Export filtered assignments CSV capped via service. (`src/app/(authenticated)/college/faculty-assignment/page.tsx:70-73`)
- Fix: Align export filename and headers.

## G2-4-005-045  [P2] GAP  facet F16  effort M
- Legacy: Desktop two card columns lg10/lg14, compact small tables. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:400-476`)
- vNext now: Disclosure form xl four columns, full roster below. (`src/app/(authenticated)/college/faculty-assignment/page.tsx:59-82;src/components/college/college-faculty-assignment-actions.tsx:100-151`)
- Fix: Restore exact legacy value and interaction unless explicitly approved.

## G2-4-005-046  [P2] GAP  facet F16  effort M
- Legacy: Legacy horizontal scroll max-content and fixed column widths. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:366-380;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:504-510`)
- vNext now: Responsive DataTable uses mobile priorities. (`src/app/(authenticated)/college/faculty-assignment/page.tsx:129-168`)
- Fix: Restore exact legacy value and interaction unless explicitly approved.

## G2-4-005-049  [P2] GAP  facet F18  effort M
- Legacy: Overview title Faculty Assignments plural. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:383-386`)
- vNext now: Invalid filter PageHeader title Faculty Assignment singular. (`src/app/(authenticated)/college/faculty-assignment/page.tsx:41-44`)
- Fix: Restore exact legacy value and interaction unless explicitly approved.

## G2-4-005-050  [P2] GAP  facet F18  effort M
- Legacy: Create card Create teaching assignment; button Create Assignment. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:402;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:471-473`)
- vNext now: Disclosure and Assign to N course(s) action. (`src/app/(authenticated)/college/faculty-assignment/page.tsx:67-69;src/components/college/college-faculty-assignment-actions.tsx:163-166`)
- Fix: Restore exact legacy value and interaction unless explicitly approved.

## G2-14-027-004  [P2] GAP  facet F03  effort M
- Legacy: Legacy returns mappingId, slug, courseName, deptId for each faculty course `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/ActiveCourseResponseDTO.java:7-11`
- vNext now: New faculty assignment roster shows teacher/course/class/role + status `src/app/(authenticated)/college/faculty-assignment/page.tsx:121-146`
- Fix: Retain legacy course slug/department fields for consuming pages.

## G2-19-019-076  [P2] GAP  facet F23  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyTeachingAssignmentController.java:236-244 read byBatch explicit endpoint
- vNext now: src/app/(authenticated)/college/faculty-assignment/page.tsx:88-96 Class selector + batch only on create form
- Fix: Expose active and historical list filter by cohort/batch ID.

## G2-19-019-058  [P3] GAP  facet F18  effort S
- Legacy: Old Create teaching assignment, Current teaching assignments card, Create Assignment button. `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:400-402` `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:471-477`
- vNext now: vNext Disclosure create title, list titled Teaching assignment roster. `src/app/(authenticated)/college/faculty-assignment/page.tsx:67-74` `src/app/(authenticated)/college/faculty-assignment/page.tsx:121-130`
- Fix: Restore second card heading and original Create Assignment button text.

## G2-3-020-021  [P3] GAP  facet F09  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/FacultyCourseAssociation.java:7-26`
- vNext now: `src/app/(authenticated)/college/faculty-assignment/page.tsx:67-69`
- Fix: VNext Create faculty assignment sits inside Disclosure with batch/course selectors, legacy generic faculty-course association may use a simpler add modal; compare old page modal markup live before fixing shell.
