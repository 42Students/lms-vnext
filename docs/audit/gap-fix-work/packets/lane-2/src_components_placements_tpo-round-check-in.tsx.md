# Work packet: edit src/components/placements/tpo-round-check-in.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drive-day-roundid.md

## G2-11-008-015  [P1] MISSING  facet F03  effort M
- Legacy: Full operators may mark `In interview`. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:331`
- vNext now: TPO check-in only allows PRESENT/ABSENT. `src/components/placements/tpo-round-check-in.tsx:18`
- Fix: Add operator IN_INTERVIEW button and transition API.

## G2-11-008-016  [P1] MISSING  facet F03  effort M
- Legacy: Full operators may mark `Done`. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:332`
- vNext now: No DONE action on TPO round. `src/components/placements/tpo-round-check-in.tsx:18`
- Fix: Add DONE button and transition API.

## G2-11-008-036  [P2] GAP  facet F07  effort S
- Legacy: Attendance failure uses error payload or `Could not save`. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:107`
- vNext now: All failures use `Attendance has changed or could not be saved...`. `src/components/placements/tpo-round-check-in.tsx:34`
- Fix: Show concrete backend errors and retain old fallback.

## G2-11-008-039  [P2] MISSING  facet F08  effort S
- Legacy: Absent message says `Marked absent. The student is told today and can dispute.` `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:108`
- vNext now: TPO check-in only refreshes, no success feedback. `src/components/placements/tpo-round-check-in.tsx:37`
- Fix: Show statement only once same-day delivery is implemented.

## G2-11-008-041  [P2] MISSING  facet F08  effort S
- Legacy: Gate inline message includes student name and roll and `marked present`. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:147`
- vNext now: Only router.refresh after success. `src/components/placements/tpo-round-check-in.tsx:37`
- Fix: Show closable last-action banner.
