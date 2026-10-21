# Work packet: NEW / MISSING items from docs/audit/gap2/lane-8/resource-file-controller.md

13 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-8/resource-file-controller.md

## G2-8-025-001  [P0] GAP  facet F01  effort M
- Legacy: Legacy GET /api/v1/resource-files/{contentId}/materials/{materialIndex}/url resolves one indexed FILE (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:37-53).
- vNext now: New GET /api/courses/deliveries/{deliveryId}/contents/{contentId}/file is content-level, no material index (src/app/api/courses/deliveries/[deliveryId]/contents/[contentId]/file/route.ts:7-29).
- Fix: Add learner/staff authorized per-material UUID download endpoint, not just root content reference.

## G2-8-025-009  [P1] GAP  facet F04  effort M
- Legacy: Legacy FILE cloudStorageObject may be absolute URL or key (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:99-110).
- vNext now: New normalized FILE uses storageKey and externalUrl must be NULL (src/db/schema/lesson-content-materials.ts:14-18,46).
- Fix: Normalize allowed legacy public URLs to tenant storage keys in migration with clear rejects.

## G2-8-025-011  [P1] GAP  facet F05  effort M
- Legacy: Legacy material fetched by exact array index; invalid index returns 404 (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:51-56,94-103).
- vNext now: New list caps 20 materials in ascending sequence (src/modules/courses/lesson-resource-materials-service.ts:49-50).
- Fix: Prevent legacy resources with >20 materials being invisibly truncated; paginate/show count.

## G2-8-025-022  [P1] GAP  facet F07  effort M
- Legacy: Legacy signing failure: Cannot sign Resource file URL (503) (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:118-126).
- vNext now: New presignUrl performed after headObject, no catch around direct signing (src/app/api/courses/deliveries/[deliveryId]/contents/[contentId]/file/route.ts:40-47).
- Fix: Catch R2 signer configuration/exception and return explicit controlled 503.

## G2-8-025-030  [P1] GAP  facet F10  effort M
- Legacy: Legacy validates path regex org-N/college-N/lesson-content/* against caller tenants (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:40-41,109-115).
- vNext now: New object key read from lessonContents without same path-shape validation in referenced service (src/modules/courses/learner-course-file-reference-service.ts:24-46).
- Fix: Enforce private tenant-scoped key ownership invariant at sign boundary.

## G2-8-025-037  [P1] GAP  facet F12  effort M
- Legacy: Legacy rejects .. and // traversal, key must embed exact org+college IDs (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:109-115).
- vNext now: New lessonContentMaterials FILE storageKey non-null but no visible tenant prefix check in table (src/db/schema/lesson-content-materials.ts:38-46).
- Fix: Add CHECK/prefix or signing-service verification that key belongs to content college.

## G2-8-025-040  [P1] GAP  facet F13  effort M
- Legacy: Legacy disabled/invisible to learner returns 404; staff may access based on requireAccessCourse (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:62-92).
- vNext now: New getLearnerCourseFileReference explicitly requires access === LEARNER and rejects faculty/admin (src/modules/courses/learner-course-file-reference-service.ts:19-23).
- Fix: Provide equivalent staff-authorized material download flow, not learner-only signer.

## G2-8-025-056  [P1] GAP  facet F22  effort M
- Legacy: Legacy LessonContents.contentDataDTO embeds ordered resourceMaterials JSON with fileDTO (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:94-105).
- vNext now: New lesson_content_materials normalized FILE/LINK, FK to lessonContents, unique content+sequence (src/db/schema/lesson-content-materials.ts:7-19,36-46).
- Fix: Migrate each JSON material to row preserving exact title, kind, file and ordering.

## G2-8-025-060  [P1] GAP  facet F23  effort M
- Legacy: Legacy no edits in signed URL controller (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:51-128).
- vNext now: New materials POST supports only LINK ADD/EDIT/REMOVE, not FILE authoring in this service (src/modules/courses/lesson-resource-materials-service.ts:59-110).
- Fix: Verify separate FILE upload/link writer; if absent implement file creation lifecycle and UI.

## G2-8-025-017  [P2] GAP  facet F07  effort M
- Legacy: Legacy invalid arguments: Invalid Resource material (400) (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:54-56).
- vNext now: New invalid URL params: INVALID_REQUEST or UUID Zod error (src/app/api/courses/deliveries/[deliveryId]/contents/[contentId]/file/route.ts:16-29).
- Fix: Return an actionable bad material reference error instead of generic validator code.

## G2-8-025-019  [P2] GAP  facet F07  effort M
- Legacy: Legacy learner inactive/disabled content -> Resource not available (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:62-64).
- vNext now: New learner requires PUBLISHED + visible + nonfuture release, else 404 or authorization code (src/modules/courses/learner-course-file-reference-service.ts:33-46).
- Fix: Expose safe generic unavailability text with retry only when relevant.

## G2-8-025-021  [P2] GAP  facet F07  effort M
- Legacy: Legacy storage missing 503 Resource storage unavailable (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:116-117).
- vNext now: New storage HEAD exception 503 COURSE_FILE_UNAVAILABLE with message The course file is not available from storage. (src/app/api/courses/deliveries/[deliveryId]/contents/[contentId]/file/route.ts:30-39).
- Fix: Display user-friendly storage retry state, preserve 503.

## G2-8-025-023  [P2] GAP  facet F08  effort M
- Legacy: Legacy success body status OK, message OK, data.url signed URL (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:118-123).
- vNext now: New success is 302 to signed URL no JSON body (src/app/api/courses/deliveries/[deliveryId]/contents/[contentId]/file/route.ts:42-47).
- Fix: Adjust loader/Download logic to handle redirect rather than expecting url field.
