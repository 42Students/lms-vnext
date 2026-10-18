# GR-quiz-read-01 / GR-quiz-submit-01: safe learner assessment failure messages

Scope: `src/components/courses/learner-quiz-attempt.tsx` and `src/modules/courses/learner-quiz-refresh-failure-model.ts` (`/quiz` route).

Read failures previously reflected raw backend `payload.message`, `payload.error`, or an arbitrary thrown `Error.message` to the learner UI. API error responses are now passed through the shared `friendlyApiError` mapping; read-only refresh failure uses a generic sentence, while a confirmed POST retains the explicit successful-submission receipt. Network submission failures show safe wording rather than stack or code. Changes preserve consent confirmation and time-of-final-click deadline guard.

Regression: `tests/unit/GR-chat7-quiz-friendly-errors.test.ts` plus `tests/unit/learner-quiz-refresh-failure.test.ts`. Source-level verification only; smoke test POST/refresh interleaving in browser before production deployment.
