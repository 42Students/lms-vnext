# Work packet (wave 2): edit src/modules/courses/validation.ts

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/l18-u018-lesson.md, docs/audit/gap2/lane-18/u003-superadmin-courses.md, docs/audit/gap2/lane-4/l14-u027-faculty-course-association-controller.md, docs/audit/gap2/lane-8/course.md

## G2-18-018-043  [P2] GAP  facet F18  effort M
- Legacy: Error/field copy `Lesson name is required`, max255 and name conflict; labels use lessonName (`LessonDTO.java:14-16`; LessonServiceImpl.java:123-127).
- vNext now: `src/modules/courses/validation.ts:248-288` uses `name`; `src/app/(authenticated)/college/lessons/page.tsx:57` title `Lessons`.
- Fix: Compare literal labels/toasts in `docs/audit/legacy-copy-{A,B}.md`, avoid showing `learning path` jargon on admin lesson row.

## G2-18-003-023  [P2] GAP  facet F04  effort M
- Legacy: Legacy Official course code optional max40, if blank fallback short title. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:58-61`
- vNext now: vNext course code required, optional officialCode max64; separate shortTitle max120. `src/modules/courses/validation.ts:16-41`, `src/components/courses/admin-course-actions.tsx:207-213`
- Fix: Map old official code into officialCode with 40-char compatibility; ensure visible code fallback.

## G2-18-003-037  [P2] GAP  facet F06  effort S
- Legacy: Legacy In this Course Description required textarea rows3. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:68-71`
- vNext now: vNext optional description max5000 and may be empty. `src/modules/courses/validation.ts:39-45`, `src/components/courses/admin-course-actions.tsx:234-245`
- Fix: Restore required validation if literal parity; preserve max5000 as safe cap.

## G2-18-003-038  [P2] GAP  facet F06  effort M
- Legacy: Legacy Course Takeaways ordered points editor. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:72-75`
- vNext now: vNext single Textarea string max2000. `src/components/courses/admin-course-actions.tsx:213-215`, `src/modules/courses/validation.ts:36-39`
- Fix: Use editable ordered-point rows preserving ordering, sanitize and persist list.

## G2-18-003-060  [P2] GAP  facet F10  effort M
- Legacy: Legacy POST createCourse with metadata, active/enabled and selected dept, then refresh. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:255-305`
- vNext now: vNext POST `/api/courses` with departmentId/name/code/shortTitle etc; default ACTIVE. `src/app/api/courses/route.ts:30-51`, `src/modules/courses/validation.ts:28-45`
- Fix: Bridge name/shortTitle/metadata/visibility semantics and suppress duplicate creation on failed upload.

## G2-14-027-041  [P2] GAP  facet F18  effort M
- Legacy: Legacy field names facultyId/courseIds, mappingId `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/FacultyCourseAssociationCreateRequestDTO.java:9-14`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:90-92`
- vNext now: New membershipId/deliveryIds and teaching assignment IDs `src/modules/courses/validation.ts:143-149`
- Fix: Map request/response field names for existing consumers.

## G2-14-027-043  [P2] GAP  facet F19  effort M
- Legacy: Legacy bulk saveAll no explicit max `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyCourseAssociationServiceImpl.java:77-95`
- vNext now: New batch max10 and per-delivery row locks `src/modules/courses/validation.ts:143-149`; `src/modules/courses/teaching-assignment-batch-service.ts:48-55`
- Fix: Document/paginate large imported bulk requests without timeout.

## G2-14-027-045  [P2] GAP  facet F20  effort M
- Legacy: Legacy bulk create may include duplicate faculty/course pairs `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyCourseAssociationServiceImpl.java:77-95`
- vNext now: New unique course ID check plus active conflict `src/modules/courses/validation.ts:143-149`; `src/modules/courses/teaching-assignment-batch-service.ts:119-129`
- Fix: Return duplicate-specific per-item error and policy on legacy repeated rows.

## G2-8-020-019  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/CourseDTO.java:14-21 short title/course name required <=255
- vNext now: src/modules/courses/validation.ts:16-32,36-50 name <=255, short title <=120, code <=64
- Fix: Match short-title max and explain new required code.

## G2-8-020-020  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/CourseDTO.java:17-18 positive dept_id
- vNext now: src/modules/courses/validation.ts:36-40 departmentId UUID
- Fix: Validate effective department reference and provide field-level error.

## G2-8-020-046  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CourseServiceImpl.java:303-320 parent<=0 clear, omitted stays
- vNext now: src/modules/courses/validation.ts:52-73 no parent in update
- Fix: Restore semantics for clearing parent.

## G2-8-020-056  [P2] GAP  facet F18  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/CourseDTO.java:14-21 API fields short_title, course_name, dept_id
- vNext now: src/modules/courses/validation.ts:36-50 frontend name/code/shortTitle/departmentId
- Fix: Ensure course editor labels and API error mapping match old catalogue wording.

## G2-18-003-033  [P3] GAP  facet F06  effort S
- Legacy: Legacy Course Name required max255 placeholder `e.g., Data Structures and Algorithms`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:46-49`
- vNext now: vNext courseName schema max255, Course step Input. `src/modules/courses/validation.ts:11-15`, `src/components/courses/admin-course-create-panel.tsx:111-115`, `src/components/courses/admin-course-create-panel.tsx:173-225`
- Fix: Use exact placeholder and client message `Enter a course name`.

## G2-18-003-040  [P3] GAP  facet F06  effort S
- Legacy: Legacy card colour accepts `#RRGGBB`, validation `Use a colour like #0a7c88`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:86-89`
- vNext now: vNext regex same 6 HEX digits, nullable, but control is plain input. `src/modules/courses/validation.ts:25-25`, `src/components/courses/admin-course-actions.tsx:213-220`
- Fix: Use color input and exact error copy.
