# Work packet: edit src/modules/academics/faculty-assignment-service.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/l19-u019-faculty-teaching-assignment.md, docs/audit/gap2/lane-9/l15-u027-faculty-controller.md, docs/audit/gap2/lane-20/faculty-course-mapping.md

## G2-19-019-031  [P1] GAP  facet F10  effort L
- Legacy: FacultyTeachingAssignmentRepository.java:124-139 bulk semester deactivation/reactivation for batch
- vNext now: src/modules/academics/faculty-assignment-service.ts:156-206 ends individual section grant; course grant end service separate
- Fix: Implement promotion rollback/reactivation contract transactionally against offering term assignment set

## G2-19-019-034  [P1] GAP  facet F11  effort M
- Legacy: FacultyTeachingAssignmentRepository.java:51-81 class,semester,batch boundaries
- vNext now: src/modules/academics/faculty-assignment-service.ts:54-57 academic scope college/organization; course service checks delivery
- Fix: Prevent section-level role from authorizing course outside assigned delivery, including electives

## G2-15-027-024  [P1] MISSING  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:496-516 bulk mapping takes list validates EVERY scope before inserts
- vNext now: src/modules/academics/faculty-assignment-service.ts:105-153 create single assignment service
- Fix: Implement prevalidated bulk scoped mapping command, prevent partial permission writes.

## G2-19-019-022  [P2] GAP  facet F07  effort S
- Legacy: FacultyTeachingAssignmentController.java:73-81 `Assignment not found with id` on invalid detail ID
- vNext now: src/modules/academics/faculty-assignment-service.ts:174-202 ends report FACULTY_ASSIGNMENT_NOT_FOUND
- Fix: Normalize not-found/ended/stale response copy, avoid exposing opaque UUIDs to user

## G2-20-019-013  [P2] GAP  facet F07  effort S
- Legacy: Multiple instructors error names class ambiguity `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/FacultyCourseMappingRepository.java:22-30`
- vNext now: New list allows multiple roles `src/modules/academics/faculty-assignment-service.ts:73-102`
- Fix: Require explicit faculty and course for ambiguous action

## G2-15-027-028  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:520-537 missing mapping => Mapping not found 404
- vNext now: src/modules/academics/faculty-assignment-service.ts:156-206 typed FACULTY_ASSIGNMENT_NOT_FOUND
- Fix: Render legacy not-found message in admin mapping UI.
