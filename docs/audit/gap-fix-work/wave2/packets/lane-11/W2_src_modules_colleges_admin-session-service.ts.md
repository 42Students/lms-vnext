# Work packet (wave 2): edit src/modules/colleges/admin-session-service.ts

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u031-admin-users.md

## G2-5-031-013  [P2] GAP  facet F04  effort M
- Legacy: Legacy sessions columns Device / agent, IP, Last used. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:537-551`
- vNext now: vNext session service returns deviceName,userAgent,IP,lastSeenAt/createdAt/expiresAt; shown on separate page. `src/modules/colleges/admin-session-service.ts:72-88`
- Fix: Render same three columns and fallbacks in quick modal.

## G2-5-031-014  [P2] GAP  facet F04  effort M
- Legacy: Legacy history AuditLogs filtered entityType `faculty` + numeric ID. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:575-579`
- vNext now: vNext event history filtered by user/membership ID, module IDENTITY/PLATFORM only. `src/modules/colleges/admin-session-service.ts:118-141`
- Fix: Map historic faculty audit rows and equivalent event-type scope.

## G2-5-031-015  [P2] GAP  facet F05  effort M
- Legacy: Legacy role-scoped list with collegeId+role, ignores out-of-scope replies via request sequence. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:73-101`
- vNext now: vNext lists both roles together, max500 raw role records. `src/modules/colleges/admin-session-service.ts:35-69`
- Fix: Restore role filter and explicit paging rather than 500 truncation.

## G2-5-031-033  [P2] GAP  facet F09  effort M
- Legacy: Legacy Sign out everywhere confirmation names admin, clarifies account remains. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:273-292`
- vNext now: vNext revoke available through device detail, no same modal at admin list. `src/modules/colleges/admin-session-service.ts:93-115`
- Fix: Include inline revoke confirmation and preserve own-device distinction.

## G2-5-031-034  [P2] GAP  facet F09  effort M
- Legacy: Legacy Active sessions modal width760, skeleton, table no pagination. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:479-555`
- vNext now: vNext separate Sessions page with up to100 active devices. `src/modules/colleges/admin-session-service.ts:72-88`
- Fix: Quick-session overlay matching width/columns/copy.

## G2-5-031-035  [P2] GAP  facet F09  effort M
- Legacy: Legacy Suspend/reactivate history modal width900 with scoped audit log. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:557-581`
- vNext now: vNext separate history page paged100 and redacted scope. `src/modules/colleges/admin-session-service.ts:118-141`
- Fix: Match history trigger and panel width with deep-link retained.

## G2-5-031-039  [P2] GAP  facet F10  effort M
- Legacy: Legacy listUserSessions and revokeAllUserSessions type FACULTY numeric ID. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:252-292`, `docs/legacy-source/frontend/src/api/Services/SuperAdminUsersService.js:1-12`
- vNext now: vNext lists/revokes device sessions by target user UUID, cross-college sessions deliberately revoked. `src/modules/colleges/admin-session-service.ts:72-115`
- Fix: Map legacy entity type and user ID plus audit event.

## G2-5-031-045  [P2] GAP  facet F12  effort M
- Legacy: Legacy managed role enum ADMIN,TPO mapped from facultyType. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:17-21`
- vNext now: vNext roles COLLEGE_ADMIN,TPO membership roles. `src/modules/colleges/admin-session-service.ts:45-51`, `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:37-38`
- Fix: Map historic faculty ADMIN to College Admin membership for reporting.

## G2-5-031-047  [P2] GAP  facet F13  effort M
- Legacy: Legacy sessions skeleton5x4, empty `No active sessions.`, retry. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:525-535`
- vNext now: vNext returns devices[], page may show different empty content. `src/modules/colleges/admin-session-service.ts:72-88`
- Fix: Match empty/load/error for device list.

## G2-5-031-060  [P2] GAP  facet F19  effort M
- Legacy: Legacy session list one request, no limit from UI, no pagination. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:261-270`
- vNext now: vNext session query max100, could truncate active devices without warning. `src/modules/colleges/admin-session-service.ts:80-88`
- Fix: Indicate if >100 and allow bounded paging.

## G2-5-031-064  [P2] GAP  facet F21  effort M
- Legacy: Legacy AdminService+SuperAdminUsersService and AuditLogs, JPA faculty-admin IDs. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:3-11`
- vNext now: vNext canonical identity service, per-person lifecycle, device sessions, activity events. `src/modules/colleges/admin-session-service.ts:1-12`
- Fix: Trace email/SMS/role migration between faculty Admin and membership.

## G2-5-031-066  [P2] GAP  facet F22  effort M
- Legacy: Legacy sessions retrieved by FACULTY entity, includes device/IP/last used. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:261-292`
- vNext now: vNext identity_device_sessions by user UUID, expires_at/revoked_at and audit. `src/modules/colleges/admin-session-service.ts:72-115`
- Fix: Map existing sessions and revocation semantics.

## G2-5-031-067  [P2] GAP  facet F22  effort M
- Legacy: Legacy status history AuditLogs FACULTY_ADMIN_STATUS by numeric faculty ID. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:557-581`
- vNext now: vNext scoped activityEvents IDENTITY/PLATFORM by user/membership. `src/modules/colleges/admin-session-service.ts:118-141`
- Fix: Make historic status changes navigable across identity mapping.
