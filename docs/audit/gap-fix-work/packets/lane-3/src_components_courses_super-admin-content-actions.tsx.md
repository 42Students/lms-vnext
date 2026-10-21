# Work packet: edit src/components/courses/super-admin-content-actions.tsx

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/lesson-content.md, docs/audit/gap2/lane-17/superadmin-lesson-content-wrapper.md, docs/audit/gap2/lane-9/superadmin-admin-resources.md

## G2-19-002-034  [P1] GAP  facet F06  effort M
- Legacy: Legacy `Visible to students` checkbox defaults true `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1554-1556`
- vNext now: vNext content DB visible true but lifecycle status DRAFT until explicit Publish `src/db/schema/courses.ts:400-404` `src/components/courses/super-admin-content-actions.tsx:124-126`
- Fix: Explain create visibility transition and preserve explicit draft/publish controls without accidental learner exposure.

## G2-19-002-052  [P1] GAP  facet F10  effort M
- Legacy: Legacy PUT `/api/v1/lesson/contents/update/{id}` and DELETE `/delete/{id}` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:665-732`
- vNext now: vNext PATCH `/api/courses/lesson-contents/{id}` and POST `/transition` PUBLISH/ARCHIVE `src/components/courses/super-admin-content-actions.tsx:83-101`
- Fix: Document soft-delete/archive, publish state, and old-link route compatibility.

## G2-19-002-087  [P1] GAP  facet F20  effort L
- Legacy: Legacy upload targets new vs edited content, protects against reusing another file `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:426-428` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:798-807`
- vNext now: vNext SuperAdmin edit only metadata/links, no file-replace control `src/components/courses/super-admin-content-actions.tsx:129-149`
- Fix: Implement target-bound video replacement and stale upload guard with private file lifecycle.

## G2-17-003-023  [P2] GAP  facet F07  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:630-638 warns sequence >=1 and points >=0 with specific copy.
- vNext now: src/components/courses/faculty-lesson-video-manager.tsx:144-146 requires Points 0..1000 and src/components/courses/super-admin-content-actions.tsx:36-40 validates order index; wording differs.
- Fix: Map validation limits and error messages for equivalent content types.

## G2-19-002-037  [P2] GAP  facet F07  effort S
- Legacy: Legacy missing title emits `Please enter a content title` toast `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:539-544`
- vNext now: vNext edit emits `Enter a title and valid Order.` `src/components/courses/super-admin-content-actions.tsx:34-39`
- Fix: Restore field-specific validation copy for title and order.

## G2-19-002-039  [P2] GAP  facet F07  effort S
- Legacy: Legacy missing Youtube `Please enter a YouTube URL` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:559-565` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1440-1448`
- vNext now: vNext secure HTTPS validation emits `Enter a secure HTTPS link for this content.` / YouTube host failure `src/components/courses/super-admin-content-actions.tsx:41-54`
- Fix: Retain exact required-field feedback; keep stronger HTTPS/host security.

## G2-19-002-041  [P2] GAP  facet F07  effort S
- Legacy: Legacy allowed sequence >=1 and points >=0 `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:628-639`
- vNext now: vNext editor Order between 1 and 10001; storage sequence>=0, points 0-1000 `src/components/courses/super-admin-content-actions.tsx:34-40` `src/db/schema/courses.ts:433-440`
- Fix: Document explicit upper-bound difference and unify labels/validation messages.

## G2-19-002-044  [P2] GAP  facet F08  effort S
- Legacy: Legacy edit success `Lesson content updated successfully!` and refresh selected lesson table `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:899-906`
- vNext now: vNext notice `Content updated.` then router.refresh `src/components/courses/super-admin-content-actions.tsx:83-89`
- Fix: Use exact success wording, toast placement and update current row.

## G2-19-002-045  [P2] GAP  facet F08  effort S
- Legacy: Legacy delete success `Lesson content deleted successfully!` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:912-922`
- vNext now: vNext `Content archived.` or `Resource deleted.` `src/components/courses/super-admin-content-actions.tsx:92-103`
- Fix: Clarify archive-vs-delete semantics and align human copy.

## G2-9-025-030  [P2] GAP  facet F07  effort M
- Legacy: Link accepts HTTPS no credentials/spaces, rejects duplicate, fallback title trunc255 `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:246-253`
- vNext now: New HTTPS link validation, single URL; no duplicate check or optional title `src/components/courses/super-admin-content-actions.tsx:41-55` `src/components/courses/faculty-lesson-authoring.tsx:274-296`
- Fix: Reinstate repeatable URL validation, duplicate blocking and link title.

## G2-9-025-032  [P2] GAP  facet F07  effort S
- Legacy: Exact invalid URL Enter a valid HTTPS link without credentials or spaces. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:248-249`
- vNext now: Error Enter a secure HTTPS link for this content. or not publicly reachable `src/components/courses/super-admin-content-actions.tsx:42-54`
- Fix: Match old invalid link message, preserve stricter network security.

## G2-9-025-036  [P2] GAP  facet F08  effort S
- Legacy: Resource deleted toast, error Could not delete resource `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:297-305`
- vNext now: Resource deleted. on archive and error Unable to update content. `src/components/courses/super-admin-content-actions.tsx:92-104`
- Fix: Separate specific delete failure and retain lifecycle truth.

## G2-9-025-035  [P3] GAP  facet F08  effort S
- Legacy: Success Resource created/Resource updated without terminal period `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:286-293`
- vNext now: Edit success Resource updated. with period; create generic FacultyLessonAuthoring receipt `src/components/courses/super-admin-content-actions.tsx:85-89`
- Fix: Match exact success punctuation and operation.
