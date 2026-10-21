# Work packet (wave 2): edit src/modules/courses/college-content-aggregate-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/college-admin-lesson-content.md

## G2-18-007-077  [P2] GAP  facet F19  effort M
- Legacy: Old Video table 10/page scoped to lesson/section (`LessonContent.js:1691-1714`).
- vNext now: New server catalogue 25/page and editor first250 (`college-content-aggregate-service.ts:153-159`; `college-content-authoring-service.ts:62-67`).
- Fix: Use 10/page default and server pagination without capped option list.
