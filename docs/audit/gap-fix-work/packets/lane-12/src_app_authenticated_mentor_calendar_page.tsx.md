# Work packet: edit src/app/(authenticated)/mentor/calendar/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u004-mentor-calendar.md

## G2-5-004-026  [P1] GAP  facet F06 Forms  effort S
- Legacy: RESCHEDULED and DRAFT may appear via status (docs/legacy-source/frontend/src/pages/mentor/calendar.js:55-63)
- vNext now: Status filter excludes RESCHEDULED and DRAFT (src/modules/projects/mentor-calendar-filter-model.ts:10; src/app/(authenticated)/mentor/calendar/page.tsx:100-106)
- Fix: Add lifecycle filter options to include all stored values.
