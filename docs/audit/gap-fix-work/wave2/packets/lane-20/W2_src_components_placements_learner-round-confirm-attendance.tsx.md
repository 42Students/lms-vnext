# Work packet (wave 2): edit src/components/placements/learner-round-confirm-attendance.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/learner-placement-schedule.md

## G2-19-004-010  [P2] GAP  facet F03  effort M
- Legacy: Old card color-coded chips `Expected`, `Confirmed`, `Please confirm`, `Reschedule asked` `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:67-73`
- vNext now: vNext uses paragraphs `Expected`, `Booked for this round`, inline confirmation button and approved-reschedule notice `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:79-101` `src/components/placements/learner-round-confirm-attendance.tsx:14-28`
- Fix: Reproduce compact urgency/status chips and pending ask indicator.

## G2-19-004-042  [P2] GAP  facet F10  effort M
- Legacy: Legacy POST `/api/v1/learner/schedule/rounds/{id}/confirm` `docs/legacy-source/frontend/src/api/Services/TpoHubService.js:176` `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:90-95`
- vNext now: vNext POST `/api/placements/learner/rounds/confirm` with applicationId,roundId,confirmed `src/components/placements/learner-round-confirm-attendance.tsx:17-24`
- Fix: Verify idempotency and role/booking security for new payload; preserve button UX.

## G2-19-004-062  [P2] GAP  facet F16  effort M
- Legacy: Legacy mobile/desktop sp-event date tile and card actions CSS `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:53-107`
- vNext now: vNext border-y article stack and adaptive min-h44 buttons `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:119-128` `src/components/placements/learner-round-confirm-attendance.tsx:15-29`
- Fix: Match event date-tile geometry at 375/768/1280 while retaining 44px touch targets.
