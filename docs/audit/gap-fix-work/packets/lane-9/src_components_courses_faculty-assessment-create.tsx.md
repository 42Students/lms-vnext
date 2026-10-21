# Work packet: edit src/components/courses/faculty-assessment-create.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/faculty-all-quizzes.md, docs/audit/gap2/lane-4/teacher-all-assignments.md

## G2-3-006-022  [P1] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:348-380`
- vNext now: `src/components/courses/faculty-assessment-create.tsx:71-79`
- Fix: Legacy builder enforces required future quiz due time and Publish now default, nested FacultyLessonAuthoring needs policy and input parity confirmation.

## G2-3-006-034  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quizzes/QuizzesContent.jsx:201-266`
- vNext now: `src/components/courses/faculty-assessment-create.tsx:71-79`
- Fix: Legacy builder can create and publish quiz on same save; ensure vNext FacultyLessonAuthoring form and lifecycle supports immediate publish if intended.

## G2-3-006-023  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Quizzes/QuizzesContent.jsx:213-248`
- vNext now: `src/components/courses/faculty-assessment-create.tsx:46-70`
- Fix: Legacy context error `Assigned courses could not be loaded` with Retry vs new `No assigned courses found` Alert; differentiate failed lookup from zero courses.

## G2-3-006-024  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Quizzes/QuizzesContent.jsx:243-247`
- vNext now: `src/components/courses/faculty-assessment-create.tsx:65-70`
- Fix: Legacy `Lessons could not be loaded` with Retry lessons, vNext no dedicated failed lesson fetch UI in preloaded options.

## G2-4-012-036  [P2] GAP  facet F07  effort S
- Legacy: Missing Course / Lesson triggers Select course / Select lesson separately. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:608-652`)
- vNext now: New general Select a course and lesson first. (`src/components/courses/faculty-assessment-create.tsx:38-38`)
- Fix: Show distinct field-level messages.
