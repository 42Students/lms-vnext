# Work packet: edit src/app/api/courses/assignments/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l13-u027-faculty-lesson-content-controller.md

## G2-13-027-017  [P3] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyLessonContentController.java:90-95 — Assignment writer unavailable (503), Assignment saved (200)
- vNext now: src/app/api/courses/assignments/route.ts:46-55 — create assignment (201) or API errors
- Fix: Map status/message and offline service dependency semantics.
