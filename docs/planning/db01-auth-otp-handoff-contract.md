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

**Current quality evidence:** DB01 has a source-only triage ledger for 312 candidate fields, with 41 legacy source candidates now backed by active auth controllers/services. **Zero VNext fields are runtime-semantic verified**, and the staged model/SQL here has **not** been run through typecheck, CI, PostgreSQL replay or runtime integration. Do not advance DB-004 beyond IN_PROGRESS based on these drafts.
