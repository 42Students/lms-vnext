# Work packet: edit src/modules/courses/lesson-video-service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/lesson-content.md, docs/audit/gap2/lane-3/lesson-content-controller.md

## G2-19-002-032  [P1] GAP  facet F06  effort M
- Legacy: Legacy Video length auto from uploaded browser file or InputNumber 1-86400 `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:400-408` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1341-1355`
- vNext now: vNext video asset upload supports duration 1-maximum; Videos page cannot upload and only YOUTUBE form `src/components/courses/super-admin-content-authoring.tsx:10-32` `src/modules/courses/lesson-video-service.ts:45-55`
- Fix: Offer duration prefill plus field on binary flow once restored.

## G2-19-002-055  [P1] GAP  facet F10  effort L
- Legacy: Legacy content URL open backed by `getFileUrl` authenticated stream for bare keys `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1008-1026`
- vNext now: vNext list exposes only safe public URL; asset management via separate video service `src/components/courses/super-admin-content-directory-page.tsx:148-149` `src/modules/courses/lesson-video-service.ts:413-436`
- Fix: Add permissioned transient playback URL action for private file-backed content.

## G2-19-002-070  [P1] GAP  facet F14  effort L
- Legacy: Legacy upload via R2 presign plus best-effort orphan cleanup on failed create `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:400-435` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:669-687`
- vNext now: vNext video service uses private grant, completion and scan states; direct admin cannot upload `src/modules/courses/lesson-video-service.ts:197-288` `src/components/courses/super-admin-content-authoring.tsx:30-32`
- Fix: Wire secure storage grant/completion for acting Super Admin; preserve cleanup and orphan review.

## G2-19-002-090  [P1] GAP  facet F21  effort L
- Legacy: Legacy AdminService imports validateVideoUrl/importVideoFromUrl/R2 upload `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:5-26` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:467-528`
- vNext now: vNext SuperAdmin wrapper depends on faculty authoring, disabled binary upload, video service `src/components/courses/super-admin-content-authoring.tsx:5-32` `src/modules/courses/lesson-video-service.ts:197-288`
- Fix: Map presigned upload, stored-object cleanup, secure validation and URL import integration contracts.

## G2-3-027-061  [P1] GAP  facet F14  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:646-663`
- vNext now: `src/modules/courses/lesson-video-service.ts:197-225`
- Fix: Legacy supports signed playback URL by content ID but stored R2 URL remains publicly readable; vNext uses dedicated managed video assets/signed playback. Verify all legacy video/file item affordances.
