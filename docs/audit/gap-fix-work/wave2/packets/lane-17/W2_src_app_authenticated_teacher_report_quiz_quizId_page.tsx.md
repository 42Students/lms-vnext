# Work packet (wave 2): edit src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx

18 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/faculty-quiz-report.md

## G2-3-007-002  [P2] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Report/QuizReportContent.jsx:135-140`; `docs/legacy-source/frontend/src/components/Report/ReportSummaryHeader.jsx:10-22`
- vNext now: `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx:48-59`
- Fix: Legacy Back uses router.back(), vNext fixed All Quizzes link; preserve previous Blueprint/report origin on Back.

## G2-3-007-003  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Report/QuizReportContent.jsx:135-145`
- vNext now: `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx:49-58`
- Fix: Legacy Back and primary Download PDF appear before heading; new Back + Individual attempts link in header, PDF buried Export options.

## G2-3-007-004  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Report/QuizReportContent.jsx:133-181`
- vNext now: `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx:48-269`
- Fix: Legacy section order header+metric strip→partial warning→Score distribution→Question accuracy→Student scores; vNext adds Export options, badges, Not attempted and Review individual attempts, shifting order.

## G2-3-007-005  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Report/ReportSummaryHeader.jsx:11-37`
- vNext now: `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx:49-58`; `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx:115-138`
- Fix: Restore single ReportSummaryHeader containing nav, title, subtitle and four metric tiles, rather than PageHeader and detached dl.

## G2-3-007-007  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Report/ReportSummaryHeader.jsx:12-22`
- vNext now: `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx:52-114`
- Fix: Restore icon buttons `Back` (ArrowLeft) and primary `Download PDF` (DownloadOutlined) at top; new PDF appears in Disclosure.

## G2-3-007-008  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Report/ReportSummaryHeader.jsx:25-35`
- vNext now: `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx:115-127`
- Fix: Legacy low Average score <60 warning-color number; vNext neutral metrics; add threshold tint.

## G2-3-007-009  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Report/ScoreDistributionBars.jsx:31-36`
- vNext now: `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx:144-150`
- Fix: No graded score empty message must read `No graded scores to chart yet.` instead of no attempts statement, since ungraded attempts can exist.

## G2-3-007-010  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Report/QuestionAccuracyList.jsx:62-70`
- vNext now: `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx:199-217`
- Fix: Use exact `Not answered yet` for absent question response, not `Not answered` / `No answers submitted`.

## G2-3-007-012  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Report/QuizReportContent.jsx:141-147`; `docs/legacy-source/frontend/src/components/Report/ReportSummaryHeader.jsx:25-35`
- vNext now: `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx:115-127`
- Fix: Legacy due date only `MMM D, YYYY`, vNext IST timestamp includes clock; match visible summary date granularity.

## G2-3-007-013  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Report/QuizReportContent.jsx:136-140`
- vNext now: `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx:50-51`
- Fix: Legacy report subtitle Course · Lesson, vNext Course · Section · Lesson; section is an extra field, optionally show elsewhere.

## G2-3-007-021  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Report/ScoreDistributionBars.jsx:36-52`
- vNext now: `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx:147-175`
- Fix: Legacy 6% minimum width for nonzero score bucket, vNext exact proportional width; tiny cohort counts can disappear visually.

## G2-3-007-035  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Report/QuizReportContent.jsx:49-51`
- vNext now: `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx:28-38`
- Fix: Legacy report explicitly fetches correct answers=true and all submissions; vNext service uses getCourseQuiz and listQuizAttempts; verify correct-option access gated to faculty.

## G2-3-007-041  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Report/QuizReportContent.jsx:111-117`
- vNext now: `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx:28-38`
- Fix: Legacy DashboardSkeleton metrics=4 labelled `Loading quiz report`; vNext server page/loading fallback different. Match four metric skeleton blocks.

## G2-3-007-042  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Report/QuizReportContent.jsx:119-130`
- vNext now: `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx:31-38`
- Fix: Legacy Empty retry for report load failure, vNext not-found 404 and exception boundary; differentiate invalid, denied, server unavailable.

## G2-3-007-044  [P2] GAP  facet F14  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Report/ReportSummaryHeader.jsx:13-22`; `docs/legacy-source/frontend/src/utils/downloadQuizReportPdf.js:28-129`
- vNext now: `src/components/courses/faculty-report-download.tsx:14-58`; `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx:80-113`
- Fix: Legacy Download PDF is top-level with report title, summary, accuracy table, student scores; vNext export options includes multiple CSV, PDF in disclosure. Restore primary placement.

## G2-3-007-048  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Report/QuizReportContent.jsx:133-180`; `docs/legacy-source/frontend/src/components/Report/ReportSummaryHeader.jsx:10-37`
- vNext now: `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx:48-138`
- Fix: At phone/tablet, legacy report header nav and stats strip use ln-report-header classes; new vertical Link and dl grid at sm4 can change wrapping and spacing; compare 375/768.

## G2-3-007-050  [P2] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Report/ScoreDistributionBars.jsx:35-36`; `docs/legacy-source/frontend/src/components/Report/QuestionAccuracyList.jsx:48-59`
- vNext now: `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx:148-162`; `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx:212-218`
- Fix: Legacy distribution row has role=img `Score distribution across X students` and question aria prompt/X%/correct; new group/MetricBar labels differ. Align screen-reader descriptions.

## G2-3-007-052  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Report/QuizReportContent.jsx:159-167`
- vNext now: `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx:140-185`
- Fix: Legacy section subtitle exactly `Worst-answered first.`; vNext appends `Accuracy uses each learner's latest attempt only.`. Move explanation to tooltip or secondary help.
