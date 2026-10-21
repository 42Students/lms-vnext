# Work packet (wave 2): edit src/components/admin/super-admin-student-bulk-access.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/super-admin-students.md, docs/audit/gap2/lane-19/superadmin-students.md

## G2-14-002-016  [P2] GAP  facet F03  effort S
- Legacy: Legacy bulk selection banner shows count and 3 module toggles, vNext bulk controls in disclosure section — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1524-1569`
- vNext now: `src/app/(authenticated)/admin/students/page.tsx:86-89`; `src/components/admin/super-admin-student-bulk-access.tsx:41-70`
- Fix: Display count/action bar adjacent to selected rows

## G2-19-001-009  [P2] GAP  facet F03  effort S
- Legacy: Legacy presents the selected-student count inline before bulk actions `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1527-1534`
- vNext now: vNext separately displays `<selected>/25 students selected` even when no selection `src/components/admin/super-admin-student-bulk-access.tsx:41-44`
- Fix: Use selection-aware conditional banner/count and legacy treatment.

## G2-19-001-074  [P2] GAP  facet F17  effort M
- Legacy: Legacy selected rows AntD checkbox with preserveSelectedRowKeys `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1578-1582`
- vNext now: vNext selection region `tabIndex=0`, checkboxes and 25-selection ceiling `src/components/admin/super-admin-student-bulk-access.tsx:43-55`
- Fix: Compare keyboard-select-all/shift select, focus return and selection persistence across pages.
