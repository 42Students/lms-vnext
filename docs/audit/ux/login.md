# UX rollout — /login

- Scope: `src/app/login/page.tsx`, route loading/error components; `UX-login-01`.
- Canonical login page deliberately re-exports `src/app/page.tsx`: preserving this delegation keeps tenant-host branding, secure OTP, safe returnTo destinations, pre-existing GuardedAction state preservation, and exact auth copy. Forking another login form would regress those behaviors.
- Improved the route-level loading skeleton and bounded slow-load action with a phone-first centered max-w-xl/min-h-dvh frame; centered exception recovery using existing GracefulErrorBoundary and a public root escape instead of a dashboard-only escape. No new auth strings or flow.
- Test: `tests/unit/UX-login-01.test.ts` authored. CI, screen reader, 320px and WebView evidence not run in this lane; route checklist pending pass.
