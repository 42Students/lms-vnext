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

### Round-4 source handoff (2026-10-17)

- GR-80/81: `tests/e2e/graceful-leak-matrix.spec.ts` adds 42 leak negative controls, two valid-copy controls, and nine real intercepted POST contract probes; probe success does not certify application recovery.
- GR-80/82: `tests/e2e/graceful-production-faults.spec.ts` adds four branded production sign-in failure cases and exhaustive initial-chunk sourcemap denial, included in the no-dev-server production config.
- GR-81: `expectNoRawErrors` recognizes arbitrary underscore-style API codes inside alerts and more runtime/driver/network internals. Regular role/status badges remain allowed.
- GR-80/82/83: Browser, helper and fake-provider integration executions are still orchestrator-owned and not run by chat-15; never mark the authored tests as passes.

### Round-5 source handoff

- GR-80: `graceful-recovery-cycle.spec.ts` adds 18 two-attempt email/phone sign-in recovery checks with both OTP POSTs intercepted, and 16 offline/reconnect checks spanning the public shell and seven seeded roles at desktop/mobile sizes.
- GR-80/81: Every case asserts the content remains nonblank and scans for raw implementation errors; role cases require development seeds. Runtime evidence remains pending.
- GR-82/83: Production-build auth states and fake-provider outbox certification remain orchestrator dependencies; no case is counted as executed.

- GR-81: `graceful-dom-surfaces.spec.ts` checks 26 accessibility/live-region leakage vectors and two safe controls. Shared DOM helper now detects hidden live-region text, tooltip/accessibility/placeholder details, and Vite overlays.

### Round-6 production role save handoff

- GR-80/82: `graceful-production-saves.spec.ts` tests 36 signed-in staging save failures (4 roles × 9 faults). All mutations fail under interception; no real writes occur. Production config includes the spec.
- GR-80/81/82: Missing externally authenticated staging role states cause explicit skips, not passes; `expectNoRawErrors` and uncaught-browser-error assertions remain mandatory.
- GR-83: No fake-provider outbox completion asserted; orchestrator still needs independent helper and database test execution.

### Round-7 code-step injection handoff

- GR-80/81: `tests/e2e/graceful-otp-flows.spec.ts` adds **40 uniquely named browser scenarios**: 20 single-factor verification failures (Email/Phone × 10 kinds), 10 administrator two-factor verification failures (both codes retained), and 10 SMS-to-email fallback failures (OTP attempt retained).
- GR-80: Every first-step success is intercepted and returns a synthetic UUID-shaped login attempt. Every verify/fallback request is intercepted, so no SMS/email provider call or real sign-in occurs; assertions require a real target POST, readable alert, preserved form and no raw DOM/console error.
- GR-82/83: Production-build certification, role fixture readiness and fake-provider GR-51 outbox witness are orchestrator-owned, NOT RUN by chat-15.

### Round-8 production recovery handoff

- GR-80/82: `graceful-production-navigation.spec.ts` adds **32 production-only tests**: 8 roles including public × 2 layouts × offline/reconnect and missing-record recovery. Real role sessions must come from `GRACEFUL_PRODUCTION_AUTH_STORAGE_DIR`, never development bypass; missing credentials SKIP explicitly.
- GR-80/81: The tests verify the intended role route before error injection, visible and cleared offline warning, actual recovery link traversal from a not-found screen, no raw error text, and no unhandled browser exceptions.
- GR-83: The fake-provider persisted outbox/GR-51 witness and helper-unit + PostgreSQL integration execution remain unverified orchestrator dependencies. No checks executed by this builder.

### Round-9 accessible backend-error evidence (authored, NOT RUN)

- GR-81: `tests/e2e/graceful-accessibility-metadata.spec.ts` adds **32 hostile fixture cases** (8 metadata/ARIA-ref surfaces × 4 unknown API error codes) and **2 safe controls**. These exercise missing parts of the shared `expectNoRawErrors` gate: alt descriptions, ARIA value/description, tooltip/data-error/data-message values, and hidden referenced labels/help.
- GR-80/82: Every existing role and production test using the shared no-raw-code gate now checks those accessibility disclosures too; browser runtime and production-build execution remain unverified.
- GR-83: The isolated fake-provider persisted outbox witness, real PostgreSQL tests, and complete helper execution remain orchestrator-owned; no acceptance item has been marked DONE.

- GR-80/81: [big-round email/error] `tests/e2e/graceful-unexpected-email-error.spec.ts` adds 10 real login failure/retry cases, with two intercepted POSTs per test, nonleaking diagnostics, preserved contact and reenabled control (authored; not run).

- GR-80/81: [big-round email/code] `tests/e2e/graceful-unexpected-email-code.spec.ts` adds 10 real login failure/retry cases, with two intercepted POSTs per test, nonleaking diagnostics, preserved contact and reenabled control (authored; not run).

- GR-80/81: [big-round email/message] `tests/e2e/graceful-unexpected-email-message.spec.ts` adds 10 real login failure/retry cases, with two intercepted POSTs each; no provider calls (authored; not run).

- GR-80/81: [big-round phone/error] `tests/e2e/graceful-unexpected-phone-error.spec.ts` adds 10 real login failure/retry cases, with two intercepted POSTs each; no provider calls (authored; not run).

- GR-80/81: [big-round phone/code] `tests/e2e/graceful-unexpected-phone-code.spec.ts` adds 10 real phone login failure/retry cases, with two intercepted POSTs each; no provider calls (authored; not run).

- GR-80/81: [big-round phone/message] `tests/e2e/graceful-unexpected-phone-message.spec.ts` adds 10 real phone login failure/retry cases, with two intercepted POSTs each; no provider calls (authored; not run).

- GR-80/81: [big-round email/known-code] `tests/e2e/graceful-known-auth-email.spec.ts` adds 10 real customer-copy scenarios; asserts exact legacy wording, preserved form and intercepted start POST (not executed).

- GR-80/81: [big-round phone/known-code] `tests/e2e/graceful-known-auth-phone.spec.ts` adds 10 real customer-copy scenarios; asserts exact legacy wording, preserved form and intercepted start POST (not executed).

- GR-80/81: [big-round one-factor] `tests/e2e/graceful-verify-one-factor-domain-failures.spec.ts` adds 10 intercepted real OTP-verification domain outcomes (correct human copy, input preserved or intentionally reset, no provider send); authored, not run.

- GR-80/81: [big-round two-factor] `tests/e2e/graceful-verify-two-factor-domain-failures.spec.ts` adds 10 intercepted real OTP-verification domain outcomes (correct human copy, input preserved or intentionally reset, no provider send); authored, not run.

### Big-round closure accounting (2026-10-17)

- The requested audit of `docs/audit/gap-register.md` found **0 OPEN/UNCONFIRMED/IN-BRANCH rows assigned to chat-15**. The register currently has 483 open/unconfirmed/in-branch rows across other proposed lanes, including 19 public rows assigned to chat-7. Chat-15 owns the four distinct GR-80–GR-83 browser-acceptance IDs in this queue, not the other lanes' page implementation gaps.
- Ten grouped commits/pushes authored **100 concrete Playwright cases**, 10 per push: 60 unknown-provider-error form/retry cases (Email and Phone × error/code/message × ten backend identifiers), 20 intentional domain-code wording cases, and 20 OTP verification/restart recovery cases (one-factor/two-factor). Both OTP-start and verify requests use Playwright interception; no provider request or valid login is attempted.
- **Source coverage only:** GR-80, GR-81, GR-82, GR-83 remain **BLOCKED for runtime certification**, not DONE. Orchestrator must execute unit/browser integration tests and independently staged production-build smoke, provision real signed-in role states, and prove the GR-51 fake-provider persisted outbox. No tests, typecheck, lint or CI were executed by this builder.
- No new page implementations were claimed for chat-7/chat-9/other product lanes; no gaps were reassigned, and no migrations were proposed.
