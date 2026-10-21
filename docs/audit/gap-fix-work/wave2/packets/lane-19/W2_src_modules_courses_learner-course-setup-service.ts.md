# Work packet (wave 2): edit src/modules/courses/learner-course-setup-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/student-course-controller.md

## G2-3-025-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentCourseController.java:72-83`
- vNext now: `src/modules/courses/learner-course-setup-service.ts:47-61`
- Fix: Expose the semester-picker data contract as a defined learner read; the current page calls setup service server-side rather than a distinct student semester endpoint.

## G2-3-025-041  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/StudentCourseServiceImpl.java:93-117`
- vNext now: `src/modules/courses/learner-course-setup-service.ts:47-61`
- Fix: Legacy semester picker includes inactive historical nondeleted semesters ordered by semesterNumber; vNext lists programTerms and delivered academic-period options.

## G2-3-025-070  [P2] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentCourseController.java:72-83`
- vNext now: `src/modules/courses/learner-course-setup-service.ts:49-61`
- Fix: Legacy standalone semester endpoint no longer exists as an HTTP contract; server-side program term retrieval partially replaces it.
