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


## Acceptance receipt — verified green (2026-11-07)

- **Exact source SHA:** `aff8ef1ef0eb4eb84aebd82aa86cb7bc11c115dd`, branch `main`.
- **Workflow:** [UX-G002 and UX-G079 root quiz acceptance — run 42391169871](https://github.com/42Students/lms-vnext/actions/runs/42391169871); completed **success**.
- Scoped ESLint **PASS**, full project TypeScript **PASS**, focused Vitest **5/5 PASS**, Chromium authenticated journeys **4/4 PASS**.
- Evidence artifact: [`ux-g002-g079-evidence`](https://github.com/42Students/lms-vnext/actions/runs/42391169871/artifacts/13581392643) (SHA-256 `e747741bcb906f6eb7f69932d8744f38f6d50eaa5bf479a733a68ad3e10344cb`).
- Captures: `test-results/ux-g002-root-desktop-1280.png`, `test-results/ux-g002-root-mobile-390.png`; quiz captures `test-results/ux-g079-quiz-phone-320.png`, `test-results/ux-g079-quiz-desktop-1280.png`.
- Assertions cover keyboard focus, browser-visible states, no page-wide horizontal overflow, permitted internal return path and blocked protocol-relative destination, plus seeded learner quiz's non-submission recovery.
- **Boundary:** all auth and role/tenant checks retained; this pass verifies the scoped UX journeys, not a global release/security signoff.
