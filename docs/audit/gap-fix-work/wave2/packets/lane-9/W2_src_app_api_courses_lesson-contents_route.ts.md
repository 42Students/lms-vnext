# Work packet (wave 2): edit src/app/api/courses/lesson-contents/route.ts

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l13-u027-faculty-lesson-content-controller.md, docs/audit/gap2/lane-3/lesson-content-controller.md

## G2-13-027-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyLessonContentController.java:30-32,55-56 — faculty POST /api/v1/faculty/lesson-contents/create
- vNext now: src/app/api/courses/lesson-contents/route.ts:30-49 — POST /api/courses/lesson-contents; no faculty path
- Fix: Update integration contract and route link; preserve delegated faculty rights.

## G2-13-027-021  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyLessonContentController.java:55-56 — LessonContentsDTO snake_case body, includes classId/courseId
- vNext now: src/app/api/courses/lesson-contents/route.ts:30-49 — JSON body returns {content}, status 201
- Fix: Publish full payload field/name/status conversion table.

## G2-3-027-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:49-53`
- vNext now: `src/app/api/courses/lesson-contents/route.ts:12-30`
- Fix: Legacy all lesson content reads/writes share /api/v1/lesson/contents namespace; vNext splits CRUD, transition, order and progress. Preserve tested caller crosswalk.

## G2-3-027-003  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:287-349`
- vNext now: `src/app/api/courses/lesson-contents/route.ts:12-27`
- Fix: Legacy offers generic fetch and fetchSpecificLessonContents with explicit classId; vNext offers GET by lessonId/deliveryId and inferred shared audience.

## G2-3-027-024  [P2] MISSING  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:431-437`
- vNext now: `src/app/api/courses/lesson-contents/route.ts:12-24`
- Fix: Legacy optional courseSlug takes precedence over courseId on assignments filter; vNext lesson content route lacks either course filter.

## G2-3-027-030  [P2] MISSING  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:449-450`
- vNext now: `src/app/api/courses/lesson-contents/route.ts:12-24`
- Fix: Legacy facultyId must positive integer with explicit message; vNext only scoped session authoring and no facultyId filter on content GET.

## G2-3-027-041  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:214-285`
- vNext now: `src/app/api/courses/lesson-contents/route.ts:30-54`
- Fix: Legacy creates active/enabled lesson content and sets facultyId from principal/admin selected faculty; vNext creates normalized authored row with createdByUserId.

## G2-3-027-058  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:287-323`
- vNext now: `src/app/api/courses/lesson-contents/route.ts:12-27`
- Fix: Legacy fetch returns generic+class content and sanitizes quiz answers; vNext content GET derives audience but quiz lives in separate modules, requires no-answer-leak proof.

## G2-3-027-059  [P2] MISSING  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:351-429`
- vNext now: `src/app/api/courses/lesson-contents/route.ts:12-27`
- Fix: Metrics/grades endpoint absence prevents exact empty counts/status behavior, not merely missing columns.

## G2-3-027-085  [P2] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:387-429`
- vNext now: `src/app/api/courses/lesson-contents/route.ts:12-54`
- Fix: Legacy content-grades aggregate absent in vNext lesson-content endpoint; explicit ownership of grades report unresolved.
