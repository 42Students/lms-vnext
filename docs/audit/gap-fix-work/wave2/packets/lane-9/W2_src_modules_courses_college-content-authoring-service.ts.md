# Work packet (wave 2): edit src/modules/courses/college-content-authoring-service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/college-admin-lesson-content.md

## G2-18-007-024  [P2] GAP  facet F05  effort M
- Legacy: Old Class reorder includes all content kinds, disables out-of-tab Edit/Delete (`LessonContent.js:1080-1107,1040-1072`).
- vNext now: New kind-scoped Existing Content always filters to one contentType (`college-content-authoring-service.ts:58-62`).
- Fix: Include all class content during reorder only; disable other tab mutations.

## G2-18-007-054  [P2] GAP  facet F10  effort M
- Legacy: Old independent API fetches courses/lessons/faculty/sections, separate retries (`LessonContent.js:5-7,1148-1155`).
- vNext now: New options server query limit lessons250, deliveries2000; no faculty (`college-content-authoring-service.ts:22-42`).
- Fix: Add faculty lookup, searchable server paging and independent Retry.

## G2-18-007-076  [P2] GAP  facet F19  effort M
- Legacy: Old Resource load sequence guard ensures latest scope wins, retains stale list on refresh (`AdminResources.js:137-169`).
- vNext now: New server aggregate and `router.refresh()` writes, but existing list is initial first250 (`college-content-authoring-control.tsx:48-52,109-113`; `college-content-authoring-service.ts:58-71`).
- Fix: Use paged scoped GET with stale-request abort and nonblocking refresh.

## G2-18-007-077  [P2] GAP  facet F19  effort M
- Legacy: Old Video table 10/page scoped to lesson/section (`LessonContent.js:1691-1714`).
- vNext now: New server catalogue 25/page and editor first250 (`college-content-aggregate-service.ts:153-159`; `college-content-authoring-service.ts:62-67`).
- Fix: Use 10/page default and server pagination without capped option list.

## G2-18-007-087  [P2] GAP  facet F23  effort M
- Legacy: Old Create Content starts from Course to Lesson picker (`LessonContent.js:1170-1200`).
- vNext now: New disabled create when no active learning-path lessons (`college-content-authoring-control.tsx:153-158`; `college-content-authoring-service.ts:22-33`).
- Fix: Provide direct navigation/setup to add required offering/path/lesson; explain new prerequisite.
