# Session expiry — PUB-auth-public-35

Source-verified on `chatgpt/chat-11-b` (2026-10-17), not execution certified.

The current design uses a **five-day absolute session lifetime** (`SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 5`). Session creation persists `expires_at` once. Session lookups reject expired or revoked credentials. A throttled `last_seen_at` update is **observational only** and never extends `expires_at`. The 256-bit opaque device credential is keyed-digested server-side, and users can revoke one or all sessions.

The former 15-minute access / 30-day refresh flow is intentionally **not** reintroduced: a 30-day long-lived refresh token is unnecessary for this host-scoped vNext design. A user actively working beyond five days must sign in again. This is a security/UX tradeoff, not an undocumented sliding session. Confirm during the orchestrator's authentication acceptance run that the expiry notice and intended return-path recovery remain friendly.

No migration, cookie lifetime change, production modification or credentials access is made by this verification.
