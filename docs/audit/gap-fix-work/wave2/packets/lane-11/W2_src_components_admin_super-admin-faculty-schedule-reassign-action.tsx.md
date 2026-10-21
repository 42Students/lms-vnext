# Work packet (wave 2): edit src/components/admin/super-admin-faculty-schedule-reassign-action.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/superadmin-faculty-section.md

## G2-6-002-048  [P2] GAP  facet F09  effort M
- Legacy: Old reassign modal includes conflict explanation, searchable target, Close and Reassign `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1542-1600`
- vNext now: New reassign uses dialog then separate ConfirmDialog, select list of max500 `src/components/admin/super-admin-faculty-schedule-reassign-action.tsx:51-84`
- Fix: Match modal copy/field search and result item-level error report

## G2-6-002-078  [P3] GAP  facet F18  effort S
- Legacy: Old Reassign message says `Moves every not-yet-started session` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1563-1569`
- vNext now: New description `Move future scheduled sessions...` `src/components/admin/super-admin-faculty-schedule-reassign-action.tsx:61-64`
- Fix: Use old headline plus new conflict explanation
