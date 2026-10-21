# Work packet: edit src/auth/session.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/auth-controller.md, docs/audit/gap2/lane-1/refresh-token-blocklist.md

## G2-1-002-005  [P1] GAP  facet F01  effort M
- Legacy: `AuthController.java:643-653,798-804` `refresh-cookie` and `refresh` endpoints; `:658-681,1024-1084` logout endpoints.
- vNext now: `src/app/api/auth/session/route.ts:18-70` DELETE logout; no corresponding token refresh endpoint because first-party 5-day opaque sessions (`src/auth/session.ts:31-51`).
- Fix: Remove stale refresh-client calls; ensure transparent account-expiry/re-login path replaces refresh and client retry logic.

## G2-1-002-052  [P1] GAP  facet F12  effort L
- Legacy: `AuthController.java:905-930` refresh token version per account; recruiter effective college rechecked (`:992-1009`).
- vNext now: `src/auth/session.ts:31-45` verifies user platformStatus plus active `membership` in request context; device session not bound to single role (`src/app/api/auth/memberships/route.ts:130-143`).
- Fix: Verify every authenticated API enforces active selected membership/recruiter grant and never uses stale role claims from cookies.

## G2-1-002-030  [P2] GAP  facet F07  effort M
- Legacy: `AuthController.java:815-826,852-863,904-930,966-974` refresh has `Refresh token required`, `Invalid token type`, `Token revoked`, `Token invalidated`, `Refresh token expired`, `Invalid token`, `Internal error`.
- vNext now: `src/auth/session.ts:17-45` throws `SESSION_MISSING`, `SESSION_INVALID`, `SESSION_EXPIRED`, `SESSION_REVOKED` based on digest and DB.
- Fix: Map auth expiry/invalidation to user-facing re-login and cross-tab sign-out rather than retrying an obsolete refresh API.

## G2-1-020-019  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AuthController.java:815-825: 401 'Refresh token required' and 'Invalid token type'.
- vNext now: src/auth/session.ts:17-29: typed SESSION_MISSING/INVALID/EXPIRED/REVOKED.
- Fix: Map auth expiry recovery UX and legacy client error compatibility only where still used.
