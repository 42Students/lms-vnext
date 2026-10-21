# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-8/resource-file-controller.md

10 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-8/resource-file-controller.md

## G2-8-025-003  [P2] GAP  facet F01  effort M
- Legacy: Legacy URL response JSON {status,message,data:{url}} (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:116-123).
- vNext now: New successful file GET 302 redirect with signed Location (src/app/api/courses/deliveries/[deliveryId]/contents/[contentId]/file/route.ts:40-47).
- Fix: Update consumer navigation/JSON-fetch semantics and preserve privacy headers.

## G2-8-025-010  [P2] GAP  facet F04  effort M
- Legacy: Legacy filename/metadata inherited FileDTO and material title max255 (docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/ResourceMaterialDTO.java:19-22).
- vNext now: New title TEXT no DB max, originalName TEXT, mimeType text, sizeBytes int (src/db/schema/lesson-content-materials.ts:13-19).
- Fix: Align 255 character title and storage filename limits with input validator and DB.

## G2-8-025-032  [P2] GAP  facet F11  effort M
- Legacy: Legacy learner must see active+enabled content; requireAccessCourse and class (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:62-63,91-92).
- vNext now: New learner requires PUBLISHED path/lesson/material plus release date and delivery scope (src/modules/courses/learner-course-file-reference-service.ts:19-45).
- Fix: Document deliberate stronger release visibility and avoid leaking materials hidden by legacy flags.

## G2-8-025-034  [P2] GAP  facet F12  effort M
- Legacy: Legacy checks index from zero inclusive, < materials.size (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:51-56,94-100).
- vNext now: New material sequence >=0 unique per content, list ordered sequence (src/db/schema/lesson-content-materials.ts:19,37-41).
- Fix: Keep stable 0-based ordinals, avoid holes changing old URL indices.

## G2-8-025-038  [P2] GAP  facet F13  effort M
- Legacy: Legacy 404 distinctions: Resource not found, material not found, file not found (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:57-61,94-104).
- vNext now: New root content file 404 covers missing lookup/file uniformly (src/app/api/courses/deliveries/[deliveryId]/contents/[contentId]/file/route.ts:24-35).
- Fix: Preserve safe distinction of missing material and invalid kind without exposing hidden content.

## G2-8-025-043  [P2] GAP  facet F14  effort M
- Legacy: Legacy signed GET no explicit filename in success JSON (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:118-123).
- vNext now: New attachment uses sanitized last object-key segment as filename (src/app/api/courses/deliveries/[deliveryId]/contents/[contentId]/file/route.ts:9-10,40-42).
- Fix: Use stored originalName for download Content-Disposition rather than opaque storage UUID key.

## G2-8-025-047  [P2] GAP  facet F18  effort M
- Legacy: Legacy exact errors Invalid Resource material, Resource file not found, Resource file storage is not allowed (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:55-56,99-108).
- vNext now: New errors INVALID_REQUEST, COURSE_FILE_NOT_FOUND, COURSE_FILE_UNAVAILABLE (src/app/api/courses/deliveries/[deliveryId]/contents/[contentId]/file/route.ts:19-39).
- Fix: Restore readable non-technical message mapping in file row and retry control.

## G2-8-025-050  [P2] GAP  facet F19  effort M
- Legacy: Legacy serialized list may contain arbitrarily many resources, URL endpoint still indexes any valid index (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:94-104).
- vNext now: New list limit20 and no pagination after that (src/modules/courses/lesson-resource-materials-service.ts:40-50).
- Fix: Ensure legacy >20 rows accessible with paging/expand rather than silently omitted.

## G2-8-025-052  [P2] GAP  facet F20  effort M
- Legacy: Legacy ContentUrlValidator legacy host fallback exists but controller demands configured allowed URL first (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:105-109; docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/ContentUrlValidator.java:141-159).
- vNext now: New key-only reference requires migration of historical URL forms (src/modules/courses/learner-course-file-reference-service.ts:24-46).
- Fix: Import keys from allowed legacy URLs, reject arbitrary external URL references.

## G2-8-025-048  [P3] GAP  facet F18  effort M
- Legacy: Legacy server success message OK (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:118-123).
- vNext now: New 302 no message, browser direct downloads (src/app/api/courses/deliveries/[deliveryId]/contents/[contentId]/file/route.ts:42-47).
- Fix: Ensure no confusing blank toast; display file-open or download in UI only.
