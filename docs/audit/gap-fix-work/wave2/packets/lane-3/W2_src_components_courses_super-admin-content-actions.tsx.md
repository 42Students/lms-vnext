# Work packet (wave 2): edit src/components/courses/super-admin-content-actions.tsx

22 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/superadmin-lesson-content-wrapper.md, docs/audit/gap2/lane-19/lesson-content.md, docs/audit/gap2/lane-9/superadmin-admin-resources.md

## G2-17-003-014  [P2] GAP  facet F04  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:601-618 Live Class start/end date and times validated with dayjs plugin.
- vNext now: src/components/courses/super-admin-content-actions.tsx:68-80 validates start/end as ISO selected timezone, formatting via new zone parser.
- Fix: Test legacy local-time interpretation vs explicit zone and preserve displayed labels/error copy.

## G2-19-002-010  [P2] GAP  facet F03  effort M
- Legacy: Legacy table row Edit/Delete icon buttons with per-title tooltip and aria `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1037-1073`
- vNext now: vNext Actions collapsed per article and text buttons `Edit`/`Publish`/`Delete` `src/components/courses/super-admin-content-directory-page.tsx:153-160` `src/components/courses/super-admin-content-actions.tsx:121-128`
- Fix: Use compact icon action-cell controls for desktop and accessible responsive fallback.

## G2-19-002-035  [P2] GAP  facet F06  effort M
- Legacy: Legacy live create four DatePicker/TimePicker controls with 15min steps and default tomorrow/+1h/+2h `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1161-1168` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1469-1522`
- vNext now: vNext mode-specific faculty form; vNext edit uses datetime-local combined fields `src/components/courses/super-admin-content-authoring.tsx:26-29` `src/components/courses/super-admin-content-actions.tsx:150-167`
- Fix: Match initial start/end and 15-minute stepping where allowed; verify create component.

## G2-19-002-036  [P2] GAP  facet F06  effort L
- Legacy: Legacy live meeting zone choices IST, UTC, America/New_York, America/Los_Angeles, Europe/London `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1525-1536`
- vNext now: vNext edit zone choices only IST and UTC `src/components/courses/super-admin-content-actions.tsx:150-160` `src/modules/courses/super-admin-content-datetime-model.ts:3-17`
- Fix: Support legacy zones with DST-safe parsing or explicitly migrate to IST policy.

## G2-19-002-047  [P2] GAP  facet F09  effort M
- Legacy: Legacy edit opens 600px non-mask-dismissible modal titled `Edit Content: <name>` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1720-1730`
- vNext now: vNext inline article `Actions` disclosure, then inline editable fieldset `src/components/courses/super-admin-content-directory-page.tsx:153-160` `src/components/courses/super-admin-content-actions.tsx:105-131`
- Fix: Restore 600px modal for Edit Content and matching dismissal behavior.

## G2-19-002-048  [P2] GAP  facet F09  effort M
- Legacy: Legacy dirty edit cancel triggers `Discard lesson-content edits?` with loss-of-replacement-file explanation `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:740-762`
- vNext now: vNext `window.confirm('Discard content changes?')`, different text, fields and presentation `src/components/courses/super-admin-content-actions.tsx:105-118`
- Fix: Use legacy confirmation copy and include replacement file case.

## G2-19-002-049  [P2] GAP  facet F09  effort S
- Legacy: Legacy delete `Popconfirm`: `Are you sure to delete this content?`, Yes/No `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1057-1073`
- vNext now: vNext browser confirm archive explanation with action `Delete` `src/components/courses/super-admin-content-actions.tsx:92-101` `src/components/courses/super-admin-content-actions.tsx:124-127`
- Fix: Mirror confirmation placement/text; accurately state soft archival.

## G2-19-002-075  [P2] GAP  facet F16  effort M
- Legacy: Legacy table horizontal max-content scroll, small AntD buttons and visible drag handle `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1691-1713` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:75-82`
- vNext now: vNext no horizontal scroll, text buttons min 44px / min 36px md `src/components/courses/super-admin-content-directory-page.tsx:134-163` `src/components/courses/super-admin-content-actions.tsx:121-127`
- Fix: Match responsive desktop density and mobile keyboard-compatible actions.

## G2-19-002-077  [P2] GAP  facet F17  effort S
- Legacy: Legacy row actions embed content-title aria labels `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1053-1072`
- vNext now: vNext repeated plain `Edit`, `Publish`, `Delete` inside each content article `src/components/courses/super-admin-content-actions.tsx:121-127`
- Fix: Give per-content accessible names/linked legend and focus return after mutation.

## G2-9-025-006  [P2] GAP  facet F02  effort M
- Legacy: Old editor is width700 modal titled Add Resource or Edit Resource `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:379-381`
- vNext now: New creation inside details; edit inline collapsible fieldset `src/components/courses/super-admin-content-authoring.tsx:16-36` `src/components/courses/super-admin-content-actions.tsx:119-129`
- Fix: Use 700px modal for both creation and edit.

## G2-9-025-008  [P2] GAP  facet F03  effort M
- Legacy: Table Edit button icon and dangerous Delete with Popconfirm `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:307-322`
- vNext now: Actions hidden in per-row details; Edit, Publish, Delete as text buttons `src/components/courses/super-admin-content-directory-page.tsx:153-161` `src/components/courses/super-admin-content-actions.tsx:120-128`
- Fix: Expose Edit/Delete side by side in Actions column and keep Publish secondary.

## G2-9-025-025  [P2] GAP  facet F06  effort M
- Legacy: Visibility switch and Upload-icon Create Resource/Save changes controls `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:404-410`
- vNext now: PublishNow flag; Save text no upload icon and different layout `src/components/courses/faculty-lesson-authoring.tsx:118-119` `src/components/courses/super-admin-content-actions.tsx:169-170`
- Fix: Match switch/submit button copy/icons.

## G2-9-025-037  [P2] GAP  facet F09  effort M
- Legacy: Editor Modal width700, maskClosable false, error alert and Cancel `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:379-413`
- vNext now: Create details and inline edit, no modal `src/components/courses/super-admin-content-authoring.tsx:16-36` `src/components/courses/super-admin-content-actions.tsx:129-175`
- Fix: Match modal geometry, button order and focus restore.

## G2-9-025-038  [P2] GAP  facet F09  effort S
- Legacy: Unsaved changes window.confirm Discard the changes to this resource? `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:203-208`
- vNext now: Creation uses confirm dialog for draft; edit native Discard resource changes? `src/components/courses/faculty-lesson-authoring.tsx:135-152` `src/components/courses/super-admin-content-actions.tsx:105-118`
- Fix: Use exact old discard text and include links/material changes.

## G2-9-025-039  [P2] GAP  facet F09  effort M
- Legacy: Popconfirm title Delete this resource?, description Students will no longer see it. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:317-321`
- vNext now: Native window.confirm combines title and description; transitions ARCHIVE `src/components/courses/super-admin-content-actions.tsx:92-101`
- Fix: Show legacy danger Popconfirm and confirm label Delete.

## G2-9-025-041  [P2] GAP  facet F10  effort M
- Legacy: Legacy update/delete lesson contents via AdminService `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:286-287,296-305`
- vNext now: PATCH metadata and POST transition action ARCHIVE, not physical delete `src/components/courses/super-admin-content-actions.tsx:84-101`
- Fix: Document transition and preservation contract.

## G2-9-025-048  [P2] MISSING  facet F12  effort M
- Legacy: Materials duplicate URL check, title 255 `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:246-253`
- vNext now: Edited content has one replacementUrl and notes only `src/components/courses/super-admin-content-actions.tsx:41-62`
- Fix: Support individual material item edits without overwriting other links.

## G2-9-025-058  [P2] GAP  facet F17  effort M
- Legacy: Selector/input labels, native file picker and Remove file aria-label `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:336-359,383-405`
- vNext now: New filters labelled but hidden authoring, no per-material remove controls `src/components/courses/super-admin-content-directory-page.tsx:93-131` `src/components/courses/super-admin-content-actions.tsx:120-145`
- Fix: Restore authoring accessibility with file alt/status and per-item actions.

## G2-9-025-060  [P2] GAP  facet F18  effort S
- Legacy: Old Add Resource, Refresh, Create Resource, Save changes, Visible to students copy `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:360-361,379-410`
- vNext now: New Add resource, Save, Publish/Delete vocabulary `src/components/courses/super-admin-content-authoring.tsx:16-18` `src/components/courses/super-admin-content-actions.tsx:119-175`
- Fix: Match exact action case/wording.

## G2-9-025-067  [P2] GAP  facet F21  effort M
- Legacy: Delete calls separate lessonContent deletion service `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:296-305`
- vNext now: Archive transition with content activity state `src/components/courses/super-admin-content-actions.tsx:92-104`
- Fix: Document retention differences and descendants/visibility semantics.

## G2-19-002-082  [P3] GAP  facet F18  effort S
- Legacy: Legacy inline sample title `e.g., Introduction Video`, URL `https://www.youtube.com/watch?v=...`, meeting `e.g., https://zoom.us/j/... or https://meet.google.com/...` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1275-1281` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1440-1466`
- vNext now: vNext link replacement placeholder `New HTTPS link (blank keeps saved link)` `src/components/courses/super-admin-content-actions.tsx:138-142`
- Fix: Match legacy form placeholders for create and edit where meaning equivalent.

## G2-9-025-061  [P3] GAP  facet F18  effort S
- Legacy: Link placeholder https://example.org/reading; Link title (optional) `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:391-394`
- vNext now: Replacement link placeholder New HTTPS link (blank keeps saved link) `src/components/courses/super-admin-content-actions.tsx:138-142`
- Fix: Restore appropriate create/edit specific placeholders.
