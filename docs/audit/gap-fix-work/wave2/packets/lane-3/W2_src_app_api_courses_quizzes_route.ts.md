# Work packet (wave 2): edit src/app/api/courses/quizzes/route.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l17-u025-quiz-controller.md

## G2-17-025-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/QuizController.java:29-31,55-68 — POST quizzes, PUT update, PATCH publish
- vNext now: src/app/api/courses/quizzes/route.ts:32-51 — POST create then PATCH individual and POST transition
- Fix: Map route/method compatibility for all consumers

## G2-17-025-004  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/QuizController.java:105-120 — list by course, slug, lesson, class, paging
- vNext now: src/app/api/courses/quizzes/route.ts:12-26 — lesson/delivery only
- Fix: Restore course-wide quiz discovery

## G2-17-025-011  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/QuizController.java:45-53 — courseSlug overrides raw courseId
- vNext now: src/app/api/courses/quizzes/route.ts:17-26 — no courseSlug and no courseId
- Fix: Preserve exact slug precedence in all-quizzes filter

## G2-17-025-021  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/QuizController.java:55-153 — single root /api/v1/quizzes endpoint family
- vNext now: src/app/api/courses/quizzes/route.ts:12-57 — split Next API endpoints and result wrappers
- Fix: Write complete endpoint/body/result crosswalk

## G2-17-025-027  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/QuizController.java:117-120 — array for unpaged callers, page wrapper on paged
- vNext now: src/app/api/courses/quizzes/route.ts:12-26 — always quizzes envelope
- Fix: Adapter for mixed legacy list payloads
