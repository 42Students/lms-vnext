# Work packet (wave 2): edit src/components/courses/college-assignment-review.tsx

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-admin-assignments.md, docs/audit/gap2/lane-4/superadmin-assignments.md, docs/audit/gap2/lane-4/superadmin-sections-assignments.md

## G2-4-004-007  [P2] GAP  facet F02  effort M
- Legacy: Submissions open in 760px modal with student list and pagination. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:87-156`)
- vNext now: Submission review is row-embedded FacultyAssignmentReview with delivery selector. (`src/components/courses/college-assignment-review.tsx:76-103; src/components/courses/college-assessment-aggregate.tsx:277-284`)
- Fix: Expose modal/drawer in row Submissions action and move per-student review inside it.

## G2-4-004-012  [P2] GAP  facet F03  effort M
- Legacy: Table actions `Submissions`, `Publish grades`, `Edit`, `Delete`, plus disabled/tooltip states. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:360-380`)
- vNext now: Row actions Edit, Publish, Delete and section review; extra Publish is assignment visibility not grade publication. (`src/components/courses/college-assignment-actions.tsx:73-103; src/components/courses/college-assignment-review.tsx:87-103`)
- Fix: Make row actions identifiable and distinguish assignment Publish from Publish grades.

## G2-4-004-047  [P2] GAP  facet F09  effort M
- Legacy: Submissions modal title assignment title or #id, width760; per-student grade edit contained inside. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:87-145`)
- vNext now: Embedded per-row submission review, no parent submissions overlay. (`src/components/courses/college-assignment-review.tsx:87-103`)
- Fix: Use 760px review modal triggered by `Submissions` row button.

## G2-4-004-048  [P2] GAP  facet F09  effort M
- Legacy: Publish all Popconfirm: title `Publish all graded submissions?` with description unmarked left alone. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:365-370`)
- vNext now: Window.confirm says `Publish grades for every graded submission in this Section? Published results become visible to learners.` (`src/components/courses/college-assignment-review.tsx:29-34`)
- Fix: Restore accessible styled Popconfirm wording and scope notice; avoid native window.confirm.

## G2-4-004-078  [P2] GAP  facet F16  effort M
- Legacy: Builder width720/modal, grade drawer width760 on all widths; responsive antd breakpoint via `Grid.useBreakpoint`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:87-89; docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:275-289; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:160-162`)
- vNext now: vNext inline create grid sm2 and mobile buttons full-width; review inline. (`src/components/courses/college-assignment-create.tsx:91-152; src/components/courses/college-assignment-review.tsx:77-103`)
- Fix: Reproduce responsive overlay dimensions/scroll/focus and legacy action stacking.

## G2-4-004-079  [P2] GAP  facet F17  effort M
- Legacy: Legacy builder fields are Ant Design Form.Item associated labels; grade input aria-label `Points for NAME`, row edit/delete aria-labels. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:303-366; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:113-118; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:372-377`)
- vNext now: vNext nested label inputs, per-student grade points label; confirmation uses native window.confirm for bulk and delete. (`src/components/courses/college-assignment-create.tsx:100-140; src/components/courses/faculty-assignment-review.tsx:352-389; src/components/courses/college-assignment-actions.tsx:50-55; src/components/courses/college-assignment-review.tsx:29-34`)
- Fix: Replace blocking window.confirm with keyboard/focus-managed shared ConfirmDialog.

## G2-4-007-049  [P2] GAP  facet F17  effort M
- Legacy: AntD buttons/popconfirm keyboard, review input aria-label Points for NAME. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:109-129`)
- vNext now: New item actions include native window.confirm for publish/delete. (`src/components/courses/college-assignment-actions.tsx:50-55;src/components/courses/college-assignment-review.tsx:29-34`)
- Fix: Use keyboard-safe styled confirm dialog.

## G2-4-010-007  [P2] GAP  facet F02  effort M
- Legacy: Submissions open in 760px modal with student list and pagination. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:87-156`)
- vNext now: Submission review is row-embedded FacultyAssignmentReview with delivery selector. (`src/components/courses/college-assignment-review.tsx:76-103; src/components/courses/college-assessment-aggregate.tsx:277-284`)
- Fix: Expose modal/drawer in row Submissions action and move per-student review inside it.

## G2-4-010-012  [P2] GAP  facet F03  effort M
- Legacy: Table actions `Submissions`, `Publish grades`, `Edit`, `Delete`, plus disabled/tooltip states. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:360-380`)
- vNext now: Row actions Edit, Publish, Delete and section review; extra Publish is assignment visibility not grade publication. (`src/components/courses/college-assignment-actions.tsx:73-103; src/components/courses/college-assignment-review.tsx:87-103`)
- Fix: Make row actions identifiable and distinguish assignment Publish from Publish grades.

## G2-4-010-047  [P2] GAP  facet F09  effort M
- Legacy: Submissions modal title assignment title or #id, width760; per-student grade edit contained inside. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:87-145`)
- vNext now: Embedded per-row submission review, no parent submissions overlay. (`src/components/courses/college-assignment-review.tsx:87-103`)
- Fix: Use 760px review modal triggered by `Submissions` row button.

## G2-4-010-048  [P2] GAP  facet F09  effort M
- Legacy: Publish all Popconfirm: title `Publish all graded submissions?` with description unmarked left alone. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:365-370`)
- vNext now: Window.confirm says `Publish grades for every graded submission in this Section? Published results become visible to learners.` (`src/components/courses/college-assignment-review.tsx:29-34`)
- Fix: Restore accessible styled Popconfirm wording and scope notice; avoid native window.confirm.

## G2-4-010-078  [P2] GAP  facet F16  effort M
- Legacy: Builder width720/modal, grade drawer width760 on all widths; responsive antd breakpoint via `Grid.useBreakpoint`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:87-89; docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:275-289; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:160-162`)
- vNext now: vNext inline create grid sm2 and mobile buttons full-width; review inline. (`src/components/courses/college-assignment-create.tsx:91-152; src/components/courses/college-assignment-review.tsx:77-103`)
- Fix: Reproduce responsive overlay dimensions/scroll/focus and legacy action stacking.

## G2-4-010-079  [P2] GAP  facet F17  effort M
- Legacy: Legacy builder fields are Ant Design Form.Item associated labels; grade input aria-label `Points for NAME`, row edit/delete aria-labels. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:303-366; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:113-118; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:372-377`)
- vNext now: vNext nested label inputs, per-student grade points label; confirmation uses native window.confirm for bulk and delete. (`src/components/courses/college-assignment-create.tsx:100-140; src/components/courses/faculty-assignment-review.tsx:352-389; src/components/courses/college-assignment-actions.tsx:50-55; src/components/courses/college-assignment-review.tsx:29-34`)
- Fix: Replace blocking window.confirm with keyboard/focus-managed shared ConfirmDialog.

## G2-4-010-127  [P2] GAP  facet F17  effort M
- Legacy: Old grade input `aria-label Points for STUDENT` and publish Popconfirm manage keyboard focus. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:109-129`)
- vNext now: New faculty reviewer has accessible field but SA bulk uses blocking window.confirm. (`src/components/courses/college-assignment-review.tsx:29-34`)
- Fix: Replace native confirm with accessible ConfirmDialog and correct focus return.
