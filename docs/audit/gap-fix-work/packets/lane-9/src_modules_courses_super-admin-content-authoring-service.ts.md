# Work packet: edit src/modules/courses/super-admin-content-authoring-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-admin-resources.md

## G2-9-025-063  [P1] GAP  facet F19  effort L
- Legacy: Class options fetched per selected course and reused for class-specific authoring `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:173-177`
- vNext now: SA authoring picker limited 500 active lessons and always deliveryId null `src/modules/courses/super-admin-content-authoring-service.ts:9-28` `src/components/courses/super-admin-content-authoring.tsx:20-29`
- Fix: Make section delivery selectable, support >500 lessons via search/pagination.
