# Work packet (wave 2): edit src/components/courses/faculty-assessment-lifecycle.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/teacher-all-assignments.md

## G2-4-012-012  [P2] GAP  facet F03  effort M
- Legacy: Legacy delete error is dismissible Assignment was not deleted banner and Retry delete. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:693-705`)
- vNext now: New lifecycle/editor show local Alert under action disclosure. (`src/components/courses/faculty-assessment-editor.tsx:181-198`; `src/components/courses/faculty-assessment-lifecycle.tsx:75-89`)
- Fix: Expose same list-level error banner and retry.

## G2-4-012-046  [P2] GAP  facet F09  effort M
- Legacy: Delete Popconfirm title Delete this assignment? with warning about learner loss. (`docs/legacy-source/frontend/src/components/Assignments/ActionAssignment.js:28-49`)
- vNext now: New ConfirmDialog title Delete assessment, archive-preserving behavior. (`src/components/courses/faculty-assessment-lifecycle.tsx:79-85`)
- Fix: Use legacy confirmation text; clearly explain archive semantics.

## G2-4-012-073  [P2] GAP  facet F17  effort S
- Legacy: Edit/Delete icon buttons labeled for SR; delete marked aria-busy. (`docs/legacy-source/frontend/src/components/Assignments/ActionAssignment.js:15-47`)
- vNext now: New text Edit and lifecycle buttons. (`src/components/courses/faculty-assessment-editor.tsx:205-224`; `src/components/courses/faculty-assessment-lifecycle.tsx:65-73`)
- Fix: Restore per-icon aria-label and busy states.
