# Work packet: edit src/components/courses/learner-course-list.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u006-learner-courses.md, docs/audit/gap2/lane-3/student-course-controller.md

## G2-15-006-018  [P1] GAP  facet F05  effort M
- Legacy: Legacy semester selection defaults backend current semester, can view off-current for reference (CoursesContent.jsx:233-246)
- vNext now: VNext picks newest non-readOnly current period else newest historical, lists past as readOnly (learner-course-preferred-period-model.ts:1-13; learner-course-list.tsx:112-128)
- Fix: Map authoritative semester currentSemester and preserve reference-only flag per selected semester

## G2-3-025-040  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/StudentCourseServiceImpl.java:162-181`
- vNext now: `src/components/courses/learner-course-list.tsx:95-114`
- Fix: Legacy defaults to batch.currentSemester or 1 and falls back from invalid/foreign requested semester; vNext preferred academic period comes from available deliveries and period options.

## G2-3-025-061  [P1] MISSING  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentCourseController.java:45-51`
- vNext now: `src/components/courses/learner-course-list.tsx:112-114`
- Fix: Missing explicit requestedSemesterId and semesterFallbackApplied response; add recoverable invalid-selection feedback and canonical picker reset.

## G2-3-025-029  [P2] MISSING  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Course/CoursesContent.jsx:205-207`
- vNext now: `src/components/courses/learner-course-list.tsx:175-199`
- Fix: Expose exact semester-load failures Session expired. Please sign in again. and Could not load semesters. where a future client refresh exists.

## G2-3-025-030  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Course/CoursesContent.jsx:471-481`
- vNext now: `src/components/courses/learner-course-list.tsx:171-200`
- Fix: Render exact Updating courses for the selected semester… and fallback/retry info where async period retrieval is supported.
