# Work packet: edit src/app/api/courses/lesson-contents/[contentId]/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/lesson-content-controller.md

## G2-3-027-032  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:665-728`
- vNext now: `src/app/api/courses/lesson-contents/[contentId]/route.ts:13-39`
- Fix: Legacy content update accepts PUT and wraps status/reason; vNext PATCH response {content}, with centralized error mapping. Preserve browser error expectations.
