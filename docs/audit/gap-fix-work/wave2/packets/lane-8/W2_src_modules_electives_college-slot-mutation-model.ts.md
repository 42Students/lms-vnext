# Work packet (wave 2): edit src/modules/electives/college-slot-mutation-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-electives.md, docs/audit/gap2/lane-4/elective-admin-controller.md

## G2-10-006-030  [P2] GAP  facet F06  effort S
- Legacy: Old minPick max10 and maxPick max10 `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:303-307`
- vNext now: New UI permits max100 for each `src/components/electives/college-slot-manager.tsx:121-124` `src/modules/electives/college-slot-mutation-model.ts:5-9`
- Fix: Clamp user-facing pick controls to 10 unless product owner approves wider range

## G2-4-024-052  [P2] GAP  facet F12  effort M
- Legacy: Legacy minPick<=maxPick; credits 0..30; maxPick unconstrained beyond positive (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:233-255`)
- vNext now: New maxPick<=100 and DB check min<=max (`src/modules/electives/college-slot-mutation-model.ts:5-9`; `src/db/schema/electives.ts:27-30`)
- Fix: Confirm 100 cap; avoid silent rejection for valid legacy values >100.

## G2-4-024-063  [P2] GAP  facet F18  effort M
- Legacy: Legacy errors `Pick range is invalid`, `Name is required`, `Semester must be between 1 and 12` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:233-245`)
- vNext now: New Zod grammar `Maximum picks cannot be below minimum picks` and native validation (`src/modules/electives/college-slot-mutation-model.ts:3-22`)
- Fix: Use exact error catalogue and map service codes to human words.
