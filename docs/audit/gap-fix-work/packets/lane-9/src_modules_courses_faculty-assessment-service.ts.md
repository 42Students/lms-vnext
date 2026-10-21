# Work packet: edit src/modules/courses/faculty-assessment-service.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/faculty-all-quizzes.md, docs/audit/gap2/lane-4/teacher-all-assignments.md

## G2-3-006-018  [P1] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:440-474`
- vNext now: `src/modules/courses/faculty-assessment-service.ts:151-157`
- Fix: Legacy list order from backend listQuizzesV2 (repository ordering UNKNOWN), vNext explicit dueAt ascending/title; compare exact sort before claiming parity.

## G2-3-006-058  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:440-474`
- vNext now: `src/modules/courses/faculty-assessment-service.ts:62-79`
- Fix: Legacy facultyProgram courseId/classId/courseSlug and numeric quizId vs vNext offering/delivery/lesson UUID; map course+class to delivery and verify shared offering visibility.

## G2-3-006-059  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:309-338`
- vNext now: `src/modules/courses/faculty-assessment-service.ts:62-79`
- Fix: Legacy gradePublished value and faculty status derived due need equivalent persisted resultsPublished+dueAt fields and release policy.

## G2-4-012-017  [P1] GAP  facet F04  effort M
- Legacy: Teacher fetch requests active and enabled only. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:288-295`)
- vNext now: New list loads DRAFT/PUBLISHED, excluding ARCHIVED. (`src/modules/courses/faculty-assessment-service.ts:69-82`)
- Fix: Separate drafts from old active listing or approve changed list visibility.

## G2-4-012-047  [P1] GAP  facet F10  effort M
- Legacy: Legacy GET faculty list with facultyId, active/enabled, courseSlug and server page size20. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:282-322`; `docs/legacy-source/frontend/src/api/Services/courseServices.js:431-443`)
- vNext now: New server aggregates all assignments across active teaching deliveries. (`src/modules/courses/faculty-assessment-service.ts:16-82`; `src/components/courses/faculty-assessment-overview.tsx:48-57`)
- Fix: Match legacy filtering and pagination or separate changed statuses.

## G2-4-012-088  [P1] GAP  facet F22  effort M
- Legacy: Legacy enabled=false soft-delete retains submissions. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:475-495`)
- vNext now: New ARCHIVED status filters out of overview. (`src/db/schema/assessments.ts:46-48`; `src/modules/courses/faculty-assessment-service.ts:69-82`)
- Fix: Preserve grade/submission history and access rules on archive.
