# DB01 per-device session persistence contract

**Task:** DB-004 · **Worker:** Chat 2 · **State:** staged only, not runtime-active

Legacy LMS persists `user_session` rows and exposes active-device/session listing, rotation, deletion, and revoke-specific-session behavior. The current vNext auth layer verifies Firebase session cookies and can call `revokeRefreshTokens(identityUid)`, which revokes the account broadly; that does **not** prove parity for targeted device revocation.

The staged table `identity_device_sessions` stores only token-safe metadata: canonical `user_id`, a one-way `session_key_hash`, device label, user agent, IP address, created/last-used/expiry timestamps, revocation timestamp/reason, and an optimistic `version`. Raw Firebase session cookies, ID tokens, refresh tokens, and legacy JTIs must never be stored.

The eventual API-phase design must pair a random application session handle with the Firebase session cookie and check the persisted session row on authenticated requests. Revoking one row must invalidate only that application session; account-wide compromise can still use Firebase refresh-token revocation plus revoking all active database rows.

Promotion requirements before runtime activation:

- Chat 1 registers/generates the Drizzle migration and clean PostgreSQL replay succeeds.
- Concurrent rotation/revoke cannot resurrect a revoked session.
- Expired and revoked rows fail closed during request authentication.
- A user can list only their own active sessions; privileged support access requires explicit permission and audit.
- IP/user-agent metadata has documented retention and privacy handling.
- No API accepts caller-supplied `user_id` to revoke another user's session.
- Logout of the current session and "sign out all devices" remain distinct operations.

**Evidence status:** source-backed schema staging only. No PostgreSQL/runtime acceptance is claimed here.
