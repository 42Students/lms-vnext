# Work packet (wave 2): edit src/modules/admin-ui/super-admin-quiz-query-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-quiz-controller.md, docs/audit/gap2/lane-3/superadmin-quizzes.md

## G2-2-022-018  [P2] GAP  facet F06  effort M
- Legacy: AdminQuizController.java:90-93 positive integer collegeId, optional integer courseId,page,size
- vNext now: src/modules/admin-ui/super-admin-quiz-query-model.ts:7-17 q/status/courseCode/scope/results/page strings
- Fix: Translate/validate old query keys and integer values.

## G2-3-004-014  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:497-522`
- vNext now: `src/components/courses/admin-assessment-read-directory.tsx:34-61`; `src/modules/admin-ui/super-admin-quiz-query-model.ts:7-18`
- Fix: Legacy one searchable clearable course dropdown and page reset; vNext courseCode plain input plus status/results/scope filters. Preserve simple primary course selector.
