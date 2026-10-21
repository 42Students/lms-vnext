# Work packet: edit src/modules/courses/course-service.ts (part 2 of 2)

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/course.md, docs/audit/gap2/lane-18/u003-superadmin-courses.md

## G2-8-020-026  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CourseServiceImpl.java:264-267 duplicate course name OR short title error
- vNext now: src/modules/courses/course-service.ts:51-112 duplicate name OR code; no shortTitle conflict
- Fix: Add case-insensitive short-title collision policy if legacy expected.

## G2-8-020-028  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CourseController.java:384-390 409 stale version “This course was modified by someone else...”
- vNext now: src/modules/courses/course-service.ts:288-361 locks row, updates without expected version supplied
- Fix: Expose optimistic expected version/token in edit payload and 409 stale response.

## G2-8-020-036  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CourseController.java:322-403 PUT update supports dept transfer plus metadata/active/enabled
- vNext now: src/modules/courses/course-service.ts:288-361 update name/code/card metadata only
- Fix: Preserve meaningful mutation side effects/visibility and department moves.

## G2-8-020-061  [P1] GAP  facet F20  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Course.java:44-53 JPA @Version for lost JSON update prevention
- vNext now: src/modules/courses/course-service.ts:309-338 row lock, no request expected version
- Fix: Implement frontend expectedUpdatedAt/version CAS and stale conflict notice.

## G2-18-003-047  [P2] GAP  facet F07  effort M
- Legacy: Legacy duplicate/delete/create errors shown field-level via applyServerFieldErrors, Alert Course was not created/edited/deleted. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:363-381`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:546-550`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:572-574`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:644-647`
- vNext now: vNext API errors mapped by academicSetupErrorMessage and toast `Course update failed`. `src/components/courses/admin-course-actions.tsx:34-64`, `src/modules/courses/course-service.ts:51-126`
- Fix: Render per-field errors and exact Alert headings in appropriate form/list.

## G2-8-020-032  [P2] GAP  facet F08  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CourseController.java:67-92 create returns OK/OK and saved Course
- vNext now: src/modules/courses/course-service.ts:205-286 returns row plus event; API envelope differs
- Fix: Map response/notification copy to legacy if old clients are still active.
