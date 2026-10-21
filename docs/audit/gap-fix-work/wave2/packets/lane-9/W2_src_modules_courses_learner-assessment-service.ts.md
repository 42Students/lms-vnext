# Work packet (wave 2): edit src/modules/courses/learner-assessment-service.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/all-assignments.md, docs/audit/gap2/lane-8/learner-all-quizzes.md

## G2-12-007-038  [P2] GAP  facet F11  effort S
- Legacy: Faculty or learner role in shared component; faculty CRUD guarded clientside `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:213-217`
- vNext now: Requires own course learner read permission `src/modules/courses/learner-assessment-service.ts:35-35`
- Fix: Validate parity via faculty route, deny wrong role

## G2-12-007-044  [P2] GAP  facet F12  effort S
- Legacy: Assignment list from teacher or learner role filtered by courseSlug `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:283-309`
- vNext now: Only enrolled published course deliveries and course UUID filter `src/modules/courses/learner-assessment-service.ts:63-73`
- Fix: Document stricter course delivery targeting

## G2-12-007-066  [P2] GAP  facet F19  effort S
- Legacy: Submission statuses fetched in one separate list `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:326-356`
- vNext now: Assessment source joins all matching submissions `src/modules/courses/learner-assessment-service.ts:69-73`
- Fix: Keep one-per-record and exclude unauthorized status

## G2-8-007-027  [P2] GAP  facet F10  effort M
- Legacy: listQuizzesV2 GET page,size,courseSlug,classId; current page server-backed (`docs/legacy-source/frontend/src/components/Quiz/Table/table.js:440-474`)
- vNext now: getLearnerAssessmentOverview server query of own deliveries/flat quiz rows (`src/modules/courses/learner-assessment-service.ts:31-70`)
- Fix: Build parity adapter for filter keys, total, class scope and statuses without reusing legacy API

## G2-8-007-036  [P2] GAP  facet F13  effort S
- Legacy: course filter lookup failure shows Couldn't load your courses · Retry (`docs/legacy-source/frontend/src/components/Quiz/Table/table.js:702-704`)
- vNext now: server overview combined fetch, no local course-options retry button (`src/modules/courses/learner-assessment-service.ts:31-38`)
- Fix: Add safe course-list retry/error messaging when associated course read fails

## G2-8-007-046  [P2] GAP  facet F19  effort M
- Legacy: legacy list pagination occurs server with 20 rows each, page-local stats fallback (`docs/legacy-source/frontend/src/components/Quiz/Table/table.js:40,459-504`)
- vNext now: new service assembles all own quiz rows then client pages by 20 (`src/modules/courses/learner-assessment-service.ts:63-72; src/components/courses/learner-assessment-overview.tsx:163-171`)
- Fix: Assess course size, DB query cap and scalable server pagination

## G2-8-007-050  [P2] GAP  facet F22  effort M
- Legacy: legacy quiz IDs/class IDs and statuses returned by quizServices v2 (`docs/legacy-source/frontend/src/components/Quiz/Table/table.js:22-28,459-474`)
- vNext now: vNext courseQuizzes/quizAttempts keyed by courseDelivery, read own rows (`src/modules/courses/learner-assessment-service.ts:63-70`)
- Fix: Document canonical quiz delivery/attempt migration mapping and stable action IDs

## G2-12-007-071  [P3] GAP  facet F21  effort S
- Legacy: Legacy courseServices endpoints GET/POST and progress update `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:13-20`
- vNext now: Drizzle local course services, no external job in read path `src/modules/courses/learner-assessment-service.ts:31-73`
- Fix: Trace progress completion side effect to mutation service
