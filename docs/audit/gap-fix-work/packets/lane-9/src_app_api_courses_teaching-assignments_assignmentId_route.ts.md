# Work packet: edit src/app/api/courses/teaching-assignments/[assignmentId]/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/l14-u027-faculty-course-association-controller.md

## G2-14-027-018  [P2] GAP  facet F07  effort M
- Legacy: Legacy deactivate missing mapping responds 404 empty `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:90-99`
- vNext now: New end endpoint uses assignment UUID and API error mapping `src/app/api/courses/teaching-assignments/[assignmentId]/route.ts:17-40`
- Fix: Preserve not-found semantics with mapped identifier.

## G2-14-027-022  [P2] GAP  facet F08  effort M
- Legacy: Legacy deactivate exact 'Association deactivated successfully.' `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:90-100`
- vNext now: New delete returns assignment JSON `src/app/api/courses/teaching-assignments/[assignmentId]/route.ts:17-38`
- Fix: Map successful end message to user and affected row state.
