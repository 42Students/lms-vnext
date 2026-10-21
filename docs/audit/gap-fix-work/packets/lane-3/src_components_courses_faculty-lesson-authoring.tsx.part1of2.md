# Work packet: edit src/components/courses/faculty-lesson-authoring.tsx (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l13-u027-faculty-lesson-content-controller.md, docs/audit/gap2/lane-4/teacher-all-assignments.md, docs/audit/gap2/lane-9/superadmin-admin-resources.md

## G2-13-027-011  [P1] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AssignmentContentWriteService.java:153-198 — assignment 1-30 resources of INSTRUCTIONS/PDF/FILE/LINK
- vNext now: src/components/courses/faculty-lesson-authoring.tsx:372-399,664-669 — quick assignment draft with description; full builder link
- Fix: Make dedicated builder available and document resource count/method parity before publishing.

## G2-13-027-014  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AssignmentContentWriteService.java:37-39,153-198 — resource enum, allowed methods and link/file validation
- vNext now: src/components/courses/faculty-lesson-authoring.tsx:384-399 — quick draft does not pass resources or allowed methods
- Fix: Ensure full builder preserves legacy content resources/submission method settings.

## G2-13-027-028  [P1] GAP  facet F13  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AssignmentContentWriteService.java:105-148 — file receipt invalid/unavailable rejects with explicit retry
- vNext now: src/components/courses/faculty-lesson-authoring.tsx:1167-1173 — file/video upload hidden until signed receipts available
- Fix: Expose upload with secure signed receipts when ready; distinguish unavailable vs no options.

## G2-13-027-029  [P1] GAP  facet F14  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LessonContentsDTO.java:28,34-47 — ContentDataDTO resources and deadline supplied together
- vNext now: src/components/courses/faculty-lesson-authoring.tsx:372-399,825-840 — assignment quick form sends description/due/points, full builder separate
- Fix: Ensure resource/method fields are reachable and reviewable before publish.

## G2-13-027-030  [P1] MISSING  facet F14  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AssignmentContentWriteService.java:127-148 — PDF filename/size/cloud-storage tenant-prefix validation
- vNext now: src/components/courses/faculty-lesson-authoring.tsx:1167-1173 — no file authoring in quick form
- Fix: Support PDF/file upload receipts with class/college containment and MIME/size checks.

## G2-4-012-028  [P1] GAP  facet F06  effort M
- Legacy: Points optional blank saves zero; nonblank only integer 1-1000. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:445-450`; `docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:677-694`)
- vNext now: Maximum points required, default 10, permits 0-1000. (`src/components/courses/faculty-lesson-authoring.tsx:103-105`; `src/components/courses/faculty-lesson-authoring.tsx:372-381`; `src/components/courses/faculty-lesson-authoring.tsx:735-751`)
- Fix: Match empty/default/validation behavior.

## G2-4-012-031  [P1] GAP  facet F06  effort M
- Legacy: How Learners Can Submit five choices defaults Written Response only. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:109-110`; `docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:885-905`)
- vNext now: New JSONB default grants all five methods; create sends none. (`src/db/schema/assessments.ts:49-59`; `src/components/courses/faculty-lesson-authoring.tsx:384-398`)
- Fix: Restore checkbox controls and default WRITTEN_RESPONSE.

## G2-4-012-037  [P1] MISSING  facet F07  effort M
- Legacy: Missing resource or title and no submission methods each show unique warning. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:355-375`; `docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:412-420`)
- vNext now: New builder has no resources/method picker and no checks. (`src/components/courses/faculty-lesson-authoring.tsx:384-398`)
- Fix: Restore separate exact warnings and form focus.

## G2-4-012-048  [P1] GAP  facet F10  effort L
- Legacy: Legacy create POST createLessonContent with lesson/content type, canonical deadline, points, resources/methods. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:456-491`; `docs/legacy-source/frontend/src/api/Services/courseServices.js:292-302`)
- vNext now: New POST /api/courses/assignments with lessonId/deliveryId,title,description,dueAt,maxPoints,sequence. (`src/components/courses/faculty-lesson-authoring.tsx:384-398`)
- Fix: Map missing scope/resources/methods and preserve wire validation.

## G2-4-012-053  [P1] GAP  facet F11  effort M
- Legacy: Legacy permits teacher CLASS/SHARED creation, but locks visibility on edit. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:86-97`; `docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:579-593`)
- vNext now: New fixed delivery scope and badge Shared Offering for existing rows. (`src/components/courses/faculty-lesson-authoring.tsx:384-398`; `src/components/courses/faculty-assessment-overview.tsx:174-177`)
- Fix: Restore authorized creation scope and edit immutability.

## G2-4-012-092  [P1] GAP  facet F23  effort L
- Legacy: Old creation publishes immediately with resources/methods. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:456-491`)
- vNext now: New DRAFT by default, no resource/method fields. (`src/components/courses/faculty-lesson-authoring.tsx:384-399`; `src/db/schema/assessments.ts:46-59`)
- Fix: Document owner approval for deviations or fix.

## G2-9-025-011  [P1] GAP  facet F03  effort M
- Legacy: Visible to students switch in editor, defaults true on creation `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:404-406`
- vNext now: New publishNow toggle and effective publish ancestry; no direct visible flag in SA editor `src/components/courses/faculty-lesson-authoring.tsx:118-119` `src/modules/courses/super-admin-content-directory-model.ts:43-51`
- Fix: Support explicit visibility state with correct published ancestry and audience.

## G2-9-025-024  [P1] MISSING  facet F06  effort M
- Legacy: Materials list each File/Link title with remove icon `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:395-403`
- vNext now: Form submits one URL and notes; no itemized materials list `src/components/courses/faculty-lesson-authoring.tsx:274-299`
- Fix: Add repeatable material list with remove operation and counts.

## G2-9-025-029  [P1] MISSING  facet F07  effort M
- Legacy: 20 material cap, allowed extensions, max50MB each; explicit messages `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:214-219`
- vNext now: No multi-file input so no per-file validation/messages `src/components/courses/faculty-lesson-authoring.tsx:274-279`
- Fix: Implement file count/size/MIME checks matching old copy.

## G2-9-025-034  [P1] MISSING  facet F08  effort M
- Legacy: Resource files uploaded toast `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:239-244`
- vNext now: No upload flow or success toast `src/components/courses/super-admin-content-authoring.tsx:16-36` `src/components/courses/faculty-lesson-authoring.tsx:274-299`
- Fix: Add post-upload confirmation and handles for retry.

## G2-9-025-040  [P1] GAP  facet F10  effort L
- Legacy: POST /api/v1/lesson/contents/create with content_data_dto.resource_materials and class/lesson/course `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:5-15,255-288`
- vNext now: POST /api/courses/lesson-contents with single externalUrl, notes, deliveryId, lesson UUID `src/components/courses/faculty-lesson-authoring.tsx:281-297` `src/app/api/courses/lesson-contents/route.ts:30-49`
- Fix: Add mixed-material storage mapping and audience scoped to delivery.

## G2-9-025-066  [P1] GAP  facet F21  effort L
- Legacy: External R2 signed upload dependency for per-file resources `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:14-16,210-244`
- vNext now: Only lesson content JSON mutation in SA authoring `src/components/courses/faculty-lesson-authoring.tsx:274-299`
- Fix: Map new storage permission, signed upload and malware scanning before enabling attachments.

## G2-9-025-068  [P1] GAP  facet F22  effort L
- Legacy: Legacy resource payload includes resource_materials array, HTML, text, visibility flags, sequence, points `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:266-285`
- vNext now: New flat lesson_contents title,notes,externalUrl,points,sequence,status,deliveryId `src/modules/courses/super-admin-content-directory-service.ts:30-53` `src/components/courses/faculty-lesson-authoring.tsx:281-297`
- Fix: Design structured material child/receipt migration and preserve rich text.

## G2-4-012-033  [P2] GAP  facet F07  effort S
- Legacy: Missing title message Enter assignment title. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:571-576`)
- vNext now: New Enter a title before saving. (`src/components/courses/faculty-lesson-authoring.tsx:260-265`)
- Fix: Use legacy error on title field.

## G2-4-012-034  [P2] GAP  facet F07  effort S
- Legacy: Invalid nonempty points message Enter a whole number from 1 to 1000. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:681-693`)
- vNext now: New message Enter a whole number from 0 to 1000. (`src/components/courses/faculty-lesson-authoring.tsx:373-381`)
- Fix: Match lower bound and text.
