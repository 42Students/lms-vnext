# Faculty Quiz Builder — shared UI primitives

Upgraded the authoring controls under `/teacher/courses/[deliveryId]/quizzes/manage`: visible search/title/due-date/number/option fields use shared `Input`; selectors use `Select`; question/instructions editors use `Textarea`; toolbar and destructive buttons use `Button` with 44px minimum targets and keyboard-visible outlines. Checkbox/radio answer semantics, question guards, copy/paste, publish locks and exact legacy copy remain unchanged. No backend permissions or payload fields were altered.

Tests: `UX-teacher-courses-deliveryId-quizzes-manage-08/09`, `tests/unit/UX-teacher-quiz-builder-shared-controls.test.ts`. Runtime/CI verification pending.
