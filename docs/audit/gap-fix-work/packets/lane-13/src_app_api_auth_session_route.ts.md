# Work packet: edit src/app/api/auth/session/route.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/auth-controller.md, docs/audit/gap2/lane-1/refresh-token-blocklist.md

## G2-1-002-005  [P1] GAP  facet F01  effort M
- Legacy: `AuthController.java:643-653,798-804` `refresh-cookie` and `refresh` endpoints; `:658-681,1024-1084` logout endpoints.
- vNext now: `src/app/api/auth/session/route.ts:18-70` DELETE logout; no corresponding token refresh endpoint because first-party 5-day opaque sessions (`src/auth/session.ts:31-51`).
- Fix: Remove stale refresh-client calls; ensure transparent account-expiry/re-login path replaces refresh and client retry logic.

## G2-1-020-021  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AuthController.java:966-974: refresh expired 401, invalid 401 and unexpected 500.
- vNext now: src/app/api/auth/session/route.ts:39-44: revoke failure returns 503, success 200; errors differ on opaque sessions.
- Fix: Confirm caller messaging and graceful retry; don't expose sensitive error details.

## G2-1-020-022  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AuthController.java:1083: POST logout success message 'Logged out'.
- vNext now: src/app/api/auth/session/route.ts:39-44: response ok true, no exact 'Logged out' text.
- Fix: Render same successful logout toast if old frontend did so; check copy catalogue.
