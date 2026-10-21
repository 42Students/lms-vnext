# Work packet (wave 2): edit src/app/api/courses/lesson-contents/[contentId]/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/lesson-content-controller.md

## G2-3-027-007  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:634-663`
- vNext now: `src/app/api/courses/lesson-contents/[contentId]/route.ts:13-39`
- Fix: Legacy fetchById and playback-url endpoints differ from vNext content PATCH and separate video playback grants; document exact authorized read mapping.
