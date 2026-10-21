# Work packet (wave 2): edit src/components/admin/department-create-form.tsx

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-departments.md, docs/audit/gap2/lane-9/superadmin-departments.md

## G2-9-006-005  [P2] GAP  facet F02  effort M
- Legacy: Create New Department Card size small, Existing Departments separate Card (`docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:348-370`)
- vNext now: Unboxed create form, directory section below (`src/components/admin/department-create-form.tsx:52-85`)
- Fix: Use legacy bordered small card wrappers.

## G2-9-006-007  [P2] GAP  facet F03  effort M
- Legacy: Create button with PlusOutlined icon (`docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:350-360`)
- vNext now: Create Department text, no icon (`src/components/admin/department-create-form.tsx:67-78`)
- Fix: Restore plus icon/compact sizing.

## G2-9-006-020  [P2] GAP  facet F06  effort M
- Legacy: Create form vertical, submit at bottom (`docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:348-362`)
- vNext now: Horizontal form at sm breakpoint (`src/components/admin/department-create-form.tsx:53-78`)
- Fix: Match vertical stack within left card.

## G2-9-006-022  [P2] GAP  facet F06  effort M
- Legacy: Create allowed with empty name but inline validator on submit (`docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:357-359`)
- vNext now: Create button disabled unless name.trim() nonempty (`src/components/admin/department-create-form.tsx:72-76`)
- Fix: Restore enabled click leading exact field validation or confirm owner preference.

## G2-9-006-060  [P2] GAP  facet F16  effort M
- Legacy: Input in vertical card, standard Ant compact sizes (`docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:353-361`)
- vNext now: At sm, input/button same horizontal row (`src/components/admin/department-create-form.tsx:53-78`)
- Fix: Align form responsiveness to legacy card.

## G2-9-024-005  [P2] GAP  facet F02  effort M
- Legacy: Create New Department Card visible left `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:330-336`
- vNext now: Unframed max-w920 two-column horizontal form `src/components/admin/department-create-form.tsx:49-53`
- Fix: Place vertical form in framed Create New Department card

## G2-9-024-008  [P2] GAP  facet F03  effort S
- Legacy: Create Department primary icon PlusOutlined `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:364-368`
- vNext now: Create button without icon `src/components/admin/department-create-form.tsx:85-89`
- Fix: Add plus icon

## G2-9-024-024  [P2] GAP  facet F06  effort M
- Legacy: Create form vertical Ant field and button beneath `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:353-369`
- vNext now: Horizontal label/input + button alongside on >=sm `src/components/admin/department-create-form.tsx:49-90`
- Fix: Place submit below input in vertical card

## G2-9-024-039  [P2] GAP  facet F10  effort M
- Legacy: POST /api/v1/department/create body name/college_id, returns HTTP200 `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:95-120` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:53-77`
- vNext now: POST /api/college/departments name only, HTTP201 `src/components/admin/department-create-form.tsx:28-47` `src/app/api/college/departments/route.ts:8-19`
- Fix: Confirm SA acting-college scope and map error bodies

## G2-9-024-054  [P2] GAP  facet F16  effort M
- Legacy: Desktop lg10/lg14 cards with 24px gutter, xs stacked `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:331-333,373-375`
- vNext now: Single-column cards omitted; horizontal sm form and responsive list `src/components/admin/department-create-form.tsx:49-90` `src/components/admin/department-directory.tsx:69-119`
- Fix: Recreate desktop 10/14, maintain mobile tap targets
