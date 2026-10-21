# Work packet (wave 2): edit src/modules/courses/lesson-content-service.ts

27 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l13-u027-faculty-lesson-content-controller.md, docs/audit/gap2/lane-17/superadmin-lesson-content-wrapper.md, docs/audit/gap2/lane-20/lesson-controller.md, docs/audit/gap2/lane-3/lesson-content-controller.md

## G2-13-027-009  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyLessonContentController.java:71-73 — classId optional, only requireAccessClass if positive
- vNext now: src/modules/courses/lesson-content-service.ts:337-345,408-426 — optional deliveryId, path checks
- Fix: Map historic class-specific scope to delivery selection and generic authoring.

## G2-13-027-012  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LessonContentsDTO.java:12-27 — @Min(1) lesson/content IDs, @NotNull type, @NotBlank @Size255 title
- vNext now: src/modules/courses/lesson-content-service.ts:395-406 — Zod createLessonContentInputSchema and lesson scope
- Fix: Crosswalk legacy snake_case and numeric identifier rules to UUID/Zod.

## G2-13-027-037  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:288-320 — lesson contents fetched and combined by lesson/class
- vNext now: src/modules/courses/lesson-content-service.ts:283-392 — list ordered sequence, creation, ID with delivery/generic audience
- Fix: Verify list order and audience inclusion for legacy class-specific entries.

## G2-13-027-043  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LessonContentsDTO.java:20-31 — facultyId/classId/courseId numeric; long sequence, points
- vNext now: src/modules/courses/lesson-content-service.ts:100-118,449-457 — UUID lesson/delivery, createdBy user ID
- Fix: Describe faculty ownership, class targeting, and allowed point ranges per content kind.

## G2-17-003-052  [P2] GAP  facet F22  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:641-647 legacy DTO supports content types VIDEO/YOUTUBE/LIVE_CLASS with classId 0 or section.
- vNext now: src/modules/courses/lesson-content-service.ts:100-110 stores lessonId, optional deliveryId, contentType, notes; schema normalized to UUID and scope.
- Fix: Document migration from integer classId 0 semantics to nullable UUID deliveryId and enforce exact authorization.

## G2-20-026-002  [P2] GAP  facet F02  effort M
- Legacy: Old lessons and class-specific contents docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonController.java:468-508
- vNext now: New lesson content per delivery src/modules/courses/lesson-content-service.ts:283-391
- Fix: Preserve generic vs specific tabs

## G2-20-026-016  [P2] GAP  facet F14  effort M
- Legacy: Legacy lesson contents and files docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonController.java:468-491
- vNext now: New separate typed lessonContents src/modules/courses/lesson-content-service.ts:283-395
- Fix: Verify files and signed download rules

## G2-3-027-004  [P2] MISSING  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:351-429`
- vNext now: `src/modules/courses/lesson-content-service.ts:283-393`
- Fix: Legacy distinct content metrics and content-grade summary HTTP endpoints not present in lesson-contents route; route to scoped vNext grading/analytics or restore.

## G2-3-027-017  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LessonContents.java:23-46`
- vNext now: `src/modules/courses/lesson-content-service.ts:100-147`
- Fix: Legacy model includes course/class/faculty numeric association, active/enabled toggles; vNext normalized content adds deliveryId/status and authored fields.

## G2-3-027-019  [P2] MISSING  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:411-428`
- vNext now: `src/modules/courses/lesson-content-service.ts:283-393`
- Fix: Implement a scoped grade-summary projection for assessment content: points, learner section, author and course slug equivalent.

## G2-3-027-020  [P2] MISSING  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:375-383`
- vNext now: `src/modules/courses/lesson-content-service.ts:352-392`
- Fix: Legacy returns per-contentType count map; vNext content GET returns rows but no `{metricsResponse}`. Add derived metrics contract where depended on.

## G2-3-027-022  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:439-471`
- vNext now: `src/modules/courses/lesson-content-service.ts:283-393`
- Fix: Legacy faculty assignments optional page/size defaults 0/20, unpaged array if absent; vNext lesson content listing returns unpaged lesson rows.

## G2-3-027-023  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:474-498`
- vNext now: `src/modules/courses/lesson-content-service.ts:283-393`
- Fix: Legacy learner assignments optionally filtered by courseSlug over courseId and paginated; vNext lesson content GET has lessonId/deliveryId/includeArchived only.

## G2-3-027-025  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:501-512`
- vNext now: `src/modules/courses/lesson-content-service.ts:337-392`
- Fix: Legacy distinct courses-with-content list for learner class; vNext returns shared/delivery lesson content rows, not dropdown options.

## G2-3-027-027  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LessonContentsDTO.java:14-32`
- vNext now: `src/modules/courses/lesson-content-service.ts:395-402`
- Fix: Legacy @Min ids @NotBlank title max255 @Min0 points and content type required; vNext parses a typed content schema, map precise response messages.

## G2-3-027-044  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:665-728`
- vNext now: `src/modules/courses/lesson-content-service.ts:463-536`
- Fix: Legacy update allows lesson/class target rescope after authority and current-audience check; vNext update preserves original lesson/delivery ancestry.

## G2-3-027-045  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:730-743`
- vNext now: `src/modules/courses/lesson-content-service.ts:538-607`
- Fix: Legacy delete endpoint soft-deletes content via service; vNext archives with transition POST rather than DELETE on content ID.

## G2-3-027-048  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:91-153`
- vNext now: `src/modules/courses/lesson-content-service.ts:303-335`
- Fix: Legacy content access via class, course or parent lesson with scoped SA college/org checks; vNext resolves offering/delivery and central learner reader, review SA acting-college parity.

## G2-3-027-051  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:298-320`
- vNext now: `src/modules/courses/lesson-content-service.ts:337-365`
- Fix: Legacy learner-specific class resolution falls back to home/elective audience; vNext deliveryId and learner enrollment determine visible content. Verify group-backed elective content.

## G2-3-027-053  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:287-324`
- vNext now: `src/modules/courses/lesson-content-service.ts:368-392`
- Fix: Legacy content read follows `sequence` and per-class override; vNext sorts sequence, createdAt, id and then optional delivery order if staged migration enabled.

## G2-3-027-055  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:439-471`
- vNext now: `src/modules/courses/lesson-content-service.ts:283-393`
- Fix: Legacy unpaged option keeps original service result order; vNext lesson read uses deterministic sequence/createdAt/id, faculty assignment list absent in this service.

## G2-3-027-057  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:91-101`
- vNext now: `src/modules/courses/lesson-content-service.ts:352-385`
- Fix: Legacy hidden/inactive/deleted content becomes learner 404 at item read; vNext PUBLISHED content plus path/lesson visible gate, not same `active&&enabled` flags.

## G2-3-027-069  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:634-643`
- vNext now: `src/modules/courses/lesson-content-service.ts:283-308`
- Fix: Legacy per-ID read for bookmarked content performs explicit ancestry scope and sanitized output; vNext lesson list by ID with no direct GET content ID route changes deep-link accessibility.

## G2-3-027-074  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:439-498`
- vNext now: `src/modules/courses/lesson-content-service.ts:283-393`
- Fix: Legacy page/size pagination optionally avoids materializing all assignments; vNext generic list loads all lesson rows with no pagination.

## G2-3-027-076  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:351-428`
- vNext now: `src/modules/courses/lesson-content-service.ts:283-393`
- Fix: Legacy content metrics calculated in-memory over class-scoped rows; vNext list returns raw rows and frontend must aggregate or call separate scoped analytic service.

## G2-3-027-078  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:665-728`
- vNext now: `src/modules/courses/lesson-content-service.ts:494-535`
- Fix: Legacy uses optimistic lock/version on lesson_contents; vNext update guards stable ancestry and status without explicit version token; verify concurrency lost-update protection.

## G2-3-027-084  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LessonContentsDTO.java:24-37`
- vNext now: `src/modules/courses/lesson-content-service.ts:100-147`
- Fix: Legacy ContentType enum covers assignment/video/youtube/lecture/ppt/pdf etc; vNext normalized RESOURCE/VIDEO/YOUTUBE/LIVE_CLASS and separate assignment/quiz tables.
