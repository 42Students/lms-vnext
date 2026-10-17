# Graceful-operation browser acceptance (GR-80–GR-83)

This suite tests the **customer-visible browser surface**, not API status codes alone. No test in this lane was executed by its author. The orchestrator must run it after chat-14's shared helpers and each page lane's adoption are merged. A committed spec is **not** passing acceptance evidence.

## Preconditions

- Use a disposable local database with the existing E2E seed (`scripts/db-seed-data.ts`) and the additional role seed (`scripts/seed-test-tenants.ts`). Never use production customer records.
- Enable the existing **development-only** harness with `APP_ENV=development`, `E2E_AUTH_ENABLED=true`, and a securely supplied `E2E_AUTH_SECRET` (at least 32 characters). The seed scripts must run before Playwright. No real OTP, email or SMS should be sent. The extra TPO and Recruiter accounts use the documented `9100061xxx` test phones; their active memberships/grants must be verified.
- With the server running against that disposable DB, run targeted specs through the repository's normal Playwright command: `npx playwright test tests/e2e/graceful-*.spec.ts`. Default `playwright.config.ts` starts `npm run dev` for Chromium. There are no additional packages or global setup hooks in this lane.
- For **GR-82 production-only smoke**, the orchestrator separately builds the application, serves a real `next start` deployment (not `npm run dev`), and sets `GRACEFUL_PRODUCTION_BASE_URL=http://localhost:<port>`. Use its non-customer environment. Run `npx playwright test tests/e2e/graceful-production.spec.ts`. The production smoke intentionally does not use the development E2E identity bypass.

## Add a role journey

1. Choose a stable seeded account/URL and identify the **actual** browser request triggered by its user action, such as `PUT /api/placements/preferences`. Server-only reads are not made testable by intercepting an unrelated URL.
2. Authenticate with `authenticateGracefulRole(context, role)` in `support/roles.ts` if required. Prepopulate a real form field before installing the response interception.
3. Install `failApi(page, exactMatcher, kind)` before the action. Each injected response is deliberately hostile (including database text), and `failApi.hits()` must be greater than zero; otherwise the test is a false positive. Unroute after the assertion.
4. Assert a **visible, plain, actionable** error/Retry or home destination; the control exits pending; the typed input remains; `expectNoRawErrors(page)` passes; no uncaught `pageerror` occurs. Cover network abort, HTML 502, JSON 500, 403, 404, 409, 429, 5-second slow, offline, and 401 where meaningful.
5. For a genuinely missing/deleted record use a known valid detail route and an impossible UUID; assert a calm not-found page with a link home. Do not mock a 404 response without triggering an actual UI request.
6. Give the test a name containing **GR-80** (or the exact checklist ID). Record the path and exact name in `docs/audit/acceptance/graceful-e2e-verification.md`. A skipped test or authored-but-unrun suite must never be reported as green.

`support/no-raw-error.ts` implements **GR-81**; its self-tests prove that raw codes, framework copy, stack traces and blank pages are rejected. The GR-82 production spec requires a real production server and validates script map denial, overlay absence, user-visible reference identifiers and stale chunk recovery.

**GR-83 is cross-lane:** chat-14 owns the pure/helper unit and integration tests for GR-01..GR-08, GR-30..GR-34, GR-50..GR-52 and GR-60. This README records the E2E side and how those helper tests are integrated; no browser test substitutes for the missing backend retry/transaction integrations.

## Known fixture limitations

The existing base seed does not guarantee unread Mentor notifications. Tests for the Mentor read-all mutation correctly skip when the button is disabled, so the orchestrator must add a deterministic unread fixture before claiming full GR-80. Recruiter grants from the extra seed must satisfy the current verified/capability/valid-until policy. Role-level chunks might not load after initial navigation; GR-82 injects one chunk 404 on a fresh production browser context and allows recovery reload.

## Acceptance

Do not claim DONE from source alone. Run in a disposable environment, record output and the tested commit SHA, and investigate any failing check instead of loosening error assertions or removing injection-hit requirements. Do not disable or skip failing customer experience gates to produce a green report.
