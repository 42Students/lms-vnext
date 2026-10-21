# Work packet: edit src/components/courses/faculty-lesson-authoring.tsx (part 2 of 2)

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/teacher-all-assignments.md, docs/audit/gap2/lane-9/superadmin-admin-resources.md, docs/audit/gap2/lane-1/l13-u027-faculty-lesson-content-controller.md

## G2-4-012-039  [P2] GAP  facet F08  effort M
- Legacy: Create success Assignment created successfully, 2-second toast. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:490-503`)
- vNext now: New creates draft with inline success and separate Publish. (`src/components/courses/faculty-lesson-authoring.tsx:384-399`; `src/components/courses/faculty-lesson-authoring.tsx:688-690`)
- Fix: Match transient toast and publish semantics.

## G2-9-025-028  [P2] GAP  facet F07  effort M
- Legacy: Requires course, lesson, title length1..255 and at least notes/file/link/html `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:255-263`
- vNext now: Requires title; RESOURCE requires notes or HTTPS URL `src/components/courses/faculty-lesson-authoring.tsx:260-279`
- Fix: Permit file-only and pre-existing HTML-only resource payloads.

## G2-9-025-030  [P2] GAP  facet F07  effort M
- Legacy: Link accepts HTTPS no credentials/spaces, rejects duplicate, fallback title trunc255 `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:246-253`
- vNext now: New HTTPS link validation, single URL; no duplicate check or optional title `src/components/courses/super-admin-content-actions.tsx:41-55` `src/components/courses/faculty-lesson-authoring.tsx:274-296`
- Fix: Reinstate repeatable URL validation, duplicate blocking and link title.

## G2-9-025-031  [P2] GAP  facet F07  effort S
- Legacy: Exact error Choose a course/lesson and enter a Resource title (1–255 characters). `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:257-261`
- vNext now: Generic Enter a title before saving. `src/components/courses/faculty-lesson-authoring.tsx:260-264`
- Fix: Restore old field validation wording/placement.

## G2-9-025-033  [P2] GAP  facet F07  effort S
- Legacy: Exact empty content Add a file, HTTPS link, or notes before saving. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:260-262`
- vNext now: Add notes or an HTTPS resource link. `src/components/courses/faculty-lesson-authoring.tsx:274-279`
- Fix: Restore file alternative in message once upload supported.

## G2-13-027-018  [P3] GAP  facet F08  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyLessonContentController.java:94-97 — Assignment saved response wrapper
- vNext now: src/components/courses/faculty-lesson-authoring.tsx:440-448 — Assignment draft created. after save
- Fix: Align success label and notification severity.

## G2-13-027-019  [P3] GAP  facet F08  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:275-282 — generic content create uses legacy lesson-content response
- vNext now: src/components/courses/faculty-lesson-authoring.tsx:440-449 — Resource saved / video created successfully, clears draft
- Fix: Compare exact toast text, reset and returned IDs.
