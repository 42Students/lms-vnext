# Work packet: edit src/components/admin/admin-scoped-live-search.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/superadmin-students.md

## G2-19-001-023  [P1] GAP  facet F05  effort M
- Legacy: Legacy search autocomplete Recent/Popular/Search Results grouped suggestions, 200ms debounce, limit 15 `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:179-285`
- vNext now: vNext `AdminScopedLiveSearch` URL-driven search without recent/popular grouped suggestions `src/components/admin/admin-scoped-read-page.tsx:115-117`; `src/components/admin/admin-scoped-live-search.tsx:1-27`
- Fix: Restore selected-college Recent/Popular suggestion groups and selection behavior.
