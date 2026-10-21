# Work packet (wave 2): edit src/components/admin/department-actions.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-departments.md, docs/audit/gap2/lane-9/superadmin-departments.md

## G2-9-006-010  [P2] GAP  facet F03  effort M
- Legacy: Edit and Delete icon-only text small actions (`docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:314-344`)
- vNext now: Edit text button, dropdown More > Archive (`src/components/admin/department-actions.tsx:145-171`)
- Fix: Match action icons/order, preserve safe archive semantics.

## G2-9-006-033  [P2] GAP  facet F09  effort M
- Legacy: Delete Department Popconfirm, Yes Delete / Cancel (`docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:337-345`)
- vNext now: Archive department Dialog, Archive department / Cancel (`src/components/admin/department-actions.tsx:221-259`)
- Fix: Review legacy copy vs safe archive action; retain separate confirm.

## G2-9-006-034  [P2] GAP  facet F09  effort M
- Legacy: Delete disabled tooltip enumerates linked programs/courses/faculty (`docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:317-328`)
- vNext now: Dropdown archive item disabled with generic dependency title (`src/components/admin/department-actions.tsx:160-175`)
- Fix: Show actual dependency names and count on hover/focus.

## G2-9-006-043  [P2] GAP  facet F12  effort M
- Legacy: Active count chips may be zero enabling Delete (`docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:214-223`)
- vNext now: usage-null blocks archive even if server may permit (`src/components/admin/department-actions.tsx:29-32`)
- Fix: Offer refresh when counts fail instead of permanent disabled state.

## G2-9-006-061  [P2] GAP  facet F17  effort M
- Legacy: Edit department, Delete department named aria-labels (`docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:316-343`)
- vNext now: Edit text and generic More, no row name (`src/components/admin/department-actions.tsx:145-168`)
- Fix: Expose distinct accessible label per department row.

## G2-9-006-066  [P2] GAP  facet F18  effort M
- Legacy: Delete Department/Yes, Delete label (`docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:336-347`)
- vNext now: Archive department/Archive department (`src/components/admin/department-actions.tsx:222-256`)
- Fix: Document owner-approved archive terminology.

## G2-9-024-011  [P2] GAP  facet F03  effort M
- Legacy: Icon-only Edit and Delete inline actions `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:287-322`
- vNext now: Text Edit + More dropdown Archive `src/components/admin/department-actions.tsx:156-174`
- Fix: Restore inline edit/danger action semantics visually

## G2-9-024-036  [P2] GAP  facet F09  effort M
- Legacy: Delete Department Popconfirm, Yes Delete/Cancel `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:301-320`
- vNext now: Archive department Dialog, Archive department/Cancel `src/components/admin/department-actions.tsx:218-245`
- Fix: Use approved action semantics and contextual confirmation

## G2-9-024-050  [P2] GAP  facet F13  effort M
- Legacy: Separate delete failure retry and fetch failure retry `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:395-404`
- vNext now: Archive modal error only, server load outside component `src/components/admin/department-actions.tsx:111-135` `src/app/(authenticated)/admin/departments/page.tsx:32-47`
- Fix: Add list-level refresh error and Retry

## G2-9-024-055  [P2] GAP  facet F17  effort S
- Legacy: Icon buttons have aria-label Edit department/Delete department `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:288-318`
- vNext now: Text Edit/More and menu accessible trigger `src/components/admin/department-actions.tsx:156-174`
- Fix: Restore per-action accessible name and row context

## G2-9-024-040  [P3] GAP  facet F10  effort M
- Legacy: PUT /api/v1/department/update/{id} name + college_id `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:134-165` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:117-174`
- vNext now: PATCH /api/college/departments/{id} name,confirm:true `src/components/admin/department-actions.tsx:44-81`
- Fix: Preserve college move prohibition and mutation audit
