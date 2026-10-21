# Work packet (wave 2): edit src/modules/departments/service.ts

21 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l18-u027-department-controller.md, docs/audit/gap2/lane-6/base-model.md, docs/audit/gap2/lane-8/l14-u031-academic-structure-cross-cutting.md, docs/audit/gap2/lane-9/superadmin-departments.md

## G2-18-027-004  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:95-124`
- vNext now: `src/modules/departments/service.ts:221-249`
- Fix: Legacy global Super Admin fetchAll can list all colleges/organization; vNext listDepartments requires one UUID collegeId.

## G2-18-027-011  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:86-124`
- vNext now: `src/modules/departments/service.ts:221-249`
- Fix: Old Department object fields/college includes legacy numeric identifiers, vNext projection id,collegeId,name,createdAt,updatedAt.

## G2-18-027-012  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:225-247`
- vNext now: `src/modules/departments/service.ts:221-249`
- Fix: Legacy PageRequest 0-based default20 capped100 and total count; vNext unpaged scoped list only.

## G2-18-027-013  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:95-124`
- vNext now: `src/modules/departments/service.ts:221-249`
- Fix: Legacy fetchAll organization/global SA scope and learner fallback, new list rejects absence of explicit college context.

## G2-18-027-027  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:95-124`
- vNext now: `src/modules/departments/service.ts:221-249`
- Fix: Legacy global SA has all-colleges fetchAll, vNext department.read permission scoped to required college UUID.

## G2-18-027-028  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:113-122`
- vNext now: `src/modules/departments/service.ts:221-249`
- Fix: Legacy learner missing principal college falls back resolveFullScope, vNext no unscoped fetchAll fallback.

## G2-18-027-036  [P2] MISSING  facet F14  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:225-247`
- vNext now: `src/modules/departments/service.ts:221-249`
- Fix: Legacy page-oriented JSON list is not an export, but dependent UI/report may need bounded API compatibility.

## G2-18-027-040  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:230-246`
- vNext now: `src/modules/departments/service.ts:221-249`
- Fix: Paged legacy Department directory vs new unpaged frontend can overflow mobile on high department counts.

## G2-18-027-045  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:225-247`
- vNext now: `src/modules/departments/service.ts:221-249`
- Fix: Legacy bounded DB pagination for large college directory, vNext returns all active departments in a single query.

## G2-18-027-046  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:95-124`
- vNext now: `src/modules/departments/service.ts:221-249`
- Fix: Legacy global Super Admin can list all departments, new college-scoped list reduces data size but removes global browse.

## G2-18-027-055  [P2] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:225-247`
- vNext now: `src/modules/departments/service.ts:221-249`
- Fix: Dedicated fetchPaged and stable legacy PageResponseDTO absent; add only if required by admin/export consumers.

## G2-6-021-007  [P2] GAP  facet F04  effort M
- Legacy: Legacy updated_at LocalDateTime @UpdateTimestamp maintained by ORM (BaseModel.java:32-34).
- vNext now: vNext updatedAt defaults now and services manually set on mutations (departments.ts:22; departments/service.ts:311-317).
- Fix: Audit all update paths for explicit updatedAt or DB trigger; avoid stale ages.

## G2-6-021-013  [P2] GAP  facet F06  effort M
- Legacy: Legacy soft-delete Boolean inherited and set in service (BaseModel.java:36-37; OrganizationServiceImpl.java:85-87).
- vNext now: vNext archive action maps to status or archivedAt (organizations/service.ts:258-260; departments/service.ts:365-375).
- Fix: Document which form/action means soft delete and restore in each module.

## G2-14-031-008  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:181-213 Delete department button
- vNext now: src/modules/departments/service.ts:345-386 archive action
- Fix: Show archive consequence and legacy delete action label if approved

## G2-14-031-016  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/DepartmentDTO.java:11-24 required name max255 optional chair/vice-chair
- vNext now: src/modules/departments/service.ts:253-340 only core create/rename in this service
- Fix: Add optional academic department role selectors with scope validation

## G2-14-031-027  [P2] GAP  facet F09  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:181-213 department deletion possible, error path
- vNext now: src/modules/departments/service.ts:345-386 archived instead
- Fix: Clarify archive/delete semantics and confirmation copy

## G2-14-031-028  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:60-84,128-213 POST/PUT/DELETE department audits
- vNext now: src/modules/departments/service.ts:253-386 create/rename/archive
- Fix: Map old audit event action to new archived state

## G2-14-031-032  [P2] GAP  facet F11  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:65-80 scoped Super Admin within org/college and College Admin
- vNext now: src/modules/departments/service.ts:221-268 requires active college
- Fix: Support safe global/org/college Super Admin list and selected-college write

## G2-14-031-053  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:7-8 Department JPA integer PK and college FK
- vNext now: src/db/schema/academics.ts:29-78 UUID programs; src/modules/departments/service.ts:221-386 scoped department UUID
- Fix: Record per-column department ID/chair mapping

## G2-9-024-064  [P2] GAP  facet F21  effort M
- Legacy: Programs/courses/faculty integrations for dependency counts `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:216-223`
- vNext now: SQL counts on active programs, active courses, not-ended faculty memberships `src/modules/departments/service.ts:33-91`
- Fix: Verify old count semantics on inactive/archived records

## G2-9-024-038  [P3] GAP  facet F10  effort S
- Legacy: GET /api/v1/department/fetch?collegeId and retain scoped list `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:60-80`
- vNext now: Server listDepartments + usage separate queries `src/app/(authenticated)/admin/departments/page.tsx:32-47` `src/modules/departments/service.ts:183-205`
- Fix: Document route and response shape
