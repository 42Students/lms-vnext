# Work packet: edit src/app/api/placements/tpo/drive-day/[roundId]/check-in/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drive-day-roundid.md

## G2-11-008-049  [P1] GAP  facet F10  effort L
- Legacy: POST `/api/v1/tpo/drive-day/{roundId}/mark` accepts applicationId,status,room. `docs/legacy-source/frontend/src/api/Services/TpoHubService.js:125`
- vNext now: POST `/api/placements/tpo/drive-day/{roundId}/check-in` expects confirmed,expectedAttendance,PRESENT/ABSENT. `src/app/api/placements/tpo/drive-day/[roundId]/check-in/route.ts:7`
- Fix: Add full attendance status/room support via guarded operator route.
