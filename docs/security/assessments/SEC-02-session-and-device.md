# SEC-02 session and device security: code assessment (2026-11-08)

Method: code read of `src/modules/auth/session-service.ts`, `src/auth/session.ts`, `src/auth/request-context.ts`, login verify route; sign-in exercised on dev. No tests run for this document. Nothing is VERIFIED; each row becomes a tracker entry after a CI run.

| Control | Finding | Proposed state | Missing proof |
|---|---|---|---|
| 001 opaque, server-revocable ids | Token is 32 random bytes (`crypto.randomBytes`, base64url); the session lives in `identity_device_sessions` with `revoked_at` | IMPLEMENTED_UNVERIFIED | Unit test on entropy and revocation |
| 002 digests only | Stored value is `HMAC-SHA256(AUTH_SECRET, token)` (`credential_digest`); the token itself is never stored | IMPLEMENTED_UNVERIFIED | DB read showing no raw tokens; AUTH_SECRET rotation plan (rotating it logs everyone out) |
| 003 cookie flags | `HttpOnly`, `Secure` when `NODE_ENV=production`, `SameSite=lax`, `path=/` (verify route) | IMPLEMENTED_UNVERIFIED | Browser check of every Set-Cookie on production host |
| 004 inactivity + absolute limits | Idle 8 h sliding (heartbeat at most once a minute), absolute 5 days | IMPLEMENTED_UNVERIFIED | Tests with a faked clock |
| 005 shorter privileged lifetimes | Super Admin: idle 30 min and absolute 8 h from OTP, decided from the persisted `system_roles`, not a cookie | IMPLEMENTED_UNVERIFIED | College Admin and TPO have the normal policy (decision: shorten?) |
| 006 rotate after login and privilege change | Every login creates a new server-generated session; the previous scope cookie is cleared on login. No rotation on workspace or role switch (the role cookie is not a credential) | PARTIAL | Rotation on step-up success and on privilege change |
| 007 suspension | `resolveSession` joins `users.platform_status = 'ACTIVE'` on every request with a row lock; a suspended user fails with SESSION_REVOKED | IMPLEMENTED_UNVERIFIED | Concurrency test (comment in code says it was designed for it) |
| 008 role or membership removal | Context (membership, roles) is re-read from the database on every request; a removed role is gone on the next request. Sessions themselves are not killed | IMPLEMENTED_UNVERIFIED | Test: revoke role, next request denied; decision whether to also revoke sessions |
| 009 logout everywhere | `revokeAllOwnSessions`, `revokeOtherSessions`, `revokeOwnSession`; routes `/api/auth/devices*` and `DELETE /api/auth/session` | IMPLEMENTED_UNVERIFIED | Route tests |
| 010 device visibility | `/account/security` and `/api/auth/devices` list device name, last seen, revocation history | IMPLEMENTED_UNVERIFIED | UX check |
| 011 suspicious sessions | None: no new-device alert, no concurrent-session or impossible-travel signal | GAP | Design: email/SMS on new device, flag on new country |
| 012 fixation and replay | Fixation is impossible (token only ever issued server-side after OTP). Replay of a stolen cookie works until revoked or expired; the session is not bound to device, IP or TLS | PARTIAL | Decide on soft binding (user agent family) with step-up on change |
| 013 step-up | `route({ stepUp })` requires a login within 15 minutes for role/permission changes, user disable/delete, exports, imports, secrets and tenant settings (owner decision 2026-11-06). Recovery UX and phishing-resistant factor not built | PARTIAL | See SEC-01 plan (passkeys) |
| 014 cached data after logout | API responses are `private, no-store`; pages are dynamic. The browser back button and the notification stream after logout were not tested | PARTIAL | Browser test: logout then back, and logout with an open EventSource |
| 015 privileged vs college sessions | Super Admin has a distinct platform workspace and an explicit, expiring, audited organization/college scope (4 h, 2026-11-08); same session cookie | PARTIAL | Decide on a separate cookie and host for platform administration |
| 016 fresh authorization on switches | `getCurrentRequestContext()` resolves persisted membership and roles each request; a role cookie that is not granted ends the session as SESSION_INVALID; the tenant host is rechecked | IMPLEMENTED_UNVERIFIED | Negative tests (forged role cookie, foreign membership id) |

Owner decisions flagged: shorter lifetimes for College Admin and TPO (005); new-device alerts (011); binding sessions to a device (012).
