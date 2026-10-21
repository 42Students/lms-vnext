# Work packet: edit src/components/courses/faculty-assessment-lifecycle.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/teacher-all-assignments.md

## G2-4-012-042  [P1] GAP  facet F08  effort L
- Legacy: Legacy creation sets active=true enabled=true; no publish confirmation. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:484-491`)
- vNext now: New status defaults DRAFT, Publish command/confirmation. (`src/db/schema/assessments.ts:46-48`; `src/components/courses/faculty-assessment-lifecycle.tsx:79-89`)
- Fix: Restore immediate visibility or owner-approve draft-first.

## G2-4-012-050  [P1] GAP  facet F10  effort L
- Legacy: Legacy delete verifies submission count then soft-deletes via enabled=false. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:441-509`)
- vNext now: New archive POST with optimistic revision. (`src/components/courses/faculty-assessment-editor.tsx:158-199`; `src/components/courses/faculty-assessment-lifecycle.tsx:44-58`)
- Fix: Match submission-history safeguards and user copy.

## G2-4-012-057  [P1] GAP  facet F12  effort L
- Legacy: Legacy new assignment active and enabled; no drafts. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:484-491`)
- vNext now: New DRAFT until PUBLISH. (`src/db/schema/assessments.ts:46-48`; `src/components/courses/faculty-assessment-lifecycle.tsx:9-19`)
- Fix: Clarify approved lifecycle and list visibility.

## G2-4-012-041  [P2] GAP  facet F08  effort S
- Legacy: Delete success Assignment deleted. 2-second toast. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:495-499`)
- vNext now: New lifecycle shows Alert until refreshed. (`src/components/courses/faculty-assessment-lifecycle.tsx:75-78`)
- Fix: Use transient 2s notification.
