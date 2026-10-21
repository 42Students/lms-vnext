# Work packet: edit src/components/placements/learner-schedule-reschedule.tsx

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/learner-placement-schedule.md

## G2-19-004-024  [P1] GAP  facet F06  effort L
- Legacy: Legacy reschedule modal requires 3+ character reason and optional free-text Times that work for you `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:109-119`
- vNext now: vNext requires reason and concrete future DateTime + venue or secure meeting URL `src/components/placements/learner-schedule-reschedule.tsx:14-28` `src/components/placements/learner-schedule-reschedule.tsx:39-60`
- Fix: Support optional free-text preferred windows while preserving structured approvals.

## G2-19-004-030  [P1] GAP  facet F07  effort M
- Legacy: Legacy validates preferred reason 3 chars, free-text times optional `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:43-47` `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:109-117`
- vNext now: vNext refuses save if no future preferred date or mode contact details `src/components/placements/learner-schedule-reschedule.tsx:14-17` `src/components/placements/learner-schedule-reschedule.tsx:57-60`
- Fix: Reconcile validation contracts so users can ask reschedule without exact slot.

## G2-19-004-035  [P1] GAP  facet F08  effort M
- Legacy: Legacy pending reschedule chip `Reschedule asked` and answered reply text `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:21-23` `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:72` `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:86-88`
- vNext now: vNext rescheduled notice only when exception approved; no pending/rejected reply display in schedule row `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:79-83` `src/components/placements/learner-schedule-reschedule.tsx:32-35`
- Fix: Show pending, approved, rejected and response note from request state.

## G2-19-004-043  [P1] GAP  facet F10  effort L
- Legacy: Legacy POST round request has reason/preferredTimes optional `docs/legacy-source/frontend/src/api/Services/TpoHubService.js:177-179` `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:43-47`
- vNext now: vNext POST `/api/placements/requests` requires scheduledAt/mode/venue or meetingUrl `src/components/placements/learner-schedule-reschedule.tsx:14-28`
- Fix: Add optional free-text request payload mapping to new approval workflow.

## G2-19-004-080  [P1] GAP  facet F21  effort L
- Legacy: Legacy ScheduleCards call TpoHub journey, confirm and reschedule and legacy Interviews service `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:9-14` `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:3-4` `docs/legacy-source/frontend/src/api/Services/TpoHubService.js:171-179` `docs/legacy-source/frontend/src/api/Services/interviewService.js:49-61`
- vNext now: vNext workspace, outcomes, two authorized mutation components `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:6-13` `src/components/placements/learner-round-confirm-attendance.tsx:17-24` `src/components/placements/learner-schedule-reschedule.tsx:20-28`
- Fix: Map old interview/assessment adapters, status and notification contracts to new services.

## G2-19-004-084  [P1] GAP  facet F22  effort L
- Legacy: Legacy reschedule request stores free-text preferredTimes and statuses `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:21-23` `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:43-47`
- vNext now: vNext request requires structured scheduledAt, mode, venue/meetingUrl `src/components/placements/learner-schedule-reschedule.tsx:20-28` `src/modules/placements/request-service.ts:393-406`
- Fix: Migrate historic preferredTimes/reply payload and render pending/decided states.

## G2-19-004-086  [P1] GAP  facet F23  effort M
- Legacy: Legacy offers optional-text reschedule without fixed new slot `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:109-119`
- vNext now: vNext requires precise date/mode/venue or meeting link `src/components/placements/learner-schedule-reschedule.tsx:14-28` `src/components/placements/learner-schedule-reschedule.tsx:39-60`
- Fix: Owner decision on whether structured reschedule request may replace flexible suggestions.

## G2-19-004-032  [P2] GAP  facet F07  effort S
- Legacy: Legacy invalid reschedule action toasts Could not send plus backend errorText `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:25-36` `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:43-47`
- vNext now: vNext inline error `Request not sent. Check the time and contact details.` `src/components/placements/learner-schedule-reschedule.tsx:26-29`
- Fix: Match failure toast and granular server error while keeping field validation.

## G2-19-004-034  [P2] GAP  facet F08  effort S
- Legacy: Legacy reschedule success toast `Sent. The placement cell will reply.` `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:43-47`
- vNext now: vNext inline `Reschedule request sent. Your booking is unchanged until approved.` `src/components/placements/learner-schedule-reschedule.tsx:26-35`
- Fix: Show original toast; keep clearer approval caveat as secondary text.
