# Work packet (wave 2): edit src/db/schema/departments.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l18-u027-department-controller.md, docs/audit/gap2/lane-6/base-model.md, docs/audit/gap2/lane-6/l18-u030-superadmin-departments.md

## G2-18-027-053  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:225-247`
- vNext now: `src/db/schema/departments.ts:25-29`
- Fix: New active-only case-insensitive unique index prevents duplicate department names, unlike old controller data shape.

## G2-6-021-008  [P2] GAP  facet F04  effort M
- Legacy: Legacy is_deleted nullable Boolean default false on entity (BaseModel.java:36-37).
- vNext now: vNext uses status ACTIVE/ARCHIVED in organizations and archivedAt nullable in departments (organizations.ts:9-10; departments.ts:19-22).
- Fix: Make per-table soft-delete compatibility mapping and exclude archived/deleted consistently.

## G2-6-021-022  [P2] GAP  facet F12  effort M
- Legacy: Legacy deleted flag defaults false, nullable DB semantics (BaseModel.java:36-37).
- vNext now: VNext status ACTIVE default or archivedAt null (organizations.ts:9-10; departments.ts:19-22).
- Fix: Define base active predicate per table, including legacy NULL-as-active historical rows.

## G2-6-021-038  [P2] GAP  facet F22  effort L
- Legacy: MappedSuperclass inherited int id, LocalDateTime created/updated, nullable boolean is_deleted (BaseModel.java:17-38).
- vNext now: VNext per-table uuid, timestamptz, archivedAt/status, varies by domain (organizations.ts:5-13; departments.ts:12-31; placements.ts:973-1020).
- Fix: Create central mapping inventory for all legacy entities and avoid assuming one uniform vNext deleted column.

## G2-18-030-063  [P2] GAP  facet F22  effort M
- Legacy: Legacy department entity has integer id, name, college FK and soft-deleted flag. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/DepartmentServiceImpl.java:69`
- vNext now: vNext departments UUID, college FK, name, archivedAt and timestamps. `src/db/schema/departments.ts:12`
- Fix: Document mapping and status semantics for imports/audit/history; no migration required in vNext.

## G2-18-030-064  [P2] GAP  facet F22  effort S
- Legacy: Legacy frontend max name 255; old DB may have same limit. `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:356`
- vNext now: vNext text with zod cap 255; DB no explicit length check. `src/db/schema/departments.ts:19`
- Fix: Add DB check <=255 to protect direct writes.
