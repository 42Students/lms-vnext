# Work packet (wave 2): edit src/components/courses/faculty-report-download.tsx

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u009-teacher-attendance-view.md, docs/audit/gap2/lane-3/faculty-quiz-report.md, docs/audit/gap2/lane-4/teacher-report-assignment-content-id.md

## G2-14-009-058  [P2] GAP  facet F14  effort S
- Legacy: Download filename attendance-course-MMMM-YYYY.pdf `docs/legacy-source/frontend/src/utils/downloadMonthlyAttendancePdf.js:140-142`
- vNext now: Filename attendance-report-title-with-YYYY-MM.pdf `src/components/attendance/faculty-attendance-workspace.tsx:598-600` `src/components/courses/faculty-report-download.tsx:26-31`
- Fix: Use original name token order and month label

## G2-3-007-030  [P2] GAP  facet F09  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Report/QuizReportContent.jsx:98-105`
- vNext now: `src/components/courses/faculty-report-download.tsx:48-58`
- Fix: Restore Ant centered Modal confirmation with exact text and Cancel, rather than generic ConfirmDialog copy and composition.

## G2-3-007-034  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Report/QuizReportContent.jsx:85-109`; `docs/legacy-source/frontend/src/utils/downloadQuizReportPdf.js:28-48`
- vNext now: `src/components/courses/faculty-report-download.tsx:14-45`
- Fix: Legacy jsPDF/autoTable client builder versus vNext binary builder; inspect page breaks, incomplete stamp, metadata and exact filename before parity.

## G2-3-007-044  [P2] GAP  facet F14  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Report/ReportSummaryHeader.jsx:13-22`; `docs/legacy-source/frontend/src/utils/downloadQuizReportPdf.js:28-129`
- vNext now: `src/components/courses/faculty-report-download.tsx:14-58`; `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx:80-113`
- Fix: Legacy Download PDF is top-level with report title, summary, accuracy table, student scores; vNext export options includes multiple CSV, PDF in disclosure. Restore primary placement.

## G2-3-007-045  [P2] GAP  facet F14  effort M
- Legacy: `docs/legacy-source/frontend/src/utils/downloadQuizReportPdf.js:41-62`
- vNext now: `src/components/courses/faculty-report-download.tsx:19-30`
- Fix: Legacy PDF includes due, generated-at and `INCOMPLETE DATA` stamp with missing-roster reason; vNext PDF summary generic incomplete warning. Match metadata and warning.

## G2-4-013-010  [P2] GAP  facet F03  effort M
- Legacy: Download PDF primary has DownloadOutlined and loading spinner. (`docs/legacy-source/frontend/src/components/Report/ReportSummaryHeader.jsx:14-21`)
- vNext now: New Download PDF primary separated under heading, no icon and no pending indicator in button component. (`src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx:69-94`; `src/components/courses/faculty-report-download.tsx:48-57`)
- Fix: Restore download icon, button position and loading feedback.

## G2-4-013-043  [P2] GAP  facet F10  effort L
- Legacy: Legacy download generates jsPDF client-side from already fetched report and local class roster. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:102-125`; `docs/legacy-source/frontend/src/utils/downloadAssignmentReportPdf.js:19-37`)
- vNext now: New client builds custom PDF from server-scoped arrays. (`src/components/courses/faculty-report-download.tsx:14-44`; `src/modules/courses/faculty-report-pdf.ts:43-75`)
- Fix: Match PDF visual/layout and warning stamp while retaining server authorization.

## G2-4-013-067  [P2] GAP  facet F15  effort S
- Legacy: PDF generation failure uses an AntD message.error toast. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:102-111`)
- vNext now: New renders inline error Alert. (`src/components/courses/faculty-report-download.tsx:43-58`)
- Fix: Use transient toast in legacy position for PDF failure.

## G2-4-013-074  [P2] GAP  facet F17  effort S
- Legacy: Legacy PDF button disabled/loading while generation in progress. (`docs/legacy-source/frontend/src/components/Report/ReportSummaryHeader.jsx:14-21`)
- vNext now: New click invokes immediate PDF creation with no loading indication. (`src/components/courses/faculty-report-download.tsx:14-57`)
- Fix: Disable double submit and announce progress for large reports.

## G2-4-013-076  [P2] GAP  facet F18  effort S
- Legacy: Legacy header button labels Back and Download PDF. (`docs/legacy-source/frontend/src/components/Report/ReportSummaryHeader.jsx:10-21`)
- vNext now: New uses ← My Assignments and separate Download PDF. (`src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx:49-52`; `src/components/courses/faculty-report-download.tsx:49-52`)
- Fix: Restore Back text with icon and old placement.

## G2-14-009-010  [P3] GAP  facet F03  effort S
- Legacy: DownloadOutlined icon before Download Report `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:221-228`
- vNext now: Report button has text but no icon `src/components/courses/faculty-report-download.tsx:48-52`
- Fix: Add legacy icon and right-side grid-header placement

## G2-4-013-040  [P3] GAP  facet F09  effort S
- Legacy: Legacy partial download opens AntD Modal.confirm with cancel text Cancel. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:114-125`)
- vNext now: New ConfirmDialog for incomplete download with default cancel behavior. (`src/components/courses/faculty-report-download.tsx:53-57`)
- Fix: Match modal width, cancel wording and focus order.

## G2-4-013-065  [P3] GAP  facet F14  effort S
- Legacy: Legacy file naming assignment-report-title with nonalphanumerics hyphens (retains trailing). (`docs/legacy-source/frontend/src/utils/downloadAssignmentReportPdf.js:118-120`)
- vNext now: New lowercases, trims boundaries and truncates filename at 70 chars. (`src/components/courses/faculty-report-download.tsx:23-30`)
- Fix: Align exported filename normalization if strict parity is required.
