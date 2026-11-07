# SEC-01 Authentication and identity: code assessment (pilot, 2026-11-07)

Method: code read only, no tests run. This file is NOT the tracker. `docs/tracker.json` accepts an assessed state only with an executed GitHub Actions run URL and commit SHA (`scripts/security/control-progress.mjs`, rule `SECURITY_EVIDENCE_INVALID`). So these notes become tracker entries after the one CI pass, citing the run that executed the matching tests. Nothing here is VERIFIED.

Files read: `src/modules/auth/login-service.ts` (startLogin, verifyLogin), `src/auth/session.ts`, `src/auth/ip-rate-limit.ts`, `src/auth/recent-device-auth.ts`.

| Control | Finding | Code | Proposed state | Missing proof |
|---|---|---|---|---|
| 001 one internal identity | Sessions and grants key on `user.id` (`verifyLogin` loads `findUserById(attempt.userId)`); email and phone are lookup inputs only | login-service.ts:598-690 | IMPLEMENTED_UNVERIFIED | Test that changing email or phone keeps grants; legacy-ID mapping review |
| 004 passkeys / WebAuthn | No code: no `webauthn` or `passkey` match anywhere in `src` | grep | GAP_CONFIRMED (feature absent) | Owner decision and build |
| 005 phishing-resistant MFA for Super Admin | Super Admin needs two codes (SMS and email), both one-time codes, so phishable. Not phishing-resistant | verifyLogin `strong` branch | PARTIAL: two factors yes, phishing-resistant no | Passkey or hardware key (needs 004) |
| 006 strong MFA for College Admin and privileged | Non-Super-Admin accepts EITHER channel's code: effectively one factor | verifyLogin `else` branch | GAP_CONFIRMED for College Admin | Owner decision: require both for privileged roles |
| 010 credential stuffing / OTP guessing | 5 verification attempts per challenge, reserved atomically before the compare | `reserveVerification`, `OTP_ATTEMPTS_EXCEEDED` | IMPLEMENTED_UNVERIFIED | Per-account and per-IP flood tests |
| 011 distributed rate limits | `src/auth/ip-rate-limit.ts` is a per-process `Map` (its own header says so). `route()` uses `allowRequestShared` (shared store), but the shared store is not enabled on dev (`SECURITY_SHARED_STORE` off) | ip-rate-limit.ts:11; route.ts | GAP_CONFIRMED until the owner switches the shared store on | Enable on dev; two-replica test |
| 013 OTP replay, atomic single use | Codes stored as keyed MAC, compared with `safeEqualHex` (constant time); `usedAt` checked; budget reserved atomically | verifyLogin | IMPLEMENTED_UNVERIFIED | Concurrent double-submit test against Postgres |
| 014 failed auth cannot activate a session | Session digest is created only after the code matches and `assertCanSignInHere` passes, inside the consume transaction | verifyLogin tail | IMPLEMENTED_UNVERIFIED | Negative test per failure path |
| 016 disabled / archived / revoked vs auth | `assertCanSignInHere` re-checks at consume time, not only at issue; `verifyIdentitySessionCookie` rejects non-ACTIVE users | session.ts:55-65 | IMPLEMENTED_UNVERIFIED | Test matrix: disabled user, archived college, revoked membership |
| 017 / 018 enterprise SSO | No OIDC or SAML code | grep | GAP_CONFIRMED (feature absent) | Owner decision (needed for enterprise customers) |
| 002, 003, 007, 008, 009, 012, 015 | Not inspected yet | | UNASSESSED | Read `startLogin`, the recovery routes, `recent-device-auth.ts`, audit events |

## Real findings from this pilot

1. **College Admins sign in with one code from either channel** (006). Only Super Admin gets two factors. Enterprise customers will ask about this first.
2. **Login throttling per IP is per process** (011) and the shared store is off on dev, so on several replicas the limit multiplies.
3. **No passkeys, TOTP or SSO exist** (004, 005, 017, 018). These are build items, not review items.

## Cost of doing all 448

SEC-01 took one pass for about half its controls. At that rate the 448 take roughly 25 passes across the remaining groups, and every result still needs CI evidence before the tracker will take it.
