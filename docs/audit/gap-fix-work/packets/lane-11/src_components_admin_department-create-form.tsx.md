# Work packet: edit src/components/admin/department-create-form.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/department.md, docs/audit/gap2/lane-9/college-admin-departments.md, docs/audit/gap2/lane-9/superadmin-departments.md

## G2-6-020-024  [P2] GAP  facet F07  effort S
- Legacy: Legacy duplicate name Department name already exists (DepartmentServiceImpl.java:86-95).
- vNext now: vNext typed DEPARTMENT_NAME_CONFLICT, client text That department name is already active in this college. (departments/service.ts:184-210; department-create-form.tsx:37-41).
- Fix: Map duplicate server/field toast to legacy exact text, including whether conflict scope is shown.

## G2-9-006-026  [P2] GAP  facet F07  effort M
- Legacy: Create server errors map college_id and generic Failed to create department (`docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:111-131`)
- vNext now: One paragraph error with separate conflict message (`src/components/admin/department-create-form.tsx:43-50`)
- Fix: Show legacy alert title with server detail and close button.

## G2-9-024-029  [P2] GAP  facet F07  effort M
- Legacy: Create server errors mapped to Ant fields and closeable Department was not created Alert `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:113-119`
- vNext now: Single role-alert paragraph and conflict-specific copy `src/components/admin/department-create-form.tsx:30-47,91-99`
- Fix: Restore persistent alert heading/close affordance, map server fields

## G2-9-024-028  [P3] GAP  facet F07  effort S
- Legacy: Whitespace-only input triggers Department name cannot be empty toast `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:99-104`
- vNext now: Uses Please enter department name inline role alert `src/components/admin/department-create-form.tsx:23-25`
- Fix: Map whitespace-specific toast wording

## G2-9-024-032  [P3] GAP  facet F08  effort S
- Legacy: Created department “NAME”. Next, add programs or courses under it. `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:109-110`
- vNext now: Same message in inline role=status paragraph `src/components/admin/department-create-form.tsx:42-46`
- Fix: Match transient Ant toast position/duration
