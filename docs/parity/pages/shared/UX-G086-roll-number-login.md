# UX-G086 — College roll-number sign-in UX (2026-11-07)

**Source scope:** `src/app/roll-number-login/page.tsx` and `src/components/auth/learner-roll-number-login.tsx`. The route was listed in the supplementary route census and not the older generated registry. The existing login/OTP API routes, rate limits, challenges, memberships, redirect logic and provider delivery are not changed.

## UX improvement acceptance

- Responsive sign-in title and clear college context; noindex metadata for private account-entry page.
- Progress explanation across the roll-number entry and OTP verification stages.
- Field-specific, accessible instructions; input/spelling/keyboard hints; visible masked delivery destination.
- Busy/disabled behavior for pending actions; accessible errors; retain entered roll number after start failure, entered code after failed verification.
- Honest `Start again or request another code` behavior; alternative email/phone sign-in remains accessible.
- No APIs are changed and no real OTP is sent by browser tests.

## Evidence gate

`tests/e2e/ux-public-auth-entry.spec.ts` includes desktop 1280×800 and mobile 390×844 cases with intercepted synthetic OTP-start and verify calls, input preservation, recovery/focus/no-overflow, and one-target-request assertions.

The dedicated workflow `.github/workflows/ux-public-auth-entry-acceptance.yml` executes scoped ESLint, the DB004 email-link security source test (shared auth regression), Chromium browser tests and TypeScript. **Status until an exact successful run is recorded: DOING, not DONE.** This UX group does not certify any global SECURITY, database, API, tenant, rate-limit or release gate.
