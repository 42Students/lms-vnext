# Work packet: edit src/modules/placements/tpo-round-drive-day-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drive-day-roundid.md

## G2-11-008-017  [P1] MISSING  facet F03  effort M
- Legacy: `Call` phone button links via `tel:` where number exists. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:337`
- vNext now: TPO view omits candidate phone by design. `src/modules/placements/tpo-round-drive-day-service.ts:58`
- Fix: Expose phone only to authorized operator view; mask for coordinators.

## G2-11-008-020  [P1] GAP  facet F04  effort M
- Legacy: Roster returns name, roll, branch, photo, phone, current and assigned room. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:350`
- vNext now: TPO projection returns only names, roll, application/result/attendance. `src/modules/placements/tpo-round-drive-day-service.ts:58`
- Fix: Restore operator-only branch, phone, avatar and both rooms.
