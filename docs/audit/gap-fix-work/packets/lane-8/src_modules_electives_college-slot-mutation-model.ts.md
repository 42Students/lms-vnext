# Work packet: edit src/modules/electives/college-slot-mutation-model.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-electives.md, docs/audit/gap2/lane-10/superadmin-electives.md, docs/audit/gap2/lane-4/elective-admin-controller.md

## G2-9-007-051  [P1] GAP  facet F12  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:233-248` — Credits 0-30, minPick>=0, maxPick>=1, name<=150, description<=1000
- vNext now: `src/modules/electives/college-slot-mutation-model.ts:3-22` — Core bounds match except pick max100 in UI/Zod vs old UI max10
- Fix: Align maximum-choice policy and validation

## G2-10-006-032  [P2] GAP  facet F07  effort S
- Legacy: Old name required error Name is required; max150 `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:298-300`
- vNext now: New name HTML required and max150 but no exact error string `src/components/electives/college-slot-manager.tsx:115-116` `src/modules/electives/college-slot-mutation-model.ts:2-3`
- Fix: Show exact field-level old required message

## G2-10-006-033  [P2] GAP  facet F07  effort S
- Legacy: Old invalid academic year message Use consecutive YYYY-YY years, e.g. 2026-27 `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:288-292`
- vNext now: New Zod regex, normalizeSlotYear throws ELECTIVE_YEAR_INVALID `src/modules/electives/college-slot-mutation-model.ts:15-15` `src/modules/electives/college-slot-mutation-model.ts:34-44`
- Fix: Map server code to exact old validation phrase

## G2-4-024-030  [P2] GAP  facet F07  effort M
- Legacy: Legacy slot empty name returns `Name is required`, >150 chars exact limit error (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:233-247`)
- vNext now: New zod required trim max150 and UI native required input (`src/modules/electives/college-slot-mutation-model.ts:3-4`; `src/components/electives/college-slot-manager.tsx:115-118`)
- Fix: Surface exact backend/inline copy for required/max length.

## G2-4-024-031  [P2] GAP  facet F07  effort M
- Legacy: Legacy picks invalid yields `Pick range is invalid` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:241-245`)
- vNext now: New Zod `Maximum picks cannot be below minimum picks` (`src/modules/electives/college-slot-mutation-model.ts:20-22`)
- Fix: Match exact legacy text or document approved revised feedback.

## G2-4-024-032  [P2] GAP  facet F07  effort M
- Legacy: Legacy year invalid `Academic year must use YYYY-YY format, e.g. 2026-27` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:257-281`)
- vNext now: New emits `ELECTIVE_YEAR_INVALID` or Zod regex error; UI placeholder 2026-27 (`src/modules/electives/college-slot-mutation-model.ts:34-44`; `src/components/electives/college-slot-manager.tsx:111-113`)
- Fix: Present exact validation on academicYear field.

## G2-9-007-034  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:289-296` — Invalid year error Use consecutive YYYY-YY years and Name is required
- vNext now: `src/modules/electives/college-slot-mutation-model.ts:11-21` — Zod regex and generic min-length parsing; raw error code surfaced
- Fix: Translate codes to exact form-field error messages
