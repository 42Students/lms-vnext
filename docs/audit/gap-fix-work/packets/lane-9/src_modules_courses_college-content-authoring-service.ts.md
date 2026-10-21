# Work packet: edit src/modules/courses/college-content-authoring-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/college-admin-lesson-content.md

## G2-18-007-023  [P1] GAP  facet F05  effort L
- Legacy: Old Existing Content filters Course, Lesson, Section; class change refetches (`LessonContent.js:1601-1664`).
- vNext now: New existing list first 250 records, client-filtered by Lesson, Section and free text, no Course (`college-content-authoring-service.ts:43-71`; `college-content-authoring-control.tsx:222-255`).
- Fix: Server-page/filter scoped list by Course/Lesson/Section; remove arbitrary 250 cap.

## G2-18-007-045  [P2] GAP  facet F08  effort M
- Legacy: Old Resource error `Could not load courses` and `Could not load lessons` separate Alerts (`AdminResources.js:89-133,329-334`).
- vNext now: New options error causes failure of server page, not isolated child Alert (`college/resources/page.tsx:33-38`; `college-content-authoring-service.ts:11-42`).
- Fix: Render partial page with legacy dependency alerts and refresh action.
