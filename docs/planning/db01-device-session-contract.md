# DB01 per-device session parity — database contract and security exception

**Worker:** Chat 2 · **Task:** DB-004 · **Phase:** DATABASE · **Status:** PROPOSED / NOT PROMOTED OR DB-VERIFIED  
**Legacy source SHA:** `lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Current vNext source:** `src/auth/session.ts`, `src/app/api/auth/session/route.ts`, `src/db/schema/users.ts`, `src/modules/identity/context-service.ts`.

## Legacy persisted user jobs (source-confirmed)

Legacy `UserSession.java`, `UserSessionService.java`, `UserSessionServiceImpl.java` and `RefreshTokenBlocklist` establish these distinct operations:

1. Track device-level login by refresh-token JTI, user ID and user type, device label, user agent, IP, creation/last-used/expiry times.
2. Rotate the session JTI when a refresh token rotates.
3. List a user's active device sessions, newest first.
4. Revoke one specific session and add its JTI to refresh-token blocklist.
5. Delete the current device session on logout and sweep expired device records daily.
6. Keep user-wide suspension/token epoch separate from targeted device revocation.

The existing vNext session route uses a Firebase Identity Platform session cookie and clears browser cookies on DELETE. `src/auth/session.ts:revokeIdentitySessions(identityUid)` calls provider-wide `revokeRefreshTokens` rather than per-device revocation. `src/db/schema/index.ts` does not currently export a per-device session relation. This is a source-level gap in the **device-list / revoke-one** product job; it does not mean Firebase sessions are insecure by default.

## Legacy security defect — explicit intentional exception

Legacy `UserSessionServiceImpl.revokeSession` computes:

```java
boolean isAdmin = "FACULTY".equalsIgnoreCase(requestingUserType);
```

The subsequent owner check is bypassed for the FACULTY type, despite the comment stating that an admin can revoke any session. **That is a permission bypass**, not valid parity behavior. The vNext replacement must never authorize broad revocation solely from a role-string match. Use the persisted actor, centralized permissions, explicit scope and exact user ownership. This is a security fix under the clone-parity exception rule, not a product simplification.

## Staged vNext schema, not an approved implementation

Source drafts:

- `src/db/schema/db01-device-sessions.staged.ts` (not exported in `src/db/schema/index.ts`)
- `docs/planning/sql/db01-device-session-staging.sql` (not numbered / applied)

`identity_device_sessions` is proposed as **user-scoped** (not bound to the currently selected college membership) because a person may switch colleges/roles in one global identity. Fields:

| Field | Purpose |
| --- | --- |
| `id uuid`, `user_id uuid FK` | Stable internal session + canonical user ownership |
| `credential_digest varchar(64) UNIQUE` | Keyed HMAC-SHA256 digest of the provider session cookie, never the cookie itself |
| `device_name`, `user_agent`, `ip_address` | Minimal consented UX/audit metadata; IP storage/retention requires privacy review |
| `created_at`, `last_seen_at`, `expires_at` | List ordering, automatic expiry, time-based validity |
| `revoked_at`, `revoked_by_user_id`, `revocation_reason` | One-device revocation with actor and immutable audit intent |

Consider whether a separate append-only session history is required for security review. Do not silently replace persistent JTI blocklist behavior with cookie deletion alone.

### Option tradeoff — do not select by accident

- **Provider-only sessions, no vNext rows:** simplest and acceptable *only if* verified provider API supports user-visible device listing and single-session revocation to the same fidelity (currently not demonstrated).
- **Provider cookie + local keyed session digest (staged):** gives vNext fine-grained device list and revoke-one while keeping provider credential verification. Requires an additional fail-closed DB check on every authorized request, atomic session issuance, secret rotation policy and race tests. It must not create a second authentication authority that accepts a DB session without provider validation.

Choose deliberately with Chat 1/platform and the user if product semantics change. Never build a homegrown JWT authentication stack.

## Strict activation conditions

1. Chat 1 registers a generated Drizzle migration/snapshot and schema-barrel export. The staged SQL is a design reference, not a migration to apply manually.
2. The session-creation handler stores a session row durably **before** returning a working browser cookie, with verified user UID and expiry bounded by provider cookie expiry.
3. Request authentication verifies the provider cookie *and* the digest/active/expiry/owner session row when this feature is enabled; a missing or revoked digest fails closed. No silent bypass during temporary DB outage.
4. Revoke-one locks the target, checks persisted actor and exact owner or explicit scoped permission, records revocation and denies future use of that exact cookie without affecting other sessions.
5. Explicit policy for global revoke/all devices, session cookie renewal, sign-in from multiple browsers, expiry cleanup, IP/User-Agent retention, audit logging and HMAC secret rotation.
6. Negative tests: a faculty member may **not** revoke another user's session merely for being Faculty; wrong tenant or forged session identifier rejected; revocation races fail closed; stale cookie after global provider revoke rejected.
7. Execute clean PostgreSQL replay and real provider-integration / route tests. Unit mocks alone cannot close authorization or concurrency gates.

**Truthful evidence:** No migration was registered or executed from this document. No Firebase or PostgreSQL session lifecycle test has been run. DB-004 still `IN_PROGRESS`; current `user_session` source triage rows stay `IDENTITY_PROVIDER_OR_SESSION_DECISION` until the design is approved and implemented.
