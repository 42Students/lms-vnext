# Work packet: edit src/app/api/courses/deliveries/[deliveryId]/contents/[contentId]/file/route.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/resource-file-controller.md

## G2-8-025-004  [P1] GAP  facet F02  effort M
- Legacy: Old endpoint is backend-only; file material selected from lesson resource card list (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:31-35,94-104).
- vNext now: New separately lists material metadata, then a content file redirect (src/modules/courses/lesson-resource-materials-service.ts:35-57; src/app/api/courses/deliveries/[deliveryId]/contents/[contentId]/file/route.ts:16-47).
- Fix: Ensure card row's Download link binds correct material ID and title, not parent content key.

## G2-8-025-053  [P1] GAP  facet F20  effort M
- Legacy: Legacy materialIndex references mutable list order; insert/remove can invalidate old link (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:94-104).
- vNext now: New stable material UUID + sequence unique, but root signed GET currently ignores material ID (src/db/schema/lesson-content-materials.ts:10,19,37-41; src/app/api/courses/deliveries/[deliveryId]/contents/[contentId]/file/route.ts:7-29).
- Fix: Use stable UUID per material for downloadable bookmarks and sort independently.

## G2-8-025-018  [P2] GAP  facet F07  effort M
- Legacy: Legacy deleted or nonresource row: Resource not found (404) (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:57-61).
- vNext now: New learner auth query returns null, new file route COURSE_FILE_NOT_FOUND 404 (src/modules/courses/learner-course-file-reference-service.ts:24-46; src/app/api/courses/deliveries/[deliveryId]/contents/[contentId]/file/route.ts:24-29).
- Fix: Preserve not-found versus not-published distinction without leaking hidden resources.
