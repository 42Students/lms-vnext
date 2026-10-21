# Work packet: edit src/modules/courses/super-admin-content-directory-service.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/lesson-content.md, docs/audit/gap2/lane-9/superadmin-admin-resources.md

## G2-19-002-023  [P1] GAP  facet F05  effort L
- Legacy: Legacy selected section enables sortable cross-type full syllabus rows `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1080-1107`
- vNext now: vNext query always `contentTypesForKind` restricted to tab kind `src/modules/courses/super-admin-content-directory-service.ts:79-86`
- Fix: Provide full cross-type section order view, with off-tab mutation disabled.

## G2-19-002-084  [P1] GAP  facet F19  effort L
- Legacy: Legacy class reorder sends full ordered list of selected-class content `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:940-956`
- vNext now: vNext directory limits 25 and content-type filters by tab; unsafe for full cross-type ordering `src/modules/courses/super-admin-content-directory-service.ts:79-92`
- Fix: Use dedicated all-content full list and bulk update API with bounded count and conflict checks.

## G2-9-025-055  [P1] GAP  facet F14  effort M
- Legacy: Round trip file_dto cloud_storage_object original_name mimetype size `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:26-45`
- vNext now: Directory selects externalUrl/notes only `src/modules/courses/super-admin-content-directory-service.ts:30-53`
- Fix: Add authorized file manifest join and per-resource count.

## G2-9-025-068  [P1] GAP  facet F22  effort L
- Legacy: Legacy resource payload includes resource_materials array, HTML, text, visibility flags, sequence, points `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:266-285`
- vNext now: New flat lesson_contents title,notes,externalUrl,points,sequence,status,deliveryId `src/modules/courses/super-admin-content-directory-service.ts:30-53` `src/components/courses/faculty-lesson-authoring.tsx:281-297`
- Fix: Design structured material child/receipt migration and preserve rich text.

## G2-9-025-069  [P1] GAP  facet F22  effort L
- Legacy: Legacy content integer IDs and course/class association `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:214-281`
- vNext now: New UUID lesson/offer/delivery and status ancestry joins `src/modules/courses/super-admin-content-directory-service.ts:30-74`
- Fix: Map legacy content/class/course IDs to new relations; verify tenant ownership.

## G2-9-025-070  [P1] GAP  facet F22  effort L
- Legacy: Old mixed material document metadata carries file size/MIME/old URL `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:266-285`
- vNext now: New directory omits file metadata from projection `src/modules/courses/super-admin-content-directory-service.ts:30-53`
- Fix: Preserve file MIME/size/title and migration references.
