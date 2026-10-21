# Work packet (wave 3): NEW / MISSING items from docs/audit/gap2/lane-5/u008-superadmin-classes.md

7 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-5/u008-superadmin-classes.md

## G2-5-008-031  [P1] MISSING  facet F06 Forms  effort L
- Legacy: No weekdays checked in recurrence means daily (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:562-569)
- vNext now: Schedule link to section page; no daily semantics in this page (src/app/(authenticated)/admin/classes/page.tsx:84-85)
- Fix: Expose full weekday recurrence semantics in Super Admin workflow.

## G2-5-008-042  [P1] MISSING  facet F09 Modals/drawers  effort L
- Legacy: Delete Popconfirm and dependency tooltip (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:415-423)
- vNext now: Archive/Restore confirm instead (src/components/academics/college-section-lifecycle-action.tsx:48-54)
- Fix: Restore delete Popconfirm with full safety blockers.

## G2-5-008-043  [P1] MISSING  facet F09 Modals/drawers  effort L
- Legacy: Recurring schedule modal width720, weekday/time/room/course inputs (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:526-599)
- vNext now: Only anchor to section schedule; modal missing (src/app/(authenticated)/admin/classes/page.tsx:84-85)
- Fix: Implement superadmin recurring modal with preview/date guards.

## G2-5-008-046  [P1] MISSING  facet F10 Actions/side effects  effort L
- Legacy: DELETE guarded by students and scheduled sessions (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:287-306; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassController.java:225-255)
- vNext now: Archive/Restore PATCH, no DELETE (src/components/academics/college-section-lifecycle-action.tsx:19-37)
- Fix: Restore delete or explicitly approve retention change.

## G2-5-008-047  [P1] MISSING  facet F10 Actions/side effects  effort L
- Legacy: POST recurring endpoint returns created/failed per date (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:338-364; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminClassScheduleController.java:92-201)
- vNext now: Schedule only navigates, no request/counter here (src/app/(authenticated)/admin/classes/page.tsx:84-85)
- Fix: Provide preview/create recurring flow for Super Admin.

## G2-5-008-053  [P1] MISSING  facet F12 Business rules  effort L
- Legacy: Unselected weekdays = daily sessions (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:562-569)
- vNext now: No built-in recurrence logic on page (src/app/(authenticated)/admin/classes/page.tsx:84-85)
- Fix: Restore recurrence daily default and selection.

## G2-5-008-079  [P1] MISSING  facet F23 Extra/dropped  effort L
- Legacy: Recurring modal is core old behavior (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:526-599)
- vNext now: Modal entirely absent (src/app/(authenticated)/admin/classes/page.tsx:84-85)
- Fix: Restore as highest-priority visual/workflow parity fix.
