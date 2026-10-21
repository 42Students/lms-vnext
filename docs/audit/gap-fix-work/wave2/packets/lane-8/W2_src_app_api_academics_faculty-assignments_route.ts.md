# Work packet (wave 2): edit src/app/api/academics/faculty-assignments/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/faculty-course-mapping.md, docs/audit/gap2/lane-3/faculty-course-association.md

## G2-20-019-018  [P2] GAP  facet F10  effort M
- Legacy: Find by faculty,course,class triple `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/FacultyCourseMappingRepository.java:36`
- vNext now: New POST body uses section/membership `src/app/api/academics/faculty-assignments/route.ts:30-50`
- Fix: Update callers and response shape

## G2-3-020-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:20-38`, `53-134`
- vNext now: `src/app/api/academics/faculty-assignments/route.ts:10-55`, `src/app/(authenticated)/college/faculty-assignment/page.tsx:29-72`
- Fix: Legacy faculty-course-associations endpoints create/createBulk/deactivate and GET facultyId/courseId lists; vNext separate section faculty assignment and course delivery teaching API with ID-scoped routes. Provide mapping for six legacy operations.
