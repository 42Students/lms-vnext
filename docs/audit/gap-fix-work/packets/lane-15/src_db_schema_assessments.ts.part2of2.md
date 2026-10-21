# Work packet: edit src/db/schema/assessments.ts (part 2 of 2)

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/teacher-all-assignments.md

## G2-4-012-089  [P1] GAP  facet F22  effort M
- Legacy: Old default methods only WRITTEN_RESPONSE. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:109-110`)
- vNext now: New JSON array default all five. (`src/db/schema/assessments.ts:49-59`)
- Fix: Change create default and handle preexisting rows explicitly.

## G2-4-012-092  [P1] GAP  facet F23  effort L
- Legacy: Old creation publishes immediately with resources/methods. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:456-491`)
- vNext now: New DRAFT by default, no resource/method fields. (`src/components/courses/faculty-lesson-authoring.tsx:384-399`; `src/db/schema/assessments.ts:46-59`)
- Fix: Document owner approval for deviations or fix.
