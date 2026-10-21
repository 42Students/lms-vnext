# Work packet (wave 2): edit src/components/courses/super-admin-content-authoring.tsx

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/superadmin-lesson-content-wrapper.md, docs/audit/gap2/lane-19/lesson-content.md, docs/audit/gap2/lane-9/superadmin-admin-resources.md

## G2-17-003-005  [P2] GAP  facet F02  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:111-114 video/live tab title and help, :117-176 has course/class selectors and author form.
- vNext now: src/components/courses/super-admin-content-directory-page.tsx:86-92 headline and authoring module initially closed details via src/components/courses/super-admin-content-authoring.tsx:16-19.
- Fix: Expose primary lesson authoring form without extra closed disclosure click.

## G2-17-003-010  [P2] GAP  facet F03  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:360-361 separate Add Resource/Refresh controls always visible after lesson selection.
- vNext now: src/components/courses/super-admin-content-authoring.tsx:16-17 all Add actions nested inside collapsed disclosure; src/components/courses/super-admin-content-directory-page.tsx:85-168 no Refresh content button.
- Fix: Expose primary Add/Refresh buttons as legacy top controls.

## G2-19-002-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy create-left and Existing Content-right `Row gutter={24}` `Col xs24 lg12` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1144-1147` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1571-1574`
- vNext now: vNext collapsed authoring `<details>` above filters and article list `src/components/courses/super-admin-content-authoring.tsx:16-35` `src/components/courses/super-admin-content-directory-page.tsx:85-93` `src/components/courses/super-admin-content-directory-page.tsx:134-165`
- Fix: Restore desktop side-by-side Add and Existing Content cards and mobile stack.

## G2-19-002-009  [P2] GAP  facet F03  effort S
- Legacy: Legacy primary form submit `Add Content` with Plus icon `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1560-1565`
- vNext now: vNext delegates to mode-specific FacultyLessonAuthoring and hidden expansion `src/components/courses/super-admin-content-authoring.tsx:20-30`
- Fix: Preserve Add Content CTA copy/icon and disabled/working states by content kind.

## G2-19-002-035  [P2] GAP  facet F06  effort M
- Legacy: Legacy live create four DatePicker/TimePicker controls with 15min steps and default tomorrow/+1h/+2h `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1161-1168` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1469-1522`
- vNext now: vNext mode-specific faculty form; vNext edit uses datetime-local combined fields `src/components/courses/super-admin-content-authoring.tsx:26-29` `src/components/courses/super-admin-content-actions.tsx:150-167`
- Fix: Match initial start/end and 15-minute stepping where allowed; verify create component.

## G2-19-002-074  [P2] GAP  facet F16  effort M
- Legacy: Legacy grid desktop two half-width Cards (`lg=12`), form subrows sm12 `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1144-1147` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1169-1172` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1571-1574`
- vNext now: vNext one-column author disclosure, md filter grids and stacked article listing `src/components/courses/super-admin-content-authoring.tsx:16-35` `src/components/courses/super-admin-content-directory-page.tsx:93-135`
- Fix: Reproduce lg two-column layout and 24px gutters across breakpoints.

## G2-19-002-081  [P2] GAP  facet F18  effort S
- Legacy: Legacy audience labels `All currently eligible sections for this course`/`One specific section` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1235-1242`
- vNext now: vNext read audience filter labels similar but authoring fixed OFFERING `src/components/courses/super-admin-content-directory-page.tsx:124-126` `src/components/courses/super-admin-content-authoring.tsx:26-29`
- Fix: Match creation audience radio labels and contextual eligibility hint.

## G2-19-002-085  [P2] GAP  facet F19  effort M
- Legacy: Legacy direct video import UI fetches remote URL with validate step `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:467-528`
- vNext now: vNext uploader uses grants and object-storage validation (not exposed to Super Admin) `src/modules/courses/lesson-video-service.ts:197-288` `src/components/courses/super-admin-content-authoring.tsx:30-32`
- Fix: Benchmark import size and async feedback only after hardened workflow restored.

## G2-9-025-005  [P2] GAP  facet F02  effort M
- Legacy: Course, Lesson and Class selectors and Add Resource/Refresh actions in one horizontal Space `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:335-362`
- vNext now: Authoring includes only lesson select behind Add resource; directory filters in separate disclosure `src/components/courses/super-admin-content-directory-page.tsx:93-132` `src/components/courses/super-admin-content-authoring.tsx:16-25`
- Fix: Place three selection controls in primary toolbar with Add Resource/Refresh.

## G2-9-025-006  [P2] GAP  facet F02  effort M
- Legacy: Old editor is width700 modal titled Add Resource or Edit Resource `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:379-381`
- vNext now: New creation inside details; edit inline collapsible fieldset `src/components/courses/super-admin-content-authoring.tsx:16-36` `src/components/courses/super-admin-content-actions.tsx:119-129`
- Fix: Use 700px modal for both creation and edit.

## G2-9-025-007  [P2] GAP  facet F03  effort S
- Legacy: Add Resource primary Plus icon and Refresh button disabled without lesson `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:360-362`
- vNext now: Collapsed Add resource summary, no inline Refresh action `src/components/courses/super-admin-content-authoring.tsx:16-18` `src/components/courses/super-admin-content-directory-page.tsx:85-94`
- Fix: Restore visible Plus icon and scoped Refresh.

## G2-9-025-037  [P2] GAP  facet F09  effort M
- Legacy: Editor Modal width700, maskClosable false, error alert and Cancel `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:379-413`
- vNext now: Create details and inline edit, no modal `src/components/courses/super-admin-content-authoring.tsx:16-36` `src/components/courses/super-admin-content-actions.tsx:129-175`
- Fix: Match modal geometry, button order and focus restore.

## G2-9-025-057  [P2] GAP  facet F16  effort L
- Legacy: Legacy horizontal selector Space then compact Table and 700px modal `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:335-362,379-410`
- vNext now: Responsive 4-col filters, stacked articles, expanded details `src/components/courses/super-admin-content-directory-page.tsx:93-169` `src/components/courses/super-admin-content-authoring.tsx:16-35`
- Fix: Rebuild desktop toolbar/table/modal; maintain mobile tap targets.

## G2-9-025-060  [P2] GAP  facet F18  effort S
- Legacy: Old Add Resource, Refresh, Create Resource, Save changes, Visible to students copy `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:360-361,379-410`
- vNext now: New Add resource, Save, Publish/Delete vocabulary `src/components/courses/super-admin-content-authoring.tsx:16-18` `src/components/courses/super-admin-content-actions.tsx:119-175`
- Fix: Match exact action case/wording.

## G2-19-002-008  [P3] GAP  facet F03  effort S
- Legacy: Legacy create Card header `Add a video` / `Schedule a live class` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1144-1147`
- vNext now: vNext collapsed summary `Add video` / `Add live class` `src/components/courses/super-admin-content-authoring.tsx:16-18`
- Fix: Match exact heading articles and placement.
