# Work packet (wave 2): edit src/modules/departments/college-department-mutation-service.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l18-u027-department-controller.md, docs/audit/gap2/lane-9/college-admin-departments.md

## G2-18-027-024  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:127-179`
- vNext now: `src/modules/departments/college-department-mutation-service.ts:88-114`
- Fix: Legacy update generic department fields, vNext only rename name, no college move.

## G2-18-027-025  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:181-223`
- vNext now: `src/modules/departments/college-department-mutation-service.ts:117-152`
- Fix: Legacy deleteDepartment may soft delete after service checks, vNext archive sets archivedAt and audits.

## G2-18-027-030  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:213-216`
- vNext now: `src/modules/departments/college-department-mutation-service.ts:123-139`
- Fix: Legacy delete conflicts on service dependency rules, new archives blocked by all historical programs/courses/faculty profile FKs.

## G2-18-027-034  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:215-221`
- vNext now: `src/modules/departments/college-department-mutation-service.ts:117-152`
- Fix: Legacy delete catches constraint conflict vs general bad request, vNext returns differentiated dependency error code.

## G2-18-027-049  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:181-223`
- vNext now: `src/modules/departments/college-department-mutation-service.ts:123-152`
- Fix: Legacy service delete and vNext archive need concurrent child-create race protection, verify FK/locks.

## G2-18-027-051  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:43-58`
- vNext now: `src/modules/departments/college-department-mutation-service.ts:76-83`
- Fix: Legacy optional AdminAuditLogService and Spring Tx, vNext required PG activity event write in transaction.

## G2-9-006-056  [P2] GAP  facet F15  effort M
- Legacy: Audits department update and delete (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:185-220`)
- vNext now: Writes UPDATE/ARCHIVE structured activity events (`src/modules/departments/college-department-mutation-service.ts:98-148`)
- Fix: Map legacy DEPARTMENT_DELETE to ARCHIVED semantics.

## G2-9-006-074  [P2] GAP  facet F22  effort M
- Legacy: Department extends BaseModel, integer ID, chair/vice nullable, collegeId (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Department.java:8-24`)
- vNext now: UUID scoped departments FK, archivedAt and name (`src/modules/departments/college-department-mutation-service.ts:47-75`)
- Fix: Document legacy integer ID mapping, obsolete chair fields and archive status.
