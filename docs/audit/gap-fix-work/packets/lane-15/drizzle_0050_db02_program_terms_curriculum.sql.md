# Work packet: edit drizzle/0050_db02_program_terms_curriculum.sql

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/superadmin-semester-course-mapping.md

## G2-17-002-086  [P1] GAP  facet F22  effort 
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:40-42 permits credits 0-30, entity credits defaults3.
- vNext now: src/db/schema/academic-terms.ts:37 and drizzle/0050_db02_program_terms_curriculum.sql:31-34 permit null or 0-30, src/modules/academics/college-term-mapping-model.ts:3-11 writes 1-10.
- Fix: Align DB/API limits or explain historical read-only out-of-range values.
