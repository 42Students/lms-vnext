# Work packet: edit src/modules/courses/faculty-route-access-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u001-faculty-course-tab.md

## G2-18-001-058  [P1] GAP  facet F11  effort M
- Legacy: Legacy faculty staff ADMIN subtype may bypass some lesson-content restrictions. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyLessonContentController.java:76-90`
- vNext now: vNext FACULTY membership role only on faculty route, no subtype ADMIN special case. `src/modules/courses/faculty-course-service.ts:43-57`, `src/modules/courses/faculty-route-access-model.ts:6-16`
- Fix: Confirm legacy faculty ADMIN subtype entitlement; map any required admin-capable account to explicit tenant role/permission, never bypass scope.
