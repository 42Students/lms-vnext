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

## Executed scoped UX closure

**PASS — 7 November 2026.** [GitHub Actions run 42391360746](https://github.com/42Students/lms-vnext/actions/runs/42391360746) completed successfully at exact implementation/test SHA [`521bc310727592e91e5d54728b15d42edd83de1a`](https://github.com/42Students/lms-vnext/commit/521bc310727592e91e5d54728b15d42edd83de1a). Executed `npx eslint` for the scoped page/component/test; `node --test tests/db004-email-link-route-security.test.mjs` (3/3 passed); `npx playwright test tests/e2e/ux-public-auth-entry.spec.ts --project=chromium --reporter=line` (9/9 passed; **4** roll-number cases across 1280×800 desktop and 390×844 mobile); and `npm run typecheck` (success, 6 GiB Node heap). No skipped/failed scoped cases.

**Group UX status: DONE.** The verified workflow covers busy states, keyboard focus, no horizontal overflow, synthetic start/verify OTP flows, preserved roll and code after controlled failures, and honest return-to-first-step recovery. Browser calls were intercepted before server actions; no OTP provider or tenant data was accessed. No role/authorization/security service change is claimed, and this does not certify broader security or release gates.
