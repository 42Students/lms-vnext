# Work packet: NEW / MISSING items from docs/audit/gap2/lane-7/l12-u027-faculty-teaching-assignment-controller.md (part 2 of 2)

4 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/l12-u027-faculty-teaching-assignment-controller.md

## G2-12-027-024  [P2] GAP  facet F07  effort S
- Legacy: LBE/controller/FacultyTeachingAssignmentController.java:76-80,141-144,164-166: 404 body status `NOT_FOUND` or `ERROR`, message `Assignment not found with id: <id>`.
- vNext now: V/modules/courses/teaching-assignment-service.ts:294-313: typed `TEACHING_ASSIGNMENT_NOT_FOUND` service error.
- Fix: Map not-found code and client-facing message to legacy exact text and HTTP status.

## G2-12-027-027  [P2] GAP  facet F08  effort S
- Legacy: LBE/controller/FacultyTeachingAssignmentController.java:134-170: update `Assignment updated successfully`; delete `Assignment deleted successfully`.
- vNext now: V/components/admin/super-admin-faculty-assignment-create.tsx:130-180: role editor refreshes without explicit success message; deletion is endedAt.
- Fix: Add exact update/end confirmation and distinguish hard delete from end.

## G2-12-027-025  [P3] GAP  facet F08  effort S
- Legacy: LBE/controller/FacultyTeachingAssignmentController.java:98-109: POST 201 `Assignment created successfully`.
- vNext now: V/components/admin/super-admin-faculty-assignment-create.tsx:50-51: `Teaching assignment created.`
- Fix: Restore exact single-assignment success string where copy parity applies.

## G2-12-027-026  [P3] GAP  facet F08  effort S
- Legacy: LBE/controller/FacultyTeachingAssignmentController.java:116-126: bulk 201 `N assignments created`.
- vNext now: V/components/admin/super-admin-faculty-assignment-create.tsx:50-51: `Created N teaching assignments for this class.`
- Fix: Match legacy count wording or document deliberate clarity improvement.
