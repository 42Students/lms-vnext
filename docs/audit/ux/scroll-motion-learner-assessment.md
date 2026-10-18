# UX-courses-learner-quiz-table-01

Surface: `src/components/courses/learner-assessment-overview.tsx` (learner All Quizzes, including `/learn/allQuizzes` route).

The quiz-only desktop raw table and separate phone cards were replaced with a single shared `DataTable`. A primary title and description, responsive course/lesson, status with mobile state guidance, due date, grade release, quiz action and history link are preserved. The shared table's `ScrollCue` provides a focusable named horizontal scroll region, overflow edge fades and overscroll containment with reduced-motion compatible CSS. Assignment cards and the assignment submission drawer are unaffected.

Coverage: `tests/unit/UX-courses-learner-quiz-table-01.test.ts`; source checks only, not browser validation.
