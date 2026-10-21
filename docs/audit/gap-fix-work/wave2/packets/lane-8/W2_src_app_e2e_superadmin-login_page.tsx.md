# Work packet (wave 2): edit src/app/e2e/superadmin-login/page.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/e2e-superadmin-login.md, docs/audit/gap2/lane-1/public-e2e-auth-controller.md

## G2-1-030-002  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/pages/e2e/superadmin-login.js:36: successful login redirects /superadmin/dashboard.
- vNext now: src/app/e2e/superadmin-login/page.tsx:5: redirects /login regardless logged-in status.
- Fix: Enable non-bypass test fixture navigation to dashboard only after authenticated setup.

## G2-1-005-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/e2e/superadmin-login.js:12-36` query `phone` automatically posts test helper then navigates `/superadmin/dashboard`.
- vNext now: `src/app/e2e/superadmin-login/page.tsx:4-6` does not consume `phone` nor auto sign in.
- Fix: Document intentional loss of one-click E2E path and supply safe test harness scripts on dev only.

## G2-1-030-003  [P3] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/pages/e2e/superadmin-login.js:43-47: plain 24px-padded system-font status view.
- vNext now: src/app/e2e/superadmin-login/page.tsx:1-7: immediate redirect; rendered screen absent.
- Fix: If dev harness retained, match static status view under secure gate.

## G2-1-030-004  [P3] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/e2e/superadmin-login.js:45: H3 'E2E Superadmin Login'.
- vNext now: src/app/e2e/superadmin-login/page.tsx:3-5: no heading; login PageHeader instead.
- Fix: Only render heading in gated development test harness.

## G2-1-030-005  [P3] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/e2e/superadmin-login.js:46: 'Logging in…' paragraph during request.
- vNext now: src/app/e2e/superadmin-login/page.tsx:5: immediate redirect, no progress.
- Fix: Do not imply auto-login when removed; show explicit test-bypass unavailable info if needed.

## G2-1-030-024  [P3] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/e2e/superadmin-login.js:11: initial screen loading until router ready and phone read.
- vNext now: src/app/e2e/superadmin-login/page.tsx:5: immediate redirect, no loading boundary.
- Fix: No E2E loading screen needed when retired.

## G2-1-030-028  [P3] GAP  facet F16  effort S
- Legacy: docs/legacy-source/frontend/src/pages/e2e/superadmin-login.js:44: 24px padding, system-ui, no responsive media.
- vNext now: src/app/e2e/superadmin-login/page.tsx:1-7: no standalone page; /login has responsive sign-in.
- Fix: No mobile test page parity necessary after approved retirement.

## G2-1-030-030  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/e2e/superadmin-login.js:45-46: 'E2E Superadmin Login', 'Logging in…'.
- vNext now: src/app/e2e/superadmin-login/page.tsx:5: neither rendered.
- Fix: If test-only page exists, label restricted dev mode clearly.

## G2-1-005-004  [P3] GAP  facet F02  effort S
- Legacy: `e2e/superadmin-login.js:44-47` shows exactly one header/status area.
- vNext now: `src/app/e2e/superadmin-login/page.tsx:3-6` no heading/feedback, normal login page owns layout.
- Fix: Provide route retirement message on login only if old bookmarks are expected.

## G2-1-005-025  [P3] GAP  facet F13  effort S
- Legacy: `e2e/superadmin-login.js:13-15` missing query phone displays error, disabled endpoint 404 from controller.
- vNext now: `src/app/e2e/superadmin-login/page.tsx:4-6` any query redirects to login.
- Fix: Clarify expected redirect and ensure no infinite redirect on legacy links.

## G2-1-005-032  [P3] GAP  facet F18  effort S
- Legacy: `e2e/superadmin-login.js:14,33,38,45-46` copy 'Missing phone', 'Failed to store auth', 'Login failed', 'E2E Superadmin Login'.
- vNext now: `src/app/e2e/superadmin-login/page.tsx:4-6` no strings; normal login copy.
- Fix: Mark deprecated copy explicitly in legacy catalogue for route retirement.
