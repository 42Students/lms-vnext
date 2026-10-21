# Work packet: edit src/app/api/courses/lesson-contents/[contentId]/materials/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/resource-file-controller.md

## G2-8-025-059  [P0] GAP  facet F23  effort M
- Legacy: Legacy single indexed signed FILE URL for staff+learner subject to permissions (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:51-128).
- vNext now: New learner-only root content download endpoint, independent materials read/list API (src/modules/courses/learner-course-file-reference-service.ts:14-46; src/app/api/courses/lesson-contents/[contentId]/materials/route.ts:20-37).
- Fix: Build complete per-material signed grant path for all authorized roles before claiming FILE parity.
