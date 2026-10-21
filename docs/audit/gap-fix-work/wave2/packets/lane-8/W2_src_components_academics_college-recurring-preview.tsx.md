# Work packet (wave 2): edit src/components/academics/college-recurring-preview.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u003-college-admin-classes.md, docs/audit/gap2/lane-5/u010-classes-shared-component.md

## G2-5-003-041  [P2] GAP  facet F09 Modals/drawers  effort L
- Legacy: Schedule recurring inline Modal width720, title, seven weekday choices and optional teaching fields. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:526-599)
- vNext now: Separate page with Preview/Confirm workflow and different form defaults. (src/app/(authenticated)/college/classes/recurring-preview/page.tsx:17-24; src/components/academics/college-recurring-preview.tsx:142-215)
- Fix: Restore entry modal shape or document intentional safety redesign.

## G2-5-003-045  [P2] GAP  facet F10 Actions/side effects  effort M
- Legacy: POST /api/v1/admin/class-schedule/recurring creates each eligible date; returns createdCount/requested/failed. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:338-364; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminClassScheduleController.java:92-201)
- vNext now: Two-step preview/confirm API calls, partial successes and skipped dates. (src/components/academics/college-recurring-preview.tsx:69-130; src/components/academics/college-recurring-preview.tsx:230-260)
- Fix: Preserve recurring per-date report and exact counter/failed data.

## G2-5-003-067  [P2] GAP  facet F18 Wording  effort S
- Legacy: Repeat on, Leave every day unchecked for daily; time picker 5-minute steps. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:562-569; docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:541-560)
- vNext now: Repeat on weekdays with Mon-Fri defaults, no empty accepted. (src/components/academics/college-recurring-preview.tsx:186-195; src/components/academics/college-recurring-preview.tsx:46-49)
- Fix: Match helper text or document new recurrence semantics explicitly.

## G2-5-003-072  [P2] GAP  facet F20 Concurrency  effort M
- Legacy: Dirty edit/schedule cancel require confirmation; busy recurring cannot close. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:263-266; docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:369-383)
- vNext now: Edit dirty guard exists; recurring is separate page, preview may be lost on navigation. (src/components/academics/college-section-management.tsx:159-162; src/components/academics/college-section-management.tsx:229-233; src/components/academics/college-recurring-preview.tsx:94-130)
- Fix: Guard navigation away from dirty recurring pattern with explicit dialog.

## G2-5-010-007  [P2] GAP  facet F02 Layout/section order  effort L
- Legacy: Edit modal / recurring modal overlay same list (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:513-599)
- vNext now: Edit Dialog but recurring preview lives separate page (src/components/academics/college-section-management.tsx:191-234; src/components/academics/college-recurring-preview.tsx:142-215)
- Fix: Match modal scheduling appearance/return context.

## G2-5-010-074  [P2] GAP  facet F21 Integrations  effort M
- Legacy: Audited class CRUD and recurring session endpoint (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassController.java:75-255; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminClassScheduleController.java:92-201)
- vNext now: Activity event plus preview/confirm schedule (src/modules/academics/college-section-mutation-service.ts:156-236; src/components/academics/college-recurring-preview.tsx:69-130)
- Fix: Preserve each event type and number of created sessions.
