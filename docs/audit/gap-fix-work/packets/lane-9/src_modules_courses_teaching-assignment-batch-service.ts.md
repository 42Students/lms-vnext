# Work packet: edit src/modules/courses/teaching-assignment-batch-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/l14-u027-faculty-course-association-controller.md

## G2-14-027-015  [P1] GAP  facet F06  effort M
- Legacy: Legacy course list can include multiple arbitrary courseIds across department `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyCourseAssociationServiceImpl.java:38-48`
- vNext now: New batch requires same class, cohort, academic period for all deliveries `src/modules/courses/teaching-assignment-batch-service.ts:31-42`
- Fix: Partition old bulk requests by class/term with explicit partial failure reporting.

## G2-14-027-025  [P1] GAP  facet F10  effort M
- Legacy: POST /createBulk flattens all faculty/course lists, saves all entities `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:75-87`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyCourseAssociationServiceImpl.java:77-95`
- vNext now: SA batch enforces one faculty/same class/term; all rows commit atomically with audits `src/modules/courses/teaching-assignment-batch-service.ts:18-47`; `src/modules/courses/teaching-assignment-batch-service.ts:126-140`
- Fix: Support explicit multi-faculty workflow or document intentional limitation.

## G2-14-027-028  [P1] GAP  facet F11  effort M
- Legacy: Legacy mutations allow superadmin, ADMIN or admin faculty type `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:40-50`
- vNext now: New create checks courses.manage scoped college; SA requires selected college `src/modules/courses/teaching-assignment-service.ts:155-161`; `src/modules/courses/teaching-assignment-batch-service.ts:23-35`
- Fix: Map admin faculty roles to explicit permissions rather than broad global mutation.
