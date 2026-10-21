# Work packet (wave 2): edit src/db/schema/faculty-course-associations.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/faculty-course-association.md

## G2-3-020-044  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/FacultyCourseAssociationRepository.java:14-32`
- vNext now: `src/db/schema/faculty-course-associations.ts:15-17`
- Fix: Legacy may have multiple rows same faculty+course and stores `active` int; vNext partial unique index on currently active membership+course. Plan collision migration, end old duplicates and preserve chronology.
