# Work packet (wave 2): edit src/app/api/admin/colleges/[collegeId]/sessions/route.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/super-admin-user-admin-controller.md

## G2-1-007-004  [P2] GAP  facet F01  effort M
- Legacy: `SuperAdminUserAdminController.java:266-301` GET target sessions, POST target revoke-all.
- vNext now: `src/app/api/admin/colleges/[collegeId]/sessions/route.ts:9-32` GET/POST keyed by user UUID, confirm true.
- Fix: Map numeric user type/id and old route to scoped UUID session operations.

## G2-1-007-014  [P2] GAP  facet F04  effort M
- Legacy: `SuperAdminUserAdminController.java:266-272` GET sessions `{sessions:[UserSession]}`.
- vNext now: `src/app/api/admin/colleges/[collegeId]/sessions/route.ts:18-22` returns listCollegeAdminSessions result; client `admin-revoke-sessions.tsx:22-31` only uses `revoked`.
- Fix: Expose device list with legacy session columns, guarded privacy.

## G2-1-007-022  [P2] GAP  facet F06  effort S
- Legacy: `SuperAdminUserAdminController.java:275-301` revoke-all no request body.
- vNext now: `api/admin/colleges/[collegeId]/sessions/route.ts:25-30` requires `{userId:uuid,confirm:true}`.
- Fix: Update old client and UI confirmation payload.

## G2-1-007-052  [P2] GAP  facet F20  effort M
- Legacy: `SuperAdminUserAdminController.java:283-300` partial session revoke may succeed and returns ok:false, revoked count.
- vNext now: `api/admin/colleges/[collegeId]/sessions/route.ts:25-30` returns service count, `admin-revoke-sessions.tsx:27-31` checks numeric nonnegative.
- Fix: Show partial failure or zero revoked distinctly, refresh session list after mutations.
