# Work packet: edit src/app/api/admin/faculty-assignment/batch/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/l14-u027-faculty-course-association-controller.md

## G2-14-027-016  [P2] GAP  facet F07  effort M
- Legacy: Legacy unauthenticated create returns 401 with empty body `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:53-58`
- vNext now: New same-origin failure 403 INVALID_ORIGIN and centralized error mapping `src/app/api/admin/faculty-assignment/batch/route.ts:10-20`
- Fix: Preserve helpful authentication vs CSRF distinctions for migrated clients.

## G2-14-027-020  [P2] GAP  facet F08  effort M
- Legacy: Legacy single create response exactly 'Association created successfully.' `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:53-64`
- vNext now: New batch 201 JSON assignments, UI 'Created N teaching assignments for this class.' `src/app/api/admin/faculty-assignment/batch/route.ts:9-18`; `src/components/college/college-faculty-assignment-actions.tsx:91-99`
- Fix: Align old toast response for legacy callers or approve improved count copy.
