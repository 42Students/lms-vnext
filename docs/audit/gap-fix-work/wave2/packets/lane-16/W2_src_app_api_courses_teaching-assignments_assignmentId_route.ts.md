# Work packet (wave 2): edit src/app/api/courses/teaching-assignments/[assignmentId]/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/l14-u027-faculty-course-association-controller.md

## G2-14-027-026  [P2] GAP  facet F10  effort M
- Legacy: PATCH deactivateAssociation mappingId sets active=0 `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:90-100`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyCourseAssociationServiceImpl.java:104-111`
- vNext now: New DELETE end assignment marks endedAt and records lifecyle `src/app/api/courses/teaching-assignments/[assignmentId]/route.ts:17-38`; `src/db/schema/courses.ts:243-251`
- Fix: Carry historical mapping ID and active→ended conversion.

## G2-14-027-034  [P2] GAP  facet F13  effort M
- Legacy: Legacy missing mapping on deactivate 404 `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:95-97`
- vNext now: New returns API error for unknown UUID `src/app/api/courses/teaching-assignments/[assignmentId]/route.ts:29-40`
- Fix: Use legacy-equivalent not-found and clear stale UI state.
