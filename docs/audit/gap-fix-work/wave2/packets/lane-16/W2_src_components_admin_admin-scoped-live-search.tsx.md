# Work packet (wave 2): edit src/components/admin/admin-scoped-live-search.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/superadmin-students.md, docs/audit/gap2/lane-6/superadmin-faculty-section.md

## G2-19-001-063  [P2] GAP  facet F13  effort M
- Legacy: Legacy search displays spinner or `No students found. Try a different search.` `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1492-1497`
- vNext now: vNext live URL search and helper `Results refresh automatically as you search.` `src/components/admin/admin-scoped-live-search.tsx:1-27`
- Fix: Show equivalent search-progress/no-suggestion panel and offline retry.

## G2-19-001-075  [P2] GAP  facet F18  effort S
- Legacy: Legacy search placeholder explicitly `Search students by name, email, roll number, or mobile (e.g., 'john', 'std', 'roll123')...` `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1483-1492`
- vNext now: vNext generic `Search directory` `src/components/admin/admin-scoped-live-search.tsx:1-27`
- Fix: Restore exact legacy student search placeholder.

## G2-6-002-064  [P2] MISSING  facet F13  effort M
- Legacy: Old autocomplete has spinner during search and empty `No faculty found. Try a different search.` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1322-1340`
- vNext now: New input no dropdown or typed-search loading indicator `src/components/admin/admin-scoped-live-search.tsx:19-25`
- Fix: Add combo search loading/empty states

## G2-6-002-075  [P2] MISSING  facet F17  effort M
- Legacy: Old combobox supports keyboard navigation and focus; option groups Recent/Popular/Search Results `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:166-224` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1322-1341`
- vNext now: New input is standard search field and URL navigation `src/components/admin/admin-scoped-live-search.tsx:19-25`
- Fix: Restore accessible combobox semantics, escape, arrow selection, active descendant
