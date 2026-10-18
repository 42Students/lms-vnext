# UX review — /learn/allQuizzes/[quizId]

- Source: `src/app/(authenticated)/learn/allQuizzes/[quizId]/page.tsx`. Learner page.
- Reviewed weakness and changes: Contrast-safe teal foreground for small links and labels; 44px minimum for interactive controls; Responsive min-width containment.
- States: Existing route `loading.tsx`, `error.tsx`, and page/component empty, guarded or partial states preserved; no invented status or data.
- Small screens: Shared token foreground, minimum touch target and responsive containment adjusted where applicable; interactive semantics remain in shared controls.
- Legacy titles, buttons, permissions and query handling: unchanged.
- Test: `tests/unit/ux-learn-chat7-batch-01.test.ts`, `UX-learn-learn-allQuizzes-quizId-01`.
- Outstanding: orchestrator Vitest, strict TypeScript and mobile/AT verification.
