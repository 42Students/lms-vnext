# Work packet (wave 2): edit src/modules/courses/admin-assessment-directory-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-quiz-controller.md, docs/audit/gap2/lane-3/superadmin-quizzes-section.md

## G2-2-022-014  [P2] GAP  facet F05  effort M
- Legacy: AdminQuizController.java:90-102 optional courseId, page0 size20 default
- vNext now: src/modules/courses/admin-assessment-directory-model.ts:3-10 page1 max1000, no size parameter
- Fix: Support 20/page, old indexed pagination and course selector.

## G2-3-005-014  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:121-124`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:237-246`
- vNext now: `src/modules/courses/admin-assessment-directory-model.ts:3-10`; `src/components/courses/admin-assessment-read-directory.tsx:109-114`
- Fix: Legacy page size=20 and page starts at backend 0; new size=25 and page starts at URL 1.

## G2-3-005-053  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:121-125`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:237-259`
- vNext now: `src/modules/courses/admin-assessment-directory-model.ts:3-10`; `src/modules/courses/college-assessment-aggregate-service.ts:166-177`
- Fix: Pagination backend count, sorting and page size 20 differ; compare ordering to backend repository.
