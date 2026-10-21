# Work packet (wave 2): edit src/app/api/departments/[departmentId]/route.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l18-u027-department-controller.md

## G2-18-027-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:127-184`
- vNext now: `src/app/api/departments/[departmentId]/route.ts:18-79`
- Fix: Legacy PUT /update/{numericId}, DELETE /delete/{numericId}; vNext PATCH/DELETE /api/departments/{UUID}.

## G2-18-027-009  [P3] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:169-177`
- vNext now: `src/app/api/departments/[departmentId]/route.ts:43-51`
- Fix: Old update exact success `Department updated successfully`, vNext returns `{department}` with no message.

## G2-18-027-043  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:169-177`
- vNext now: `src/app/api/departments/[departmentId]/route.ts:43-51`
- Fix: Exact legacy Department updated successfully and failure Please try again or contact support missing from API envelope.
