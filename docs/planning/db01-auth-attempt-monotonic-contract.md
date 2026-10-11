# DB-004 — OTP challenge monotonic persistence and anti-replay contract

**Chat 2 | shared DATABASE phase | main | staged only.**
**Status: SQL + Drizzle draft and executable tests AUTHORED. Zero PostgreSQL executions; zero newly activated authentication endpoints.**

## Why the first bounded schema was insufficient

The legacy application’s current `PublicMobileAuthController.java` creates a mobile/recruiter login attempt with a five-minute expiry and checks `used` and `verification_attempts`. `MobileLoginAttemptRepository.reserveVerificationAttempt` atomically increments its five-try budget. Email-first recruiter login and learner/faculty email fallback are separate user jobs. These are live source semantics, not automatic proof that the vNext Identity Platform provider implements the entire experience.

The previous unregistered `identity_auth_attempts` draft already had CHECK(`verification_attempts BETWEEN 0 AND 5`), expiry > creation, code-MAC format, and single-use conditional-UPDATE guidance. **A row CHECK alone cannot stop a direct SQL update from resetting five attempts to zero, extending an existing deadline, swapping an issued user/college/membership, moving a used attempt back to unused, or replacing an OTP MAC after verification.** The proposed transition trigger closes these *database state* loopholes. It cannot itself prove an OTP was delivered or correct, that the caller is authorized, or that the Identity Platform mints or revokes a session safely.

## Auth-source-backed decisions

- Original attempt lifetime: five minutes. The staged SQL and Drizzle row CHECK now enforce `expires_at <= created_at + interval '5 minutes'`. Independent SMS/email code expiry must also be checked at verify time.
- A consumed attempt must have `verified_at IS NOT NULL`, `verified_at <= used_at`, both timestamps before `expires_at`, and **both** SMS and email code-MAC/expiry pairs cleared. Email-first may begin with SMS MAC absent; do not introduce a dummy SMS code.
- `target_role` may not be blank (1–24 characters), but permitted role and account type remain server-authorization obligations.
- Persist MACs using keyed HMAC-SHA256 with a secret outside the database; never raw six-digit codes, raw refresh/session/ID tokens or direct hash without a secret.
- Verified or used timestamps are sticky. Scope (user, college, membership, role, contact fingerprint and created time) is immutable; retry and resend counters cannot decrease or jump by more than one per UPDATE.
- Every attempt state mutation increments `version` **exactly once**; a verified challenge cannot rotate a MAC to a new non-null value, though code clearing is allowed.
- The outer expiry may be shortened to invalidate the challenge but cannot be extended. A consumed challenge is terminal; even a version-only no-op UPDATE is rejected. A retention DELETE would need an explicit approved policy.
- Counter reservation still must be an atomic conditional UPDATE using `used_at IS NULL AND expires_at > NOW() AND verification_attempts < 5`, with `version = version + 1`. This database shape cannot replace IP/contact-level abuse protection or provider verification.

## Engineering artifacts committed directly to main

| Artifact | Role |
| --- | --- |
| `docs/planning/sql/db01-auth-attempts-staging.sql` | Updated original table CHECKs to enforce five-minute TTL, role shape, consume-time cleanup |
| `src/db/schema/db01-auth-attempts.staged.ts` | Mirrors new constraints in isolated Drizzle draft, not the schema barrel |
| `docs/planning/sql/db01-auth-attempt-lifecycle-guard-staging.sql` | New OLD/NEW PostgreSQL trigger draft preventing counter, identity, expiry and terminal-state rollback |
| `tests/db01-auth-attempt-lifecycle-source.test.mjs` | 14 authored Node source/mutation tests; not executed with Node here |
| `tests/db01-auth-attempt-lifecycle-pg.test.mjs` | Executable opt-in disposable DB witness exercising valid/invalid lifecycle changes and actual two-session lock wait at fifth reservation |

Test on a separately approved disposable PostgreSQL with installed project dependencies:

    DB01_AUTH_DISPOSABLE=I_ACCEPT_DESTRUCTIVE_TEMP_SCHEMA TEST_DATABASE_URL='<disposable URL>' node --test tests/db01-auth-attempt-lifecycle-pg.test.mjs

This witness creates and cleans up only its randomly named fixture schema. It refuses identical `TEST_DATABASE_URL` and `DATABASE_URL`, and otherwise SKIPS absent explicit opt-in. It uses `pg_stat_activity` to observe an actual wait before releasing the transaction. Do not run it against any real/user data. Successful synthetic-fixture execution would still not establish full registered migration replay or complete Identity Platform integration.

## Must-pass acceptance before promotion

1. Product/platform decision: managed provider-only implementation **or** minimum safe DB challenge table. **Do not register the staged auth table until this is decided**; do not build an independent duplicate OTP engine merely because a draft exists.
2. Chat 1 registers the approved table, composite membership-user-college constraints and transition guard in exactly one consistent Drizzle numbered migration/snapshot after reviewing generated SQL and enum/table ownership.
3. Execute on isolated PostgreSQL: blank target role, expiry over five minutes, used before verified, used with uncleared MAC, unused spent record replay, member/college/user rebinding, verification/resend decrement/skip, expiry extension, verified MAC swap, consumed no-op update, email-first code path, wrong/expired channel, and two writers reserving the last fifth slot.
4. Run the full real-schema migration from empty and incremental existing vNext journal revisions; verify Drizzle snapshot consistency, indexes, composite keys and no existing row violations. Keep source code SHA, PostgreSQL version, command, output and explicit test pass/fail.
5. Implement subsequent API-phase server/provider verification, tenant/host and user/membership ACTIVE checks, HMAC key management, rate limiting across attempts and IPs, email-fallback and recruiter email-first flows, replay denial and cleanup.
6. Never claim vNext DB01 semantic verification from in-process static checks or authored but unexecuted tests. GitHub Actions is intentionally paused (billing) and is **not** a blocker; an independent PostgreSQL acceptance run remains compulsory.

## Known intentional divergence

The legacy SMS verify endpoint had a short already-used replay window; the new draft deliberately rejects replay, classified as a security tightening. The old source stores raw short OTP and, elsewhere, raw handoff access/refresh tokens; those must not be copied. Neither the provider-only approach nor this DB approach is production-approved in DB-004 yet.

**Last source check:** 24/24 GitHub-content JavaScript assertions passed in-process against a prior guard revision; this is a source-consistency check, NOT an executed Node test or PostgreSQL result. Review and re-run against the exact final revision before using it as engineering evidence.
