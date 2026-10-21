# Work packet: edit src/components/placements/learner-placements-dashboard.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u005-learner-placements-home.md

## G2-18-005-004  [P1] GAP  facet F01  effort M
- Legacy: Legacy CTA links `/learn/my-placements/placement`, `/offers`, `/schedule`, `/jobs`, `/applications`. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:73-97`
- vNext now: vNext uses `/offers`, `/interviews`, `/assessments`, applications and registration anchors. `src/components/placements/learner-placements-dashboard.tsx:74-130`, `src/modules/placements/learner-dashboard-model.ts:75-90`
- Fix: Preserve compatibility aliases from legacy `schedule`, `placement` and job slug links.

## G2-18-005-012  [P1] GAP  facet F03  effort M
- Legacy: Legacy hero CTA varies `Accept or decline`, `Register now`, `Confirm I'll attend`, `See details`, `See your rules`, `See drives`, `Update profile`. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:83-97`
- vNext now: vNext hero button mainly `Browse drives` or `View next step` independent of actual next.action. `src/components/placements/learner-placements-dashboard.tsx:94-100`
- Fix: Bind rendered CTA to computed action label for each distinct next action, preserving exact legacy strings.

## G2-18-005-016  [P1] GAP  facet F03  effort S
- Legacy: Legacy does not display four dashboard KPI cards; explicitly avoids raw counts. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:24-27`
- vNext now: vNext displays Published drives, Applications, Upcoming assessments, Upcoming interviews StatTiles. `src/components/placements/learner-placements-dashboard.tsx:145-173`
- Fix: Remove/promote below-fold stat tiles to honor explicit legacy no-count design decision.

## G2-18-005-022  [P1] GAP  facet F04  effort M
- Legacy: Legacy placed message `You're placed with COMPANY` and eligible to still apply. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:59-61`, `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:90-91`
- vNext now: vNext HeroPriority relies accepted offer flag and expired offer priority. `src/app/(authenticated)/learn/my-placements/page.tsx:267-268`, `src/components/placements/learner-placements-dashboard.tsx:57-60`
- Fix: Ensure accepted-offer or hired status produces placed state after higher urgency, with exact CTA.

## G2-18-005-023  [P1] GAP  facet F05  effort M
- Legacy: Legacy prioritizes open released offers first, then registration, then earliest future event, then placed, open drives, opted-out, caught-up. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:80-98`
- vNext now: vNext HeroPriority model plus dashboard nextAction computes urgent expiring offer <=24h and week events. `src/modules/placements/learner-dashboard-model.ts:104-132`, `src/components/placements/learner-placements-dashboard.tsx:57-60`
- Fix: Match precedence for *all* released offers and registration, not only expiring <=24h.

## G2-18-005-026  [P1] GAP  facet F05  effort M
- Legacy: Legacy toConfirm only booked, not confirmed, not TALK, no pending move request. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:65-66`
- vNext now: vNext waiting list built from upcoming assessment/interview plus offer and nextAction. `src/components/placements/learner-placements-dashboard.tsx:63-70`, `src/modules/placements/learner-waiting-on-you-model.ts:1-100`
- Fix: Add booked-but-unconfirmed sessions and suppress pending change requests.

## G2-18-005-076  [P1] GAP  facet F18  effort S
- Legacy: Legacy no counters in first view by explicit design comment. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:24-27`
- vNext now: vNext KPI labels include Applications/Assessments/Interviews numeric totals. `src/components/placements/learner-placements-dashboard.tsx:145-173`
- Fix: Move KPI row below the legacy ordered panels.

## G2-18-005-038  [P2] GAP  facet F07  effort S
- Legacy: Legacy schedule unavailable only as part of whole journey failure. `docs/legacy-source/frontend/src/components/Placements/student/useJourney.js:18-35`
- vNext now: vNext dashboard events depend journeyRead, firstWeek null, warnings. `src/app/(authenticated)/learn/my-placements/page.tsx:69-91`, `src/components/placements/learner-placements-dashboard.tsx:57-73`
- Fix: Show schedule-specific unknown without `No events` if journey fails.

## G2-18-005-042  [P2] GAP  facet F08  effort S
- Legacy: Legacy progress empty depends appsCount and `Browse drives open to you`. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:165-169`
- vNext now: vNext funnel empty says based on stages/unavailable, no corresponding panel. `src/components/placements/learner-placements-dashboard.tsx:176-185`
- Fix: Render no-application vs no-live-application distinct states and browse CTA.

## G2-18-005-040  [P3] GAP  facet F08  effort S
- Legacy: Legacy nothing to do copy `Nothing to do right now. We'll list it here...`. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:136-140`
- vNext now: vNext waiting empty `No recorded offers awaiting your reply or upcoming assessments/interviews...`. `src/components/placements/learner-placements-dashboard.tsx:125-127`
- Fix: Use original message when no todo.

## G2-18-005-041  [P3] GAP  facet F08  effort S
- Legacy: Legacy 7-day empty `No tests or interviews in the next 7 days...you get a notice.` `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:155-159`
- vNext now: vNext upcoming callout only when event exists; no matching section/empty message. `src/components/placements/learner-placements-dashboard.tsx:187-210`
- Fix: Render Next 7 days panel with exact no-schedule empty copy.
