# Work packet: edit src/app/api/college/departments/[departmentId]/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l18-u027-department-controller.md

## G2-18-027-017  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:207-221`
- vNext now: `src/app/api/college/departments/[departmentId]/route.ts:23-32`
- Fix: Legacy delete dependency conflict 409 with exception text, new DEPARTMENT_HAS_DEPENDENCIES code and standardized mapping.
