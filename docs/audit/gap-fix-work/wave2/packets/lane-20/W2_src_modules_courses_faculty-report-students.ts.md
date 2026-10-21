# Work packet (wave 2): edit src/modules/courses/faculty-report-students.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/faculty-quiz-report.md, docs/audit/gap2/lane-4/teacher-report-assignment-content-id.md

## G2-3-007-018  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Report/ReportStudentTable.jsx:41-95`
- vNext now: `src/components/courses/faculty-report-student-table.tsx:28-99`; `src/modules/courses/faculty-report-students.ts:10-39`
- Fix: Legacy all student-score rows shown with no pagination, vNext caps visible rows at 20 with Previous/Next; match default view or disclose pagination.

## G2-3-007-020  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/utils/quizReport.js:49-67`
- vNext now: `src/modules/courses/faculty-report-students.ts:19-28`
- Fix: Legacy score ties preserve incoming order; vNext secondary alphabetical name/id sort. Decide tie semantics for rankings.

## G2-4-013-021  [P2] GAP  facet F04  effort S
- Legacy: Legacy student fallback name Student N or Unknown student; roster fallback can use email. (`docs/legacy-source/frontend/src/utils/assignmentReport.js:4-20`)
- vNext now: New hides contact fallback, outputs Learner (name unavailable). (`src/modules/courses/faculty-report-students.ts:42-45`)
- Fix: Use privacy-safe name fallback but align label per legacy where safe.

## G2-4-013-026  [P2] GAP  facet F05  effort S
- Legacy: Legacy student rows sorted by descending percent, no explicit tie sort. (`docs/legacy-source/frontend/src/utils/assignmentReport.js:57-88`)
- vNext now: New sorts descending percent then name/id ascending. (`src/modules/courses/faculty-report-students.ts:19-28`)
- Fix: Match stable tie order from submitted API or confirm acceptable deterministic tie-break.

## G2-4-013-081  [P3] GAP  facet F19  effort M
- Legacy: Legacy student list unpaginated but searchable only after >8. (`docs/legacy-source/frontend/src/components/Report/ReportStudentTable.jsx:53-101`)
- vNext now: New client page size20 and 8-search threshold. (`src/components/courses/faculty-report-student-table.tsx:36-47`; `src/modules/courses/faculty-report-students.ts:10-39`)
- Fix: Review pagination for large class while matching initial 20 row/scroll presentation.
