# UX rollout — /auth/handoff

- Scope: `src/app/auth/handoff/page.tsx`; test `UX-auth-handoff-01`.
- This route is intentionally **redirect-only** and must not present a sign-in or handoff form. The deprecated cross-host credential exchange was retired for security. Adding a page or accepting a token would undo the secure product decision.
- Confirmed redirect to `/?auth=handoff-retired` which shows the existing, approved message and fresh first-party OTP path; no token parsing, forwarding, or client storage.
- No markup changes required. `tests/unit/UX-auth-handoff-01.test.ts` authored; execute in CI and capture the redirect before ticking the page.
