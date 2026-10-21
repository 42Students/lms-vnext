# Work packet (wave 2): edit src/app/api/courses/assignments/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l13-u027-faculty-lesson-content-controller.md

## G2-13-027-002  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyLessonContentController.java:90-97 — ASSIGNMENT dispatches to AssignmentContentWriteService
- vNext now: src/app/api/courses/assignments/route.ts:34-55 — assignments separate POST /api/courses/assignments
- Fix: Ensure clients select API by content kind, never generic content endpoint.

## G2-13-027-022  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyLessonContentController.java:90-95 — assignment through validated writer with same LessonContents model
- vNext now: src/app/api/courses/assignments/route.ts:42-55 — separate assignments entity response
- Fix: Record two distinct table/model sources and caller association mapping.
