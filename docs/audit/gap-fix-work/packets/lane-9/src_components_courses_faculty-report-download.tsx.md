# Work packet: edit src/components/courses/faculty-report-download.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u009-teacher-attendance-view.md, docs/audit/gap2/lane-4/teacher-report-assignment-content-id.md, docs/audit/gap2/lane-3/faculty-quiz-report.md

## G2-14-009-057  [P1] GAP  facet F14  effort L
- Legacy: PDF has portrait per-student summary and landscape day-by-day matrix `docs/legacy-source/frontend/src/utils/downloadMonthlyAttendancePdf.js:25-31` `docs/legacy-source/frontend/src/utils/downloadMonthlyAttendancePdf.js:75-138`
- vNext now: Generic PDF takes summary text and learner text rows only `src/components/attendance/faculty-attendance-workspace.tsx:596-632` `src/components/courses/faculty-report-download.tsx:14-45`
- Fix: Restore two-part PDF with color-coded daily matrix

## G2-4-013-031  [P1] GAP  facet F06  effort M
- Legacy: Legacy incomplete PDF confirmation shown only on failed class roster. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:114-126`)
- vNext now: New confirmation if any student missing/ungraded or cohort size zero. (`src/modules/courses/faculty-report-completeness.ts:4-16`; `src/components/courses/faculty-report-download.tsx:49-57`)
- Fix: Separate data-integrity incomplete from legitimate in-progress ungraded roster.

## G2-3-007-027  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Report/QuizReportContent.jsx:85-108`
- vNext now: `src/components/courses/faculty-report-download.tsx:48-58`
- Fix: Legacy PDF generation catch toast `Couldn't generate the PDF. Please try again.`, vNext inline `Could not generate the PDF. Please try again.` wording/place differs.

## G2-3-007-028  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Report/QuizReportContent.jsx:148-157`
- vNext now: `src/components/courses/faculty-report-download.tsx:53-57`
- Fix: Legacy incomplete dialog includes actual roster warning, vNext generic ungraded/unsubmitted reason and no runtime partial data. Include specific missing dependency.

## G2-4-013-035  [P2] GAP  facet F07  effort S
- Legacy: PDF generation failure toast Couldn't generate the PDF. Please try again. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:102-111`)
- vNext now: New Alert text Could not generate the PDF. Please try again. (`src/components/courses/faculty-report-download.tsx:43-58`)
- Fix: Restore apostrophe and toast duration/placement.

## G2-4-013-037  [P2] GAP  facet F08  effort M
- Legacy: Partial download confirm title This report is incomplete and full roster-specific warning; Download marked incomplete. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:114-125`)
- vNext now: New confirmation same title/button but generic missing/ungraded explanation. (`src/components/courses/faculty-report-download.tsx:49-57`)
- Fix: Match trigger and content to actual data failure.

## G2-4-013-038  [P3] GAP  facet F08  effort S
- Legacy: Legacy download button loading during jsPDF generation, no separate success toast. (`docs/legacy-source/frontend/src/components/Report/ReportSummaryHeader.jsx:14-21`; `docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:102-112`)
- vNext now: New synchronous download without pending state; no success toast. (`src/components/courses/faculty-report-download.tsx:14-46`)
- Fix: Set pending visual affordance for large PDF generation.
