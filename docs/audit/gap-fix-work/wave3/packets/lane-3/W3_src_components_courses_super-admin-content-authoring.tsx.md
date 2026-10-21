# Work packet (wave 3): edit src/components/courses/super-admin-content-authoring.tsx

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/superadmin-lesson-content-wrapper.md, docs/audit/gap2/lane-19/lesson-content.md, docs/audit/gap2/lane-9/superadmin-admin-resources.md

## G2-17-003-009  [P1] MISSING  facet F03  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:96-100 offers Video (Upload), YouTube Video, Live Class type choices.
- vNext now: src/components/courses/super-admin-content-authoring.tsx:10,26-32 offers only YOUTUBE when kind VIDEOS and explicitly disables admin binary uploads.
- Fix: Add safe super-admin VIDEO upload implementation with scoped actor/storage checks, not a dead option.

## G2-17-003-037  [P1] MISSING  facet F14  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:400-447 uploads binary videos via presigned R2 URL, :467-526 imports from URL, :158-166 reports progress.
- vNext now: src/components/courses/super-admin-content-authoring.tsx:30-32 disables binary superadmin upload with storage-actor explanation.
- Fix: Complete secure selected-college Super Admin storage actor support, presigned upload and import UI.

## G2-19-002-028  [P1] MISSING  facet F06  effort L
- Legacy: Legacy creation audience defaults ALL, allows SPECIFIC section `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1161-1163` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1233-1271`
- vNext now: vNext superadmin authoring always deliveryId=null, audience `OFFERING`; no section-scoped authoring `src/components/courses/super-admin-content-authoring.tsx:26-29`
- Fix: Add scoped section-delivery authoring with permissioned targeting and eligible-section picker.

## G2-19-002-029  [P1] MISSING  facet F06  effort L
- Legacy: Legacy content type selector offers VIDEO and YOUTUBE in Video tab `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:96-100` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:124-126`
- vNext now: vNext Videos authoring `modes={VIDEOS:['YOUTUBE']}` and binary video upload explicitly disabled `src/components/courses/super-admin-content-authoring.tsx:10` `src/components/courses/super-admin-content-directory-page.tsx:89-91`
- Fix: Implement safe Super Admin video upload after secure uploader/actor storage prerequisites.

## G2-19-002-038  [P1] MISSING  facet F07  effort L
- Legacy: Legacy missing upload `Please upload a file first` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:548-555`
- vNext now: vNext Videos cannot create VIDEO binary from admin page `src/components/courses/super-admin-content-authoring.tsx:30-32`
- Fix: Enable file validation state on restored video upload flow.

## G2-19-002-050  [P1] MISSING  facet F09  effort L
- Legacy: Legacy uploaded file progress bar and success Alert integrated in form `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1368-1400`
- vNext now: vNext Super Admin video authoring disabled, explanatory paragraph `src/components/courses/super-admin-content-authoring.tsx:30-32`
- Fix: Restore upload progress, upload lifecycle state and scanned binary handling.

## G2-19-002-054  [P1] MISSING  facet F10  effort L
- Legacy: Legacy video import Validate/Import API via `validateVideoUrl`, `importVideoFromUrl` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:467-528`
- vNext now: vNext SuperAdmin Videos authoring limited to YOUTUBE; no direct URL import actions `src/components/courses/super-admin-content-authoring.tsx:10-32`
- Fix: Implement secure server fetch+validation with SSRF protection, size/type limits and audit or explicitly deprecate.

## G2-19-002-069  [P1] MISSING  facet F14  effort L
- Legacy: Legacy VIDEO Dragger accepts .mp4/.webm/.mov/.avi, one file `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1361-1388`
- vNext now: vNext admin authoring explicitly disables VIDEO upload `src/components/courses/super-admin-content-authoring.tsx:30-32`
- Fix: Restore file input MIME/extension behavior alongside server validation.

## G2-19-002-071  [P1] MISSING  facet F14  effort L
- Legacy: Legacy VIDEO from URL Validate then Import workflow and specific success messages `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:467-528` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1402-1433`
- vNext now: vNext no URL import controls on admin Videos `src/components/courses/super-admin-content-authoring.tsx:30-32`
- Fix: Restore guarded import with content-length/MIME verification and progress feedback.

## G2-19-002-098  [P1] MISSING  facet F23  effort L
- Legacy: Legacy supports VIDEO and direct video URL import from Videos tab `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:96-100` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1402-1433`
- vNext now: vNext omits VIDEO authoring for superadmin until private bucket/malware/actor migration `src/components/courses/super-admin-content-authoring.tsx:30-32`
- Fix: Owner decide whether storage blocker is acceptable; prioritize secure completion.

## G2-9-025-010  [P1] MISSING  facet F03  effort L
- Legacy: Multi-file upload input accepts selected extensions; disabled during save/upload or 20 materials `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:389-390`
- vNext now: Resource authoring only notes or externalUrl, no file input `src/components/courses/faculty-lesson-authoring.tsx:274-299` `src/components/courses/super-admin-content-authoring.tsx:26-29`
- Fix: Add authenticated R2/GCS signed-upload/file receipt workflow, multi-upload, 20 cap with scan gating.

## G2-9-025-023  [P1] MISSING  facet F06  effort L
- Legacy: Editor fields Title, Notes, Add files, HTTPS link and optional link title `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:383-394`
- vNext now: New resource composer fields title, points, notes, URL; no file list/title input `src/components/courses/faculty-lesson-authoring.tsx:274-296` `src/components/courses/super-admin-content-authoring.tsx:26-29`
- Fix: Restore mixed-material composer fields and file/link titles.
