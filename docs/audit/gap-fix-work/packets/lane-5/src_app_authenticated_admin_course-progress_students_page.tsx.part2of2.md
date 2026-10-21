# Work packet: edit src/app/(authenticated)/admin/course-progress/students/page.tsx (part 2 of 2)

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/course-progress.md, docs/audit/gap2/lane-19/course-progress.md, docs/audit/gap2/lane-2/admin-course-progress-controller.md

## G2-14-003-034  [P2] GAP  facet F07  effort S
- Legacy: Legacy data fetch error Could not load course progress plus server text, retry; vNext generic Unable to read course progress — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:136-160,318-327`
- vNext now: `src/app/(authenticated)/admin/course-progress/students/page.tsx:24-29`
- Fix: Surface safe error detail with same retry instead of generic back link

## G2-14-003-036  [P2] GAP  facet F08  effort S
- Legacy: Legacy info confirmation data.note warns zero measured; vNext says No enrolled students not same note — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:153-162`
- vNext now: `src/app/(authenticated)/admin/course-progress/students/page.tsx:48-65`
- Fix: Use server note string per condition

## G2-19-003-026  [P2] GAP  facet F07  effort M
- Legacy: Backend error courseId is required and classId is required `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:83-96`
- vNext now: Detail expects offeringId UUID and Choose a course offering `src/modules/courses/super-admin-student-course-progress.ts:20-23` `src/app/(authenticated)/admin/course-progress/students/page.tsx:18-23`
- Fix: Preserve class/course field-level requirement semantics.

## G2-19-003-029  [P2] GAP  facet F07  effort S
- Legacy: Backend no measured work/no active learner returns explicit note `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:153-161`
- vNext now: Detail returns Not measured or no enrolled students `src/modules/courses/super-admin-student-progress-model.ts:5-13` `src/app/(authenticated)/admin/course-progress/students/page.tsx:59-65`
- Fix: Distinguish no measured items versus empty roster using exact notes.

## G2-2-015-070  [P2] GAP  facet F07  effort M
- Legacy: Backend rejects nonpositive courseId and classId with exact `courseId is required` / `classId is required` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:90-95`
- vNext now: Super Admin invalid offeringId receives Choose a course offering generic ErrorState `src/app/(authenticated)/admin/course-progress/students/page.tsx:18-23`
- Fix: Show actionable field-specific invalid/missing selector feedback
