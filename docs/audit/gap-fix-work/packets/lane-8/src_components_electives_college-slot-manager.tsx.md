# Work packet: edit src/components/electives/college-slot-manager.tsx

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-electives.md, docs/audit/gap2/lane-4/elective-admin-controller.md, docs/audit/gap2/lane-9/college-admin-electives.md

## G2-10-006-025  [P1] GAP  facet F06  effort M
- Legacy: Old Semester numeric Input min1 max12 disabled only for enrolled edit `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:273-286`
- vNext now: New create semester bound by program duration and edit omits term completely `src/components/electives/college-slot-manager.tsx:109-114` `src/components/electives/college-slot-manager.tsx:97-100`
- Fix: Permit identity edits before enrollment history as legacy; lock only when history exists

## G2-10-006-045  [P1] GAP  facet F10  effort L
- Legacy: Old create POST slot and PUT edit slot with same body fields `docs/legacy-source/frontend/src/api/Services/ElectiveService.js:11-15` `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:141-159`
- vNext now: New POST/PATCH /api/academics/elective-slots; edited payload omits academic identity fields `src/components/electives/college-slot-manager.tsx:55-75`
- Fix: Support editing academic identity until enrollment history, with version guard

## G2-10-006-050  [P1] GAP  facet F12  effort M
- Legacy: Old enrollment-history lock prevents changing program semester year credits/pick rules after picks `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:265-296`
- vNext now: New edit omits program semester/year fields entirely but server checks pick rule changes `src/components/electives/college-slot-manager.tsx:97-125` `src/modules/electives/college-slot-mutation-service.ts:64-99`
- Fix: Use hasEnrollmentHistory to dynamically lock only fields legacy locks

## G2-4-024-024  [P1] GAP  facet F06  effort M
- Legacy: Legacy edit can change semester,year only before membership history (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:167-207`)
- vNext now: New edit form hides program/semester/year entirely regardless of history (`src/components/electives/college-slot-manager.tsx:98-114`)
- Fix: Allow eligible pre-allocation academic identity edit with version checks, lock only after history.

## G2-4-024-076  [P1] GAP  facet F23  effort M
- Legacy: Legacy semester/year editable until historical membership, and unlimited-capacity offerings (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:177-212,306-317`)
- vNext now: New edit hides semester/year and requires numeric finite capacity (`src/components/electives/college-slot-manager.tsx:98-114`; `src/modules/electives/service.ts:28-34`)
- Fix: Restore valid legacy controls or mark intentional loss explicitly.

## G2-9-007-028  [P1] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:303-311` — Pick bounds max10; max pick tooltip explains limit
- vNext now: `src/components/electives/college-slot-manager.tsx:121-124` — Bounds max100 with no explanatory tooltip
- Fix: Restore max10 bounds and tooltip subject to policy decision

## G2-9-007-029  [P1] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:258-288` — Allocation history locks semester/year/credits/picks but displays disabled controls
- vNext now: `src/components/electives/college-slot-manager.tsx:97-125` — Edit omits identity controls and allows count submission with server guard
- Fix: Display fields, freeze only with history, align server lock

## G2-9-007-041  [P1] GAP  facet F09  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:181-194` — Unsaved close prompts Discard this elective slot draft or edits, Keep editing
- vNext now: `src/components/electives/college-slot-manager.tsx:91-136` — Cancel/toggle discards dirty entries unconditionally
- Fix: Add dirty-close confirmation and busy dismissal lock

## G2-9-007-044  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/api/Services/ElectiveService.js:10-16` — GET list/detail/unallocated, POST create/archive, PUT edit under /api/v1/electives/admin
- vNext now: `src/components/electives/college-slot-manager.tsx:67-84` — POST/PATCH slots, direct DB list, PATCH lifecycle, no matching GET detail route
- Fix: Map every API method, restore detail and eligible read parity

## G2-9-007-063  [P1] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:256-263` — Modal blocks backdrop dismiss and traps focus; submit pending
- vNext now: `src/components/electives/college-slot-manager.tsx:91-136` — Inline form has pending disabled but no dialog focus control
- Fix: Restore modal semantics and keyboard/focus/escape rules

## G2-9-007-069  [P1] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:64-82` — Request-sequence drops stale list response
- vNext now: `src/components/electives/college-slot-manager.tsx:67-89` — Mutation uses expectedVersion but no retry-specific conflict copy
- Fix: Present stale-version correction and preserve draft

## G2-10-006-032  [P2] GAP  facet F07  effort S
- Legacy: Old name required error Name is required; max150 `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:298-300`
- vNext now: New name HTML required and max150 but no exact error string `src/components/electives/college-slot-manager.tsx:115-116` `src/modules/electives/college-slot-mutation-model.ts:2-3`
- Fix: Show exact field-level old required message

## G2-10-006-034  [P2] GAP  facet F07  effort S
- Legacy: Old program semester validator says This program has only N semesters `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:273-285`
- vNext now: New server throws ELECTIVE_SEMESTER_INVALID and input max duration `src/modules/electives/college-slot-mutation-service.ts:79-81` `src/components/electives/college-slot-manager.tsx:109-110`
- Fix: Show program-specific semester error message, do not rely only on max attribute

## G2-10-006-036  [P2] GAP  facet F07  effort M
- Legacy: Old on invalid selected target backend returns API error via errorMessage `docs/legacy-source/frontend/src/api/Services/ElectiveService.js:33-34` `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:141-164`
- vNext now: New editor shows raw error code from JSON and generic Unable to save `src/components/electives/college-slot-manager.tsx:69-87`
- Fix: Translate Zod/API codes into friendly field errors and canonical copy

## G2-10-006-037  [P2] MISSING  facet F08  effort S
- Legacy: Old create success Slot created; edit Slot saved; archive TITLE archived `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:141-178`
- vNext now: New manager closes and router.refresh no success notice `src/components/electives/college-slot-manager.tsx:77-86`
- Fix: Display original success messages after server confirmation

## G2-4-024-030  [P2] GAP  facet F07  effort M
- Legacy: Legacy slot empty name returns `Name is required`, >150 chars exact limit error (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:233-247`)
- vNext now: New zod required trim max150 and UI native required input (`src/modules/electives/college-slot-mutation-model.ts:3-4`; `src/components/electives/college-slot-manager.tsx:115-118`)
- Fix: Surface exact backend/inline copy for required/max length.

## G2-4-024-032  [P2] GAP  facet F07  effort M
- Legacy: Legacy year invalid `Academic year must use YYYY-YY format, e.g. 2026-27` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:257-281`)
- vNext now: New emits `ELECTIVE_YEAR_INVALID` or Zod regex error; UI placeholder 2026-27 (`src/modules/electives/college-slot-mutation-model.ts:34-44`; `src/components/electives/college-slot-manager.tsx:111-113`)
- Fix: Present exact validation on academicYear field.

## G2-4-024-036  [P2] GAP  facet F08  effort M
- Legacy: Legacy slot create/update returns HTTP200 full SlotView (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/electives/ElectiveAdminController.java:89-106`)
- vNext now: New POST201 `{slot}` raw persisted row, client refreshes without toast (`src/app/api/academics/elective-slots/route.ts:9-24`; `src/components/electives/college-slot-manager.tsx:77-88`)
- Fix: Preserve full view response and successful create/update feedback.

## G2-9-007-033  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:278-286` — Errors Program is required, Semester is required, only N semesters
- vNext now: `src/components/electives/college-slot-manager.tsx:99-110` — Native browser validation instead of exact messages
- Fix: Map field errors with exact legacy wording

## G2-9-007-037  [P2] MISSING  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:145-157` — Slot created / Slot saved exact success messages
- vNext now: `src/components/electives/college-slot-manager.tsx:77-87` — Closes editor and refreshes with no success toast
- Fix: Show both exact success toasts
