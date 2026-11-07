# UX-G079 — Learner quiz entry, loading and error recovery

**Scope:** `src/app/quiz/page.tsx`, `src/app/quiz/loading.tsx`, `src/app/quiz/error.tsx` (`PAGE` plus route error/loading; canonical IDs in `docs/tracker.json#uxReview.groups[UX-G079]`).

## Verified source changes

- Quiz cancellation still routes to `/learn/allQuizzes`; its accessible name is now explicit (**Cancel quiz and return to All Quizzes**) rather than mixing the decorative logo's alternative text into the link. Button gets a visible keyboard focus ring and wraps at 320px.
- Quiz route loading uses a named 12-second bounded `GracefulPageLoading` with a mobile-safe container; the actual attempt component continues to control answer persistence, expiry, submissions and authorized quiz reads.
- The route error fallback keeps reset, explicit refresh and **Back to quizzes** actions and existing copy, with full-width stacked phone controls rather than cramped inline buttons.

## Strict acceptance

- Run `.github/workflows/ux-root-quiz-acceptance.yml` with exact source SHA: scoped ESLint, TypeScript, source Vitest, Chromium seeded learner 320px and 1280px.
- Browser missing-quiz case must show a truthful non-submission error, a focusable cancel link with the original destination, usable Try Again, and no page-wide horizontal overflow.
- Screenshots: quiz phone 320 and desktop 1280. Existing quiz submission tests and data/tenant controls are not modified. Release-grade accessibility review stays independent from this scoped acceptance.

**Source modified:** quiz `page.tsx`, `loading.tsx`, `error.tsx`. No lesson, quiz answer, grading or attempt authorization code changed. Closure evidence is added below when the run finishes.
