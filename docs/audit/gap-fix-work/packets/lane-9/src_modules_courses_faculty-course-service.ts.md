# Work packet: edit src/modules/courses/faculty-course-service.ts

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/l19-u019-faculty-teaching-assignment.md, docs/audit/gap2/lane-15/u001-teacher-courses.md, docs/audit/gap2/lane-17/teacher-courses-courseid-index.md, docs/audit/gap2/lane-18/u001-faculty-course-tab.md

## G2-19-019-014  [P1] GAP  facet F05  effort M
- Legacy: FacultyTeachingAssignmentRepository.java:43-81 active by faculty,class,semester,batch,course
- vNext now: src/modules/courses/faculty-course-service.ts:60-204 filters active grants and section/course/delivery state
- Fix: Expose class+semester and batch+semester filters when needed; require active membership and active delivery joins

## G2-19-019-037  [P1] GAP  facet F12  effort M
- Legacy: FacultyTeachingAssignment.java:49-53 explicit startDate/endDate may encode future-dated grants
- vNext now: src/db/schema/courses.ts:243-260 startedAt defaultNow and endedAt only, faculty-course-service.ts:180-198 active if endedAt null
- Fix: Enforce future start and scheduled end cutoff in authorization or formally document non-equivalence

## G2-15-001-030  [P1] GAP  facet F07  effort M
- Legacy: Unauthorized client shows `Faculty access is required to view teaching assignments.` before fetch (CoursesContent.jsx:109-113).
- vNext now: Permission denial throws on server `requirePermission`/faculty membership (faculty-course-list-service.ts:7-12; faculty-course-service.ts:43-57), no same inline message in page (page.tsx:10-39).
- Fix: Render accessible exact legacy role-denial message or documented 403 policy, without exposing data.

## G2-15-001-066  [P1] GAP  facet F22  effort L
- Legacy: Legacy `faculty_teaching_assignment` uses integer faculty/course/class and nullable batch, semester_number, academic_year, role, is_active, start/end dates (FacultyTeachingAssignment.java:18-60).
- vNext now: `course_teaching_assignments` UUID delivery/membership, role, startedAt/endedAt timestamps; period/section accessed by joins (courses.ts:228-260; faculty-course-service.ts:66-101).
- Fix: Write explicit mapping/document retention of legacy semester/year/status and active date semantics for audit/report parity.

## G2-15-001-067  [P1] GAP  facet F22  effort M
- Legacy: Legacy soft deletion inherited BaseModel and allowed null deleted flag, filtered in repository (FacultyTeachingAssignmentRepository.java:41-47).
- vNext now: vNext uses endedAt NULL and uniqueness partial indexes (courses.ts:248-275; faculty-course-service.ts:177-189).
- Fix: Specify soft-delete translation and verify no removed old grants are shown as active.

## G2-17-001-025  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/utils/facultyCourseDetail.js:25-47 selects requested cls, then preferred cls, stored cls, lowest class ID; rejects no active assigned class.
- vNext now: src/modules/courses/faculty-course-service.ts:80-178 resolves by scoped delivery ID and enforces endedAt-null and active course/section/term.
- Fix: Define compatibility rule for links with ?cls= and multiple deliveries; map to the matching vNext delivery rather than silently selecting wrong section.

## G2-18-001-002  [P1] GAP  facet F01  effort M
- Legacy: Legacy `/teacher/courses/:courseId/...` accepts slug or positive numeric mapping/course ID and canonicalizes numeric to slug. `docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:89-115`, `docs/legacy-source/frontend/src/utils/facultyCourseDetail.js:2-20`
- vNext now: vNext requires UUID deliveryId and rejects non-UUID default links. `src/app/(authenticated)/teacher/courses/[deliveryId]/page.tsx:4-11`, `src/modules/courses/faculty-course-service.ts:204-211`
- Fix: Add safe legacy-deep-link resolver from numeric mapping/course slug plus explicit section to an authorized delivery UUID; redirect with preserved intended tab.

## G2-18-001-052  [P1] GAP  facet F10  effort M
- Legacy: Legacy course bootstrap calls GET mapping-by-id, GET course-by-id or slug, GET active teacher assignments, writes only Redux route context. `docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:60-135`, `docs/legacy-source/frontend/src/api/Services/courseServices.js:186-208`, `docs/legacy-source/frontend/src/api/Services/courseServices.js:316-345`, `docs/legacy-source/frontend/src/api/Services/FacultyAssignmentService.js:30-33`
- vNext now: vNext uses server DB join on delivery+teaching assignments, gets workspace and home signals, no legacy bootstrap REST calls. `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx:24-41`, `src/modules/courses/faculty-course-service.ts:60-202`, `src/modules/courses/faculty-course-service.ts:204-335`
- Fix: Introduce safe compatibility redirects for existing external links; do not reintroduce client-side authoritative Redux.

## G2-18-001-058  [P1] GAP  facet F11  effort M
- Legacy: Legacy faculty staff ADMIN subtype may bypass some lesson-content restrictions. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyLessonContentController.java:76-90`
- vNext now: vNext FACULTY membership role only on faculty route, no subtype ADMIN special case. `src/modules/courses/faculty-course-service.ts:43-57`, `src/modules/courses/faculty-route-access-model.ts:6-16`
- Fix: Confirm legacy faculty ADMIN subtype entitlement; map any required admin-capable account to explicit tenant role/permission, never bypass scope.

## G2-18-001-093  [P1] GAP  facet F20  effort M
- Legacy: Legacy checks cancellation and sequence to ignore out-of-order assignment refresh, clears cached roster on failure. `docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:145-156`, `docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:184-203`
- vNext now: vNext navigations use server snapshots refreshed every minute with authorized DB queries. `src/components/courses/faculty-course-tab-navigation.tsx:29-42`, `src/modules/courses/faculty-course-service.ts:103-195`
- Fix: Ensure a failed periodic refresh never leaves stale confidential roster visibly accessible; consider route-level error reset on revoked access.
