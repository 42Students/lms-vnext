# Work packet (wave 2): edit src/app/api/auth/session/route.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/auth-controller.md, docs/audit/gap2/lane-1/refresh-token-blocklist.md

## G2-1-002-020  [P2] GAP  facet F05  effort S
- Legacy: `AuthController.java:1139-1151` DELETE any of caller's own sessions including active current session.
- vNext now: `src/components/auth/device-list.tsx:80-99` deliberately hides Sign out action for `device.current`; current logout is elsewhere (`src/app/api/auth/session/route.ts:18-70`).
- Fix: Keep current-session signout accessible via account menu and document difference, avoid a dead-end for users.

## G2-1-002-064  [P2] GAP  facet F18  effort S
- Legacy: `AuthController.java:1024-1084` exactly `{message:'Logged out'}`; `:1090-1116` `{message:'All sessions revoked'}`; `:1139-1151` `{message:'Session revoked'}`.
- vNext now: `src/app/api/auth/session/route.ts:41-44`, `auth/devices/route.ts:47`, `auth/devices/[sessionId]/route.ts:31` return ok/code; `device-list.tsx:87-95,113-120` uses different text.
- Fix: Keep legacy user-facing wording in shell where requested and record intentional semantics (`everywhere else`).

## G2-1-020-002  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AuthController.java:1024-1083: POST /api/v1/auth/logout blocklists refresh and Authorization Bearer access JWTs.
- vNext now: src/app/api/auth/session/route.ts:25-69: DELETE /api/auth/session revokes first-party device session and clears cookies.
- Fix: Audit old clients calling POST /logout and support compatible logout transition if any remain.

## G2-1-020-005  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AuthController.java:1083: logout returns JSON message 'Logged out'.
- vNext now: src/app/api/auth/session/route.ts:39-44: logout returns ok JSON or LOGOUT_REVOKE_FAILED, no identical message.
- Fix: Map exact sign-out confirmation string where shown to users.

## G2-1-020-041  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AuthController.java:1083: 'Logged out'.
- vNext now: src/app/api/auth/session/route.ts:39-44: JSON ok true; different wording.
- Fix: Check actual frontend toast and match old text if visible.
