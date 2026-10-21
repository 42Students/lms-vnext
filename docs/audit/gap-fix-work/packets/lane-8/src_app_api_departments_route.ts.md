# Work packet: edit src/app/api/departments/route.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l18-u027-department-controller.md

## G2-18-027-054  [P1] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:95-124`
- vNext now: `src/app/api/departments/route.ts:12-25`
- Fix: Global/organization-scoped fetchAll contracts are omitted from current scoped API, need compatibility only if consumers need global inventory.

## G2-18-027-018  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:99-100`
- vNext now: `src/app/api/departments/route.ts:12-21`
- Fix: Legacy fetchAll not-authenticated 401 Authentication required, vNext common context guard error.

## G2-18-027-019  [P3] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:81-83`
- vNext now: `src/app/api/departments/route.ts:46-56`
- Fix: Legacy POST create responds 200 OK wrapper; vNext 201 `{department}`.
