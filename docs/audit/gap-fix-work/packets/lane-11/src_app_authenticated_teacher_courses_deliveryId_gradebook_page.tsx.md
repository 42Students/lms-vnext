# Work packet: edit src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l15-u031-learning-flow-cross-cutting.md

## G2-15-031-036  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:94-96`
- vNext now: `src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/page.tsx:113-149`
- Fix: Old present = roster minus absent conflates unmarked; new published gradebook leaves missing results unknown.
