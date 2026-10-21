# Work packet: edit src/app/e2e/superadmin-login/page.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/l15-u024-super-admin-e2e.md, docs/audit/gap2/lane-1/public-e2e-auth-controller.md, docs/audit/gap2/lane-1/e2e-superadmin-login.md

## G2-15-024-001  [P1] MISSING  facet F01  effort M
- Legacy: POST /api/v1/superadmin/e2e/seed only action (SuperAdminE2eController.java:17-20,37-48).
- vNext now: No seed route in src/app/api; dev harness identity cookies and /e2e/superadmin-login redirects to /login (src/auth/e2e-identity.ts:1-58; src/app/e2e/superadmin-login/page.tsx:3-6).
- Fix: Add tightly gated dev-only deterministic seed endpoint or documented migration/setup substitute.

## G2-1-005-013  [P2] GAP  facet F07  effort M
- Legacy: `PublicE2eAuthController.java:92-109` returns 404 `NOT_FOUND` disabled, 400 `phone must be a string` or `PHONE_REQUIRED`, 403 `PHONE_NOT_ALLOWED` or `NOT_SUPER_ADMIN`.
- vNext now: `src/app/e2e/superadmin-login/page.tsx:4-6` no corresponding JSON errors; standard auth emits `NOT_REGISTERED`, `ACCOUNT_DISABLED` etc `login-service.ts:46-83`.
- Fix: Update negative-path tests to route-retired redirect and normalized sign-in errors.

## G2-1-030-011  [P3] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/e2e/superadmin-login.js:14: exact 'Missing phone'.
- vNext now: src/app/e2e/superadmin-login/page.tsx:5: no error, just /login redirect.
- Fix: Retirement notice if legacy bookmarked test URL opened.

## G2-1-030-014  [P3] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/e2e/superadmin-login.js:38: fetch catch shows error.message or 'Login failed'.
- vNext now: src/app/e2e/superadmin-login/page.tsx:5: immediate redirect to sign-in.
- Fix: Return safe sign-in explanation when test harness unavailable.

## G2-1-030-015  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/e2e/superadmin-login.js:36: successful storeAuthResponse causes silent route replacement.
- vNext now: src/app/e2e/superadmin-login/page.tsx:5: always redirect to /login.
- Fix: For tests, assert successful authorized sign-in separately with no magic bypass.

## G2-1-005-014  [P3] GAP  facet F07  effort S
- Legacy: `e2e/superadmin-login.js:25-39` displays server message/error or HTTP code; network failure shown raw.
- vNext now: `src/app/e2e/superadmin-login/page.tsx:4-6` displays no error, redirects to login.
- Fix: Ensure login has understandable explanation of retired E2E deep link when needed.

## G2-1-005-015  [P3] GAP  facet F08  effort S
- Legacy: `e2e/superadmin-login.js:45-46` shows 'E2E Superadmin Login' and 'Logging in…' or raw error; missing phone 'Missing phone' `:12-15`.
- vNext now: `src/app/e2e/superadmin-login/page.tsx:4-6` no copy; redirect to `/login`.
- Fix: Retire those strings in inventory and ensure automated tests assert redirect rather than legacy copy.
