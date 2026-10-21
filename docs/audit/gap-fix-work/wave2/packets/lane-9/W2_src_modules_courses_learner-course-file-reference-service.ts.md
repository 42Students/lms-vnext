# Work packet (wave 2): edit src/modules/courses/learner-course-file-reference-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/resource-file-controller.md

## G2-8-025-013  [P2] GAP  facet F06  effort M
- Legacy: Legacy URL args require contentId positive integer and materialIndex >=0 (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:51-56).
- vNext now: New learner route accepts UUID content/delivery and optional download 0/1 only (src/app/api/courses/deliveries/[deliveryId]/contents/[contentId]/file/route.ts:16-29; src/modules/courses/learner-course-file-reference-service.ts:17-19).
- Fix: Map invalid legacy integer index and UUID errors to distinct field-safe responses.
