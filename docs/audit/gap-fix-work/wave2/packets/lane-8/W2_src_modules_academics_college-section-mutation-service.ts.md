# Work packet (wave 2): edit src/modules/academics/college-section-mutation-service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/class-controller.md, docs/audit/gap2/lane-5/u003-college-admin-classes.md

## G2-2-031-044  [P2] GAP  facet F10  effort M
- Legacy: ClassController.java:74-107 create register with optional batch, audit CLASS_CREATE.
- vNext now: college-section-mutation-service.ts:156-177 transactions insert, activity with cohort, period/code/capacity.
- Fix: Map old program/batch to cohort/academic period, activity taxonomy for audit search.

## G2-2-031-045  [P2] GAP  facet F10  effort L
- Legacy: ClassController.java:180-222 PUT update validates batch/program relation and audits CLASS_UPDATE.
- vNext now: college-section-mutation-service.ts:180-236 PATCH allows only name/code/capacity/description and doesn't reparent.
- Fix: Explicitly retire no-dependency program/batch moves or provide controlled transfer workflow.

## G2-2-031-055  [P2] GAP  facet F12  effort M
- Legacy: ClassServiceImpl.java:35-48 allows reparent only if zero students/schedules/teacher assignments.
- vNext now: college-section-mutation-service.ts:180-222 does not support reparent even unused.
- Fix: Decide controlled transfer for unused section or communicate immutability.

## G2-5-003-042  [P2] GAP  facet F10 Actions/side effects  effort L
- Legacy: POST /api/v1/class/create with classPayload program_id/batch_id/limits; audit CLASS_CREATE. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:235-249; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassController.java:75-106)
- vNext now: POST /api/college/classes with cohortId/academicPeriodId/name/code/capacity/description, activity event. (src/components/academics/college-section-management.tsx:59-74; src/modules/academics/college-section-mutation-service.ts:156-178)
- Fix: Map old payload fields/IDs, preserve audit and requested capacity.

## G2-2-031-082  [P3] GAP  facet F21  effort M
- Legacy: ClassController.java:37-56 depends class service, access scope, batch/learner/schedule repositories.
- vNext now: college-section-mutation-service.ts:9-41 uses DB tables, acting-college, activity.
- Fix: Document migration of scope and class schedule/roster dependencies.
