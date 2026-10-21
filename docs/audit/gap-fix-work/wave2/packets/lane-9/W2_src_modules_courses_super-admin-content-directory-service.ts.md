# Work packet (wave 2): edit src/modules/courses/super-admin-content-directory-service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/lesson-content.md, docs/audit/gap2/lane-9/superadmin-admin-resources.md

## G2-19-002-018  [P2] GAP  facet F04  effort M
- Legacy: Legacy content includes faculty association and potentially class ID `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:641-657` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LessonContents.java:23-35`
- vNext now: vNext projected course/lesson/cohort/period/delivery, no faculty in directory `src/modules/courses/super-admin-content-directory-service.ts:30-53`
- Fix: Expose faculty and audience fields needed for legacy staff review via safe joins.

## G2-19-002-061  [P2] GAP  facet F12  effort M
- Legacy: Legacy prevents edit/delete of non-tab rows while mixed class reorder view `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1041-1055`
- vNext now: vNext kind-specific query never lists other-type rows `src/modules/courses/super-admin-content-directory-service.ts:75-86`
- Fix: Restore mixed view with disabled off-tab actions and matching tooltip.

## G2-9-025-020  [P2] GAP  facet F05  effort M
- Legacy: Selecting class or lesson loads only corresponding RESOURCE items `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:137-171`
- vNext now: Search is server-side over all resources unless filter specified; status and keyword included `src/modules/courses/super-admin-content-directory-service.ts:75-93`
- Fix: Match default lesson/class-scoped list, not global college directory.

## G2-9-025-021  [P2] GAP  facet F05  effort S
- Legacy: Legacy Table pagination fixed pageSize15 `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:377-377`
- vNext now: Server default page size25 `src/modules/courses/super-admin-content-directory-model.ts:1-2` `src/modules/courses/super-admin-content-directory-service.ts:90-93`
- Fix: Use 15 per page for parity; keep backend cursor/limit for scale.

## G2-9-025-062  [P2] GAP  facet F19  effort M
- Legacy: Legacy fetches a lesson/class at a time and paginates local resources 15 `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:155-169,374-378`
- vNext now: New server count and 25-row pagination by course/lesson sequence `src/modules/courses/super-admin-content-directory-service.ts:88-93`
- Fix: Match lesson scope and 15 row list while retaining efficient DB pagination.
