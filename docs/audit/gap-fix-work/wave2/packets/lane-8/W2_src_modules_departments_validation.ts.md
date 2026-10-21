# Work packet (wave 2): edit src/modules/departments/validation.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l18-u027-department-controller.md

## G2-18-027-007  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:63-83`
- vNext now: `src/modules/departments/validation.ts:6-15`
- Fix: Legacy create DepartmentDTO collegeId/name, vNext Zod department name and UUID college.

## G2-18-027-014  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:63-83`
- vNext now: `src/modules/departments/validation.ts:6-19`
- Fix: Legacy @Valid DepartmentDTO vs vNext trim name 1–255, UUID collegeId and strict payload.

## G2-18-027-041  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:63-83`
- vNext now: `src/modules/departments/validation.ts:6-15`
- Fix: Legacy @Valid errors for departmentName/collegeId vs Zod field validation and aria-focused inline errors.
