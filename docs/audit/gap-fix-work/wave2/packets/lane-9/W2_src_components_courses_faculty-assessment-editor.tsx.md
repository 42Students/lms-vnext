# Work packet (wave 2): edit src/components/courses/faculty-assessment-editor.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/teacher-all-assignments.md

## G2-4-012-012  [P2] GAP  facet F03  effort M
- Legacy: Legacy delete error is dismissible Assignment was not deleted banner and Retry delete. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:693-705`)
- vNext now: New lifecycle/editor show local Alert under action disclosure. (`src/components/courses/faculty-assessment-editor.tsx:181-198`; `src/components/courses/faculty-assessment-lifecycle.tsx:75-89`)
- Fix: Expose same list-level error banner and retry.

## G2-4-012-045  [P2] GAP  facet F09  effort L
- Legacy: Edit uses same full 640px resource-aware drawer as create. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:431-434`; `docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:527-548`)
- vNext now: New editor Drawer exposes title, description, due, points. (`src/components/courses/faculty-assessment-editor.tsx:226-341`)
- Fix: Restore resource and methods editing, modal dimension/footers.

## G2-4-012-073  [P2] GAP  facet F17  effort S
- Legacy: Edit/Delete icon buttons labeled for SR; delete marked aria-busy. (`docs/legacy-source/frontend/src/components/Assignments/ActionAssignment.js:15-47`)
- vNext now: New text Edit and lifecycle buttons. (`src/components/courses/faculty-assessment-editor.tsx:205-224`; `src/components/courses/faculty-assessment-lifecycle.tsx:65-73`)
- Fix: Restore per-icon aria-label and busy states.

## G2-4-012-078  [P2] GAP  facet F18  effort S
- Legacy: Success copies Assignment created successfully, Assignment updated successfully. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:490-497`)
- vNext now: New draft success and editor refresh differ. (`src/components/courses/faculty-lesson-authoring.tsx:384-399`; `src/components/courses/faculty-assessment-editor.tsx:140-156`)
- Fix: Use exact copy for equivalent transition.
