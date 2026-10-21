# Work packet (wave 2): edit src/db/schema/drive-day.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drive-day-roundid.md

## G2-11-008-086  [P2] GAP  facet F22  effort M
- Legacy: Legacy round_attendance fields status, room, marked_by, marked_by_role, marked_at with composite uniqueness. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:395`
- vNext now: vNext UUID row id, round/application composite unique; markedByUserId and timestamps, no role. `src/db/schema/drive-day.ts:62`
- Fix: Record actor role in activity metadata for audit parity.

## G2-11-008-087  [P2] GAP  facet F22  effort M
- Legacy: Legacy reads `WAITING` when attendance row missing; backend accepts WAITING as a write. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:357`
- vNext now: Check constraint permits PRESENT/IN_INTERVIEW/DONE/ABSENT only; null means WAITING. `src/db/schema/drive-day.ts:89`
- Fix: Map reset-to-waiting to deletion and verify with migration tests.
