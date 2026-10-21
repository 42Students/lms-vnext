# Work packet: edit src/app/api/courses/lesson-contents/order/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/lesson-content-controller.md

## G2-3-027-036  [P3] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:630-632`
- vNext now: `src/app/api/courses/lesson-contents/order/route.ts:29-36`
- Fix: Legacy order update response wraps string Order updated; vNext returns `{order}` full list receipt.
