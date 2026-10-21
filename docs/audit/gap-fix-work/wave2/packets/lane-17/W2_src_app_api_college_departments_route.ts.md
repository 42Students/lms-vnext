# Work packet (wave 2): edit src/app/api/college/departments/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/department-search-controller.md, docs/audit/gap2/lane-9/superadmin-departments.md

## G2-20-013-001  [P2] MISSING  facet F01  effort M
- Legacy: GET /api/v2/departments/search with query,limit,collegeId `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/departments/DepartmentSearchController.java:20-24,60-68`
- vNext now: No analogous v2 search route in src/app/api/college/departments; only POST create `src/app/api/college/departments/route.ts:1-17`
- Fix: Expose scoped read/search route only if old consumers remain; map new directory data contract

## G2-9-024-039  [P2] GAP  facet F10  effort M
- Legacy: POST /api/v1/department/create body name/college_id, returns HTTP200 `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:95-120` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:53-77`
- vNext now: POST /api/college/departments name only, HTTP201 `src/components/admin/department-create-form.tsx:28-47` `src/app/api/college/departments/route.ts:8-19`
- Fix: Confirm SA acting-college scope and map error bodies
