# Work packet (wave 2): edit src/components/admin/college-admin-lifecycle-action.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u031-admin-users.md

## G2-5-031-008  [P2] GAP  facet F03  effort M
- Legacy: Legacy per-row Enabled Switch, red Suspended tag. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:303-314`
- vNext now: vNext status badge and Access disclosure with action buttons. `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:38-39`, `src/components/admin/college-admin-lifecycle-action.tsx:20-61`
- Fix: Restore visible enabled switch with confirmation, preserve added suspension reason.

## G2-5-031-031  [P2] GAP  facet F09  effort M
- Legacy: Legacy suspend Modal.confirm names selected admin, describes lost access and invalidated sessions. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:211-219`
- vNext now: vNext ConfirmDialog generic `Suspend administrator access?` plus mandatory reason. `src/components/admin/college-admin-lifecycle-action.tsx:55-62`
- Fix: Include name and equivalent consequences in dialog.
