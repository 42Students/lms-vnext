# DB01 cross-host authentication handoff contract

**Task:** DB-004 · **Worker:** Chat 2 · **State:** staged only, not runtime-active

The latest legacy backend actively creates `auth_handoff_token` rows during cross-host membership switching and consumes them through `POST /api/v1/auth/handoff/consume`. The record is single-use and short-lived, but legacy persists the raw access and refresh tokens. That storage shape must **not** be cloned into vNext.

vNext still needs the product job when a tenant switch crosses origins: a browser cannot rely on one host's HttpOnly session cookie appearing on another custom host. The staged `identity_auth_handoffs` table therefore stores only a one-way hash of a high-entropy handoff code plus canonical user, requested membership, target host, expiry and consumed timestamp.

API-phase requirements:

- Generate at least 256 bits of randomness; return the raw code only to the browser and store only its hash.
- Bind the handoff to a normalized, verified target host. Consumption from any other host fails closed.
- Atomically consume exactly once using a conditional update/lock; concurrent replay yields one winner.
- Re-read the canonical user, membership, college, organization and domain status during consume; do not trust stale fields from the handoff row.
- Never persist or return a Firebase refresh token, ID token, session cookie, or legacy JWT in this table.
- After successful consume, bootstrap Identity Platform on the target origin using a server-created short-lived mechanism (for example an Identity Platform custom-token exchange), then establish the normal target-host session cookie.
- Expired/consumed rows are unusable and eligible for bounded cleanup.
- A membership becoming inactive or a tenant host becoming unverified between issue and consume invalidates the handoff.

**Source proof:** legacy `AuthController.completeSwitch` creates a two-minute handoff row and `/handoff/consume` checks deletion/use/expiry then marks it used. Source oracle: `lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`, `AuthController.java@b802e800ae99fd7410e51138fed81f90e3c082ce`.

No migration, API, browser flow, PostgreSQL concurrency test, or runtime success is claimed here.
