# Chat-6 auth, OTP, handoff, and session hardening ledger

**Top priority / master queue chat-6 Pass B.** Focused test file: `tests/unit/chat6-auth-session-hardening.test.ts`. These are source and pure-function tests; PostgreSQL session revocation, OTP send/consume race and full-browser paths are pending integration execution.

| Source | Exported function or route guard | Adversarial test | Cases covered / remaining |
|---|---|---|---|
| `src/modules/auth/crypto.ts` | `mac`, `codeMac`, `sessionDigest`, `contactFingerprint` | AUTH-otp-01 | Channel, attempt, purpose, contact kind domain separation; keyed deterministic digest. |
| `src/modules/auth/crypto.ts` | `safeEqualHex` | AUTH-otp-02 | Same digest, different digest, non-equal length; runtime timing analysis pending. |
| `src/modules/auth/crypto.ts` | `generateCode`, `generateToken` | AUTH-otp-03 | 6-decimal and 256-bit base64url shape across 32 trials; entropy audit pending. |
| `src/modules/auth/crypto.ts` | `maskPhone`, `maskEmail` | AUTH-login-02 | Short contact, last-four phone, concealed email local part. |
| `src/modules/auth/login-service.ts` | `normalizePhone`, `normalizeEmail` | AUTH-login-01 | International and domestic canonicalization, invalid formats. |
| `src/modules/auth/login-service.ts` | `startLogin`, `verifyLogin` and attempt repository boundaries | AUTH-login-03 | Atomic attempt/resend/consume constraints source-reviewed. Multi-session provider simulation and real PostgreSQL CAS pending. |
| `src/modules/auth/http.ts` | `guardLoginRequest`, `loginErrorResponse`, `ipTag`, `auditLogin` | AUTH-login-04 | Same-origin, throttle, bad JSON/Zod, unknown tenant, Retry-After and log privacy source-reviewed. |
| `src/modules/auth/session-service.ts` | `resolveSession` | AUTH-session-01 | Disabled platform user now rejected before mutating last_seen; expired/revoked cases source-reviewed. DB execution pending. |
| `src/modules/auth/session-service.ts` | `revokeOwnSession`, `revokeOtherSessions`, `revokeAllSessionsForUser`, `revokeSessionByToken` | AUTH-session-02 | Owner-bound rows, current device exclusion, idempotent revocation SQL structure. DB race pending. |

## Behavioral denial matrix — `tests/unit/chat6-auth-account-denials.test.ts`

| Case | Actor | Tenant | Expected guard |
|---|---|---|---|
| AUTH-role-01 | Disabled user with formerly active membership | College and platform | `ACCOUNT_DISABLED` before delivery |
| AUTH-role-02 | User with ended membership only | Platform | `NO_ACCOUNT_FOR_DOMAIN` |
| AUTH-role-03 | Active member of college A | College B | `NO_ACCOUNT_FOR_DOMAIN` |
| AUTH-role-04 | Suspended college member | Same college | `ACCOUNT_SUSPENDED` |
| AUTH-role-05 | Super Admin without independent email | Platform | `SECOND_FACTOR_UNAVAILABLE` |
| AUTH-role-06 | Unknown contact | College | `NOT_REGISTERED` |

Tests call `startLogin` with a deliberately adversarial repository fake; they assert actual denial behavior, not just that source strings exist. Provider delivery and database effects must still be exercised in the PostgreSQL integration harness.

## OTP verification adversarial transactions — `tests/unit/chat6-auth-otp-verify-breaker.test.ts`

Nine behavioral tests call `verifyLogin` against a stateful fake repository: database-authoritative expiry, foreign-tenant challenge refusal, consumed-code replay, missing second factor without spending a guess, wrong-code budget, valid dual-factor consume, concurrent double submit with a single successful consume, deactivated account after issuing the challenge, and refused verification budget. These tests exercise service behavior and call ordering; they do **not** replace the PostgreSQL transactional single-winner integration tests.

## Defect AUTH-session-01

**Severity:** BLOCKER for deactivated-account access. The persisted session resolver accepted device tokens for disabled users and returned `ok:true` with `platformStatus:"DISABLED"`, relying on later UI/permission checks. Source fix `710e217b` refuses disabled users as `SESSION_REVOKED` before updating last-seen time. The test source checks the ordering. Separate service/API integration must verify the disabled user has no usable routes.

This ledger is not an exhaustive sign-off of all Auth exported functions, tenant DNS verification, or full browser handoff. Those require an executable DB/browser harness.
