# DB-004: mobile/email OTP and cross-host handoff persistence — source-based acceptance contract

**Worker:** Chat 2 (temporary DATABASE task DB-004). **Current status:** STAGED ONLY; no runtime activation or migration.  
**Legacy oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5` (prod-2026)  
**VNext:** `42Students/lms-vnext@main`, global API/UI phases still LOCKED.

## Legacy behavior that must be explicitly mapped

The current legacy `PublicMobileAuthController.java` actually calls `MobileLoginAttemptRepository` for the following distinct jobs. These are not merely unused snapshot columns.

| User job | Legacy source witness | vNext decision / DB proposal |
| --- | --- | --- |
| Initiate learner/faculty SMS OTP | Controller `createAttempt` stores `attempt_id`, user/type, phone, college/org, OTP, five-minute expiration and `used=false` | Prefer managed provider verification if it handles OTP/rate limits and parity; otherwise stage `identity_auth_attempts` with keyed code MAC only |
| Start recruiter email-first login | `PublicMobileAuthController` creates an attempt with `phone=null`, generates a dummy never-accepted SMS value solely for legacy `otp NOT NULL`, and persists a distinct email OTP | vNext must **never** require a fake SMS OTP value for an email-only challenge; nullable code MACs and explicit channel validation |
| Send learner/faculty email fallback | `/email-fallback/send` updates `email_otp`, `email_otp_sent_at`, `email_otp_expires_at` | Avoid plaintext email OTP; store keyed MAC, sentAt/expiry, and record resend/rate policy |
| Verify SMS or email code | `/verify` and `/email-fallback/verify` check expiry, tenant mismatch, used state, and call `reserveVerificationAttempt` | Atomic conditional increment of verification attempts on DB (not read-then-write); shared five-try cap across channels |
| Budget/account lockout | Repository `UPDATE ... SET verification_attempts = verification_attempts + 1 WHERE ... < 5 AND expires_at > :now` | Single DB writer under concurrency; test simultaneous fails, including mixed SMS/email channel |
| Tenant binding | Controllers derive tenant college from effective host and compare with attempt college | Bind pending challenge to ACTIVE canonical user and scoped membership/college; wrong host/college must fail closed |
| Replay/consumption | Legacy tracks `used`/`verified_at`; SMS allows a short replay window in one endpoint, email fallback rejects used attempts | **Intentional security tightening:** after durable successful consumption, replay must fail. Do not treat brief legacy replay as a required desirable user job |
| Source-issued cross-host handoff | `AuthController.completeSwitch` creates `auth_handoff_token` containing raw JWT/refresh token and 2-minute expiration; `/handoff/consume` checks used/expiry | **Intentional security redesign:** staged `identity_auth_handoffs` holds keyed one-time code MAC, owner, target domain+membership and 2-minute TTL; never raw provider credentials |

### Source evidence distinguishing provider and database responsibilities

Current vNext `src/auth/session.ts` verifies Firebase session cookies, with provider-global `revokeRefreshTokens`. Current `src/app/api/auth/session/route.ts` creates/deletes cookies, but this **does not itself** prove all legacy OTP fallback / admin device session / cross-host user jobs are reproduced. Any provider-only decision must list the exact managed provider API capability for the user job; where the provider cannot supply it, retain a minimal privacy-safe persistence layer or explicitly negotiate product redesign.

**Current vNext source result (2026-10-11):** the server-side session route accepts an already-minted Firebase `idToken`, validates recent sign-in, and exchanges it for the HttpOnly `lms_session` cookie. `firebase-identity-directory.ts` provisions/looks up provider users, but the current `main` tree has no application phone/email sign-in implementation that obtains that `idToken` (no checked-in phone OTP verifier / email sign-in client flow was found in the auth tree). Therefore the active legacy learner/faculty/mobile OTP jobs are **not provider-replaced yet**. The staged `identity_auth_attempts` contract remains a candidate database responsibility until the later API phase proves which abuse-budget, fallback, replay, tenant-binding and recovery jobs are wholly delegated to Identity Platform.

### Unregistered schema drafts

| Artifact | Safe staging purpose |
| --- | --- |
| `src/db/schema/db01-auth-attempts.staged.ts` | One user-bound challenge; nullable SMS/email keyed code MACs; college+membership, expiry, consumed/verified timestamps, atomic attempt budget, rate-limit fingerprint |
| `docs/planning/sql/db01-auth-attempts-staging.sql` | Candidate SQL, CHECKs and conditional attempt reservation statement (not applied) |
| `src/db/schema/db01-auth-handoffs.staged.ts` | High-entropy one-time code MAC, target host/domain/membership and two-minute expiry |
| `docs/planning/sql/db01-auth-handoffs-staging.sql` | Candidate SQL and atomic consume pattern (not applied) |
| `src/db/schema/db01-device-sessions.staged.ts` | Alternative targeted per-device session contract; does not activate session API |
| `docs/planning/db01-device-session-contract.md` | Explicit legacy FACULTY impersonation bug exception and provider-vs-ledger design |

A closed, unmerged `PR #61` also contains an alternative staging shape for device sessions and handoff. **Do not merge two incompatible competing schemas.** Chat 1 must select/reconcile a single normalized contract, generated migration and independent database acceptance. That historical PR is not an implemented/proven schema.

## Strict security invariants for integration

1. **No raw short OTP in persistent storage.** Even plain SHA-256 is brute-forceable for six decimal digits; use a separate keyed HMAC with a managed secret, rotation plan and constant-time comparison. Keep OTP values out of logs and device analytics.
2. **No raw Firebase bearer/session tokens or handoff codes in DB.** A high-entropy code MAC is permissible; handoff is not an alternate authentication provider.
3. **No self-trusting `user_id` or `membership_id`.** The server resolves authorized user; membership must belong to user and tenant domain's college must equal membership's college. FK references alone do not enforce equality across three independent parents.
4. **Single-use and expiry must be enforced atomically.** `UPDATE ... WHERE used_at IS NULL AND expires_at > now()` / `... consumed_at IS NULL ... RETURNING` should have at most one winner, including under simultaneous requests and retries.
5. **Rate cap is global to the challenge**, not five attempts separately per SMS/email. Phone and email sends have their own anti-abuse budget. Successful consume clears secret material or expires it, and a failed provider mint cannot inadvertently resurrect a challenge.
6. **Current authorization is checked at consume**, never solely at issue. Account disabled, college archived, role revoked, domain unverified, host changed or membership ended invalidates the code. Reject cross-origin code use and stale tenant scope.
7. **Do not clone legacy security bug**: the old session revoke method treated `FACULTY` as a privileged admin and bypassed owner check. Modern policy must use persisted actor ownership or explicit central admin permission.
8. **Separate privacy from debugging**: contact fingerprint is a keyed digest, not a raw phone/email; IP/device details require retention controls and access policy. OTP and token records are not learner/admin content.

## Executable acceptance plan after W01 migration integration

- PostgreSQL replay: clean and latest migrations; required target FKs, checks, unique constraints and indexes present.
- Mutation witnesses: 10 simultaneous wrong OTP attempts produce at most five committed reservations, across channels and replicas.
- Replays: exactly one successful challenge consume and one cross-host handoff consume, including transaction races and expiry edges.
- Tenant mismatch: forged `college_id`, `membership_id`, target verified domain and ACTIVE user/role rejected, with no session minted.
- Provider flow: Firebase user disable, token revocation, OTP/email fallback and handoff mint failures leave no usable inconsistent session.
- Rate abuse: fingerprint collisions/rotation, resend limits, support/test-number OTP setup isolated from production.
- Secret scanner: no raw OTP/JWT/refresh token columns, unsafe logging or public-code querystrings.
- Privacy/cleanup: expired/used records purged within approved retention, without silently losing required security audit.

**Current quality evidence:** DB01 has a source-only triage ledger for 312 candidate fields, with 66 legacy source fields now backed by direct active auth workflows; all 84 identity-provider/session candidates have an explicit current-source disposition. **Zero VNext fields are runtime-semantic verified**, and the staged model/SQL here has **not** been run through typecheck, CI, PostgreSQL replay or runtime integration. Do not advance DB-004 beyond IN_PROGRESS based on these drafts.

## Cross-host handoff one-time row-transition hardening — 2026-10-11 Chat 2

**New direct-main staged files (UNREGISTERED):**
`docs/planning/sql/db01-auth-handoff-lifecycle-guard-staging.sql`,
`tests/db01-auth-handoff-lifecycle-source.test.mjs`, and
`tests/db01-auth-handoff-lifecycle-pg.test.mjs`.
The accompanying candidate appears as `DB01-HANDOFF-MONOTONIC` in the
migration integration manifest. **Auth/provider/API behavior remains unchanged.**

The original `identity_auth_handoffs` table has a unique keyed-MAC code,
two-minute lifetime check and optional `consumed_at`. A conditional
`UPDATE ... WHERE consumed_at IS NULL AND expires_at > ... RETURNING`
offers a one-winner consume transaction, but **does not by itself enforce
immutable SQL state** if a privileged buggy writer later runs a direct update.
The staged `BEFORE UPDATE` trigger therefore rejects mutation of
`id`, `user_id`, `college_id`, `target_membership_id`,
`target_domain_id`, `target_host`, `code_mac`, or `created_at`;
rejects extension of `expires_at`; and forbids **any** update after
`consumed_at` becomes non-NULL. It rechecks
`clock_timestamp() >= NEW.expires_at` after acquiring the row lock,
so a transaction that waited past the expiry cannot consume by providing a
backdated `consumed_at` value.

**Actual PostgreSQL test remains pending.** The authored disposable witness
creates only a randomized temporary schema under explicit opt-in with a
`TEST_DATABASE_URL` distinct from `DATABASE_URL`, then exercises
scope/MAC/host rebinding, expiry extension, consumed replay, already-expired
consumption, two simultaneous consumers, and a blocked writer that crosses
the expiry deadline. It drops the fixture in `finally`; its synthetic
parent fixture **does not** replace full migrated-schema composite tenant
foreign-key or Identity Platform acceptance.

When using a database-backed handoff, Chat 1 must register the **table and
its row-transition trigger together** in a numbered migration; the actual
API consume must use `clock_timestamp()` for conditional expiry checks and
verify the ACTIVE user/membership/college/org and matching VERIFIED,
nondeleted target domain/host **in the same consistent transaction**.
Avoid hosting codes in URL querystrings or storing any raw bearer tokens.
A bounded-retention `DELETE` is a separate explicit policy; do not reset
a consumed record or rotate its MAC. A provider-only alternative would need
equivalent replay/tenant proofs before retiring this staged model.

To run *only after approving a separately disposable PostgreSQL database*:

```sh
node --test tests/db01-auth-handoff-lifecycle-source.test.mjs
DB01_HANDOFF_DISPOSABLE=I_ACCEPT_DESTRUCTIVE_TEMP_SCHEMA TEST_DATABASE_URL='<disposable URL>' node --test tests/db01-auth-handoff-lifecycle-pg.test.mjs
```

The source tests and PostgreSQL witness are **authored**, not evidenced as
Node or PostgreSQL executions in this documentation; passing source-text
assertions alone do not satisfy DB-004 verification or unlock the global
DATABASE phase.


## DB-004 accelerated security closure — 2026-10-12 (source-level only)

**Why this batch matters:** the initial source-stage OTP and handoff guards previously protected only UPDATEs. Direct SQL could INSERT a row already used or verified and satisfy the row CHECK, or verify a challenge after real-clock expiry by backdating `verified_at`. The active source work now rejects these cases while preserving single-use and retry version semantics.

**Staged SQL hardening committed to `main`:**

- `db01-auth-attempt-lifecycle-guard-staging.sql` now has an INSERT gate requiring unused/unverified challenge, zero retries/resends, version 1, nonfuture creation and unexpired issuance; the trigger covers INSERT and UPDATE.
- Under UPDATE, it checks **`clock_timestamp() >= LEAST(OLD.expires_at, NEW.expires_at)`** after locking the row, rejecting expired verification, consumption, retry and resend increments. Using `LEAST` blocks same-write shortening of expiry paired with backdated verification. Independently it rejects newly written future `verified_at` or `used_at` even when within the challenge's expiry window.
- `db01-auth-handoff-lifecycle-guard-staging.sql` now rejects INSERT of pre-consumed or expired handoff proofs and rejects future-dated UPDATE `consumed_at`; it retains its real-clock post-lock expiry check, immutable target host/principal/MAC envelope and terminal consumed replay protection.
- Original source-owned draft behavior, proposed Drizzle models, API/session provider, numbered migrations, schema barrel and CI remain untouched. **Neither draft SQL file is registered/applied to any database.**

**Exact-source execution performed:** After final edits, all 20 OTP and 15 handoff existing-plus-new `node:test` callback bodies were executed using the exact GitHub-fetched test, model and SQL text in an isolated JavaScript V8 evaluation context: **35/35 passed**, zero failed. This is **NOT an execution of Node's `node --test` runner** and does not attest PostgreSQL runtime syntax or behavior. The committed source blobs at this point were: OTP guard `fd0274b6b284590b0092d10fe39d8ded2ce31a75`, OTP source tests `1ab41e80a50ed7a645feece76ea134dd9489966e`, handoff guard `8471b0d447daebd2a559a7558ee1cf706191b1d3`, and handoff source tests `57129c05cef058a573b1660f41fbdc45507a2021`.

**Authored but NOT executed in PostgreSQL:** `tests/db01-auth-attempt-lifecycle-pg.test.mjs` now adds expired backdated verify/consume, expired counter reservation, future-event proofs and same-write shortened-expiry cases; `tests/db01-auth-handoff-lifecycle-pg.test.mjs` now covers fabricated spent/expired INSERTs, legitimate expiry after issuance and future-dated consumed evidence. Both use opt-in isolated temporary schemas and require independent PostgreSQL execution before migration registration or runtime acceptance.

**Integration dependency:** Registration of auth OTP/handoff tables remains contingent on the product/provider choice (Identity Platform versus database-backed challenges). Source-only tests do not approve adding a second OTP engine. Chat 1's reserved migration/schema-barrel authority remains unchanged. **DB-004 remains IN_PROGRESS and global DATABASE remains ACTIVE.**

**Fastest real completion path:** Execute both opt-in disposable PostgreSQL witnesses and independently generated registered schema replay, reconcile the source-to-provider account-verification and token-revocation decisions, and then verify end-to-end auth session issuance against that exact database revision. GitHub Actions billing is intentionally irrelevant; use a local or ephemeral PostgreSQL runner and record actual output.


## 2026-10-12 SQL compiler delimiter correction

During independent staging review, both authored PL/pgSQL lifecycle files were discovered to contain invalid `LANGUAGE plpgsql AS $` (a single dollar), although their previously authored source-behavior tests had passed. PostgreSQL requires a **matching paired dollar-quote tag**, such as `$$` or `$tag$`. Both files now use correctly matched openers and closers. This is a prerequisite for executing either disposable PostgreSQL witness; **no execution of PostgreSQL is claimed**.

A new regression was integrated into `tests/db01-test-database-guard.test.mjs`, which already belongs to the existing `npm run test:db:parity` CI command. It asserts both exact staged trigger definitions have paired PL/pgSQL dollar delimiters and includes negative mutants that remove a leading or trailing dollar. The three new test callbacks ran against the **actual latest GitHub SQL blobs**, with **3/3 passing** in an isolated JavaScript source evaluator (not the full Node test runner).

Corrected file blobs at verification:
- `docs/planning/sql/db01-auth-attempt-lifecycle-guard-staging.sql`: `146898685b74a262a19dc67d0fd34c42a6d26985`
- `docs/planning/sql/db01-auth-handoff-lifecycle-guard-staging.sql`: `dd8971f03ba9cde4a1cbcb9660c3f9c998ee3aa7`
- CI-covered static test: `tests/db01-test-database-guard.test.mjs` at `3e8e5ac361a852578fb8a749957cfe9379bfe0c5`

The source SQL is still **UNREGISTERED** pending explicit provider model selection, scoped composite FK reconciliation and executed disposable PostgreSQL acceptance. Do not call DB-004 verified based on delimiter syntax or source tests.
