# Work packet: edit src/components/courses/faculty-assessment-editor.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/teacher-all-assignments.md

## G2-4-012-049  [P1] GAP  facet F10  effort L
- Legacy: Legacy edit posts createLessonContent with lesson_content_id and complete assignment data. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:456-491`)
- vNext now: New PATCH /api/courses/assignments/:id edits metadata only. (`src/components/courses/faculty-assessment-editor.tsx:117-132`)
- Fix: Support safe resource/method editing where allowed.

## G2-4-012-050  [P1] GAP  facet F10  effort L
- Legacy: Legacy delete verifies submission count then soft-deletes via enabled=false. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:441-509`)
- vNext now: New archive POST with optimistic revision. (`src/components/courses/faculty-assessment-editor.tsx:158-199`; `src/components/courses/faculty-assessment-lifecycle.tsx:44-58`)
- Fix: Match submission-history safeguards and user copy.

## G2-4-012-040  [P2] GAP  facet F08  effort S
- Legacy: Edit success Assignment updated successfully, 2-second toast. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:490-503`)
- vNext now: New editor closes and router.refresh without toast. (`src/components/courses/faculty-assessment-editor.tsx:140-156`)
- Fix: Toast exact legacy text on verified save.
