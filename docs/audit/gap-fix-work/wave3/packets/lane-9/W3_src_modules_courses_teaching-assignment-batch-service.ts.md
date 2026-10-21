# Work packet (wave 3): edit src/modules/courses/teaching-assignment-batch-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/l19-u019-faculty-teaching-assignment.md

## G2-19-019-074  [P1] MISSING  facet F23  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyTeachingAssignmentController.java:318-331 mass end on batch promotion
- vNext now: src/modules/courses/teaching-assignment-batch-service.ts:18-20 only batch assignment create
- Fix: Add promotion safety hook plus reversal and audit.
