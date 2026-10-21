# Work packet (wave 2): edit src/modules/courses/college-assessment-aggregate-service.ts

19 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-quiz-controller.md, docs/audit/gap2/lane-3/college-admin-quizzes.md, docs/audit/gap2/lane-3/superadmin-quizzes-section.md, docs/audit/gap2/lane-3/superadmin-quizzes.md, docs/audit/gap2/lane-4/college-admin-assignments.md, docs/audit/gap2/lane-4/superadmin-sections-assignments.md

## G2-2-022-002  [P2] GAP  facet F01  effort M
- Legacy: AdminQuizController.java:87-103 GET with collegeId,courseId,page,size
- vNext now: src/modules/courses/college-assessment-aggregate-service.ts:47-157 uses chosen college, courseCode, status, query
- Fix: Support old courseId and server-side paging contract or migrate caller.

## G2-2-022-010  [P2] GAP  facet F04  effort M
- Legacy: AdminQuizController.java:89-103 Response<PageResponseDTO<QuizResponseDTO>> with success/message
- vNext now: src/modules/courses/college-assessment-aggregate-service.ts:47-157 items aggregate, counts
- Fix: Expose quiz DTO fields and wrapper for admin clients.

## G2-2-022-019  [P2] GAP  facet F06  effort M
- Legacy: AdminQuizController.java:101-103 service listQuizzesForAdmin returns paged DTO
- vNext now: src/modules/courses/college-assessment-aggregate-service.ts:47-70 college scope from context
- Fix: Provide stable sort/page and totals; avoid unbounded result aggregation.

## G2-2-022-035  [P2] GAP  facet F11  effort M
- Legacy: AdminQuizController.java:98-99 requirePerformAdminActionForCollege
- vNext now: src/modules/courses/college-assessment-aggregate-service.ts:47-70 courses.read permission
- Fix: Compare read/admin action role capability; no elevated rights for learner.

## G2-2-022-059  [P2] GAP  facet F21  effort M
- Legacy: AdminQuizController.java:45-55 QuizService, AccessControlService, ScopeResolutionService dependencies
- vNext now: src/modules/courses/college-assessment-aggregate-service.ts:47-70 permissions/read service integrated
- Fix: Map quiz authoring and admin oversight permissions centrally.

## G2-3-001-013  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:425-431`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:170-176`
- vNext now: `src/components/courses/college-assessment-aggregate.tsx:245-253`; `src/modules/courses/college-assessment-aggregate-service.ts:274-305`
- Fix: Show resolved section name for section-specific quizzes, not only generic `Section-specific` scope.

## G2-3-001-076  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:121-125`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:216-259`
- vNext now: `src/modules/courses/college-assessment-aggregate-service.ts:166-177`; `src/modules/courses/college-assessment-aggregate-model.ts:3-19`
- Fix: Compare 20 vs 25 page fetch and server query/index profile; maintain consistent count and deterministic cursor under large lists.

## G2-3-005-034  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:237-260`; `docs/legacy-source/frontend/src/api/Services/quizServices.js:62-65`
- vNext now: `src/app/(authenticated)/admin/quizzes/page.tsx:39-42`; `src/modules/courses/college-assessment-aggregate-service.ts:128-178`
- Fix: Check selected-college draft/faculty-owner coverage and legacy 20/page API response vs aggregate JOIN.

## G2-3-005-053  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:121-125`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:237-259`
- vNext now: `src/modules/courses/admin-assessment-directory-model.ts:3-10`; `src/modules/courses/college-assessment-aggregate-service.ts:166-177`
- Fix: Pagination backend count, sorting and page size 20 differ; compare ordering to backend repository.

## G2-3-004-013  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:120-127`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:596-605`
- vNext now: `src/components/courses/admin-assessment-read-directory.tsx:109-114`; `src/modules/courses/college-assessment-aggregate-service.ts:166-177`
- Fix: Legacy page size 20 with pager, vNext 25. Align page size and label.

## G2-3-004-025  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:217-259`
- vNext now: `src/app/(authenticated)/admin/quizzes/page.tsx:39-42`; `src/modules/courses/college-assessment-aggregate-service.ts:128-178`
- Fix: Legacy admin API returns 20/page scoped quizzes; vNext direct Drizzle aggregate 25/page and filters with richer joins. Verify parity of draft visibility and faculty ownership.

## G2-3-004-042  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:117-155`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:216-260`
- vNext now: `src/modules/courses/college-assessment-aggregate-service.ts:128-178`
- Fix: Legacy maintains request-sequence cancellation on filter/scope and last-data; SSR new listing has independent authoring options result, verify stale responses at switch.

## G2-3-004-048  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:217-259`
- vNext now: `src/modules/courses/college-assessment-aggregate-service.ts:128-164`
- Fix: Legacy quiz model owns classId/facultyId and gradePublished; vNext course offer/delivery/createdBy UUID fields require reporting equivalence.

## G2-4-004-021  [P2] GAP  facet F04  effort M
- Legacy: Legacy stats may fail per-assignment; UI shows `Unavailable` badge instead of hiding assignment. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentController.java:129-137; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:350-358`)
- vNext now: vNext computes aggregated counts, no explicit per-row `Unavailable` representation. (`src/components/courses/college-assessment-aggregate.tsx:273-276; src/modules/courses/college-assessment-aggregate-service.ts:119-127`)
- Fix: Represent partial unavailable stats without silently displaying zero.

## G2-4-004-061  [P2] GAP  facet F12  effort M
- Legacy: Server list size defaults20 max100; must have positive collegeId and valid class scope. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentController.java:93-112`)
- vNext now: Page fixed25 maxpage1000, scope by membership no external collegeId parameter. (`src/modules/courses/college-assessment-aggregate-model.ts:3-19; src/modules/courses/college-assessment-aggregate-service.ts:54-73`)
- Fix: Align page size and explain server query bounds.

## G2-4-004-085  [P2] GAP  facet F19  effort M
- Legacy: Legacy assignment endpoint page size 20 with assignment stats fetched one at a time (max100/pg). (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentController.java:50-52; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentController.java:105-137`)
- vNext now: Drizzle aggregate query 25/page plus eligibility/activity calculation. (`src/modules/courses/college-assessment-aggregate-model.ts:3; src/modules/courses/college-assessment-aggregate-service.ts:119-127`)
- Fix: Stress-test and quantify query count and data-volume impact for 25 rows vs legacy stats.

## G2-4-010-021  [P2] GAP  facet F04  effort M
- Legacy: Legacy stats may fail per-assignment; UI shows `Unavailable` badge instead of hiding assignment. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentController.java:129-137; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:350-358`)
- vNext now: vNext computes aggregated counts, no explicit per-row `Unavailable` representation. (`src/components/courses/college-assessment-aggregate.tsx:273-276; src/modules/courses/college-assessment-aggregate-service.ts:119-127`)
- Fix: Represent partial unavailable stats without silently displaying zero.

## G2-4-010-061  [P2] GAP  facet F12  effort M
- Legacy: Server list size defaults20 max100; must have positive collegeId and valid class scope. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentController.java:93-112`)
- vNext now: Page fixed25 maxpage1000, scope by membership no external collegeId parameter. (`src/modules/courses/college-assessment-aggregate-model.ts:3-19; src/modules/courses/college-assessment-aggregate-service.ts:54-73`)
- Fix: Align page size and explain server query bounds.

## G2-4-010-085  [P2] GAP  facet F19  effort M
- Legacy: Legacy assignment endpoint page size 20 with assignment stats fetched one at a time (max100/pg). (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentController.java:50-52; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentController.java:105-137`)
- vNext now: Drizzle aggregate query 25/page plus eligibility/activity calculation. (`src/modules/courses/college-assessment-aggregate-model.ts:3; src/modules/courses/college-assessment-aggregate-service.ts:119-127`)
- Fix: Stress-test and quantify query count and data-volume impact for 25 rows vs legacy stats.
