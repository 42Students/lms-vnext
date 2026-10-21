# Work packet: edit src/components/courses/super-admin-content-authoring.tsx

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/superadmin-lesson-content-wrapper.md, docs/audit/gap2/lane-19/lesson-content.md, docs/audit/gap2/lane-9/superadmin-admin-resources.md

## G2-17-003-013  [P1] MISSING  facet F04  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:365-398 extracts actual video file duration from metadata when available.
- vNext now: src/components/courses/super-admin-content-authoring.tsx:30-32 disallows binary upload on admin Videos page, so duration probe cannot run.
- Fix: Restore duration detection and confirmation for successful video uploads.

## G2-17-003-018  [P1] GAP  facet F06  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:539-647 author form has title, type, lesson, points, order, audience, duration/link/upload and scheduling fields.
- vNext now: src/components/courses/super-admin-content-authoring.tsx:20-32 delegates to FacultyLessonAuthoring but VIDEOS only YOUTUBE; uploads unavailable.
- Fix: Audit and fill missing VIDEO author fields and distinct class-audience controls.

## G2-17-003-021  [P1] MISSING  facet F07  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:468-490 validates video import URL http/https and provides validation/import-specific toasts.
- vNext now: src/components/courses/super-admin-content-authoring.tsx:30-32 no admin binary upload/import control; YouTube URL can be authored separately.
- Fix: Add validation/import URL flow with exact failure/size/info messages and safe server importer.

## G2-17-003-025  [P1] MISSING  facet F08  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:435-438 video upload success '${file.name} uploaded successfully!' and error 'Upload failed:...'.
- vNext now: src/components/courses/super-admin-content-authoring.tsx:30-32 instead states binary upload unavailable; no matching success path.
- Fix: Support upload and progress/toast feedback once secure storage actor is ready.

## G2-17-003-034  [P1] GAP  facet F12  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:146-150 selectedClassIdForView 0 generic; :641-647 allows content scoped to one class or all.
- vNext now: src/components/courses/super-admin-content-authoring.tsx:26-29 default audience='OFFERING' and deliveryId=null for superadmin authoring, no wrapper class chooser.
- Fix: Expose Section-specific audience selector and class/section content edit path.

## G2-17-003-049  [P1] GAP  facet F20  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:162-166 upload target binds file to 'new' or specific edit ID to prevent cross-item media mixup.
- vNext now: src/components/courses/super-admin-content-authoring.tsx:30-32 no upload path for admin; separate VideoManager when enabled uses lessonId and selection.
- Fix: Carry upload/edit target isolation into admin video uploader if implemented.

## G2-17-003-051  [P1] GAP  facet F21  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:400-447 integrates presigned R2 and URL import (first party storage); no scheduling job in wrapper.
- vNext now: src/components/courses/super-admin-content-authoring.tsx:30-32 states storage actor bucket/scanner/migration pending; src/modules/courses/lesson-content-service.ts:100-110 stores metadata only.
- Fix: Complete secure upload integration rather than replacing it with informational paragraph.

## G2-19-002-027  [P1] GAP  facet F06  effort L
- Legacy: Legacy creation first requires `Course`, `Lesson`, `Faculty` as separate selectors `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1170-1231`
- vNext now: vNext authoring picker preselects first lesson and doesn't expose Faculty `src/components/courses/super-admin-content-authoring.tsx:11-29`
- Fix: Offer separate Course/Lesson/Faculty fields and selected-college options as legacy.

## G2-19-002-031  [P1] GAP  facet F06  effort M
- Legacy: Legacy `Faculty` is required with exact message `Select a faculty member` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1220-1230`
- vNext now: vNext authoring has no Faculty picker `src/components/courses/super-admin-content-authoring.tsx:18-32`
- Fix: Add verified faculty attribution or document immutable `createdByUserId` decision.

## G2-19-002-032  [P1] GAP  facet F06  effort M
- Legacy: Legacy Video length auto from uploaded browser file or InputNumber 1-86400 `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:400-408` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1341-1355`
- vNext now: vNext video asset upload supports duration 1-maximum; Videos page cannot upload and only YOUTUBE form `src/components/courses/super-admin-content-authoring.tsx:10-32` `src/modules/courses/lesson-video-service.ts:45-55`
- Fix: Offer duration prefill plus field on binary flow once restored.

## G2-19-002-058  [P1] GAP  facet F11  effort L
- Legacy: Legacy can create on behalf of a selected faculty `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:256-268` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1220-1231`
- vNext now: vNext records `createdByUserId=context.user.id`, no delegated author selection `src/modules/courses/lesson-content-service.ts:449-457` `src/components/courses/super-admin-content-authoring.tsx:20-29`
- Fix: Define delegated faculty author semantics, require scoped faculty membership on write.

## G2-19-002-059  [P1] GAP  facet F12  effort M
- Legacy: Legacy video VIDEO and YOUTUBE creation alongside LIVE_CLASS, shared course/lesson selection `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:96-114` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1275-1301`
- vNext now: vNext kind-specific typed schema, Videos author only YOUTUBE `src/modules/courses/super-admin-content-directory-model.ts:17-20` `src/components/courses/super-admin-content-authoring.tsx:9-32`
- Fix: Implement full allowed content-kind transitions with equivalent authored types.

## G2-19-002-070  [P1] GAP  facet F14  effort L
- Legacy: Legacy upload via R2 presign plus best-effort orphan cleanup on failed create `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:400-435` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:669-687`
- vNext now: vNext video service uses private grant, completion and scan states; direct admin cannot upload `src/modules/courses/lesson-video-service.ts:197-288` `src/components/courses/super-admin-content-authoring.tsx:30-32`
- Fix: Wire secure storage grant/completion for acting Super Admin; preserve cleanup and orphan review.

## G2-19-002-078  [P1] MISSING  facet F17  effort M
- Legacy: Legacy upload drag zone visible click/drag instructions and `Progress` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1368-1400`
- vNext now: vNext disabled video upload instead of equivalent drop zone `src/components/courses/super-admin-content-authoring.tsx:30-32`
- Fix: Restore keyboard file picker + dropzone progress semantics.

## G2-19-002-090  [P1] GAP  facet F21  effort L
- Legacy: Legacy AdminService imports validateVideoUrl/importVideoFromUrl/R2 upload `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:5-26` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:467-528`
- vNext now: vNext SuperAdmin wrapper depends on faculty authoring, disabled binary upload, video service `src/components/courses/super-admin-content-authoring.tsx:5-32` `src/modules/courses/lesson-video-service.ts:197-288`
- Fix: Map presigned upload, stored-object cleanup, secure validation and URL import integration contracts.

## G2-9-025-034  [P1] MISSING  facet F08  effort M
- Legacy: Resource files uploaded toast `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:239-244`
- vNext now: No upload flow or success toast `src/components/courses/super-admin-content-authoring.tsx:16-36` `src/components/courses/faculty-lesson-authoring.tsx:274-299`
- Fix: Add post-upload confirmation and handles for retry.

## G2-9-025-063  [P1] GAP  facet F19  effort L
- Legacy: Class options fetched per selected course and reused for class-specific authoring `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:173-177`
- vNext now: SA authoring picker limited 500 active lessons and always deliveryId null `src/modules/courses/super-admin-content-authoring-service.ts:9-28` `src/components/courses/super-admin-content-authoring.tsx:20-29`
- Fix: Make section delivery selectable, support >500 lessons via search/pagination.
