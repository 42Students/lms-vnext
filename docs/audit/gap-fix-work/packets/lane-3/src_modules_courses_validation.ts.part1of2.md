# Work packet: edit src/modules/courses/validation.ts (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/courses.md, docs/audit/gap2/lane-14/l18-u018-lesson.md, docs/audit/gap2/lane-18/u003-superadmin-courses.md, docs/audit/gap2/lane-4/l14-u027-faculty-course-association-controller.md, docs/audit/gap2/lane-8/course.md

## G2-12-003-034  [P1] GAP  facet F07  effort S
- Legacy: Max255 Course Name, max64 Short Title with `Maximum 64 characters` `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:46-55`
- vNext now: Name max255, Short Title max120 `src/modules/courses/validation.ts:16-34`
- Fix: Align shortTitle max64 and message

## G2-12-003-085  [P1] GAP  facet F22  effort S
- Legacy: Legacy DTO short_title required max255, course_name required max255, dept_id positive `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/CourseDTO.java:14-31`
- vNext now: VNext shortTitle optional max120, name max255, UUID department `src/modules/courses/validation.ts:16-50`
- Fix: Reconcile requiredness/length and identifier migration

## G2-18-018-008  [P1] GAP  facet F04  effort S
- Legacy: `sequence` Java long (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Lesson.java:24-25`), legacy may autoallocate from max+1 (`LessonServiceImpl.java:133-142`).
- vNext now: `src/db/schema/courses.ts:331` signed int; create schema `src/modules/courses/validation.ts:258-263` 0..10000.
- Fix: Specify range shrink and migration/large imported sequence policy; auto-select first free ordinal rather than exposing required number in UI if old create auto-appended.

## G2-18-018-014  [P1] GAP  facet F06  effort M
- Legacy: Create DTO fields `lessonName`, courseId/courseSlug, optional active/enabled, sequence, contentsDTOs (`LessonDTO.java:13-22`).
- vNext now: `src/modules/courses/validation.ts:248-264` accepts learningPathId,name,optional description,required sequence; no nested contentsDTOs.
- Fix: Compare legacy create form and contents-in-same-request workflow; offer equivalent authoring actions or explicitly document deliberate split.

## G2-18-018-021  [P1] MISSING  facet F07  effort M
- Legacy: Move with class-specific contents blocked with exact long warning (`LessonServiceImpl.java:316-326`).
- vNext now: `src/modules/courses/validation.ts:265-288` has no move operation.
- Fix: Before implementing move, require same-college and curricular ancestry checks and show class-specific warning.

## G2-18-003-034  [P1] GAP  facet F06  effort S
- Legacy: Legacy Short display name required max64, placeholder DSA. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:50-55`
- vNext now: vNext shortTitle max120 and optional in schema. `src/modules/courses/validation.ts:24-25`, `src/modules/courses/validation.ts:30-41`
- Fix: Retain required at UX (max64) or explicitly document 120/optional product change.

## G2-18-003-035  [P1] GAP  facet F06  effort M
- Legacy: Legacy Official course code optional max40, placeholder CS101. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:58-61`
- vNext now: vNext primary course code required length <=64, optional officialCode length<=64. `src/modules/courses/validation.ts:16-25`, `src/modules/courses/validation.ts:30-41`
- Fix: Avoid mapping blank legacy official code to required primary code incorrectly; preserve fallback semantics.

## G2-18-003-036  [P1] MISSING  facet F06  effort M
- Legacy: Legacy In this Course Heading required max255. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:64-67`
- vNext now: vNext course validation has no introductionHeading field. `src/modules/courses/validation.ts:28-45`
- Fix: Add persisted introduction heading and required form field, update read-only course display.

## G2-18-003-046  [P1] GAP  facet F07  effort M
- Legacy: Legacy Code input max40 optional; no pattern except image/colour. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:58-61`
- vNext now: vNext required courseCode regex `[A-Za-z0-9._-]` with error Code may contain ... . `src/modules/courses/validation.ts:16-23`
- Fix: Document stricter code constraint; accept legacy persisted values or migration normalization, do not reject equivalent edit unexpectedly.

## G2-18-003-073  [P1] GAP  facet F12  effort M
- Legacy: Legacy course name required, name max255, shortTitle required max64, code optional max40. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:46-61`
- vNext now: vNext name max255, shortTitle optional max120, code required max64/regex, officialCode optional64. `src/modules/courses/validation.ts:11-45`
- Fix: Implement compatibility mapping, field messages and explicit normalized constraints.

## G2-18-003-074  [P1] GAP  facet F12  effort L
- Legacy: Legacy course metadata image+color, takeaways and intro heading required. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:64-89`
- vNext now: vNext retains color/takeaways/description but drops heading/image in base course schema. `src/db/schema/courses.ts:34-61`, `src/modules/courses/validation.ts:24-45`
- Fix: Restore image+intro heading and ordered takeaways representation.

## G2-18-003-110  [P1] GAP  facet F22  effort M
- Legacy: Legacy shortTitle max64 and optional courseCode40; vNext shortTitle120, required code64 with DB uniqueness. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:50-61`
- vNext now: vNext validation plus unique code/name in department. `src/modules/courses/validation.ts:16-45`, `src/modules/courses/course-service.ts:51-126`, `src/db/schema/courses.ts:66-78`
- Fix: Document constraint collisions and migration/coercion, test longest persisted values.

## G2-14-027-012  [P1] GAP  facet F06  effort M
- Legacy: Single create DTO requires facultyId min1, courseIds non-null List<Integer> `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/FacultyCourseAssociationCreateRequestDTO.java:9-14`
- vNext now: New create requires deliveryId, membershipId UUID, role enum `src/modules/courses/validation.ts:131-137`
- Fix: Implement safe facultyId/courseIds→membership/delivery conversion with selected class/period.

## G2-14-027-013  [P1] GAP  facet F06  effort M
- Legacy: Bulk request is non-null array of association DTOs, no explicit size max `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/BulkFacultyCourseAssociationCreateRequestDTO.java:6-15`
- vNext now: New batch 1..10 unique delivery UUIDs for one membership/role `src/modules/courses/validation.ts:143-149`
- Fix: Provide multi-faculty batch bridge or explicitly reject unsupported old payload.

## G2-8-020-021  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/CourseDTO.java:22-26 null parentCourseId unchanged, explicit <=0 clears
- vNext now: src/modules/courses/validation.ts:52-66 update has no parentCourseId
- Fix: Restore parent edit and explicit clearing semantics.

## G2-8-020-022  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/CourseDTO.java:27-31 optional active/enabled/display/metadata
- vNext now: src/modules/courses/validation.ts:36-66 cannot edit these fields via course schema
- Fix: Add equivalent controls and field-by-field validation.

## G2-8-020-063  [P1] GAP  facet F20  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CourseServiceImpl.java:303-352 merge absent metadata fields to avoid concurrent erasure
- vNext now: src/modules/courses/validation.ts:52-73 partial top-level edit only
- Fix: Carry generic JSON preservation when metadata reintroduced.

## G2-18-018-018  [P2] GAP  facet F07  effort S
- Legacy: `Lesson name is required` and `Lesson name must not exceed 255 characters` (`LessonDTO.java:14-16`).
- vNext now: Zod generic min/max `.trim()` `src/modules/courses/validation.ts:15-19`; default errors differ.
- Fix: Map client/server schema issue to exact legacy label strings and field-level red state.

## G2-18-003-045  [P2] GAP  facet F07  effort S
- Legacy: Legacy Course Name validation `Enter a course name` and `Maximum 255 characters`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:46-49`
- vNext now: vNext schema min1 max255, generic validation error text via API model. `src/modules/courses/validation.ts:11-15`, `src/components/courses/admin-course-actions.tsx:196-205`
- Fix: Translate field errors into exact copy and inline location.

## G2-8-020-025  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/CourseDTO.java:14-21 exact “short_title is required”, “course_name is required”
- vNext now: src/modules/courses/validation.ts:16-32 generic Zod min error and code regex
- Fix: Restore legacy label/validation copy for course create form.
