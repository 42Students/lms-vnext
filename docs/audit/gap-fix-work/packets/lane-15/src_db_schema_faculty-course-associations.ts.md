# Work packet: edit src/db/schema/faculty-course-associations.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/faculty-course-association.md

## G2-3-020-007  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/FacultyCourseAssociation.java:12-23`
- vNext now: `src/db/schema/faculty-course-associations.ts:6-18`
- Fix: Legacy table ID LONG, faculty_id INT, course_id INT, active INT default1; vNext UUID ID, membership UUID, course UUID, startedAt/endedAt and timestamps. Migration must map legacy IDs and active value to endedAt safely.

## G2-3-020-027  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/FacultyCourseAssociation.java:22-23`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyCourseAssociationServiceImpl.java:42-47`
- vNext now: `src/db/schema/faculty-course-associations.ts:10-17`, `src/modules/courses/teaching-assignment-service.ts:139-177`
- Fix: Legacy new association active=1 and deactivation sets 0; vNext active is endedAt null but requires faculty active membership+role and live delivery. Convert historical statuses with proper role constraints.

## G2-3-020-040  [P1] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/FacultyCourseAssociationRepository.java:32-32`
- vNext now: `src/db/schema/faculty-course-associations.ts:15-17`, `src/modules/courses/teaching-assignment-service.ts:238-245`
- Fix: Legacy findByFacultyIdAndCourseId assumes single row but DB has no unique constraint; can become ambiguous when reassigning. VNext partial unique active index avoids duplicates. On migration deduplicate preserving history.

## G2-3-020-043  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/FacultyCourseAssociation.java:9-23`
- vNext now: `src/db/schema/faculty-course-associations.ts:6-18`
- Fix: Legacy `faculty_course_associations` int id/faculty_id/course_id/active vs vNext same-named Postgres table with UUID id/membership_id/course_id and endedAt. Requires explicit table migration/identifier mapping, not naive column copy.
