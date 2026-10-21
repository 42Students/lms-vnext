# Work packet: edit src/app/(authenticated)/learn/my-placements/schedule/page.tsx

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/learner-placement-schedule.md, docs/audit/gap2/lane-8/learner-placement-assessments-moved.md

## G2-19-004-003  [P1] GAP  facet F01  effort L
- Legacy: Old page merges rounds, historical interviews, and direct vendor tests `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:70-112`
- vNext now: vNext page fetches workspace.rounds and outcomes only `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:22-35`
- Fix: Union historical interviews and standalone legacy assessments without duplicate slots.

## G2-19-004-013  [P1] GAP  facet F04  effort M
- Legacy: Legacy round card displays company/logo, role link, online/room, optional platform/duration, bring instructions `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:19-30` `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:74-85`
- vNext now: vNext article has company/role/duration/venue, no job role deep link, platform or whatToBring field `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:71-85` `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:119-127`
- Fix: Extend view model with role/job link, verified instructions and platform where persisted.

## G2-19-004-027  [P1] GAP  facet F06  effort M
- Legacy: Legacy Confirm I'll attend button appears for booked, live, non-past, non-Talk, unconfirmed `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:17-22` `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:90-95`
- vNext now: vNext checks booked, outcome null, future timestamp; no explicit TALK exclusion `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:87-90`
- Fix: Exclude talk-only and reschedule-pending rounds consistently from attendance confirmation.

## G2-19-004-035  [P1] GAP  facet F08  effort M
- Legacy: Legacy pending reschedule chip `Reschedule asked` and answered reply text `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:21-23` `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:72` `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:86-88`
- vNext now: vNext rescheduled notice only when exception approved; no pending/rejected reply display in schedule row `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:79-83` `src/components/placements/learner-schedule-reschedule.tsx:32-35`
- Fix: Show pending, approved, rejected and response note from request state.

## G2-19-004-039  [P1] GAP  facet F10  effort L
- Legacy: Legacy GET placement journey + GET older learner interviews separately `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:61-80` `docs/legacy-source/frontend/src/components/Placements/student/useJourney.js:18-32` `docs/legacy-source/frontend/src/api/Services/interviewService.js:49-73`
- vNext now: vNext calls getLearnerPlacementRequestWorkspace and listOwnAppliedPlacementResults `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:22-26`
- Fix: Map legacy interview fallback, personal application states and dedupe in service.

## G2-19-004-040  [P1] MISSING  facet F10  effort M
- Legacy: Legacy GET `/api/v1/jobs/all/{learnerId}` for visible application deadlines `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:81-87`
- vNext now: vNext schedule fetches no jobs deadline list directly `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:22-35`
- Fix: Add authorized un-applied active job deadline source to calendar aggregation.

## G2-19-004-041  [P1] MISSING  facet F10  effort M
- Legacy: Legacy GET college calendar extras with month start/end for BLOCKED exam dates `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:91-100` `docs/legacy-source/frontend/src/api/Services/TpoHubService.js:186-191`
- vNext now: vNext calendar gets round list only from workspace, filters on round-kind `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:34-45` `src/modules/placements/learner-career-calendar-model.ts:64-88`
- Fix: Read college exam/blocked calendar events for selected displayed month.

## G2-19-004-046  [P1] GAP  facet F11  effort M
- Legacy: Legacy only booked/live/nonpast/non-talk rounds can send confirm or reschedule `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:17-23` `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:90-104`
- vNext now: vNext Confirm condition checks booked/future/no outcome; reschedule control renders for all ahead `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:87-90` `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:119-127`
- Fix: Hide/disable reschedule where not booked or not eligible and enforce server rules.

## G2-19-004-049  [P1] GAP  facet F12  effort S
- Legacy: Legacy excludes TALK round from needsConfirm count and confirm control `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:124` `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:17-22`
- vNext now: vNext `needsConfirmation` counts any booked ahead with no confirm `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:33` `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:107`
- Fix: Exclude TALK and pending reschedule requests from alert counts.

## G2-19-004-078  [P1] GAP  facet F20  effort S
- Legacy: Legacy pending move request excluded from confirm-alert count `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:124`
- vNext now: vNext unconditionally counts booked unconfirmed ahead `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:33`
- Fix: Exclude pending reschedule and invalid/expired bookings from needsConfirmation.

## G2-19-004-080  [P1] GAP  facet F21  effort L
- Legacy: Legacy ScheduleCards call TpoHub journey, confirm and reschedule and legacy Interviews service `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:9-14` `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:3-4` `docs/legacy-source/frontend/src/api/Services/TpoHubService.js:171-179` `docs/legacy-source/frontend/src/api/Services/interviewService.js:49-61`
- vNext now: vNext workspace, outcomes, two authorized mutation components `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:6-13` `src/components/placements/learner-round-confirm-attendance.tsx:17-24` `src/components/placements/learner-schedule-reschedule.tsx:20-28`
- Fix: Map old interview/assessment adapters, status and notification contracts to new services.

## G2-19-004-082  [P1] GAP  facet F22  effort L
- Legacy: Legacy schedule model uses numeric interviewId/jobId/roundId, old interviewStatus, optional moveAsk `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:19-31` `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:103-112`
- vNext now: vNext uses UUID applicationId/roundId and request exceptions/learnerConfirmedAt `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:29-45` `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:79-90`
- Fix: Document migration mapping old IDs/states to new slot, request and attendance records.

## G2-8-6-001  [P1] GAP  facet F01  effort M
- Legacy: Old bookmark automatically routes to /learn/my-placements/schedule (`docs/legacy-source/frontend/src/pages/learn/my-placements/assessments.js:1-10; docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:9-15; docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:18-115`)
- vNext now: Same bookmark path now renders its own complete assessments page (`src/app/(authenticated)/learn/my-placements/assessments/page.tsx:12-79; src/modules/placements/learner-assessment-browse-service.ts:8-17; src/app/(authenticated)/learn/my-placements/schedule/page.tsx:104-115`)
- Fix: Provide legacy redirect compatibility or record intentional canonical-route break

## G2-8-6-037  [P1] MISSING  facet F23  effort M
- Legacy: Old route auto-redirected with three-row transition placeholder (`docs/legacy-source/frontend/src/pages/learn/my-placements/assessments.js:1-10; docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:9-15; docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:18-115`)
- vNext now: Redirect behavior absent on replacement route (`src/app/(authenticated)/learn/my-placements/assessments/page.tsx:12-79; src/modules/placements/learner-assessment-browse-service.ts:8-17; src/app/(authenticated)/learn/my-placements/schedule/page.tsx:104-115`)
- Fix: Resolve explicit compatibility policy before UI fixes; preserve old bookmarks

## G2-19-004-031  [P2] GAP  facet F07  effort M
- Legacy: Legacy bad schedule load warning `We could not load your schedule` and Retry `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:117-119`
- vNext now: vNext async server `Promise.all` without page-level retry component `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:22-26` `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:104-112`
- Fix: Render scoped ErrorState/warning with Retry and preserve unrelated calendar data.
