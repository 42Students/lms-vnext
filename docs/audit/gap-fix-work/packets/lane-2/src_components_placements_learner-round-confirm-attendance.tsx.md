# Work packet: edit src/components/placements/learner-round-confirm-attendance.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/learner-placement-schedule.md

## G2-19-004-080  [P1] GAP  facet F21  effort L
- Legacy: Legacy ScheduleCards call TpoHub journey, confirm and reschedule and legacy Interviews service `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:9-14` `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:3-4` `docs/legacy-source/frontend/src/api/Services/TpoHubService.js:171-179` `docs/legacy-source/frontend/src/api/Services/interviewService.js:49-61`
- vNext now: vNext workspace, outcomes, two authorized mutation components `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:6-13` `src/components/placements/learner-round-confirm-attendance.tsx:17-24` `src/components/placements/learner-schedule-reschedule.tsx:20-28`
- Fix: Map old interview/assessment adapters, status and notification contracts to new services.

## G2-19-004-033  [P3] GAP  facet F08  effort S
- Legacy: Legacy confirmation success toast `Confirmed. See you there.` `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:90-95`
- vNext now: vNext sets Confirmed in inline state, router.refresh; no toast `src/components/placements/learner-round-confirm-attendance.tsx:14-29`
- Fix: Use matching success toast plus persistent confirmed badge.
