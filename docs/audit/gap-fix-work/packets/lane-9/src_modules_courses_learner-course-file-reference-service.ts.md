# Work packet: edit src/modules/courses/learner-course-file-reference-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/resource-file-controller.md

## G2-8-025-027  [P1] GAP  facet F10  effort M
- Legacy: Legacy GET authenticates then resolves contentId, lesson and scope before signing URL (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:51-118).
- vNext now: New GET authorizes delivery/learning path then HEADs object and redirects (src/app/api/courses/deliveries/[deliveryId]/contents/[contentId]/file/route.ts:16-47; src/modules/courses/learner-course-file-reference-service.ts:19-46).
- Fix: Add exactly selected material row join and file scan/owner verification before granting.

## G2-8-025-057  [P1] GAP  facet F22  effort M
- Legacy: Legacy storage key pattern org-{id}/college-{id}/lesson-content/... (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:40-41,109-115).
- vNext now: New normalized material storageKey has no DB tenant prefix check; root content storageKey separate (src/db/schema/lesson-content-materials.ts:15,38-46; src/modules/courses/learner-course-file-reference-service.ts:24-26).
- Fix: Bind each FILE object to lessonContentMaterial tenant and parent, enforce key generation uniqueness.
