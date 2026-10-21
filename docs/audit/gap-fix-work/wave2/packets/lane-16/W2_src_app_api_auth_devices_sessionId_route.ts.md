# Work packet (wave 2): edit src/app/api/auth/devices/[sessionId]/route.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/auth-controller.md, docs/audit/gap2/lane-1/user-session.md

## G2-1-002-006  [P2] GAP  facet F01  effort M
- Legacy: `AuthController.java:1090-1158` `revoke-sessions`, `sessions`, `sessions/{jti}` endpoints.
- vNext now: `src/app/api/auth/devices/route.ts:14-51`, `.../devices/[sessionId]/route.ts:18-35` own device GET/DELETE, other sessions DELETE; admin target revocation is separately routed.
- Fix: Provide route mapping in API migration notes and update old session-links/scripts; preserve owner/admin access distinctions.

## G2-1-002-064  [P2] GAP  facet F18  effort S
- Legacy: `AuthController.java:1024-1084` exactly `{message:'Logged out'}`; `:1090-1116` `{message:'All sessions revoked'}`; `:1139-1151` `{message:'Session revoked'}`.
- vNext now: `src/app/api/auth/session/route.ts:41-44`, `auth/devices/route.ts:47`, `auth/devices/[sessionId]/route.ts:31` return ok/code; `device-list.tsx:87-95,113-120` uses different text.
- Fix: Keep legacy user-facing wording in shell where requested and record intentional semantics (`everywhere else`).

## G2-1-022-040  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/UserSessionServiceImpl.java:77,86 literal 'Session not found', 'Cannot revoke another user’s session'.
- vNext now: src/app/api/auth/devices/[sessionId]/route.ts:27-28 code SESSION_NOT_FOUND.
- Fix: Preserve safe error label in frontend copy catalogue.
