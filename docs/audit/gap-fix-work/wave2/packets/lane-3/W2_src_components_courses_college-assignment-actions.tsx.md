# Work packet (wave 2): edit src/components/courses/college-assignment-actions.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-admin-assignments.md, docs/audit/gap2/lane-4/superadmin-assignments.md, docs/audit/gap2/lane-4/superadmin-sections-assignments.md

## G2-4-004-012  [P2] GAP  facet F03  effort M
- Legacy: Table actions `Submissions`, `Publish grades`, `Edit`, `Delete`, plus disabled/tooltip states. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:360-380`)
- vNext now: Row actions Edit, Publish, Delete and section review; extra Publish is assignment visibility not grade publication. (`src/components/courses/college-assignment-actions.tsx:73-103; src/components/courses/college-assignment-review.tsx:87-103`)
- Fix: Make row actions identifiable and distinguish assignment Publish from Publish grades.

## G2-4-004-033  [P2] GAP  facet F06  effort M
- Legacy: Course and Lesson separate searchable/dependent fields; both disabled editing existing assignment. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:303-320`)
- vNext now: Create a single Course / Lesson dropdown; existing edit never offers course/lesson selector. (`src/components/courses/college-assignment-create.tsx:100-107; src/components/courses/college-assignment-actions.tsx:104-120`)
- Fix: Restore distinct course then lesson controls and edit-time immutable display.

## G2-4-004-049  [P2] GAP  facet F09  effort M
- Legacy: Delete Popconfirm `Delete this assignment?`, includes N existing student submissions. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:373-378`)
- vNext now: Window.confirm `Delete this assignment? Existing submissions must be preserved and will block deletion.` (`src/components/courses/college-assignment-actions.tsx:50-55`)
- Fix: Display exact live submitted count in a styled confirmation dialog.

## G2-4-004-079  [P2] GAP  facet F17  effort M
- Legacy: Legacy builder fields are Ant Design Form.Item associated labels; grade input aria-label `Points for NAME`, row edit/delete aria-labels. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:303-366; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:113-118; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:372-377`)
- vNext now: vNext nested label inputs, per-student grade points label; confirmation uses native window.confirm for bulk and delete. (`src/components/courses/college-assignment-create.tsx:100-140; src/components/courses/faculty-assignment-review.tsx:352-389; src/components/courses/college-assignment-actions.tsx:50-55; src/components/courses/college-assignment-review.tsx:29-34`)
- Fix: Replace blocking window.confirm with keyboard/focus-managed shared ConfirmDialog.

## G2-4-007-034  [P2] GAP  facet F09  effort M
- Legacy: Delete Popconfirm includes existing submitted count. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:373-379`)
- vNext now: Client window.confirm warns submissions block delete. (`src/components/courses/college-assignment-actions.tsx:50-56`)
- Fix: Match exact legacy interaction and value or explicitly record approved divergence.

## G2-4-007-049  [P2] GAP  facet F17  effort M
- Legacy: AntD buttons/popconfirm keyboard, review input aria-label Points for NAME. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:109-129`)
- vNext now: New item actions include native window.confirm for publish/delete. (`src/components/courses/college-assignment-actions.tsx:50-55;src/components/courses/college-assignment-review.tsx:29-34`)
- Fix: Use keyboard-safe styled confirm dialog.

## G2-4-007-055  [P2] GAP  facet F20  effort M
- Legacy: Legacy inline edit rejects stale JPA version with reopen instruction. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:199-209`)
- vNext now: vNext uses optimistic updatedAt guard, conflict message differs. (`src/components/courses/college-assignment-actions.tsx:34-70`)
- Fix: Match exact legacy interaction and value or explicitly record approved divergence.

## G2-4-010-012  [P2] GAP  facet F03  effort M
- Legacy: Table actions `Submissions`, `Publish grades`, `Edit`, `Delete`, plus disabled/tooltip states. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:360-380`)
- vNext now: Row actions Edit, Publish, Delete and section review; extra Publish is assignment visibility not grade publication. (`src/components/courses/college-assignment-actions.tsx:73-103; src/components/courses/college-assignment-review.tsx:87-103`)
- Fix: Make row actions identifiable and distinguish assignment Publish from Publish grades.

## G2-4-010-033  [P2] GAP  facet F06  effort M
- Legacy: Course and Lesson separate searchable/dependent fields; both disabled editing existing assignment. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:303-320`)
- vNext now: Create a single Course / Lesson dropdown; existing edit never offers course/lesson selector. (`src/components/courses/college-assignment-create.tsx:100-107; src/components/courses/college-assignment-actions.tsx:104-120`)
- Fix: Restore distinct course then lesson controls and edit-time immutable display.

## G2-4-010-049  [P2] GAP  facet F09  effort M
- Legacy: Delete Popconfirm `Delete this assignment?`, includes N existing student submissions. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:373-378`)
- vNext now: Window.confirm `Delete this assignment? Existing submissions must be preserved and will block deletion.` (`src/components/courses/college-assignment-actions.tsx:50-55`)
- Fix: Display exact live submitted count in a styled confirmation dialog.

## G2-4-010-079  [P2] GAP  facet F17  effort M
- Legacy: Legacy builder fields are Ant Design Form.Item associated labels; grade input aria-label `Points for NAME`, row edit/delete aria-labels. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:303-366; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:113-118; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:372-377`)
- vNext now: vNext nested label inputs, per-student grade points label; confirmation uses native window.confirm for bulk and delete. (`src/components/courses/college-assignment-create.tsx:100-140; src/components/courses/faculty-assignment-review.tsx:352-389; src/components/courses/college-assignment-actions.tsx:50-55; src/components/courses/college-assignment-review.tsx:29-34`)
- Fix: Replace blocking window.confirm with keyboard/focus-managed shared ConfirmDialog.
