# Work packet: edit src/modules/courses/delivery-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l14-u031-academic-structure-cross-cutting.md

## G2-14-031-052  [P1] GAP  facet F21  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:283-470 semester course mappings feed teaching assignments
- vNext now: src/modules/courses/delivery-service.ts:107-212 offering→section delivery and src/modules/courses/teaching-assignment-service.ts:139-278 assignments
- Fix: Maintain consistent course mapping→offering→delivery→faculty chain
