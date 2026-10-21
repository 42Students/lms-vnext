# Work packet: edit src/components/admin/college-admin-lifecycle-action.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u031-admin-users.md

## G2-5-031-037  [P1] GAP  facet F10  effort M
- Legacy: Legacy status API sets isDeleted suspension and invalidates active sessions. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:175-200`, `docs/legacy-source/frontend/src/api/Services/SuperAdminUsersService.js:1-12`
- vNext now: vNext PATCH /api/people/{membershipId}/lifecycle SUSPEND/REACTIVATE; session revocation delegated. `src/components/admin/college-admin-lifecycle-action.tsx:21-32`, `src/modules/colleges/admin-session-service.ts:93-115`
- Fix: Verify all sessions actually revoked and legacy access semantics mapped.

## G2-5-031-042  [P1] GAP  facet F11  effort M
- Legacy: Legacy suspend disabled if backend active project dependencies, warned in modal. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:205-219`
- vNext now: vNext if hasMentorRole disables suspension even without active project. `src/components/admin/college-admin-lifecycle-action.tsx:20-35`
- Fix: Check active project assignment, not just mentor role presence.

## G2-5-031-043  [P1] GAP  facet F12  effort M
- Legacy: Legacy suspend reversible, hard Delete only when already suspended, and project dependencies block. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:202-249`
- vNext now: vNext suspends membership but no permanent delete; reason min3 enforced. `src/components/admin/college-admin-lifecycle-action.tsx:20-35`, `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:39-42`
- Fix: Implement audited hard-delete policy or explicitly sunset with owner approval.

## G2-5-031-025  [P2] GAP  facet F07  effort M
- Legacy: Legacy action failure banner `Admin was not suspended/reactivated` with Retry. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:441-453`
- vNext now: vNext local Alert from generic Error and confirm closes only on success. `src/components/admin/college-admin-lifecycle-action.tsx:21-54`
- Fix: Preserve action-specific error title and explicit retry.

## G2-5-031-028  [P2] GAP  facet F08  effort M
- Legacy: Legacy suspend toast `Admin suspended. Their existing sessions were invalidated.`, reactivate `Admin reactivated.` `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:184-190`
- vNext now: vNext session/lifecycle action refreshes page without toast. `src/components/admin/college-admin-lifecycle-action.tsx:21-32`
- Fix: Use exact success messages after actual session invalidation.
