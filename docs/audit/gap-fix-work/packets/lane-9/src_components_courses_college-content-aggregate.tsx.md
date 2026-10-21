# Work packet: edit src/components/courses/college-content-aggregate.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/college-admin-lesson-content.md

## G2-18-007-019  [P1] MISSING  facet F04  effort M
- Legacy: Old VIDEO external or file proxy key renders View button (`LessonContent.js:1001-1033`).
- vNext now: New catalogue explicitly omits storage key and playback URL, no View (`college-content-aggregate-service.ts:35-38,82-103`; `college-content-aggregate.tsx:275-279`).
- Fix: Add click-to-resolve signed View endpoint under courses.manage; never include raw key.

## G2-18-007-035  [P1] GAP  facet F06  effort M
- Legacy: Old visibility switch default true in Video and Resource create (`LessonContent.js:1553-1556`; `AdminResources.js:404-405`).
- vNext now: New editor no visibility checkbox, catalogue has visibility mutation (`college-content-authoring-control.tsx:159-221`; `college-content-aggregate.tsx:257-261`).
- Fix: Expose Visible to students in create/edit; persist atomically.
