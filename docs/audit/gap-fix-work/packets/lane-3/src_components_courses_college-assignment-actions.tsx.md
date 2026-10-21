# Work packet: edit src/components/courses/college-assignment-actions.tsx

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-admin-assignments.md, docs/audit/gap2/lane-4/superadmin-sections-assignments.md, docs/audit/gap2/lane-4/superadmin-assignments.md

## G2-4-004-031  [P1] GAP  facet F06  effort M
- Legacy: Title field max 255 characters, input placeholder `e.g., Module 1 Project`. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:355-357`)
- vNext now: Title field max 200, no example placeholder. (`src/components/courses/college-assignment-create.tsx:116-118; src/components/courses/college-assignment-actions.tsx:105-107`)
- Fix: Allow 255-character title as in legacy and reproduce placeholder.

## G2-4-004-036  [P1] GAP  facet F06  effort M
- Legacy: Legacy edit fetches full content record/version and includes resources/submission settings. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:90-135; docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:199-218`)
- vNext now: vNext edit fetches full assignment settings, allows title,points,due,instructions,methods but no legacy builder resource list. (`src/components/courses/college-assignment-actions.tsx:77-120`)
- Fix: Add resource editor and version-aware edit parity while preserving vNext concurrency checks.

## G2-4-004-052  [P1] GAP  facet F10  effort M
- Legacy: Legacy creates/edits POST `/api/v1/admin/assignments/content/save` with content_data_dto and resources, edits include lesson_content_id. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:199-235; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentContentWriteController.java:44-60`)
- vNext now: Create POST `/api/courses/assignments`; edit PATCH `/api/courses/assignments/{id}`, JSON different schema, no builder resource writes. (`src/components/courses/college-assignment-create.tsx:71-89; src/components/courses/college-assignment-actions.tsx:34-70`)
- Fix: Port all authoring payload fields/materials and protect edits with optimistic version.

## G2-4-004-055  [P1] GAP  facet F10  effort M
- Legacy: Legacy delete invokes `deleteLessonContent(id)` and confirms existing submissions. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:316-327; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:373-378`)
- vNext now: vNext `ARCHIVE` status transition behind `/api/courses/assignments/{id}/transition` and refuses submitted edits/deletes. (`src/components/courses/college-assignment-actions.tsx:34-70`)
- Fix: Match deletion semantics, archival visibility and restrictions, particularly for submissions already present.

## G2-4-010-031  [P1] GAP  facet F06  effort M
- Legacy: Title field max 255 characters, input placeholder `e.g., Module 1 Project`. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:355-357`)
- vNext now: Title field max 200, no example placeholder. (`src/components/courses/college-assignment-create.tsx:116-118; src/components/courses/college-assignment-actions.tsx:105-107`)
- Fix: Allow 255-character title as in legacy and reproduce placeholder.

## G2-4-010-036  [P1] GAP  facet F06  effort M
- Legacy: Legacy edit fetches full content record/version and includes resources/submission settings. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:90-135; docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:199-218`)
- vNext now: vNext edit fetches full assignment settings, allows title,points,due,instructions,methods but no legacy builder resource list. (`src/components/courses/college-assignment-actions.tsx:77-120`)
- Fix: Add resource editor and version-aware edit parity while preserving vNext concurrency checks.

## G2-4-010-052  [P1] GAP  facet F10  effort M
- Legacy: Legacy creates/edits POST `/api/v1/admin/assignments/content/save` with content_data_dto and resources, edits include lesson_content_id. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:199-235; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentContentWriteController.java:44-60`)
- vNext now: Create POST `/api/courses/assignments`; edit PATCH `/api/courses/assignments/{id}`, JSON different schema, no builder resource writes. (`src/components/courses/college-assignment-create.tsx:71-89; src/components/courses/college-assignment-actions.tsx:34-70`)
- Fix: Port all authoring payload fields/materials and protect edits with optimistic version.

## G2-4-010-055  [P1] GAP  facet F10  effort M
- Legacy: Legacy delete invokes `deleteLessonContent(id)` and confirms existing submissions. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:316-327; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:373-378`)
- vNext now: vNext `ARCHIVE` status transition behind `/api/courses/assignments/{id}/transition` and refuses submitted edits/deletes. (`src/components/courses/college-assignment-actions.tsx:34-70`)
- Fix: Match deletion semantics, archival visibility and restrictions, particularly for submissions already present.

## G2-4-004-040  [P2] GAP  facet F07  effort M
- Legacy: Legacy conflicting edit version says `This assignment changed while you were editing. Reopen it to avoid overwriting someone else's changes.` (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:199-209`)
- vNext now: Says `Another author edited the assignment. Close this form and reopen it before saving.` (`src/components/courses/college-assignment-actions.tsx:61-66`)
- Fix: Use exact collision wording or approve renamed message in copy catalogue.

## G2-4-004-043  [P2] GAP  facet F08  effort M
- Legacy: Legacy create/edit success toast `Assignment created` / `Assignment updated`. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:233-237`)
- vNext now: New create success notice `Assignment draft created. Publish it to let learners submit.`; edit `Assignment updated.` (`src/components/courses/college-assignment-create.tsx:82-89; src/components/courses/college-assignment-actions.tsx:67-69`)
- Fix: Align exact success copy where workflow matches; keep draft disclosure prominently if intentional.

## G2-4-004-044  [P2] GAP  facet F08  effort M
- Legacy: Legacy delete success toast `Assignment deleted` and grade publish summary e.g. `N published · M not yet marked`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:295-326`)
- vNext now: Delete notice `Assignment deleted.` and publish summary `N grade(s) published; ...`. (`src/components/courses/college-assignment-actions.tsx:67-69; src/components/courses/college-assignment-review.tsx:62-69`)
- Fix: Match punctuation and human-readable published/skipped/already-published counts.

## G2-4-007-029  [P2] GAP  facet F08  effort M
- Legacy: Delete toast Assignment deleted. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:316-327`)
- vNext now: New delete feedback Assignment deleted. (period). (`src/components/courses/college-assignment-actions.tsx:61-70`)
- Fix: Match exact legacy interaction and value or explicitly record approved divergence.

## G2-4-010-040  [P2] GAP  facet F07  effort M
- Legacy: Legacy conflicting edit version says `This assignment changed while you were editing. Reopen it to avoid overwriting someone else's changes.` (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:199-209`)
- vNext now: Says `Another author edited the assignment. Close this form and reopen it before saving.` (`src/components/courses/college-assignment-actions.tsx:61-66`)
- Fix: Use exact collision wording or approve renamed message in copy catalogue.

## G2-4-010-043  [P2] GAP  facet F08  effort M
- Legacy: Legacy create/edit success toast `Assignment created` / `Assignment updated`. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:233-237`)
- vNext now: New create success notice `Assignment draft created. Publish it to let learners submit.`; edit `Assignment updated.` (`src/components/courses/college-assignment-create.tsx:82-89; src/components/courses/college-assignment-actions.tsx:67-69`)
- Fix: Align exact success copy where workflow matches; keep draft disclosure prominently if intentional.

## G2-4-010-044  [P2] GAP  facet F08  effort M
- Legacy: Legacy delete success toast `Assignment deleted` and grade publish summary e.g. `N published · M not yet marked`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:295-326`)
- vNext now: Delete notice `Assignment deleted.` and publish summary `N grade(s) published; ...`. (`src/components/courses/college-assignment-actions.tsx:67-69; src/components/courses/college-assignment-review.tsx:62-69`)
- Fix: Match punctuation and human-readable published/skipped/already-published counts.
