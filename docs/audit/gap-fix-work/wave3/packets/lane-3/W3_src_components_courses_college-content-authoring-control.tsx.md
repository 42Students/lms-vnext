# Work packet (wave 3): edit src/components/courses/college-content-authoring-control.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/college-admin-lesson-content.md

## G2-18-007-011  [P1] MISSING  facet F03  effort L
- Legacy: Legacy Video content types `Video (Upload)` and `YouTube Video` selectable (`LessonContent.js:96-107,1283-1300`).
- vNext now: New Videos authoring only `kind=YOUTUBE` (`college/videos/page.tsx:32-37`; `college-content-authoring-control.tsx:13,53`).
- Fix: Add VIDEO Upload content-type option and supported auth upload flow.

## G2-18-007-025  [P1] MISSING  facet F05  effort L
- Legacy: Old class drag-drop/keyboard reorder saves whole contentIds array (`LessonContent.js:934-965,1666-1702`).
- vNext now: New Order number patches one row's sequence (`college-content-authoring-control.tsx:116-131,264-269`).
- Fix: Restore section-specific atomic multirow drag-and-keyboard reorder.

## G2-18-007-030  [P1] MISSING  facet F06  effort L
- Legacy: Old VIDEO Dragger accepts file and probes duration, shows progress (`LessonContent.js:365-452,1753-1836`).
- vNext now: New YOUTUBE form has no upload or progress, duration manually entered (`college-content-authoring-control.tsx:63-115,180-188`).
- Fix: Implement secure presign upload with progress/duration and replacement.

## G2-18-007-036  [P1] MISSING  facet F06  effort L
- Legacy: Old Resource add form supports multiple files, HTTPS link, optional link title, notes (`AdminResources.js:388-405`).
- vNext now: New Resource creation supports URL/notes but no files or link title (`college-content-authoring-control.tsx:180-185,223-225`).
- Fix: Embed mixed material composer on new Resource, not only existing.

## G2-18-007-050  [P1] MISSING  facet F09  effort L
- Legacy: Old current VIDEO file preview and replacement file Upload with progress (`LessonContent.js:1753-1836`).
- vNext now: New only URL optional-keep-on-edit, no file replacement (`college-content-authoring-control.tsx:54-58,180-182`).
- Fix: Implement secure Current File/View/Replace File modal and cleanup.

## G2-18-007-052  [P1] MISSING  facet F10  effort L
- Legacy: Old Resource uploads to R2 folder lesson-content/course/class via uploadResourceFile (`AdminResources.js:210-239`).
- vNext now: New new Resource sends metadata JSON only (`college-content-authoring-control.tsx:63-115`).
- Fix: Add signed upload/material attach flow for create.

## G2-18-007-065  [P1] MISSING  facet F14  effort L
- Legacy: Old VIDEO presign upload, progress, orphan cleanup (`LessonContent.js:400-452,675-688`).
- vNext now: New YOUTUBE has no VIDEO upload (`college-content-authoring-control.tsx:63-115`).
- Fix: Create VIDEO file upload with receipt, safe cleanup and duration metadata.

## G2-18-007-066  [P1] MISSING  facet F14  effort L
- Legacy: Old Resources accepts multiple approved files (PDF/office/text/image), max20 (`AdminResources.js:18-19,210-243`).
- vNext now: New new-resource editor has no file picker (`college-content-authoring-control.tsx:180-185`).
- Fix: Offer mixed file+link creator and upload progress.
