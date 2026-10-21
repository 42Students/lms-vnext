# Work packet (wave 2): edit src/modules/courses/faculty-assessment-report-service.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/faculty-quiz-report.md, docs/audit/gap2/lane-4/teacher-report-assignment-content-id.md

## G2-3-007-016  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/utils/quizReport.js:74-98`
- vNext now: `src/modules/courses/faculty-assessment-report-service.ts:77-119`
- Fix: Legacy equal-accuracy questions retain authored sequence, new sort tie breaks prompt lexicographically. Restore stable authored sequence on ties.

## G2-3-007-039  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/utils/scoreDistribution.js:5-20`
- vNext now: `src/modules/courses/faculty-assessment-report-service.ts:22-50`
- Fix: Legacy bucket compares percentages to fixed integer ranges directly; e.g. 89.5 fits none, vNext rounds to 90 and puts it in 90-100. Normalize raw scores consistently.

## G2-3-007-054  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Report/QuizReportContent.jsx:49-82`
- vNext now: `src/modules/courses/faculty-assessment-report-service.ts:197-243`
- Fix: Legacy client Promise.all and roster optional load with per-request cancellation, vNext all data server-side before stream; add partial report and loading progress for slow roster.

## G2-3-007-060  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/frontend/src/utils/quizReport.js:31-47`; `docs/legacy-source/frontend/src/utils/quizReport.js:99-114`
- vNext now: `src/modules/courses/faculty-assessment-report-service.ts:197-285`
- Fix: Legacy numeric quizId/class roster, submitted-at, learnerId and score rows differ from UUID quiz/delivery/membership, answer snapshots; document conversion and roster scoping.

## G2-4-013-042  [P2] GAP  facet F10  effort M
- Legacy: Legacy fetches GET getLessonContentById, GET assignment fetchSubmissions all pages, GET getLearnersByClass concurrently. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:58-88`; `docs/legacy-source/frontend/src/api/Services/courseServices.js:445-473`)
- vNext now: New service resolves faculty overview, then listAssignmentSubmissions and getFacultyDeliveryRoster. (`src/modules/courses/faculty-assessment-report-service.ts:289-315`)
- Fix: Preserve partial roster success and tenant-scope reads, avoid marking missing as zero.

## G2-4-013-045  [P2] GAP  facet F11  effort M
- Legacy: Legacy controller validates lesson content course and class access; active teaching or author for submission reads. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AssignmentController.java:68-99`)
- vNext now: New report only for current faculty deliveries and current selected Section roster. (`src/modules/courses/faculty-assessment-report-service.ts:12-20`; `src/modules/courses/faculty-assessment-report-service.ts:289-316`)
- Fix: Document approved active teacher vs historical author access and 404 behavior.

## G2-4-013-050  [P2] GAP  facet F12  effort M
- Legacy: Legacy percent rounds each score then averages rounded percentages, caps at 100. (`docs/legacy-source/frontend/src/utils/assignmentReport.js:57-68`; `docs/legacy-source/frontend/src/utils/assignmentReport.js:90-93`)
- vNext now: New computes unrounded percentage mean then rounds once. (`src/modules/courses/faculty-assessment-report-service.ts:121-154`)
- Fix: Match legacy rounding order or document approved correction with examples.

## G2-4-013-083  [P2] GAP  facet F20  effort S
- Legacy: Legacy average rounds per-student before mean; new rounds average of raw percents. (`docs/legacy-source/frontend/src/utils/assignmentReport.js:65-68`; `docs/legacy-source/frontend/src/utils/assignmentReport.js:90-93`)
- vNext now: New raw ratios averaged then Math.round. (`src/modules/courses/faculty-assessment-report-service.ts:121-154`)
- Fix: Match legacy rounding with e.g. three fractional scores.

## G2-4-013-088  [P2] GAP  facet F22  effort L
- Legacy: Legacy report aggregates LessonContents, StudentAssignment and class learner records via REST. (`docs/legacy-source/frontend/src/utils/assignmentReport.js:30-43`; `docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:58-88`)
- vNext now: New aggregates courseAssignments, assignmentSubmissions and Section roster in service. (`src/modules/courses/faculty-assessment-report-service.ts:289-360`)
- Fix: Document membership, delivery and historical learner scoping relationships.
