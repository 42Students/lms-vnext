# Graceful-operation browser acceptance — GR-80 through GR-83

**Tests are authored, not run.** These assertions are product release gates, not evidence of a passing environment. Do not mark a gap closed until the orchestrator runs the relevant suite on a pinned merged commit. The browser suite assumes the GR-02 message catalog and GR-11 screens currently authored on chat-14's branch; a page that has not adopted the helper is expected to fail.

## Environment and commands

Use only disposable test data. `playwright.config.ts` runs Chromium at `http://localhost:3000` and starts `npm run dev` if necessary. Set `APP_ENV=development`, `E2E_AUTH_ENABLED=true`, `E2E_AUTH_SECRET` (32+ characters); populate the existing `scripts/db-seed-data.ts` seed and, for TPO/Recruiter, `scripts/seed-test-tenants.ts`. Never enable this identity bypass for `NODE_ENV=production`. Do not send real messages.

```bash
npx playwright test tests/e2e/graceful-helper.spec.ts
npx playwright test tests/e2e/graceful-public.spec.ts tests/e2e/graceful-*.spec.ts
```

The second command also matches the helper and production files; the production suite is skipped without `GRACEFUL_PRODUCTION_BASE_URL` under the default config. Narrow the file selection to investigate individual failures. Existing role tests use seed identities and sometimes role-specific enrollment, course, notification or company-grant fixtures.

### GR-82: an actual production build

Start a **separately built, disposable** `next start` instance (not `npm run dev`) on its own port. To prevent Playwright's normal config from accidentally launching a dev server, use the dedicated configuration with **no webServer**:

```bash
GRACEFUL_PRODUCTION_BASE_URL=http://127.0.0.1:3100 \
  npx playwright test --config tests/e2e/playwright.graceful-production.config.ts
```

The orchestrator must verify that `GRACEFUL_PRODUCTION_BASE_URL` serves the expected production build. The test checks branded errors, an unknown URL with a return-home link, dynamic-chunk sourcemap denial, HTML 502 redaction, a 500 with `Reference: abcd1234` and Copy reference, and one-time stale-chunk reload followed by working sign-in controls. These are fail-closed assertions; no dynamic identity bypass runs in production.

## GR-80 journey coverage

| Account | Real browser journeys |
| --- | --- |
| Public | Email and phone OTP-start failure matrix; disconnected network; guarded retry |
| Learner | Placement preferences save; profile editor/reload draft; missing course; guarded submission |
| Faculty | Assignment authoring save; membership-switch outage; missing course; guarded submission |
| Mentor | Read-all personal notifications; invalid meeting filter recovery; offline calendar; missing project |
| College Admin | Department creation; person onboarding; contacts recovery; missing student; guarded submission |
| TPO | Engage recruiter lead list; company directory; offline roster; missing lead |
| Recruiter | Message reply; designation and display-name saves; offline draft; missing drive; guarded submission |
| Super Admin | Organization and college creation; unknown tenant; guarded submission |

When applicable, test cases inject an API abort across all `/api/**`, HTML 502, hostile JSON 500 with fake database text, 403, 404, 409, 429, five-second slow 504, offline, and 401 session expiry. The missing-record deep links use nonexistent UUIDs. Dedicated GR-80/GR-82 production smoke exercises chunk-failure recovery. **The matrix documents authored coverage, not passing execution.** Some endpoints currently show page-specific legacy errors instead of GR-02 copy; that is a failure to fix in the corresponding product lane rather than a reason to loosen assertions.

## Writing a deterministic browser test

1. Identify the real seeded identity, product URL, form field, exact API pathname/method, and one user action. Install route interception *after* the page is rendered to avoid blocking its initial server read; inject before clicking.
2. Use `authenticateGracefulRole(context, role)` for seeded accounts; public tests use normal login. For browser actions use `failApi(page, endpoint, kind)`. The helper returns `hits()`, `requests()`, and `dispose()`. Assert the target method/path appears in `requests()`; ambient polling must not make an unexercised test pass.
3. For the shared GR-02 wording use `expectFriendlyFailure(page, kind)`, which checks a visible announced failure with the exact approved customer sentence. Do not copy the API `error`, provider `message` or SQL text into UI. Some legacy domain messages have separate approved wording and must be tested as such.
4. Assert entered values are unchanged, controls leave pending after failure, retry/home remains usable, and `expectNoRawErrors(page)` passes. `captureUncaughtErrors(page)` watches page exceptions and console errors, excluding only Chromium's own logged synthetic network requests.
5. For double-submit use a five-second delayed response and press Enter again while the action is pending; require **one** target request and restored editability. For offline tests toggle `context.setOffline(true)` *after* the page loads and restore it in `finally`. Do not reload offline unless a cached offline shell is explicitly part of the application contract.
6. Prefer a true missing detail route with an impossible UUID to a mocked status that no component reads. For chunk failure require a post-reload interactive control, not only server-rendered text.
7. Name every test with `GR-80`, `GR-81`, `GR-82` or `GR-83` as appropriate. Keep fixture cleanup isolated and do not write to customer DBs.

## GR-81 negative self-tests and approved GR-02 copy

The shared `tests/e2e/support/no-raw-error.ts` rejects long uppercase codes, stack frames, SQL/database/provider leaks, numeric HTTP status codes, `Error:`, `Exception`, `ECONN`, `undefined`, `null`, `NaN`, `[object`, an empty body and the `nextjs-portal` overlay. The negative tests in `graceful-helper.spec.ts` demonstrate these failures; its positive fixture verifies plain recovery prose. `GR02_TEXT` is a literal snapshot of chat-14's `src/lib/friendly-error.ts` catalog for now, intentionally avoiding a compile-time dependency on a branch not in main.

## GR-83 helper/unit and integration certification

Chat-14 has authored unit suites under `tests/unit/graceful-api-helpers.test.ts`, `graceful-action-helpers.test.ts`, `graceful-server-helpers.test.ts`, `graceful-root-screens.test.ts`, `graceful-ui-primitives.test.ts`, `graceful-route-coverage.test.ts`, `graceful-login-guards.test.ts`, and `graceful-raw-error-scan.test.ts`. These cover GR-01–08, GR-30–34, GR-50/52, GR-60 and additional fallback rules; the orchestrator must verify the complete checklist mapping, merge the sources, and execute them. The real PostgreSQL retry and outbound queue integration also require disposable database gates; `tests/integration/db10-outbound-queue.test.ts` is an existing related integration witness, not by itself certification of GR-83. Chat-15 does not duplicate or falsely mark those tests passed.

## Known blockers — do not silently skip

- Mentor base fixtures do not guarantee a nonzero unread count; the notification mutation test explicitly skips until the orchestrator provides a deterministic unread Mentor row and must never be counted as passing.
- The Recruiter seed's grants must be presently valid, verified and authorized for the relevant capabilities; rerun the seed or provide a conforming fixture before browser certification.
- Shared helpers, role-specific adoption and area not-found screens authored on chat-14's branch are not yet included in main as of this round. A controlled test failure against old code is an open implementation dependency.
- GR-82 needs a real production build and a provisioned isolated external origin. A local dev build cannot close it.
- GR-83 needs independently executed unit and disposable-PostgreSQL integration evidence from chat-14/orchestrator.

## Sign-off rule

Record the **exact merged commit SHA**, command, environment, scenario counts, failures, skips, trace links and result in `docs/audit/acceptance/graceful-e2e-verification.md`. An authored assertion, a mock endpoint that was never hit, and a skipped test are not product proof. Do not weaken failure copy, lose typed edits, accept framework overlays, or mark unrun suites green.
