# Work packet (wave 2): edit src/modules/courses/faculty-ist-month-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u011-teacher-calendar.md

## G2-5-011-063  [P2] GAP  facet F20  effort M
- Legacy: Legacy dates formatted in browser timezone by moment (`docs/legacy-source/frontend/src/components/CalendarComp/CalendarEvents/CalendarEvents.js:18-35`)
- vNext now: vNext explicitly partitions month by Asia/Kolkata boundaries (`src/modules/courses/faculty-ist-month-model.ts:9-18`)
- Fix: Record intentional timezone change and verify boundary sessions midnight, DST-travel users.
