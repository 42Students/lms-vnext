# Work packet: edit src/modules/courses/faculty-assessment-report-service.ts

18 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/faculty-quiz-report.md, docs/audit/gap2/lane-4/teacher-report-assignment-content-id.md

## G2-3-007-014  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/utils/quizReport.js:49-72`
- vNext now: `src/modules/courses/faculty-assessment-report-service.ts:174-195`; `src/modules/courses/faculty-assessment-report-service.ts:244-261`
- Fix: Legacy average rounds each learner percent before averaging rounded values; vNext averages raw fractions then rounds: can differ by 1. Align formula precisely.

## G2-3-007-026  [P1] GAP  facet F07  effort L
- Legacy: `docs/legacy-source/frontend/src/components/Report/QuizReportContent.jsx:59-67`; `docs/legacy-source/frontend/src/components/Report/QuizReportContent.jsx:148-157`
- vNext now: `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx:28-38`; `src/modules/courses/faculty-assessment-report-service.ts:212-228`
- Fix: Legacy roster API failure falls back to partial data with warning+Retry roster, vNext Promise.all rejects entire report; restore partial-data degrade for roster-only failure.

## G2-3-007-033  [P1] GAP  facet F10  effort L
- Legacy: `docs/legacy-source/frontend/src/components/Report/QuizReportContent.jsx:49-71`; `docs/legacy-source/frontend/src/api/Services/quizServices.js:3-52`
- vNext now: `src/modules/courses/faculty-assessment-report-service.ts:197-228`
- Fix: Legacy GET quiz+all submissions, optional class roster; vNext scoped service requires deliveryId for shared offerings and current roster; trace cross-section report semantics.

## G2-3-007-036  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Report/QuizReportContent.jsx:49-71`; `docs/legacy-source/frontend/src/utils/quizReport.js:31-47`
- vNext now: `src/modules/courses/faculty-assessment-report-service.ts:197-243`
- Fix: Legacy quiz report includes all submissions for quiz, vNext filters to only learners on current verified delivery roster; differences for transferred/withdrawn students need product decision.

## G2-3-007-038  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/utils/quizReport.js:99-114`
- vNext now: `src/modules/courses/faculty-assessment-report-service.ts:234-285`
- Fix: Legacy shared quiz classId null has no single roster denominator, vNext refuses ambiguous multi-delivery without deliveryId. Add section-choice UI or legacy aggregate mode.

## G2-3-007-043  [P1] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Report/QuizReportContent.jsx:59-67`
- vNext now: `src/modules/courses/faculty-assessment-report-service.ts:212-228`
- Fix: Legacy displays partial report if class roster unavailable, vNext failure hides all sections; must preserve completed quiz/submission section.

## G2-3-007-057  [P1] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/utils/quizReport.js:69-72`; `docs/legacy-source/frontend/src/utils/scoreDistribution.js:14-20`
- vNext now: `src/modules/courses/faculty-assessment-report-service.ts:174-195`; `src/modules/courses/faculty-assessment-report-service.ts:29-50`
- Fix: Integer-rounded averages and grade distribution boundary handling differ on 59.5/89.5 weighted scores; add shared regression fixtures.

## G2-4-013-012  [P1] GAP  facet F03  effort M
- Legacy: Partial roster warning yellow Alert Report is partially loaded, Retry roster. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:167-175`)
- vNext now: No partial warning banner; failed roster API fails entire report render. (`src/modules/courses/faculty-assessment-report-service.ts:304-315`; `src/app/(authenticated)/teacher/report/assignment/[contentId]/error.tsx:5-13`)
- Fix: Render partial metrics/warning and Retry roster when submission data succeeded.

## G2-4-013-018  [P1] GAP  facet F04  effort M
- Legacy: Legacy Submitted stat N/rosterSize if roster found, else N only. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:160-163`)
- vNext now: New Submitted always N/eligibleLearners and requires roster. (`src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx:95-100`; `src/modules/courses/faculty-assessment-report-service.ts:304-315`)
- Fix: Support submission-only report partial state when roster unavailable.

## G2-4-013-034  [P1] GAP  facet F07  effort M
- Legacy: Partial roster failure shows Report is partially loaded and precise completion caution. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:82-85`; `docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:167-175`)
- vNext now: New roster failure rejects report with generic error, not partial. (`src/modules/courses/faculty-assessment-report-service.ts:304-315`)
- Fix: Provide partial warning without false missing/eligible counts.

## G2-4-013-044  [P1] GAP  facet F10  effort M
- Legacy: Legacy report reads class roster even without dedicated Section filter. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:67-73`)
- vNext now: New requires one scoped course delivery to disambiguate shared assignments. (`src/modules/courses/faculty-assessment-report-service.ts:157-171`; `src/modules/courses/faculty-assessment-report-service.ts:289-303`)
- Fix: Support unambiguous legacy links; retain strict cross-section scope for shared reports.

## G2-4-013-046  [P1] GAP  facet F11  effort M
- Legacy: Legacy report may be reached by faculty from Blueprint without deliveryId. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:29-33`)
- vNext now: New errors ambiguous shared offering if multiple eligible sections. (`src/modules/courses/faculty-assessment-report-service.ts:157-171`)
- Fix: Provide safe Section chooser on ambiguous deep links.

## G2-4-013-049  [P1] GAP  facet F12  effort M
- Legacy: Legacy isGraded accepts graded==1 OR nonnegative pointsObtained. (`docs/legacy-source/frontend/src/utils/assignmentReport.js:23-28`)
- vNext now: New graded only when gradingStatus GRADED. (`src/modules/courses/faculty-assessment-report-service.ts:329-339`)
- Fix: Map legacy graded flag/score to new grading status consistently.

## G2-4-013-054  [P1] GAP  facet F12  effort M
- Legacy: Legacy notSubmitted from entire roster minus deduped student ids, no foreign-row filter. (`docs/legacy-source/frontend/src/utils/assignmentReport.js:95-112`)
- vNext now: New filters submissions to current active membership roster before all metrics. (`src/modules/courses/faculty-assessment-report-service.ts:12-20`; `src/modules/courses/faculty-assessment-report-service.ts:316-328`)
- Fix: Document differences for withdrawn/transfer students in historic reports.

## G2-4-013-057  [P1] GAP  facet F13  effort M
- Legacy: Legacy roster partial still displays report data and warning. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:82-88`; `docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:167-175`)
- vNext now: New Promise.all failure shows full-page error. (`src/modules/courses/faculty-assessment-report-service.ts:304-315`)
- Fix: Render partial result with missing-count unknown placeholder.

## G2-4-013-085  [P1] GAP  facet F20  effort M
- Legacy: Legacy incomplete roster is a partial state rather than all failure. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:82-88`)
- vNext now: New fail-closed if roster fails. (`src/modules/courses/faculty-assessment-report-service.ts:304-315`)
- Fix: Keep valid submissions data with explicit UNKNOWN completeness when roster unavailable.

## G2-4-013-089  [P1] GAP  facet F22  effort L
- Legacy: Legacy studentId numeric, multiple rows deduped per student; status graded numeric or points. (`docs/legacy-source/frontend/src/utils/assignmentReport.js:23-28`; `docs/legacy-source/frontend/src/utils/assignmentReport.js:43-55`)
- vNext now: New UUID membershipId with GRADED enum and submittedAt. (`src/modules/courses/faculty-assessment-report-service.ts:304-339`)
- Fix: Specify migration of attempt count, points, graded visibility and identity.

## G2-4-013-090  [P1] GAP  facet F22  effort M
- Legacy: Legacy due and points values nested in lesson content DTO, can lack roster. (`docs/legacy-source/frontend/src/utils/assignmentReport.js:37-43`; `docs/legacy-source/frontend/src/utils/assignmentReport.js:100-115`)
- vNext now: New dueAt/maxPoints first-class columns, roster fetched as required dependency. (`src/modules/courses/faculty-assessment-report-service.ts:289-315`)
- Fix: Define nullable due and roster-loss behavior, historical period roster snapshot.
