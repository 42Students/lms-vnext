# Work packet: edit src/modules/courses/lesson-resource-materials-service.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/legacy-resource-viewer.md, docs/audit/gap2/lane-8/resource-file-controller.md

## G2-17-008-054  [P0] GAP  facet F14  effort L
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:68-89 — File Open requests signed redirect, raw key never shown.
- vNext now: src/modules/courses/lesson-resource-materials-service.ts:51-57 — File storageKey not serialized but grant unavailable.
- Fix: Issue signed URL without exposing storage key to client.

## G2-17-008-012  [P1] GAP  facet F04  effort L
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:61-64 — resource_materials is stored in contentDataDTO JSON, supports camel/snake.
- vNext now: src/modules/courses/lesson-resource-materials-service.ts:40-50 — Reads normalized lesson_content_materials records.
- Fix: Define backfill/compatibility mapping for all legacy material shapes.

## G2-17-008-040  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/components/Global/Offcanvas/Syallabus/ResourceComposer.js:158-219 — Single Resource save payload has parent, JSON materials and notes.
- vNext now: src/modules/courses/lesson-resource-materials-service.ts:59-109 — Separate transactional link row command and event.
- Fix: Ensure parent/child create and scope are coherently persisted.

## G2-17-008-042  [P1] GAP  facet F11  effort M
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:65-66 — Faculty edits/removes; learner completion only.
- vNext now: src/modules/courses/lesson-resource-materials-service.ts:19-33 — Write permission via delivery owner or courses.manage, read scoped.
- Fix: Test all college admin/faculty/learner permission combinations.

## G2-17-008-046  [P1] MISSING  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:118-122 — Presigned file GET is valid 15 minutes.
- vNext now: src/modules/courses/lesson-resource-materials-service.ts:51-52 — Grant endpoint deferred, no signing lifetime.
- Fix: Implement short TTL and refresh only on Open.

## G2-17-008-066  [P1] MISSING  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:68-90 — Fetch signed grant at user click only; no pre-sign on list load.
- vNext now: src/modules/courses/lesson-resource-materials-service.ts:40-50 — Loads metadata on mount, no grants.
- Fix: Add on-demand signer, private no-store responses.

## G2-8-025-002  [P1] GAP  facet F01  effort M
- Legacy: Legacy reads embedded ContentDataDTO.resourceMaterials by 0-based index (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:94-104).
- vNext now: New separate /api/courses/lesson-contents/{contentId}/materials GET enumerates UUID material IDs (src/app/api/courses/lesson-contents/[contentId]/materials/route.ts:20-27; src/modules/courses/lesson-resource-materials-service.ts:35-57).
- Fix: Provide stable legacy index-to-material-ID adapter for existing links.

## G2-8-025-008  [P1] GAP  facet F04  effort M
- Legacy: Old indexes materials list by materialIndex integer and preserves order from ContentDataDTO (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:94-100).
- vNext now: New file rows have UUID id and integer sequence ordered asc (src/db/schema/lesson-content-materials.ts:10-19; src/modules/courses/lesson-resource-materials-service.ts:40-50).
- Fix: Migrate exact index ordering and preserve historical references even after reorder.
