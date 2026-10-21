# Work packet: edit src/modules/electives/college-slot-mutation-service.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-electives.md, docs/audit/gap2/lane-4/elective-admin-controller.md, docs/audit/gap2/lane-9/college-admin-electives.md

## G2-10-006-050  [P1] GAP  facet F12  effort M
- Legacy: Old enrollment-history lock prevents changing program semester year credits/pick rules after picks `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:265-296`
- vNext now: New edit omits program semester/year fields entirely but server checks pick rule changes `src/components/electives/college-slot-manager.tsx:97-125` `src/modules/electives/college-slot-mutation-service.ts:64-99`
- Fix: Use hasEnrollmentHistory to dynamically lock only fields legacy locks

## G2-4-024-053  [P1] GAP  facet F12  effort M
- Legacy: Legacy forbids academic identity changes if any historical membership including removed (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:177-212`)
- vNext now: New checks current ACTIVE/WAITLISTED/REQUESTED roster only (`src/modules/electives/college-slot-mutation-service.ts:133-143`)
- Fix: Check historical group member events before changing picks/credits; not only currently active records.

## G2-4-024-069  [P1] GAP  facet F20  effort M
- Legacy: Legacy removed members preserve history and lock state for selection rules (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:177-212,575-589`)
- vNext now: New slot mutation checks live roster only, not prior membership events (`src/modules/electives/college-slot-mutation-service.ts:133-143`)
- Fix: Use immutable lms_group_member_events to detect historical picks before changing limits.

## G2-9-007-052  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:168-203` — History-based semester/year/credits/choice lock
- vNext now: `src/modules/electives/college-slot-mutation-service.ts:130-149` — Version CAS and selection guard; no edit path for term/year
- Fix: Allow prehistory corrections; block after history with clear message

## G2-10-006-034  [P2] GAP  facet F07  effort S
- Legacy: Old program semester validator says This program has only N semesters `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:273-285`
- vNext now: New server throws ELECTIVE_SEMESTER_INVALID and input max duration `src/modules/electives/college-slot-mutation-service.ts:79-81` `src/components/electives/college-slot-manager.tsx:109-110`
- Fix: Show program-specific semester error message, do not rely only on max attribute

## G2-10-006-035  [P2] GAP  facet F07  effort M
- Legacy: Old lookup errors include Unavailable: programs courses faculty classes batches `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:89-117` `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:249-252`
- vNext now: New options only programs and academic periods; no per-dependency failure banner `src/modules/electives/college-slot-mutation-service.ts:45-61` `src/app/(authenticated)/admin/electives/page.tsx:31-34`
- Fix: Restore partial lookup failure messaging and Retry before editor actions

## G2-4-024-034  [P2] GAP  facet F07  effort M
- Legacy: Legacy forbidden edit of archived slot `An archived slot cannot be edited` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:167-171`)
- vNext now: New stale error ELECTIVE_SLOT_STALE from status/version check (`src/modules/electives/college-slot-mutation-service.ts:124-131`)
- Fix: Distinguish archived vs stale version failure.
