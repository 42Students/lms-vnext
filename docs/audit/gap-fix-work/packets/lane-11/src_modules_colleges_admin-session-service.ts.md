# Work packet: edit src/modules/colleges/admin-session-service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u031-admin-users.md

## G2-5-031-037  [P1] GAP  facet F10  effort M
- Legacy: Legacy status API sets isDeleted suspension and invalidates active sessions. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:175-200`, `docs/legacy-source/frontend/src/api/Services/SuperAdminUsersService.js:1-12`
- vNext now: vNext PATCH /api/people/{membershipId}/lifecycle SUSPEND/REACTIVATE; session revocation delegated. `src/components/admin/college-admin-lifecycle-action.tsx:21-32`, `src/modules/colleges/admin-session-service.ts:93-115`
- Fix: Verify all sessions actually revoked and legacy access semantics mapped.

## G2-5-031-059  [P1] GAP  facet F19  effort M
- Legacy: Legacy 25 rows per page in browser after GET role list, no server page in component. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:469-475`
- vNext now: vNext first500 role records, no next page. `src/modules/colleges/admin-session-service.ts:35-69`
- Fix: Implement DB pagination and per-role counts beyond 500.

## G2-5-031-065  [P1] GAP  facet F22  effort M
- Legacy: Legacy Admin user is Faculty record with facultyType ADMIN or TPO, isDeleted, phone,email,organizationId,collegeId. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:295-301`
- vNext now: vNext user+college_membership+membership_roles and platformStatus, UUIDs. `src/db/schema/memberships.ts:17-65`, `src/modules/colleges/admin-session-service.ts:44-68`
- Fix: Map numeric Faculty IDs to person/membership and migration status.

## G2-5-031-026  [P2] GAP  facet F07  effort M
- Legacy: Legacy sessions error `Could not load active sessions` with Retry. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:515-523`
- vNext now: vNext service errors throw, history page error boundary separate. `src/modules/colleges/admin-session-service.ts:72-88`
- Fix: Show exact modal error, retry without losing selected user.

## G2-5-031-030  [P2] GAP  facet F08  effort M
- Legacy: Legacy sign-out-all success `All sessions ended.` `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:283-291`
- vNext now: vNext revoke service returns number of revoked sessions, UI destination can show count. `src/modules/colleges/admin-session-service.ts:93-115`
- Fix: Show legacy toast and count; handle zero revoked gracefully.
