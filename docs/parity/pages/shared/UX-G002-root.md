# UX-G002 — Root/sign-in and shared authenticated route states

**Scope:** `src/app/page.tsx` (`PAGE-0513`), `src/app/(authenticated)/loading.tsx` (`ROUTE-STATE-0549`), `src/app/(authenticated)/error.tsx` (`ROUTE-STATE-0411`). Canonical status: `docs/tracker.json#uxReview.groups[UX-G002]`.

## Verified source changes

- The platform's anonymous `/` marketing redirect now explicitly exempts `?legacy=superadmin`. Otherwise the valid legacy Super Admin OTP entry link was diverted to `/home`; `/login` stays the ordinary sign-in route and account/tenant policy checks are unchanged.
- Authenticated shell loading now announces **Loading your workspace…** through the existing bounded 12-second `GracefulPageLoading` component rather than an unnamed loading state.
- Authenticated error fallback retains `GracefulErrorBoundary`, reset and `insideShell` role navigation, with mobile `min-w-0 max-w-full` containment.

## Strict acceptance

- Run `.github/workflows/ux-root-quiz-acceptance.yml` with exact source SHA: scoped ESLint, TypeScript, source contract Vitest, authenticated Chromium at 1280px and 390px.
- Browser positive: anonymous platform `/` goes to `/home`; `/?legacy=superadmin` stays in OTP sign-in and has a skip link.
- Browser negative: expired sign-in safely preserves an internal return path; protocol-relative hostile return destinations are rejected with no reflected private text.
- Screenshots: root desktop 1280 and root mobile 390. For device/assistive-tech evidence beyond Chromium, maintain independent release gate; no security or broader UI parity signoff is implied.

**Source modified:** `src/app/page.tsx`, `src/app/(authenticated)/loading.tsx`, `src/app/(authenticated)/error.tsx`. No auth service, permission, tenant scope, session, OTP or data persistence changes. Closure evidence is added below when the run finishes.


## Acceptance receipt — verified green (2026-11-07)

- **Exact source SHA:** `aff8ef1ef0eb4eb84aebd82aa86cb7bc11c115dd`, branch `main`.
- **Workflow:** [UX-G002 and UX-G079 root quiz acceptance — run 42391169871](https://github.com/42Students/lms-vnext/actions/runs/42391169871); completed **success**.
- Scoped ESLint **PASS**, full project TypeScript **PASS**, focused Vitest **5/5 PASS**, Chromium authenticated journeys **4/4 PASS**.
- Evidence artifact: [`ux-g002-g079-evidence`](https://github.com/42Students/lms-vnext/actions/runs/42391169871/artifacts/13581392643) (SHA-256 `e747741bcb906f6eb7f69932d8744f38f6d50eaa5bf479a733a68ad3e10344cb`).
- Captures: `test-results/ux-g002-root-desktop-1280.png`, `test-results/ux-g002-root-mobile-390.png`; quiz captures `test-results/ux-g079-quiz-phone-320.png`, `test-results/ux-g079-quiz-desktop-1280.png`.
- Assertions cover keyboard focus, browser-visible states, no page-wide horizontal overflow, permitted internal return path and blocked protocol-relative destination, plus seeded learner quiz's non-submission recovery.
- **Boundary:** all auth and role/tenant checks retained; this pass verifies the scoped UX journeys, not a global release/security signoff.
