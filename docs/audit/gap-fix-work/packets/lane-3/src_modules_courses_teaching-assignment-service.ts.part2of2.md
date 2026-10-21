# Work packet: edit src/modules/courses/teaching-assignment-service.ts (part 2 of 2)

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/l19-u019-faculty-teaching-assignment.md, docs/audit/gap2/lane-3/faculty-course-association.md, docs/audit/gap2/lane-4/l14-u027-faculty-course-association-controller.md

## G2-19-019-026  [P2] GAP  facet F08  effort M
- Legacy: FacultyTeachingAssignmentController.java:168-187 `Assignment deleted successfully`/`Assignment deactivated`
- vNext now: src/modules/courses/teaching-assignment-service.ts:280-390 ends grant, audit event
- Fix: Map Deactivate vs Delete semantics and show exact success copy; never imply physical deletion

## G2-3-020-015  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/FacultyCourseAssociationCreateRequestDTO.java:10-13`
- vNext now: `src/modules/courses/teaching-assignment-service.ts:143-179`
- Fix: Legacy @Min(1) faculty ID and @NotNull courseIds with no min array size; vNext requires UUID membership, active role, same college and delivery. Keep stricter validation but map exact form messages.

## G2-3-020-016  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:40-50`
- vNext now: `src/modules/courses/teaching-assignment-service.ts:155-179`
- Fix: Legacy admin-only error `Only an admin can create, update, or remove faculty course associations`; vNext courses.manage/academics.manage typed errors. Map exact role-insufficient user-facing text.

## G2-3-020-017  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:95-99`
- vNext now: `src/modules/courses/teaching-assignment-service.ts:280-312`
- Fix: Legacy unknown mappingId deactivate returns 404 no body; vNext `TEACHING_ASSIGNMENT_NOT_FOUND` with default error mapping. Preserve 404 and nonenumerating message.

## G2-14-027-017  [P2] GAP  facet F07  effort M
- Legacy: Legacy wrong role exact 'Only an admin can create, update, or remove faculty course associations' `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:40-50`
- vNext now: New permission errors from courses.manage `src/modules/courses/teaching-assignment-service.ts:139-161`
- Fix: Map exact user-facing access failure where needed.
