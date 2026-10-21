# Work packet: edit src/db/schema/departments.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l18-u027-department-controller.md, docs/audit/gap2/lane-9/superadmin-departments.md

## G2-18-027-010  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:65-83`
- vNext now: `src/db/schema/departments.ts:12-29`
- Fix: Legacy numeric department/college IDs and isDeleted via BaseModel, vNext UUID id/collegeId and archivedAt.

## G2-18-027-052  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:61-83`
- vNext now: `src/db/schema/departments.ts:12-29`
- Fix: Numeric department college and soft-delete state require UUID/archivedAt migration.

## G2-9-024-066  [P1] GAP  facet F22  effort L
- Legacy: Legacy department integer PK with mutable name and college_id `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:59-77`
- vNext now: UUID id, FK collegeId, archivedAt timestamp, created/updatedAt `src/db/schema/departments.ts:8-26`
- Fix: Document int-to-UUID mapping and archive lifecycle migration
