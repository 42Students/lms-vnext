# Chat-6 auth and sessions ledger — 2026-10-18

**Scope:** Auth, session, device and login endpoint exports, prioritized after Projects IIT Dharwad breaker. Every runtime export and handler in the listed files is enumerated; types and constant declarations are summarized below rather than falsely described as callable functions. Source assertions are explicitly distinguished from fake-repository behavioural tests and real PostgreSQL tests. CI status **unverified**.

## Exported runtime functions and HTTP handlers

| File | Function/handler | Test(s) | Tested rule and remaining gap |
|---|---|---|---|
| `src/modules/auth/config.ts` | `readAuthConfig` | `tests/unit/auth-login-service.test.ts` | secret length, development-only test OTP; cached-config expiry remains integration |
| `src/modules/auth/config.ts` | `getPlatformHosts` | `tests/unit/auth-login-service.test.ts` | secret length, development-only test OTP; cached-config expiry remains integration |
| `src/modules/auth/config.ts` | `getAuthConfig` | `tests/unit/auth-login-service.test.ts` | secret length, development-only test OTP; cached-config expiry remains integration |
| `src/modules/auth/config.ts` | `resetAuthConfigForTests` | `tests/unit/auth-login-service.test.ts` | secret length, development-only test OTP; cached-config expiry remains integration |
| `src/modules/auth/crypto.ts` | `mac` | `tests/unit/chat6-auth-session-adversarial.test.ts`, `tests/unit/chat17-auth-crypto-hardening.test.ts` | keyed purpose isolation, constant format, random tokens; runtime RNG and redaction tests |
| `src/modules/auth/crypto.ts` | `safeEqualHex` | `tests/unit/chat6-auth-session-adversarial.test.ts`, `tests/unit/chat17-auth-crypto-hardening.test.ts` | keyed purpose isolation, constant format, random tokens; runtime RNG and redaction tests |
| `src/modules/auth/crypto.ts` | `generateCode` | `tests/unit/chat6-auth-session-adversarial.test.ts`, `tests/unit/chat17-auth-crypto-hardening.test.ts` | keyed purpose isolation, constant format, random tokens; runtime RNG and redaction tests |
| `src/modules/auth/crypto.ts` | `generateToken` | `tests/unit/chat6-auth-session-adversarial.test.ts`, `tests/unit/chat17-auth-crypto-hardening.test.ts` | keyed purpose isolation, constant format, random tokens; runtime RNG and redaction tests |
| `src/modules/auth/crypto.ts` | `codeMac` | `tests/unit/chat6-auth-session-adversarial.test.ts`, `tests/unit/chat17-auth-crypto-hardening.test.ts` | keyed purpose isolation, constant format, random tokens; runtime RNG and redaction tests |
| `src/modules/auth/crypto.ts` | `contactFingerprint` | `tests/unit/chat6-auth-session-adversarial.test.ts`, `tests/unit/chat17-auth-crypto-hardening.test.ts` | keyed purpose isolation, constant format, random tokens; runtime RNG and redaction tests |
| `src/modules/auth/crypto.ts` | `sessionDigest` | `tests/unit/chat6-auth-session-adversarial.test.ts`, `tests/unit/chat17-auth-crypto-hardening.test.ts` | keyed purpose isolation, constant format, random tokens; runtime RNG and redaction tests |
| `src/modules/auth/crypto.ts` | `maskPhone` | `tests/unit/chat6-auth-session-adversarial.test.ts`, `tests/unit/chat17-auth-crypto-hardening.test.ts` | keyed purpose isolation, constant format, random tokens; runtime RNG and redaction tests |
| `src/modules/auth/crypto.ts` | `maskEmail` | `tests/unit/chat6-auth-session-adversarial.test.ts`, `tests/unit/chat17-auth-crypto-hardening.test.ts` | keyed purpose isolation, constant format, random tokens; runtime RNG and redaction tests |
| `src/modules/auth/device-label.ts` | `describeDevice` | `tests/unit/chat6-auth-retention-network.test.ts`, `tests/unit/auth-device-label.test.ts` | raw hostile user-agent fallback and common browser/system combinations |
| `src/modules/auth/http.ts` | `ipTag` | `tests/unit/chat17-auth-http-hardening.test.ts`, `tests/unit/chat6-auth-tenant-failclosed.test.ts` | host+origin+rate schema enforcement, untrusted IP, 503 fail-closed |
| `src/modules/auth/http.ts` | `auditLogin` | `tests/unit/chat17-auth-http-hardening.test.ts`, `tests/unit/chat6-auth-tenant-failclosed.test.ts` | host+origin+rate schema enforcement, untrusted IP, 503 fail-closed |
| `src/modules/auth/http.ts` | `loginErrorResponse` | `tests/unit/chat17-auth-http-hardening.test.ts`, `tests/unit/chat6-auth-tenant-failclosed.test.ts` | host+origin+rate schema enforcement, untrusted IP, 503 fail-closed |
| `src/modules/auth/http.ts` | `guardLoginRequest` | `tests/unit/chat17-auth-http-hardening.test.ts`, `tests/unit/chat6-auth-tenant-failclosed.test.ts` | host+origin+rate schema enforcement, untrusted IP, 503 fail-closed |
| `src/modules/auth/login-repository.ts` | `drizzleLoginRepository` | `tests/unit/chat6-auth-session-adversarial.test.ts` | single-use atomic SQL contract; real PostgreSQL concurrency GAP |
| `src/modules/auth/login-service.ts` | `normalizePhone` | `tests/unit/auth-login-service.test.ts` | real FakeRepository behavioural OTP happy/negative, 2FA, lockout, resend, session issuance; PostgreSQL GAP |
| `src/modules/auth/login-service.ts` | `normalizeEmail` | `tests/unit/auth-login-service.test.ts` | real FakeRepository behavioural OTP happy/negative, 2FA, lockout, resend, session issuance; PostgreSQL GAP |
| `src/modules/auth/login-service.ts` | `startLogin` | `tests/unit/auth-login-service.test.ts` | real FakeRepository behavioural OTP happy/negative, 2FA, lockout, resend, session issuance; PostgreSQL GAP |
| `src/modules/auth/login-service.ts` | `sendEmailFallback` | `tests/unit/auth-login-service.test.ts` | real FakeRepository behavioural OTP happy/negative, 2FA, lockout, resend, session issuance; PostgreSQL GAP |
| `src/modules/auth/login-service.ts` | `verifyLogin` | `tests/unit/auth-login-service.test.ts` | real FakeRepository behavioural OTP happy/negative, 2FA, lockout, resend, session issuance; PostgreSQL GAP |
| `src/modules/auth/public-network-notice-model.ts` | `publicNetworkNotice` | `tests/unit/chat6-auth-retention-network.test.ts` | gateway and session-change message choices |
| `src/modules/auth/request-tenant.ts` | `resolveRequestTenant` | `tests/unit/chat6-auth-tenant-failclosed.test.ts`, `tests/unit/auth-tenant-access.test.ts` | unavailable host denied in guard; DNS cache and retry failure injection still GAP |
| `src/modules/auth/request-tenant.ts` | `clearRequestTenantCacheForTests` | `tests/unit/chat6-auth-tenant-failclosed.test.ts`, `tests/unit/auth-tenant-access.test.ts` | unavailable host denied in guard; DNS cache and retry failure injection still GAP |
| `src/modules/auth/retention.ts` | `purgeAuthData` | `tests/unit/chat6-auth-retention-network.test.ts` | bounded expiry SQL, partial DB failure, null driver counts |
| `src/modules/auth/runtime.ts` | `startLoginWithRuntime` | `tests/unit/chat16-otp-route-tenant-session-09.test.ts` | endpoint integration with mocked runtime; live provider+DB GAP |
| `src/modules/auth/runtime.ts` | `sendEmailFallbackWithRuntime` | `tests/unit/chat16-otp-route-tenant-session-09.test.ts` | endpoint integration with mocked runtime; live provider+DB GAP |
| `src/modules/auth/runtime.ts` | `verifyLoginWithRuntime` | `tests/unit/chat16-otp-route-tenant-session-09.test.ts` | endpoint integration with mocked runtime; live provider+DB GAP |
| `src/modules/auth/session-service.ts` | `createSession` | `tests/unit/chat6-auth-session-adversarial.test.ts`, `tests/unit/chat6-auth-logout-revocation.test.ts` | opaque digest, user ownership, revoked/expired gate; live PG stale session race GAP |
| `src/modules/auth/session-service.ts` | `resolveSession` | `tests/unit/chat6-auth-session-adversarial.test.ts`, `tests/unit/chat6-auth-logout-revocation.test.ts` | opaque digest, user ownership, revoked/expired gate; live PG stale session race GAP |
| `src/modules/auth/session-service.ts` | `revokeSessionByToken` | `tests/unit/chat6-auth-session-adversarial.test.ts`, `tests/unit/chat6-auth-logout-revocation.test.ts` | opaque digest, user ownership, revoked/expired gate; live PG stale session race GAP |
| `src/modules/auth/session-service.ts` | `revokeAllSessionsForUser` | `tests/unit/chat6-auth-session-adversarial.test.ts`, `tests/unit/chat6-auth-logout-revocation.test.ts` | opaque digest, user ownership, revoked/expired gate; live PG stale session race GAP |
| `src/modules/auth/session-service.ts` | `listActiveSessions` | `tests/unit/chat6-auth-session-adversarial.test.ts`, `tests/unit/chat6-auth-logout-revocation.test.ts` | opaque digest, user ownership, revoked/expired gate; live PG stale session race GAP |
| `src/modules/auth/session-service.ts` | `revokeOtherSessions` | `tests/unit/chat6-auth-session-adversarial.test.ts`, `tests/unit/chat6-auth-logout-revocation.test.ts` | opaque digest, user ownership, revoked/expired gate; live PG stale session race GAP |
| `src/modules/auth/session-service.ts` | `revokeOwnSession` | `tests/unit/chat6-auth-session-adversarial.test.ts`, `tests/unit/chat6-auth-logout-revocation.test.ts` | opaque digest, user ownership, revoked/expired gate; live PG stale session race GAP |
| `src/modules/auth/tenant-access.ts` | `isTenantAccessAllowed` | `tests/unit/auth-tenant-access.test.ts` | active membership and tenant host binding; deactivation timing GAP |
| `src/modules/auth/tenant-branding.ts` | `getCollegeSignInName` | `tests/unit/chat17-auth-tenant-branding.test.ts` | active selected college display; DB outage/display integration GAP |
| `src/auth/ip-rate-limit.ts` | `allowRequest` | `tests/unit/auth-ip-rate-limit.test.ts`, `tests/unit/chat6-auth-session-adversarial.test.ts` | 50k-key saturation, expiry, spoofed XFF, independent buckets |
| `src/auth/ip-rate-limit.ts` | `clientIp` | `tests/unit/auth-ip-rate-limit.test.ts`, `tests/unit/chat6-auth-session-adversarial.test.ts` | 50k-key saturation, expiry, spoofed XFF, independent buckets |
| `src/auth/ip-rate-limit.ts` | `resetIpRateLimitForTests` | `tests/unit/auth-ip-rate-limit.test.ts`, `tests/unit/chat6-auth-session-adversarial.test.ts` | 50k-key saturation, expiry, spoofed XFF, independent buckets |
| `src/auth/session.ts` | `verifyIdentitySessionCookie` | `tests/unit/chat6-auth-session-adversarial.test.ts` | read-layer fail-closed source contract; DB-active-revocation race GAP |
| `src/auth/session.ts` | `revokeIdentitySessions` | `tests/unit/chat6-auth-session-adversarial.test.ts` | read-layer fail-closed source contract; DB-active-revocation race GAP |
| `src/app/api/auth/login/start/route.ts` | `POST` | `tests/unit/chat16-otp-route-tenant-session-09.test.ts` | host-derived tenant and request throttling, invalid input |
| `src/app/api/auth/login/verify/route.ts` | `POST` | `tests/unit/chat16-otp-route-tenant-session-09.test.ts` | session cookie rotation, admin scope reset, expired OTP |
| `src/app/api/auth/login/email/route.ts` | `POST` | `tests/unit/chat16-otp-route-tenant-session-09.test.ts` | resend against existing challenge, no unguarded delivery |
| `src/app/api/auth/session/route.ts` | `DELETE` | `tests/unit/chat6-auth-logout-revocation.test.ts` | CSRF, success/failure, wipe device cookies, truthful 503 |
| `src/app/api/auth/devices/route.ts` | `GET` | `tests/unit/chat6-auth-session-adversarial.test.ts` | same-user lookup/revoke source contract; DB and HTTP handler mocks GAP |
| `src/app/api/auth/devices/route.ts` | `DELETE` | `tests/unit/chat6-auth-session-adversarial.test.ts` | same-user lookup/revoke source contract; DB and HTTP handler mocks GAP |
| `src/app/api/auth/devices/[sessionId]/route.ts` | `DELETE` | `tests/unit/chat6-auth-session-adversarial.test.ts` | userId ownership and UUID gate source contract; database IDOR GAP |

## Schema and constant inventory

- `src/modules/auth/config.ts`: `MIN_AUTH_SECRET_LENGTH`, `SESSION_MAX_AGE_SECONDS`, `AuthConfig`, `AuthConfigError`.
- `src/modules/auth/login-service.ts`: `ATTEMPT_LIFETIME_SECONDS`, `MAX_SENDS_PER_CONTACT`, `MAX_SENDS_PER_CONTACT_TOTAL`, `MAX_SENDS_PER_ADDRESS`, `SEND_WINDOW_MINUTES`, `EMAIL_RESEND_GAP_SECONDS`, `MAX_EMAIL_RESENDS`, `UNKNOWN_ADDRESS_TAG`, `LoginError`, types for users, memberships, attempts, repositories, login/verify results, and session issues.
- `src/modules/auth/retention.ts`: `ATTEMPT_RETENTION_DAYS`, `SESSION_RETENTION_DAYS`, `SqlExecutor`; `src/modules/auth/session-service.ts`: session DTO and lookup failure unions.
- `src/modules/auth/request-tenant.ts`: `RequestTenant` platform/college/unknown/unavailable union. Never collapse unavailable into platform.

## Defects and verification

- **AUTH-tenant-failclosed-01:** unavailable tenant-domain lookup incorrectly proceeded with `tenantCollegeId:null` as if platform host. Fixed by a distinct, non-cacheable retryable 503 response and behavioural tests in `chat6-auth-tenant-failclosed.test.ts`.
- **AUTH-sessions-05:** DB revoke failure previously cleared client cookies and returned success while the remote token could remain valid. Fix returns a truthful 503 while clearing shared-device state; behavioural route test in `chat6-auth-logout-revocation.test.ts`.
- **AUTH-rate-limits-01:** attacker-controlled key explosion could clear live budgets; bounded/fail-closed map, 50k-key behavioural stress test.
- **AUTH-sessions-04:** relogin could revoke a previous token without matching the same canonical user; fixed user-ID equality.

**Not yet certified:** exhaustive server-side device CRUD mocks, all tenant-domain races, 2FA multi-replica concurrency, session revocation under in-flight writes, PostgreSQL constraint/integration tests, real Exotel/ZeptoMail sandbox faults, CI/typecheck and mobile/browser route journeys. A source filename appearing in the test column is not proof of a fully exercised behavioural/permission matrix. Fix those gaps before any release sign-off.
