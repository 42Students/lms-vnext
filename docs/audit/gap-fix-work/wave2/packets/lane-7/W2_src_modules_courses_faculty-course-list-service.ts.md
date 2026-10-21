# Work packet (wave 2): edit src/modules/courses/faculty-course-list-service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/faculty-course-association.md

## G2-3-020-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyCourseAssociationServiceImpl.java:51-70`, `147-171`
- vNext now: `src/modules/courses/faculty-course-list-service.ts:7-22`, `src/modules/courses/teaching-assignment-service.ts:57-137`
- Fix: Legacy generic faculty-to-course association controls course access by course ID, vNext faculty course page uses specific section deliveries and teaching roles. Ensure legacy assigned course appears for correct sections.

## G2-3-020-004  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:66-72`, `128-133`
- vNext now: `src/modules/courses/faculty-course-list-service.ts:7-22`
- Fix: Legacy fetchAllCoursesByFacultyId includes inactive rows, fetchActiveCoursesByFacultyId excludes inactive; vNext getFacultyCourseList returns live deliveries only. Add historical list/active toggle semantics.

## G2-3-020-009  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/FacultyCourseAssociationRepository.java:14-19`, `25-29`
- vNext now: `src/modules/courses/teaching-assignment-service.ts:57-137`, `src/modules/courses/faculty-course-list-service.ts:7-22`
- Fix: Legacy queries facultyId→all courses and courseId→all faculty plus active-only forms; vNext listTeachingAssignments keyed one delivery. Add course-aggregate and faculty-aggregate projections.

## G2-3-020-010  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyCourseAssociationServiceImpl.java:51-70`
- vNext now: `src/modules/courses/faculty-course-list-service.ts:15-21`
- Fix: Legacy returns mappingId and courseSlug+courseName+deptId; vNext course choices identified by deliveryId/name/class/period and no slug. Add legacy-friendly course projection and stable links.

## G2-3-020-030  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyCourseAssociationServiceImpl.java:52-68`
- vNext now: `src/modules/courses/faculty-course-list-service.ts:7-22`
- Fix: Legacy missing course returned from CourseService is skipped without failing entire response; vNext scope query can return no data/error for missing delivery. Match partial/empty read safely.
