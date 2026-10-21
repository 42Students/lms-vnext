# Work packet (wave 2): edit src/components/courses/faculty-assignment-review.tsx (part 2 of 2)

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-admin-assignments.md, docs/audit/gap2/lane-4/superadmin-sections-assignments.md, docs/audit/gap2/lane-4/teacher-all-assignments.md

## G2-4-004-013  [P2] GAP  facet F03  effort M
- Legacy: Per-row grade badges: `Published: points/max` or grading status color; class Scope uses purple/default tag. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:139-143; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:346-347`)
- vNext now: Table uses StatusBadge and plain audience string; grade status appears in nested cards. (`src/components/courses/college-assessment-aggregate.tsx:264-284; src/components/courses/faculty-assignment-review.tsx:313-327`)
- Fix: Restore scoped colored chips and inline publish status where legacy shows them.

## G2-4-004-014  [P2] GAP  facet F03  effort M
- Legacy: Save and publish grade has Popconfirm, `Save privately`, `Save & hide from student`, `Save & publish`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:109-136`)
- vNext now: Grade cards support save, submit grade, publish with ConfirmDialog, different text/actions. (`src/components/courses/faculty-assignment-review.tsx:395-417; src/components/courses/faculty-assignment-review.tsx:177-225`)
- Fix: Align grade action labels and grade-visibility semantics, especially re-hide published grade.

## G2-4-004-023  [P2] GAP  facet F04  effort M
- Legacy: Name fallback `Student ${studentId}` and grade status `Graded, not published`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:101-106; docs/legacy-source/frontend/src/components/admin/SubmissionWork.jsx:14-20`)
- vNext now: vNext student display falls back to learner email or short membership token, gradingStatus GRADED. (`src/components/courses/faculty-assignment-review.tsx:33-43; src/components/courses/faculty-assignment-review.tsx:313-327`)
- Fix: Align student identity fallback and private-grading status labels; never expose masked data.

## G2-4-004-050  [P2] GAP  facet F09  effort M
- Legacy: Save grade Popconfirm `Publish X points for NAME?` and per-student audience visibility copy. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:123-128`)
- vNext now: Save and publish uses ConfirmDialog and may require feedback on regrading. (`src/components/courses/faculty-assignment-review.tsx:177-225`)
- Fix: Show exact points+student in confirmation while preserving new regrade rules.

## G2-4-004-070  [P2] GAP  facet F13  effort M
- Legacy: Submissions modal `Loading submissions…`, `No submissions yet`, Retry and page state. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:93-100; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:148-152`)
- vNext now: FacultyAssignmentReview uses LoadingState/EmptyState plus filters and page state. (`src/components/courses/faculty-assignment-review.tsx:15-18; src/components/courses/faculty-assignment-review.tsx:440-657`)
- Fix: Match modal level submission loading, no-submissions and Retry wording.

## G2-4-004-079  [P2] GAP  facet F17  effort M
- Legacy: Legacy builder fields are Ant Design Form.Item associated labels; grade input aria-label `Points for NAME`, row edit/delete aria-labels. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:303-366; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:113-118; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:372-377`)
- vNext now: vNext nested label inputs, per-student grade points label; confirmation uses native window.confirm for bulk and delete. (`src/components/courses/college-assignment-create.tsx:100-140; src/components/courses/faculty-assignment-review.tsx:352-389; src/components/courses/college-assignment-actions.tsx:50-55; src/components/courses/college-assignment-review.tsx:29-34`)
- Fix: Replace blocking window.confirm with keyboard/focus-managed shared ConfirmDialog.

## G2-4-004-080  [P2] GAP  facet F17  effort M
- Legacy: Legacy grade input save/publish disabled while saving and out-of-range, includes overMax text `Max is X`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:107-128`)
- vNext now: vNext grade editor validates whole-number and disables buttons; default error wording differs. (`src/components/courses/faculty-assignment-review.tsx:100-116; src/components/courses/faculty-assignment-review.tsx:395-417`)
- Fix: Preserve visible `Max is X` field-level hint and out-of-range disabled states.

## G2-4-004-084  [P2] GAP  facet F18  effort M
- Legacy: Legacy modal labels `Save privately`, `Save & publish`, warning private grade. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:87-92; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:120-129`)
- vNext now: VNext `Submit grade`/`Edit grade`, grade cards and custom messages. (`src/components/courses/faculty-assignment-review.tsx:395-417`)
- Fix: Align grading action phrasing and screen-reader labels.

## G2-4-010-013  [P2] GAP  facet F03  effort M
- Legacy: Per-row grade badges: `Published: points/max` or grading status color; class Scope uses purple/default tag. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:139-143; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:346-347`)
- vNext now: Table uses StatusBadge and plain audience string; grade status appears in nested cards. (`src/components/courses/college-assessment-aggregate.tsx:264-284; src/components/courses/faculty-assignment-review.tsx:313-327`)
- Fix: Restore scoped colored chips and inline publish status where legacy shows them.

## G2-4-010-014  [P2] GAP  facet F03  effort M
- Legacy: Save and publish grade has Popconfirm, `Save privately`, `Save & hide from student`, `Save & publish`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:109-136`)
- vNext now: Grade cards support save, submit grade, publish with ConfirmDialog, different text/actions. (`src/components/courses/faculty-assignment-review.tsx:395-417; src/components/courses/faculty-assignment-review.tsx:177-225`)
- Fix: Align grade action labels and grade-visibility semantics, especially re-hide published grade.

## G2-4-010-023  [P2] GAP  facet F04  effort M
- Legacy: Name fallback `Student ${studentId}` and grade status `Graded, not published`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:101-106; docs/legacy-source/frontend/src/components/admin/SubmissionWork.jsx:14-20`)
- vNext now: vNext student display falls back to learner email or short membership token, gradingStatus GRADED. (`src/components/courses/faculty-assignment-review.tsx:33-43; src/components/courses/faculty-assignment-review.tsx:313-327`)
- Fix: Align student identity fallback and private-grading status labels; never expose masked data.

## G2-4-010-050  [P2] GAP  facet F09  effort M
- Legacy: Save grade Popconfirm `Publish X points for NAME?` and per-student audience visibility copy. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:123-128`)
- vNext now: Save and publish uses ConfirmDialog and may require feedback on regrading. (`src/components/courses/faculty-assignment-review.tsx:177-225`)
- Fix: Show exact points+student in confirmation while preserving new regrade rules.

## G2-4-010-070  [P2] GAP  facet F13  effort M
- Legacy: Submissions modal `Loading submissions…`, `No submissions yet`, Retry and page state. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:93-100; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:148-152`)
- vNext now: FacultyAssignmentReview uses LoadingState/EmptyState plus filters and page state. (`src/components/courses/faculty-assignment-review.tsx:15-18; src/components/courses/faculty-assignment-review.tsx:440-657`)
- Fix: Match modal level submission loading, no-submissions and Retry wording.

## G2-4-010-079  [P2] GAP  facet F17  effort M
- Legacy: Legacy builder fields are Ant Design Form.Item associated labels; grade input aria-label `Points for NAME`, row edit/delete aria-labels. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:303-366; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:113-118; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:372-377`)
- vNext now: vNext nested label inputs, per-student grade points label; confirmation uses native window.confirm for bulk and delete. (`src/components/courses/college-assignment-create.tsx:100-140; src/components/courses/faculty-assignment-review.tsx:352-389; src/components/courses/college-assignment-actions.tsx:50-55; src/components/courses/college-assignment-review.tsx:29-34`)
- Fix: Replace blocking window.confirm with keyboard/focus-managed shared ConfirmDialog.

## G2-4-010-080  [P2] GAP  facet F17  effort M
- Legacy: Legacy grade input save/publish disabled while saving and out-of-range, includes overMax text `Max is X`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:107-128`)
- vNext now: vNext grade editor validates whole-number and disables buttons; default error wording differs. (`src/components/courses/faculty-assignment-review.tsx:100-116; src/components/courses/faculty-assignment-review.tsx:395-417`)
- Fix: Preserve visible `Max is X` field-level hint and out-of-range disabled states.

## G2-4-010-084  [P2] GAP  facet F18  effort M
- Legacy: Legacy modal labels `Save privately`, `Save & publish`, warning private grade. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:87-92; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:120-129`)
- vNext now: VNext `Submit grade`/`Edit grade`, grade cards and custom messages. (`src/components/courses/faculty-assignment-review.tsx:395-417`)
- Fix: Align grading action phrasing and screen-reader labels.

## G2-4-012-051  [P2] GAP  facet F10  effort M
- Legacy: Legacy Report and Submissions as row actions. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:423-429`)
- vNext now: New routes to report and embeds faculty review. (`src/components/courses/faculty-assessment-overview.tsx:236-246`; `src/components/courses/faculty-assignment-review.tsx:514-547`)
- Fix: Preserve modal and click outcomes.
