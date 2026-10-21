# Work packet (wave 2): edit src/app/api/college/departments/[departmentId]/route.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l18-u027-department-controller.md, docs/audit/gap2/lane-9/college-admin-departments.md

## G2-18-027-006  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:127-179`
- vNext now: `src/app/api/college/departments/[departmentId]/route.ts:12-32`
- Fix: Old update/delete direct controller and generic DepartmentDTO, new college mutation service restricted to rename/archive.

## G2-18-027-022  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:181-223`
- vNext now: `src/app/api/college/departments/[departmentId]/route.ts:23-32`
- Fix: Delete renamed Archive in vNext; consuming UI must confirm reversible vs irreversible wording precisely.

## G2-18-027-033  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:173-177`
- vNext now: `src/app/api/college/departments/[departmentId]/route.ts:12-21`
- Fix: Legacy catch-all 400 message on update, new coded error response plus consuming UI recovery.

## G2-9-006-036  [P2] GAP  facet F10  effort M
- Legacy: PUT update/{id}, DELETE delete/{id} (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:139-250`)
- vNext now: PATCH rename/{id} and DELETE archive/{id} (`src/app/api/college/departments/[departmentId]/route.ts:11-34`)
- Fix: Document changed route/verb and archive behavior for integration clients.

## G2-18-027-044  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:208-221`
- vNext now: `src/app/api/college/departments/[departmentId]/route.ts:23-32`
- Fix: Exact legacy Department deleted successfully text becomes archive semantics.
