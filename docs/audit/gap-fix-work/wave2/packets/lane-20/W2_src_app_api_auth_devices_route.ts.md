# Work packet (wave 2): edit src/app/api/auth/devices/route.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/auth-controller.md, docs/audit/gap2/lane-1/user-session.md

## G2-1-002-006  [P2] GAP  facet F01  effort M
- Legacy: `AuthController.java:1090-1158` `revoke-sessions`, `sessions`, `sessions/{jti}` endpoints.
- vNext now: `src/app/api/auth/devices/route.ts:14-51`, `.../devices/[sessionId]/route.ts:18-35` own device GET/DELETE, other sessions DELETE; admin target revocation is separately routed.
- Fix: Provide route mapping in API migration notes and update old session-links/scripts; preserve owner/admin access distinctions.

## G2-1-002-016  [P2] GAP  facet F04  effort M
- Legacy: `AuthController.java:1121-1134`, `UserSession.java:18-46` `/sessions` returns all raw session fields `jti,userId,userType,deviceName,userAgent,ipAddress,createdAt,lastUsedAt,expiresAt`.
- vNext now: `src/app/api/auth/devices/route.ts:19-29` returns `{devices:[id,deviceName,userAgent,createdAt,lastSeenAt,expiresAt,current]}` intentionally omits user IDs/IP/JTI.
- Fix: Map legacy display columns to new device shape; handle loss of IP address explicitly and keep privacy rationale.

## G2-1-002-017  [P2] GAP  facet F04  effort S
- Legacy: `AuthController.java:1111-1115` self/admin revoke-all response includes `message`, numeric `userId`, `userType`.
- vNext now: `src/app/api/auth/devices/route.ts:41-47` other-devices action returns `{ok:true,revoked}` and excludes current session.
- Fix: Use machine-readable action result + human copy, define count and 'current excluded' semantics clearly.

## G2-1-002-025  [P2] GAP  facet F06  effort M
- Legacy: `AuthController.java:1090-1109` revoke-all takes numeric query `userId`, `userType` constrained to LEARNER/FACULTY for others.
- vNext now: `src/app/api/auth/devices/route.ts:35-47` DELETE uses current device session with no user query; admin target flows separate.
- Fix: Update caller payload and preserve explicit admin target/scope authorization.

## G2-1-002-064  [P2] GAP  facet F18  effort S
- Legacy: `AuthController.java:1024-1084` exactly `{message:'Logged out'}`; `:1090-1116` `{message:'All sessions revoked'}`; `:1139-1151` `{message:'Session revoked'}`.
- vNext now: `src/app/api/auth/session/route.ts:41-44`, `auth/devices/route.ts:47`, `auth/devices/[sessionId]/route.ts:31` return ok/code; `device-list.tsx:87-95,113-120` uses different text.
- Fix: Keep legacy user-facing wording in shell where requested and record intentional semantics (`everywhere else`).

## G2-1-022-004  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/UserSession.java:29-37 device label, agent and IP optional.
- vNext now: src/app/api/auth/devices/route.ts:20-28 lists label and agent but omits IP.
- Fix: Review whether privacy-safe IP display is required.
