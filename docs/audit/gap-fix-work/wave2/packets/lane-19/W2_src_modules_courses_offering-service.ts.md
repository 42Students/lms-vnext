# Work packet (wave 2): edit src/modules/courses/offering-service.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/semester-course.md

## G2-8-016-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy service permits add/remove single/all course in semester (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:33-123`)
- vNext now: VNext offering service create/archive per offering, no remove-all by semester (`src/modules/courses/offering-service.ts:216-267,543-622`)
- Fix: Expose equivalent scoped bulk unlink with preview or document replacement

## G2-8-016-012  [P2] GAP  facet F05  effort M
- Legacy: Legacy bulk add appends courses at max courseOrder (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:79-111`)
- vNext now: VNext create assigns displayOrder default0 (`src/db/schema/courses.ts:111-113; src/modules/courses/offering-service.ts:216-300`)
- Fix: Append after max display order, avoid all rows showing 0

## G2-8-016-013  [P2] GAP  facet F06  effort M
- Legacy: Legacy required semesterId and courseId validates both >0 (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:33-46`)
- vNext now: VNext create schema validates UUID period/cohort/course (`src/modules/courses/offering-service.ts:216-239`)
- Fix: Provide exact errors with mapped semantic semester terminology

## G2-8-016-020  [P2] GAP  facet F10  effort M
- Legacy: Legacy addCoursesToSemester bulk skips existing mappings rather than fail entire request (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:79-111`)
- vNext now: VNext createCourseOffering creates one offering per mutation (`src/modules/courses/offering-service.ts:216-391`)
- Fix: Support partial idempotent bulk add semantics with skipped rows

## G2-8-016-021  [P2] GAP  facet F10  effort M
- Legacy: Legacy removeAllCoursesFromSemester hard deletes mapping (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:118-120`)
- vNext now: VNext archiveCourseOffering sets ARCHIVED status (`src/modules/courses/offering-service.ts:543-622`)
- Fix: Decide whether removing assignments should unlink vs archive and restore on reactivation

## G2-8-016-032  [P2] GAP  facet F18  effort M
- Legacy: Legacy duplicate error exact Course is already assigned to this semester (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:51-52`)
- vNext now: VNext offering conflict uses generic conflict code (`src/modules/courses/offering-service.ts:216-391`)
- Fix: Restore field-specific duplicate message in form

## G2-8-016-038  [P2] GAP  facet F23  effort M
- Legacy: Legacy easy bulk attach/remove-all (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:79-120`)
- vNext now: New offering archive more auditable but not same bulk flow (`src/modules/courses/offering-service.ts:543-622`)
- Fix: Expose user-safe bulk assignment management if still in requirements
