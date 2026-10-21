# Work packet (wave 2): edit src/components/admin/admin-revoke-sessions.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/super-admin-user-admin-controller.md

## G2-1-007-007  [P2] GAP  facet F02  effort M
- Legacy: `AdminUsers.js:273-302` sessions open in panel tied to selected admin.
- vNext now: `src/components/admin/admin-revoke-sessions.tsx:9-53` revoke control on admin detail, no session panel in that component.
- Fix: Surface device-session rows and last-used metadata adjacent to force-logout action.

## G2-1-007-010  [P2] GAP  facet F03  effort M
- Legacy: `AdminUsers.js:205-220` confirmation explicitly says suspension reversible, sessions ended, mentor projects guard.
- vNext now: `admin-revoke-sessions.tsx:44-49` distinct force logout confirm; scoped membership lifecycle action has state-specific confirm.
- Fix: Keep separate suspend versus revoke-session semantics and exact warning copy.

## G2-1-007-014  [P2] GAP  facet F04  effort M
- Legacy: `SuperAdminUserAdminController.java:266-272` GET sessions `{sessions:[UserSession]}`.
- vNext now: `src/app/api/admin/colleges/[collegeId]/sessions/route.ts:18-22` returns listCollegeAdminSessions result; client `admin-revoke-sessions.tsx:22-31` only uses `revoked`.
- Fix: Expose device list with legacy session columns, guarded privacy.

## G2-1-007-030  [P2] GAP  facet F09  effort M
- Legacy: `AdminUsers.js:205-220,273-300` confirm flows via AntD Modal.confirm, sessions overlay.
- vNext now: `admin-revoke-sessions.tsx:44-48` ConfirmDialog, onboard dialog `person-onboard-dialog.tsx:130-149`.
- Fix: Match legacy modal geometry, button order, destructive styling and disabled state.

## G2-1-007-042  [P2] GAP  facet F13  effort M
- Legacy: `AdminUsers.js:252-269` sessions panel loading/retry/errors.
- vNext now: `admin-revoke-sessions.tsx:9-53` only mutation; session listing is served by API route.
- Fix: Add row-level session loading/empty/retry view.

## G2-1-007-049  [P2] GAP  facet F18  effort M
- Legacy: `AdminUsers.js:184-190` 'Admin suspended. Their existing sessions were invalidated.'
- vNext now: `admin-revoke-sessions.tsx:30` `${count} session(s) revoked.`, membership action separate.
- Fix: Restore role-specific lifecycle confirmation and success copies.

## G2-1-007-052  [P2] GAP  facet F20  effort M
- Legacy: `SuperAdminUserAdminController.java:283-300` partial session revoke may succeed and returns ok:false, revoked count.
- vNext now: `api/admin/colleges/[collegeId]/sessions/route.ts:25-30` returns service count, `admin-revoke-sessions.tsx:27-31` checks numeric nonnegative.
- Fix: Show partial failure or zero revoked distinctly, refresh session list after mutations.
