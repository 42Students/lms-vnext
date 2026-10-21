# Work packet (wave 2): edit src/auth/session.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/auth-controller.md, docs/audit/gap2/lane-1/refresh-token-blocklist.md

## G2-1-002-054  [P2] GAP  facet F13  effort M
- Legacy: `AuthController.java:643-649,815-826` missing refresh cookie/body gives 401 `Refresh token required`.
- vNext now: `src/auth/session.ts:17-45` missing/expired opaque cookie throws SESSION_MISSING/SESSION_EXPIRED; `src/app/api/auth/login/verify/route.ts:87-109` issues full session.
- Fix: Redirect to sign-in on missing/expired opaque session; remove silent infinite token-refresh loading.

## G2-1-020-040  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AuthController.java:858-863: exact error 'Token revoked'; C:968-971 'Refresh token expired'/'Invalid token'.
- vNext now: src/auth/session.ts:17-29: SESSION_REVOKED/EXPIRED/INVALID internal codes.
- Fix: Use actionable session-expired copy rather than raw internal codes; align translated labels if desired.
