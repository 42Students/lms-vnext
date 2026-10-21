# Work packet (wave 2): edit src/modules/people/super-admin-legacy-tabs-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/superadmin-teachers.md

## G2-6-003-041  [P2] GAP  facet F18  effort S
- Legacy: Old group has People heading and Faculty tab from nav taxonomy `docs/legacy-source/frontend/src/components/admin/SuperAdminGroupShell.jsx:18-28` `docs/legacy-source/frontend/src/common/superAdminNavGroups.js:87-92`
- vNext now: New group model shared group(2) and only tab strip `src/modules/people/super-admin-legacy-tabs-model.ts:22-24` `src/components/admin/super-admin-legacy-group-tabs.tsx:14-16`
- Fix: Restore visible People heading and active Faculty tab label
