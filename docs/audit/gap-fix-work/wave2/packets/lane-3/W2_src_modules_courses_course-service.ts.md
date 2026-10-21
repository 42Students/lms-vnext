# Work packet (wave 2): edit src/modules/courses/course-service.ts

19 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l19-u027-course-controller.md, docs/audit/gap2/lane-12/courses.md, docs/audit/gap2/lane-18/u003-superadmin-courses.md, docs/audit/gap2/lane-8/course.md

## G2-19-027-013  [P2] GAP  facet F05  effort M
- Legacy: `fetch` only department courses, `fetchByCollege` all departments, superadmin `fetchAll` restricted to JWT college/org/all; CourseController.java:95-125,159-165
- vNext now: vNext listCourses requires explicit collegeId, optional departmentId, enforces courses.read college; course-service.ts:128-176
- Fix: Retain department-specific and admin-scope read semantics; use server-selected college, do not let requested collegeId widen scope.

## G2-19-027-031  [P2] GAP  facet F10  effort M
- Legacy: Legacy `createCourse` one transaction + 5 slug candidates, after scope/duplicate checks; CourseController.java:60-93; CourseServiceImpl.java:58-101
- vNext now: vNext transactional course create locks department/org path, inserts UUID name/code and event; course-service.ts:204-284
- Fix: Retain atomic create and tenant checks; introduce slug alias issuance only if legacy URL continuity necessary.

## G2-19-027-045  [P2] GAP  facet F15  effort M
- Legacy: Legacy course mutations record admin audit COURSE_UPDATE/DELETE/RESTORE, not per-user notifications; CourseController.java:53-57,377-380,431-435,473-476
- vNext now: vNext activity event CREATED/UPDATED/ARCHIVED within transaction; course-service.ts:273-283,344-355,424-434
- Fix: Crosswalk action names and actor/college/provenance, add restore event, do not invent bell/SMS send.

## G2-12-003-066  [P2] GAP  facet F15  effort S
- Legacy: Course controller injects admin audit log and tracks course action keys `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CourseController.java:47-58`
- vNext now: VNext activity taxonomy COURSE_CATALOG_CREATED/UPDATED/ARCHIVED `src/modules/courses/course-service.ts:273-279,346-353,425-431`
- Fix: Map action labels and actor metadata for audit parity

## G2-18-003-062  [P2] GAP  facet F10  effort M
- Legacy: Legacy DELETE course blocked on lessons; backend performs final check. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:487-513`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:387-402`
- vNext now: vNext DELETE `/api/courses/:id` archives and requires no active offerings. `src/app/api/courses/[courseId]/route.ts:43-65`, `src/modules/courses/course-service.ts:320-435`
- Fix: Surface both blocker semantics and history preservation in confirmation; maintain transactional validation.

## G2-18-003-070  [P2] GAP  facet F11  effort S
- Legacy: Legacy deletion blocked if linked lesson, safety/ownership rechecked server. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:487-513`
- vNext now: vNext blocks archive with active offerings and requires courses.manage. `src/components/courses/admin-course-actions.tsx:254-260`, `src/modules/courses/course-service.ts:320-435`
- Fix: Display both linked lessons and offerings with no unauthorized leak.

## G2-18-003-075  [P2] GAP  facet F12  effort M
- Legacy: Legacy delete with active lessons blocked, avoid cascade orphan data. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:487-513`
- vNext now: vNext archive blocked on active offerings, historical rows preserved. `src/components/courses/admin-course-actions.tsx:254-260`, `src/modules/courses/course-service.ts:320-435`
- Fix: Add dependency details and archive behavior explanation.

## G2-8-020-003  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CourseController.java:267-284 /{courseId}/slug endpoint
- vNext now: src/modules/courses/course-service.ts:129-203 course catalog names/code only
- Fix: Provide old slug-resolution compatibility or explicit retirement.

## G2-8-020-015  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CourseController.java:130-155 global Super Admin paginated default 20
- vNext now: src/modules/courses/course-service.ts:129-203 all rows for college, orders department/name asc
- Fix: Apply server paging and original list default/filters to admin listing.

## G2-8-020-017  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CourseServiceImpl.java:107-146 legacy scoped and unscoped lists via repository
- vNext now: src/modules/courses/course-service.ts:129-203 requires college ID and department optionally
- Fix: Document selected-scope-only behavior versus legacy global mode.

## G2-8-020-024  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CourseServiceImpl.java:314-320 deptId can change within current college
- vNext now: src/modules/courses/course-service.ts:288-336 departmentId omitted update input
- Fix: Either restore same-college transfer or mark feature intentionally retired.

## G2-8-020-035  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CourseController.java:67-92 POST createCourse deptId payload
- vNext now: src/modules/courses/course-service.ts:205-286 createCourse writes UUID-coded course and activity event
- Fix: Record method, endpoint and payload adapter, including code generation.

## G2-8-020-037  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CourseController.java:405-445 DELETE soft-deletes with admin audit COURSE_DELETE
- vNext now: src/modules/courses/course-service.ts:364-374 archive starts with course scope and FK check
- Fix: Align archive restrictions and audit event label/action.

## G2-8-020-049  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CourseServiceImpl.java:217-229 cache refresh failure logs warning, write still succeeds
- vNext now: src/modules/courses/course-service.ts:205-286 DB transaction with activity event; no search cache refresh shown
- Fix: Document search freshness and event-driven invalidation policy.

## G2-8-020-052  [P2] GAP  facet F15  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CourseController.java:47-58,377-379,430-435,473-476 course admin audit entries update/delete/restore
- vNext now: src/modules/courses/course-service.ts:273-280,346-353 activity events create/update; archive separate
- Fix: Map legacy audit action types for deletes/restores to vNext taxonomy.

## G2-8-020-058  [P2] GAP  facet F18  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CourseController.java:435,476 “Course deleted successfully” and “Course restored”
- vNext now: src/modules/courses/course-service.ts:273-280,346-353 activity summaries “Course created/updated”
- Fix: Keep user-facing action-specific messages, not generic archive toast.

## G2-8-020-059  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CourseController.java:128-179 DB paged lists, page0 size20
- vNext now: src/modules/courses/course-service.ts:179-203 unpaginated list per college
- Fix: Add DB pagination for large college course catalogs.

## G2-8-020-060  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CourseServiceImpl.java:217-230 optional CourseSearchCache refresh and warning on failure
- vNext now: src/modules/courses/course-service.ts:205-286 no corresponding cache integration in core service
- Fix: Verify search cache freshness strategy and stale-results recovery.

## G2-8-020-064  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CourseServiceImpl.java:217-230 search-cache refresh integration
- vNext now: src/modules/courses/course-service.ts:205-286 activity event on DB mutation
- Fix: Document invalidation replacement or new search adapter.
