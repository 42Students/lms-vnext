# Graceful operation queue: chat-15 (browser failure tests)

You own the browser tests that prove the app fails gracefully (Playwright, `tests/e2e/`). Read first, on origin/main: `AGENTS.md`, `docs/orchestrator/briefs/gap-closure-lane.md`, `docs/orchestrator/work-packages/graceful-operation.md`, `docs/audit/graceful/CHECKLIST.md` (section 9: GR-80 to GR-83), and the existing specs in `tests/e2e/` plus `playwright.config.ts` for the setup, the seeded accounts (`scripts/seed-test-tenants.ts`: fixed code 135790, phones 9100061xxx) and helpers. Branch `chatgpt/chat-15-b` (merge origin/main first). Tag commits `[chat-15]`, cite GR ids, test names contain the GR id, push after each group. You cannot run tests; the orchestrator runs them, so keep specs deterministic and conservative.

Build, in this order:
1. GR-81: `tests/e2e/support/no-raw-error.ts`: a helper `expectNoRawErrors(page)` asserting the page body text has no match for `^[A-Z0-9_]{6,}$` tokens (word-level), no "Error:", "Exception", "ECONN", "undefined", "NaN", "[object", "at <anonymous>", stack-frame patterns, no "Application error", and that the page is not blank. Also `failApi(page, matcher, kind)` helpers for the injections below.
2. GR-80: one spec file per role journey (learner, faculty, mentor, college admin, TPO, recruiter, super admin, public/login), each running the same injection matrix on 2 to 3 main journeys of that role: all `/api/**` aborted (backend down), HTML 502 reply, JSON 500 `INTERNAL_ERROR`, 403 `FORBIDDEN`, 404 record (open a deleted or unknown id link), 409 conflict on save, 429, 5 s slow responses, offline (`context.setOffline`), stale chunk (route `/_next/static/chunks/**` to 404 then navigate), session expired mid-form (401 on submit). For each: friendly text is visible, `expectNoRawErrors` passes, entered form input is still in the fields, the page offers Retry or a way home.
3. GR-82: production-build smoke spec: no dev overlay, no `*.map` served (request a known chunk's `.map` and expect 404), error screens show "Reference:" with 8 characters.
4. GR-83: a README at `tests/e2e/README-graceful.md` describing how the suite runs and how to add a journey.

Dependencies: the helpers and screens are built by chat-14 (`src/lib/friendly-error.ts`, `api-fetch.ts`, root and per-area screens). Write the tests against the behaviour in `CHECKLIST.md` (exact friendly sentences in GR-02), not against file names, so they can run once chat-14 lands. If a screen or sentence you need does not exist yet, add one line under Notes and keep going.

Record each item in `docs/audit/acceptance/graceful-e2e-verification.md` (`| GR-xx | DONE / NOT-A-GAP / BLOCKED | spec file + test |`).

## Notes (blockers, one line each)

- GR-80: GR-02 shared helpers and graceful screens are now merged into main, but many page-specific clients have not adopted them; strict browser acceptance remains unverified.
- GR-80 Faculty/Mentor: Deterministic unread personal notifications must be seeded; read-all and per-notification tests skip without them and must not count toward pass totals.
- GR-80 Recruiter: Additional test tenant must have active, verified, nonexpired employer college grant with required capability before messaging/profile suites can certify.
- GR-80/82: All seven authenticated role stale-chunk tests require separately signed-in staging storageState files under GRACEFUL_PRODUCTION_AUTH_STORAGE_DIR; development bypass cannot certify production.
- GR-82: Orchestrator must supply a separately built production origin and run tests/e2e/playwright.graceful-production.config.ts; local dev is not evidence.
- GR-83: The GR-51 automatic-retry outbox UI witness is not identified in merged helper unit tests; a fake-provider persisted-outbox integration and all helper execution evidence are still needed.

### Round-3 source handoff

- GR-80: New role journeys: TPO two-stage recruiter creation (GET contact preflight then POST), Faculty/Mentor read-all and individual notifications with explicit unread fixture precondition, Faculty offline assignment authoring.
- GR-80/82: Added `tests/e2e/graceful-production-roles.spec.ts` for the seven signed-in roles; production config runs both production specs without launching a dev server.
- GR-81: The DOM scan distinguishes legitimate uppercase role/status labels from raw API error identifiers; actual request methods/paths remain asserted.
- GR-83: Merged chat-14 helper unit suites are listed in `tests/e2e/README-graceful.md`; only orchestrator execution can certify.

- GR-80: HTTP 503 maintenance injection added to every role matrix with the exact shared customer message; still requires orchestrator runtime execution.
- GR-80/GR-34: New delayed duplicate-send tests for Recruiter conversation replies and TPO confirmed recruiter creation cover high-risk non-idempotent actions without a real send.
