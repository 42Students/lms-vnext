# Work packet: edit src/app/api/departments/[departmentId]/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l18-u027-department-controller.md

## G2-18-027-016  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:169-177`
- vNext now: `src/app/api/departments/[departmentId]/route.ts:18-51`
- Fix: Legacy update catches any Exception into 400 user message, vNext centralized codes and apiErrorResponse.

## G2-18-027-020  [P3] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:208-212`
- vNext now: `src/app/api/departments/[departmentId]/route.ts:69-77`
- Fix: Legacy `Department deleted successfully`; vNext archived department payload, different toast copy.
