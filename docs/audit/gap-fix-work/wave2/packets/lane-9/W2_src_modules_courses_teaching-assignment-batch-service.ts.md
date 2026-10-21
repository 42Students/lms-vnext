# Work packet (wave 2): edit src/modules/courses/teaching-assignment-batch-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/l14-u027-faculty-course-association-controller.md

## G2-14-027-043  [P2] GAP  facet F19  effort M
- Legacy: Legacy bulk saveAll no explicit max `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyCourseAssociationServiceImpl.java:77-95`
- vNext now: New batch max10 and per-delivery row locks `src/modules/courses/validation.ts:143-149`; `src/modules/courses/teaching-assignment-batch-service.ts:48-55`
- Fix: Document/paginate large imported bulk requests without timeout.

## G2-14-027-045  [P2] GAP  facet F20  effort M
- Legacy: Legacy bulk create may include duplicate faculty/course pairs `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyCourseAssociationServiceImpl.java:77-95`
- vNext now: New unique course ID check plus active conflict `src/modules/courses/validation.ts:143-149`; `src/modules/courses/teaching-assignment-batch-service.ts:119-129`
- Fix: Return duplicate-specific per-item error and policy on legacy repeated rows.
