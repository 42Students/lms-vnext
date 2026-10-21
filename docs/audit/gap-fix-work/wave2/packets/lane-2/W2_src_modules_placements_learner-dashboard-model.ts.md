# Work packet (wave 2): edit src/modules/placements/learner-dashboard-model.ts

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u005-learner-placements-home.md

## G2-18-005-019  [P2] GAP  facet F04  effort S
- Legacy: Legacy `You have an offer`, `First step`, `Congratulations`, `All caught up` eyebrow strings. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:83-97`
- vNext now: vNext HeroPriority `Offer decision due soon`, nextScheduledEvent label etc. `src/modules/placements/learner-dashboard-model.ts:110-131`, `src/components/placements/learner-placements-dashboard.tsx:78-85`
- Fix: Map legacy eyebrow text per state.

## G2-18-005-021  [P2] GAP  facet F04  effort M
- Legacy: Legacy events label `Today`/`Tomorrow`, mode `Online` or room and bring item. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:76-89`
- vNext now: vNext date formatter and upcoming lists display IST timestamp, event href. `src/modules/placements/learner-dashboard-model.ts:66-96`, `src/components/placements/learner-placements-dashboard.tsx:187-210`
- Fix: Match relative-day and room/mode/bring copy, preserving IST.

## G2-18-005-025  [P2] GAP  facet F05  effort S
- Legacy: Legacy seven-day window current moment through end of seventh local day. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:63-64`
- vNext now: vNext IST-week helper builds seven local calendar date segments. `src/modules/placements/learner-dashboard-model.ts:96-99`
- Fix: Test end boundary (6d23h vs 7d) and local midnight against old moment behavior.

## G2-18-005-027  [P2] GAP  facet F05  effort M
- Legacy: Legacy closingSoon drives from eligible un-applied jobs, deadline within3 days, sorted by soonest. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:66-69`, `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:76-77`
- vNext now: vNext waiting list not evidently includes closing-soon eligible drives; dashboard open-job count. `src/components/placements/learner-placements-dashboard.tsx:63-70`, `src/modules/placements/learner-dashboard-model.ts:141-146`
- Fix: Add 3-day closing-soon items with same sorting and urgency.

## G2-18-005-055  [P2] GAP  facet F12  effort M
- Legacy: Legacy no timed follow-up/alerts for completed rounds; ahead filters s.live and !isOver. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:62-65`
- vNext now: vNext events from effective scheduledAt, no check for `completed` beyond round visibility. `src/modules/placements/learner-dashboard-model.ts:66-96`
- Fix: Exclude finished/over rounds and clearly mark expected vs booked.

## G2-18-005-056  [P2] GAP  facet F12  effort M
- Legacy: Legacy year/date parse via moment and week horizon; parent event data may carry expected times. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:62-65`, `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:89-89`
- vNext now: vNext new Date and isCareerRoundVisible with exception overrides. `src/modules/placements/learner-dashboard-model.ts:66-96`
- Fix: Preserve expected/confirmed distinction and exception start date.

## G2-18-005-075  [P2] GAP  facet F18  effort S
- Legacy: Legacy Next hero `All caught up` message and `Update profile`. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:96-97`
- vNext now: vNext fallback `Start here`/`Stay ready` and `View next step`. `src/modules/placements/learner-dashboard-model.ts:110-132`, `src/components/placements/learner-placements-dashboard.tsx:94-111`
- Fix: Use exact all-caught-up copy only when no pending action.

## G2-18-005-078  [P2] GAP  facet F19  effort M
- Legacy: Legacy next7 filters in memory with moment; only four visible. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:62-69`, `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:153-161`
- vNext now: vNext computes server-side projected events and IST buckets. `src/modules/placements/learner-dashboard-model.ts:66-100`
- Fix: Ensure deterministic time snapshots, cache local week and limit four only in UI.

## G2-18-005-083  [P2] GAP  facet F20  effort S
- Legacy: Legacy next from soonest future schedule; ahead sorted order source journey. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:62-64`, `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:82-90`
- vNext now: vNext `events.sort` ascending then seven-day priority. `src/modules/placements/learner-dashboard-model.ts:66-110`
- Fix: Match prioritization when earliest scheduled event >7days.

## G2-18-005-086  [P2] GAP  facet F22  effort L
- Legacy: Legacy journey has applications, schedule, offers with numeric jobId/applicationId/roundId. `docs/legacy-source/frontend/src/components/Placements/student/useJourney.js:4-5`, `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:54-65`
- vNext now: vNext normalized UUID placement jobs/roles/applications/round events/offers. `src/app/(authenticated)/learn/my-placements/page.tsx:95-174`, `src/modules/placements/learner-dashboard-model.ts:6-46`
- Fix: Document old numeric id→new UUID for CTA/event deep links and round matching.

## G2-18-005-088  [P2] GAP  facet F22  effort M
- Legacy: Legacy schedule week uses moment local time, return dates enriched UI. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:62-65`
- vNext now: vNext UTC Date SQL instants, IST week projection. `src/modules/placements/learner-dashboard-model.ts:66-100`
- Fix: Handle timezone conversion and date-only deadlines explicitly.
