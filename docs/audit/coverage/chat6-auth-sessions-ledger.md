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


## AUTH-sessions-06 behavioural session service follow-through

`tests/unit/chat6-auth-session-service-behaviour.test.ts` exercises actual exported service functions with a mocked PostgreSQL adapter (not just source text): active login resolution, unknown tokens, revoked sessions, expired sessions, disabled platform users, session creation and DB failure, logout failure propagation, all-device revocation, owner-scoped per-device revoke, other-device count, and own-session device list. No mock claims to provide PostgreSQL transaction isolation, query-plan verification, or an authenticated browser. The existing `AUTH-sessions-04` login handoff and `AUTH-sessions-05` truthful logout regressions remain separately covered.

Outstanding DB acceptance: inject a real concurrent revoke between authentication and a mutation to confirm the latter rejects the stale session; replay the same opaque token across two devices; verify `identity_device_sessions` indexes, foreign keys and expiry purge under realistic retention. Existing source-level permission guards do not substitute for those tests.

## AUTH-sessions-07 administrative revocation double-submit and recovery (2026-10-18)

| Entry point | Test | Coverage | Still required |
| --- | --- | --- | --- |
| `src/components/admin/admin-revoke-sessions.tsx` | `tests/unit/chat6-auth-revoke-admin-flight-and-errors.test.ts` | Synchronous `useGuardedAction` protects against repeated modal confirmation, server POST retains exact owner and college identifiers, failures keep a retryable notice inside the confirmation dialog, successful revocation refreshes the admin list | Authenticated browser with simultaneous Enter/click and server-revocation races |
| `src/lib/api-fetch.ts` used by session revoke | same | Mocked 503 HTML and thrown network error never expose private proxy or SQL exception text | Cloud CI and actual edge proxy fault injection |

No source under `src/auth` or `src/security` was changed; this lane's UI edit is restricted to the administrator session-revoke component. Existing unit-failure snapshot from CI dd44f0f2 is historical and is not a replacement for a fresh CI run.

## AUTH-sessions-08 persisted Super Admin session HTTP boundary

`tests/unit/chat6-super-admin-session-route-breaker.test.ts` invokes the actual exported GET/POST route handlers for `/api/admin/colleges/[collegeId]/sessions`, mocking only origin/context/service dependencies, to cover origin-first denial, malformed/extra-property/no-confirmation rejection, exact route-college/user forwarding, zero-revoke idempotent retries, persistence-failure error redaction and request IDs, and private no-store GET. The persisted service is separately reviewed in `tests/unit/chat4-super-admin-session-hardening.test.ts`; real PostgreSQL transactions and browser revocation race are still required for full certification.

## AUTH-sessions-09 persisted actor and audit under a transaction

`tests/unit/chat6-super-admin-session-service-races.test.ts` exercises `revokeCollegeAdminSessions` with a mocked database adapter: unsupported roles, disabled actors and wrong selected tenant fail before revocation; out-of-roster targets fail; lost persisted actor permission fails before UPDATE; a zero-row repeat never emits another audit; actual affected-row count is audited once; failures propagate instead of returning a false success. This is **mocked transaction boundary coverage**, not proof of a PostgreSQL lock/rollback or cross-request serialization. Real concurrent revoke and role-change tests remain mandatory.

## AUTH-sessions-10 device HTTP journeys, CSRF and private caching (chat-6)

`tests/unit/chat6-auth-devices-http-role-journey.test.ts` invokes each exported account-security device handler rather than inferring safety from import names. The tests cover GET's authenticated owner-derived list, current-device indicator and sensitive-data no-store headers; missing/revoked session denial; same-origin rejection before auth or SQL; sign-out-other-devices zero-row idempotence and exact owner/current IDs; single-device UUID validation, foreign-owner guessing, successful revoke and a database-failure response that never exposes connection information or falsely claims success. Source now sets `Cache-Control: private, no-store` for successful private device enumeration and revocation at both routes.

The existing source/SQL tests additionally check persisted ownership predicates; this HTTP mock is not a PostgreSQL IDOR/race proof. Tests authored, **not executed** locally. CI and concurrent real-DB/browser session-revocation acceptance remain required.

## AUTH-sessions-11 active-only revocation accounting

`revokeAllSessionsForUser`, `revokeOtherSessions`, and `revokeOwnSession` now constrain SQL UPDATEs with `expires_at > now()` in addition to persisted owner and not-yet-revoked predicates. An already expired device must not be reported as a newly revoked live device, and sign-out-other-devices must not inflate its success count with inert sessions. `tests/unit/chat6-auth-session-service-behaviour.test.ts` asserts the SQL contracts, while its mocked adapter verifies zero-row retry behavior. Actual PostgreSQL expired-session fixture and concurrent expiry/revoke tests still pending. Unit tests authored, **not executed**.

## AUTH-sessions-12 bounded last-seen write for stale sessions

The throttled `resolveSession` last-seen UPDATE now includes `revoked_at IS NULL` and `expires_at > now()`, so bookkeeping never modifies a session row already rendered unusable by revocation or expiry. `tests/unit/chat6-auth-session-service-behaviour.test.ts` includes the AUTH-sessions-12 SQL contract and existing behaviour verifies rejected rows never trigger last-seen writes. This is **not** full protection against concurrent revocation occurring after the initial authenticated SELECT; PostgreSQL transaction-level acceptance of that race remains open, and this change makes no such claim. Tests authored; CI pending.
