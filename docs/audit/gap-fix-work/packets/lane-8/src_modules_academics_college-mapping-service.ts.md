# Work packet: edit src/modules/academics/college-mapping-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l14-u031-academic-structure-cross-cutting.md

## G2-14-031-002  [P1] GAP  facet F01  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:31-34,104-106 semester page/actions per program
- vNext now: src/modules/academics/college-mapping-service.ts:53-58 periods/cohort offerings, not ordinal semester
- Fix: Expose program semester number and equivalent course mapping entry point

## G2-14-031-009  [P1] MISSING  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:104-210 create/update/delete semester controls
- vNext now: src/modules/academics/college-mapping-service.ts:53-127 read-only mappings
- Fix: Add direct term metadata edit controls or explicit link to program term editor

## G2-14-031-030  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:104-210 semester mutation and 283-470 associated courses
- vNext now: src/modules/academics/college-mapping-service.ts:53-127 read mappings; src/modules/courses/offering-service.ts:1-150 manages offerings
- Fix: Connect semester course map writes to term offering and course delivery

## G2-14-031-024  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:129-132 'Semester created successfully'
- vNext now: src/modules/academics/college-mapping-service.ts:53-127 does not create term
- Fix: Restore success message on mapped term creation
