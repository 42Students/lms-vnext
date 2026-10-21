# Work packet: edit src/modules/placements/learner-career-calendar-model.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/learner-calendar-redirect.md, docs/audit/gap2/lane-19/learner-placement-schedule.md, docs/audit/gap2/lane-9/l18-u023-learner-eligibility-controller.md

## G2-19-005-035  [P1] GAP  facet F12  effort M
- Legacy: Old schedule filters only visible un-applied deadlines `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:81-87` `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:121-123`
- vNext now: vNext calendar round-only model, no job deadline kind `src/modules/placements/learner-career-calendar-model.ts:64-88`
- Fix: Enforce applied/visibility exclusion when adding deadlines.

## G2-19-005-036  [P1] GAP  facet F12  effort M
- Legacy: Old blocked exam day notice says No drives run on it `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:161-170`
- vNext now: vNext calendar no blocked-day status in events `src/modules/placements/learner-career-calendar-model.ts:14-25` `src/modules/placements/learner-career-calendar-model.ts:64-88`
- Fix: Restore exam blackout warning and prevent falsely implying scheduled events are valid on blocked dates.

## G2-19-005-065  [P1] GAP  facet F22  effort L
- Legacy: Old Schedule drew from legacy interviews, TPO calendar extras and jobs deadline records `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:70-112`
- vNext now: vNext calendar event projection accepts only round fields `src/modules/placements/learner-career-calendar-model.ts:3-25` `src/modules/placements/learner-career-calendar-model.ts:64-88`
- Fix: Define read-only view mapping for old numeric interview IDs, blocked calendar rows and job deadlines.

## G2-19-004-041  [P1] MISSING  facet F10  effort M
- Legacy: Legacy GET college calendar extras with month start/end for BLOCKED exam dates `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:91-100` `docs/legacy-source/frontend/src/api/Services/TpoHubService.js:186-191`
- vNext now: vNext calendar gets round list only from workspace, filters on round-kind `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:34-45` `src/modules/placements/learner-career-calendar-model.ts:64-88`
- Fix: Read college exam/blocked calendar events for selected displayed month.

## G2-19-004-048  [P1] MISSING  facet F12  effort M
- Legacy: Legacy omits applied drive deadlines from calendar `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:121-123` `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:163-170`
- vNext now: vNext calendar has no application deadline event kind in round model `src/modules/placements/learner-career-calendar-model.ts:64-88`
- Fix: Show un-applied drive deadlines only; use authorized applied check.

## G2-19-004-083  [P1] GAP  facet F22  effort L
- Legacy: Legacy calendar exam events and application deadline are separate job/calendar tables `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:81-100`
- vNext now: vNext calendar schema projection only placement rounds `src/modules/placements/learner-career-calendar-model.ts:3-25` `src/modules/placements/learner-career-calendar-model.ts:64-88`
- Fix: Add read-only projections joining approved calendar block and application-deadline tables.

## G2-18-023-070  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/StudentCalendarService.java:46-94 reads job_round TALK, round_assignment/slot, season blocked_dates
- vNext now: src/modules/placements/learner-career-calendar-model.ts:3-25 client only rounds event input, no schema fields for exam events
- Fix: Add read model for talks/round slots/season blocked dates with tenant scope.

## G2-18-023-073  [P1] MISSING  facet F23  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/StudentCalendarService.java:79-94 college exam blackout dates shown even if no drives visible
- vNext now: src/modules/placements/learner-career-calendar-model.ts:64-87 derives only scheduled application rounds
- Fix: Fetch blackout dates independently of visible-drive list and show on empty calendar.
