# Work packet (wave 2): edit src/app/api/admin/faculty-assignment/batch/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/l14-u027-faculty-course-association-controller.md

## G2-14-027-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy endpoint base /api/v1/faculty-course-associations with six operations `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:20-22`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:53-134`
- vNext now: New routes /api/college/teaching-assignments/bulk and /api/admin/faculty-assignment/batch `src/components/college/college-faculty-assignment-actions.tsx:81-90`; `src/app/api/admin/faculty-assignment/batch/route.ts:9-17`
- Fix: Document endpoint migration and each caller's course-vs-delivery ID mapping.
