# Work packet (wave 2): edit src/components/electives/college-slot-manager.tsx

21 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-electives.md, docs/audit/gap2/lane-4/elective-admin-controller.md, docs/audit/gap2/lane-9/college-admin-electives.md

## G2-10-006-006  [P2] GAP  facet F02  effort M
- Legacy: Old slot editor opens Antd Modal new/edit with action footer and validation `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:262-312`
- vNext now: New create/edit slot appears inline in page card with 920px maximum `src/components/electives/college-slot-manager.tsx:91-137`
- Fix: Use legacy modal geometry, footer and cancel behavior

## G2-10-006-024  [P2] GAP  facet F06  effort S
- Legacy: Old Program required with Select program placeholder; cannot modify in edit `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:269-272`
- vNext now: New defaults program selection to first option without explicit Choose prompt `src/components/electives/college-slot-manager.tsx:40-43` `src/components/electives/college-slot-manager.tsx:99-103`
- Fix: Start unselected and show Select program placeholder, especially for multi-program colleges

## G2-10-006-026  [P2] GAP  facet F06  effort M
- Legacy: Old Academic year 2026-27 placeholder maxLength7 and edit enabled until history `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:288-292`
- vNext now: New Academic year maxLength9 and field only during create `src/components/electives/college-slot-manager.tsx:111-114` `src/components/electives/college-slot-manager.tsx:97-100`
- Fix: Use maxLength7 for canonical YYYY-YY and allow change before enrollment history

## G2-10-006-028  [P2] GAP  facet F06  effort S
- Legacy: Old Description textarea rows2 with max1000 `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:298-301`
- vNext now: New Description single-line Input max1000 `src/components/electives/college-slot-manager.tsx:115-118`
- Fix: Restore two-row textarea for descriptions

## G2-10-006-029  [P2] GAP  facet F06  effort S
- Legacy: Old pick labels Each student picks at least and Each student picks at most with tooltip `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:303-307`
- vNext now: New labels Minimum choices and Maximum choices, no tooltip `src/components/electives/college-slot-manager.tsx:121-124`
- Fix: Use old field labels and max-choice help tooltip

## G2-10-006-030  [P2] GAP  facet F06  effort S
- Legacy: Old minPick max10 and maxPick max10 `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:303-307`
- vNext now: New UI permits max100 for each `src/components/electives/college-slot-manager.tsx:121-124` `src/modules/electives/college-slot-mutation-model.ts:5-9`
- Fix: Clamp user-facing pick controls to 10 unless product owner approves wider range

## G2-10-006-040  [P2] GAP  facet F09  effort M
- Legacy: Old Add/Edit slot uses Modal with Create or Save footer; maskClosable false `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:262-265`
- vNext now: New inline form button Confirm create/Confirm update, no modal `src/components/electives/college-slot-manager.tsx:91-137`
- Fix: Restore dialog and Create/Save button labels

## G2-10-006-041  [P2] MISSING  facet F09  effort S
- Legacy: Old dirty edit cancel prompts Discard this elective slot draft? or Discard elective slot edits? `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:182-202`
- vNext now: New Cancel immediately toggles closed without dirty check `src/components/electives/college-slot-manager.tsx:126-135`
- Fix: Add dirty state and exact discard confirmation

## G2-10-006-060  [P2] GAP  facet F16  effort M
- Legacy: Old New slot and filters inline toolbar; nested modal works within mobile viewport `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:230-245` `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:262-312`
- vNext now: New control forms grid min2 columns from md and inline 920px editor `src/app/(authenticated)/admin/electives/page.tsx:42-70` `src/components/electives/college-slot-manager.tsx:97-136`
- Fix: Preserve mobile 44px tap targets while matching compact desktop toolbar and modal dialog

## G2-10-006-062  [P2] GAP  facet F17  effort M
- Legacy: Old drawer/dialog focus and modal cancel guard managed by Antd `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:182-202` `docs/legacy-source/frontend/src/components/admin/electives/ElectiveSlotPanel.jsx:55-68`
- vNext now: New inline panel and browser confirm, without modal focus trap or return `src/components/electives/college-slot-manager.tsx:91-137` `src/components/electives/college-elective-lifecycle-action.tsx:13-17`
- Fix: Use accessible dialog primitives with Escape, focus return, and pending close lock

## G2-10-006-065  [P2] GAP  facet F18  effort S
- Legacy: Old New slot and Search slots; selector Active only / Incl. archived `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:231-245`
- vNext now: New New elective slot, Search Slot or program, Status Active/Archived/All `src/components/electives/college-slot-manager.tsx:91-96` `src/app/(authenticated)/admin/electives/page.tsx:42-52`
- Fix: Use old short New slot and Search slots labels, and inclusive archive selector

## G2-10-006-068  [P2] GAP  facet F18  effort S
- Legacy: Old actions Open Edit Archive and save Create or Save `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:216-224` `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:262-264`
- vNext now: New Slot management disclosure, Confirm create/Confirm update `src/app/(authenticated)/admin/electives/page.tsx:94-105` `src/components/electives/college-slot-manager.tsx:126-130`
- Fix: Restore concise action labels in visible toolbar and dialog

## G2-10-006-073  [P2] GAP  facet F20  effort S
- Legacy: Old modal dirty close confirmation prevents data loss `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:182-202`
- vNext now: New inline Cancel drops pending edits without check `src/components/electives/college-slot-manager.tsx:126-135`
- Fix: Restore dirty-form protection and focus return

## G2-4-024-011  [P2] GAP  facet F03  effort M
- Legacy: New elective slot action visible without opening modal automatically (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/electives/ElectiveAdminController.java:89-94`)
- vNext now: New collapsible inline form trigger `New elective slot` with disabled no-program state (`src/components/electives/college-slot-manager.tsx:91-99`)
- Fix: Match old placement/action styling and empty-program explanation.

## G2-4-024-039  [P2] GAP  facet F09  effort M
- Legacy: Legacy slot editor built in admin elective screen, slot detail view separate (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/electives/ElectiveAdminController.java:81-120`)
- vNext now: New expands inline form beneath button; no modal (`src/components/electives/college-slot-manager.tsx:91-137`)
- Fix: Match old modal/drawer mode, responsive placement and cancel reset after visual comparison.

## G2-4-024-064  [P2] GAP  facet F18  effort M
- Legacy: Legacy slot labels include minPick/maxPick semantics and academic year YYYY-YY (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/electives/ElectiveRequests.java:14-23`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:257-281`)
- vNext now: New form uses `Minimum choices`, `Maximum choices`, Year YYYY-YY placeholder (`src/components/electives/college-slot-manager.tsx:111-125`)
- Fix: Check actual legacy frontend copy before finalizing form labels.

## G2-9-007-023  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:147-151` — Create defaults 3 credits/1 minimum/1 maximum, Program must be actively chosen
- vNext now: `src/components/electives/college-slot-manager.tsx:40-48` — Counts match, Program auto-selects first option
- Fix: Default Program to blank and require explicit selection

## G2-9-007-024  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:265-286` — Order Program, Semester, Academic year, Credits, name, Description, min/max
- vNext now: `src/components/electives/college-slot-manager.tsx:97-125` — Adds academic period and reorders Credits under Description
- Fix: Match field order or mark extra period separately

## G2-9-007-026  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:289-294` — Year maxLength7, YYYY-YY consecutive, placeholder 2026-27
- vNext now: `src/components/electives/college-slot-manager.tsx:111-113` — Year maxLength9 supports YYYY-YYYY
- Fix: Restrict input length to seven for exact clone

## G2-9-007-027  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:295-302` — Description textarea rows2 and name placeholder Professional Elective 1
- vNext now: `src/components/electives/college-slot-manager.tsx:115-118` — Description single-line input and no name placeholder
- Fix: Use two-row Textarea and exact placeholder

## G2-9-007-040  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:256-263` — New elective slot and Edit slot in Ant Modal with Create/Save
- vNext now: `src/components/electives/college-slot-manager.tsx:91-136` — Inline toggle editor with Confirm create/update
- Fix: Convert to shared dialog with exact title/actions
