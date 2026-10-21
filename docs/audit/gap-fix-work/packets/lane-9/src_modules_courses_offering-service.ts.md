# Work packet: edit src/modules/courses/offering-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l14-u031-academic-structure-cross-cutting.md

## G2-14-031-030  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:104-210 semester mutation and 283-470 associated courses
- vNext now: src/modules/academics/college-mapping-service.ts:53-127 read mappings; src/modules/courses/offering-service.ts:1-150 manages offerings
- Fix: Connect semester course map writes to term offering and course delivery
