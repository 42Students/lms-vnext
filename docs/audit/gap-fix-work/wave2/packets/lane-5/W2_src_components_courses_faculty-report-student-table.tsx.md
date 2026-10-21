# Work packet (wave 2): edit src/components/courses/faculty-report-student-table.tsx

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/faculty-quiz-report.md, docs/audit/gap2/lane-4/teacher-report-assignment-content-id.md

## G2-3-007-011  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Report/ReportStudentTable.jsx:51-90`
- vNext now: `src/components/courses/faculty-report-student-table.tsx:56-74`
- Fix: Restore colored initials avatars/low-score styling and three headers `Student`,`Score`,`Submitted`; new four headers `Learner`,`Score`,`Submitted`,`Details`.

## G2-3-007-018  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Report/ReportStudentTable.jsx:41-95`
- vNext now: `src/components/courses/faculty-report-student-table.tsx:28-99`; `src/modules/courses/faculty-report-students.ts:10-39`
- Fix: Legacy all student-score rows shown with no pagination, vNext caps visible rows at 20 with Previous/Next; match default view or disclose pagination.

## G2-3-007-019  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Report/ReportStudentTable.jsx:41-52`
- vNext now: `src/components/courses/faculty-report-student-table.tsx:36-47`
- Fix: Legacy search placeholder `Search students…` with prefix search icon + allowClear, vNext label `Search students`, placeholder `Name`, no icon.

## G2-3-007-023  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Report/ReportStudentTable.jsx:32-51`
- vNext now: `src/components/courses/faculty-report-student-table.tsx:19-44`
- Fix: Search input displays only if >8 students in both, but vNext does not provide allowClear X; restore exact clear behavior.

## G2-3-007-049  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Report/ReportStudentTable.jsx:41-95`
- vNext now: `src/components/courses/faculty-report-student-table.tsx:28-99`
- Fix: Legacy 3-column student list with initials, new DataTable responsive priority/grid and fourth Details column; match mobile stack.

## G2-3-007-051  [P2] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Report/ReportStudentTable.jsx:35-51`
- vNext now: `src/components/courses/faculty-report-student-table.tsx:36-47`
- Fix: Legacy SearchOutlined prefix/clearable search, new labelled input with focus ring; preserve keyboard search clear and no-results announcement.

## G2-3-007-053  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Report/QuizReportContent.jsx:172-179`
- vNext now: `src/components/courses/faculty-report-student-table.tsx:62-72`
- Fix: Legacy `Student` column and `Submitted` date/`Score` labels; vNext `Learner`, extra `Details`, and different timestamp language.

## G2-4-013-015  [P2] GAP  facet F03  effort M
- Legacy: Legacy student header has initials-tint avatars and custom score rows. (`docs/legacy-source/frontend/src/components/Report/ReportStudentTable.jsx:5-29`; `docs/legacy-source/frontend/src/components/Report/ReportStudentTable.jsx:70-94`)
- vNext now: New DataTable uses bold student name and percentage, no avatar. (`src/components/courses/faculty-report-student-table.tsx:55-74`)
- Fix: Restore avatar tint, initials and score hierarchy.

## G2-4-013-020  [P2] GAP  facet F04  effort S
- Legacy: Legacy student Submitted cell formats MMM D, h:mm A plus Late pill, missing uses em dash. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:192-205`)
- vNext now: New table date uses IST timestamp plus separate Details text Late/On time and Published/Private. (`src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx:172-184`; `src/components/courses/faculty-report-student-table.tsx:69-73`)
- Fix: Render legacy date and Late pill within Submitted cell.

## G2-4-013-022  [P2] GAP  facet F04  effort S
- Legacy: Legacy grade score percent and points as two tiers, low under60 red. (`docs/legacy-source/frontend/src/components/Report/ReportStudentTable.jsx:81-91`)
- vNext now: New percent then score text, no conditional low-score class. (`src/components/courses/faculty-report-student-table.tsx:64-68`)
- Fix: Restore low-score warning tone and 2-line score typography.

## G2-4-013-023  [P2] GAP  facet F05  effort M
- Legacy: Legacy Student scores is rows Student Score Submitted, no Details column. (`docs/legacy-source/frontend/src/components/Report/ReportStudentTable.jsx:65-69`; `docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:192-207`)
- vNext now: New DataTable columns Learner Score Submitted Details. (`src/components/courses/faculty-report-student-table.tsx:61-73`)
- Fix: Use old three columns, place extra status info inside Submitted.

## G2-4-013-025  [P2] GAP  facet F05  effort S
- Legacy: Legacy search placeholder Search students…, allowClear, prefix magnifying icon. (`docs/legacy-source/frontend/src/components/Report/ReportStudentTable.jsx:55-63`)
- vNext now: New Search students label, Name placeholder and no prefix icon. (`src/components/courses/faculty-report-student-table.tsx:36-46`)
- Fix: Restore prefix icon, placeholder and clear affordance.

## G2-4-013-073  [P2] GAP  facet F17  effort S
- Legacy: Legacy search input prefix SearchOutlined, allowClear, placeholder Search students… (`docs/legacy-source/frontend/src/components/Report/ReportStudentTable.jsx:55-64`)
- vNext now: New label Search students and placeholder Name, no icon. (`src/components/courses/faculty-report-student-table.tsx:36-47`)
- Fix: Match exact accessibility, icon, placeholder and clear behavior.

## G2-4-013-078  [P2] GAP  facet F18  effort S
- Legacy: Legacy search placeholder Search students…; zero search No students match “query”. (`docs/legacy-source/frontend/src/components/Report/ReportStudentTable.jsx:55-64`; `docs/legacy-source/frontend/src/components/Report/ReportStudentTable.jsx:98-100`)
- vNext now: New Name placeholder and No students match this search. (`src/components/courses/faculty-report-student-table.tsx:36-54`)
- Fix: Restore query-specific empty text and placeholder.

## G2-4-013-081  [P3] GAP  facet F19  effort M
- Legacy: Legacy student list unpaginated but searchable only after >8. (`docs/legacy-source/frontend/src/components/Report/ReportStudentTable.jsx:53-101`)
- vNext now: New client page size20 and 8-search threshold. (`src/components/courses/faculty-report-student-table.tsx:36-47`; `src/modules/courses/faculty-report-students.ts:10-39`)
- Fix: Review pagination for large class while matching initial 20 row/scroll presentation.
