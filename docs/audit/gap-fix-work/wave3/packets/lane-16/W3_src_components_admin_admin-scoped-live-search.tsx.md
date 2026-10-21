# Work packet (wave 3): edit src/components/admin/admin-scoped-live-search.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/superadmin-faculty-section.md

## G2-6-002-024  [P1] MISSING  facet F05  effort L
- Legacy: Old autocomplete 200ms search returns max15 suggestions and Recent/Popular groups `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:153-225` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:226-260`
- vNext now: New debounced URL search at 400ms no suggestions `src/components/admin/admin-scoped-live-search.tsx:9-25`
- Fix: Implement scoped combobox with result suggestions, recents/popularity and latest-request guard
