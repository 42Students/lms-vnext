# Work packet (wave 2): edit src/app/api/departments/route.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l18-u027-department-controller.md

## G2-18-027-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:25-30`
- vNext now: `src/app/api/departments/route.ts:12-25`
- Fix: Legacy /api/v1/department/create/fetch/fetchAll/fetchPaged vs vNext /api/departments GET/POST, plus /api/college/departments POST.

## G2-18-027-003  [P2] MISSING  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:225-247`
- vNext now: `src/app/api/departments/route.ts:12-25`
- Fix: Legacy dedicated GET fetchPaged with page/size/totalElements envelope has no same route or pagination params in vNext list.

## G2-18-027-005  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:86-93`
- vNext now: `src/app/api/departments/route.ts:12-21`
- Fix: Old fetch?collegeId returns Response envelope, vNext {departments:[...]}; same concept different protocol.

## G2-18-027-008  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:230-246`
- vNext now: `src/app/api/departments/route.ts:12-21`
- Fix: Old pagination request page,size and first/last flags absent new list API.

## G2-18-027-031  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:225-235`
- vNext now: `src/app/api/departments/route.ts:12-25`
- Fix: Legacy pageable size clamped1–100/default20, vNext no list page-size contract.

## G2-18-027-032  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:98-124`
- vNext now: `src/app/api/departments/route.ts:12-25`
- Fix: Legacy empty scoped lists return OK [] and no college resolves empty list, vNext absence of valid collegeId causes API error.

## G2-18-027-050  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:25-27`
- vNext now: `src/app/api/departments/route.ts:12-62`
- Fix: Legacy credentialed CORS 42lms.com wildcard, new authenticated same-origin PATCH/POST/DELETE.
