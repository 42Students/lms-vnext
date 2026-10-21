# Work packet (wave 2): edit src/modules/placements/drive-day-coordinator-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drive-day-index.md, docs/audit/gap2/lane-11/tpo-drive-day-roundid.md

## G2-11-009-054  [P2] GAP  facet F12  effort M
- Legacy: Legacy business date uses MySQL CURDATE. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:346`
- vNext now: Coordinator business date explicitly Asia/Kolkata. `src/modules/placements/drive-day-coordinator-service.ts:41`
- Fix: Standardize IST date at midnight across both branches.

## G2-11-008-088  [P2] GAP  facet F22  effort M
- Legacy: Separate `assignedRoom` from assignment plus current attendance room. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:360`
- vNext now: Roster projection returns current `room` only. `src/modules/placements/drive-day-coordinator-service.ts:835`
- Fix: Add assigned room field and display precedence.
