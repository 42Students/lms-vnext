# Work packet: edit src/modules/courses/assignment-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l13-u027-faculty-lesson-content-controller.md

## G2-13-027-042  [P1] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LessonContentsDTO.java:11-48 — one legacy LessonContents model for assignment and other content
- vNext now: src/modules/courses/assignment-service.ts:249-267 — separate courseAssignments DB row
- Fix: Provide migration mapping and linked lesson sequence/curriculum parity.
