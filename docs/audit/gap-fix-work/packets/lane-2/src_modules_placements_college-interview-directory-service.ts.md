# Work packet: edit src/modules/placements/college-interview-directory-service.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u002-college-admin-calendar.md

## G2-5-002-011  [P1] GAP  facet F03 Every visible element  effort L
- Legacy: Statuses Scheduled, Confirmed, Reschedule, Completed, Cancelled, No Show with AntD status colors. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:96-103; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:513-535)
- vNext now: Raw SCHEDULED/COMPLETED/NO_SHOW/CANCELLED status, missing Confirmed/Reschedule. (src/app/(authenticated)/college/placements/interviews/page.tsx:49-50; src/modules/placements/college-interview-directory-service.ts:49-57)
- Fix: Persist legacy states, translate color/labels instead of raw enum.

## G2-5-002-023  [P1] GAP  facet F06 Forms  effort M
- Legacy: Status choice All statuses / Active / Completed / Cancelled; Active includes three states. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:71-76; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:254-262)
- vNext now: All/Scheduled/Completed/No Show/Cancelled, no Active aggregate. (src/app/(authenticated)/college/placements/interviews/page.tsx:86-93; src/modules/placements/college-interview-directory-service.ts:13)
- Fix: Preserve Active set incl Confirmed and Reschedule requested.

## G2-5-002-024  [P1] GAP  facet F06 Forms  effort L
- Legacy: Type filter All types plus Screening/Technical/HR/Managerial/Final. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:51-58; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:78-81)
- vNext now: Only ALL/INTERVIEW/GD. (src/app/(authenticated)/college/placements/interviews/page.tsx:86-93; src/modules/placements/college-interview-directory-service.ts:15)
- Fix: Map five subtype values and labels; treat GD additional.

## G2-5-002-036  [P1] GAP  facet F10 Actions/side effects  effort L
- Legacy: GET /api/v1/interviews lists appointment rows across a token-scoped college or org. (docs/legacy-source/frontend/src/api/Services/interviewService.js:25-40; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/InterviewController.java:333-385)
- vNext now: Calendar renders round/deadline/followup; directory renders only BOOKED slot rows. (src/modules/placements/placement-calendar-service.ts:221-241; src/modules/placements/placement-calendar-service.ts:507-601; src/modules/placements/college-interview-directory-service.ts:34-62)
- Fix: Build appointment-level source including historical states; reconcile data model.

## G2-5-002-042  [P1] GAP  facet F12 Business rules  effort L
- Legacy: Active includes scheduled/confirmed/reschedule, conflict ignores cancelled. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:254-262; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:224-230)
- vNext now: Booked slots + activity-derived status; incomplete lifecycle and conflicts. (src/modules/placements/college-interview-directory-service.ts:49-57; src/modules/placements/college-interview-directory-service.ts:79-96)
- Fix: Use full persisted interview status and cancellation semantics.

## G2-5-002-044  [P1] GAP  facet F12 Business rules  effort L
- Legacy: No default date window; all interviews with scheduled date visible. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:148-161)
- vNext now: Calendar period bounded; directory stops at first 5000 unfiltered rows. (src/modules/placements/placement-calendar-service.ts:44-121; src/modules/placements/college-interview-directory-service.ts:76-81)
- Fix: Allow full college interview history with complete filtered counts.
