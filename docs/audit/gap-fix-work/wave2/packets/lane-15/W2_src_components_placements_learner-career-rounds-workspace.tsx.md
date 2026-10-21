# Work packet (wave 2): edit src/components/placements/learner-career-rounds-workspace.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/learner-placements-interviews.md

## G2-17-005-008  [P2] GAP  facet F03  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:126-159 destination includes Coming up, Past, Calendar segmented switch; day grouped cards.
- vNext now: src/components/placements/learner-career-rounds-workspace.tsx:52-61,135-142 uses All, Upcoming, Past schedule, Awaiting schedule, plus search and filters.
- Fix: Alias route should land on consolidated Schedule and expose same Coming up/Past/Calendar controls.

## G2-17-005-011  [P2] GAP  facet F05  effort 
- Legacy: docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:14 no list/table on redirect itself; destination docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:144-155 groups rounds by day.
- vNext now: src/components/placements/learner-career-rounds-workspace.tsx:191-200 filters/interview counts; source chosen only INTERVIEW, not full day grouped schedule.
- Fix: Redirect to shared day-grouped Schedule rather than narrow interviews list.

## G2-17-005-012  [P2] GAP  facet F05  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:111-115 sort all events ascending by timestamp, Past reversed descending.
- vNext now: src/components/placements/learner-career-rounds-workspace.tsx:59-61 default sort='soonest', filters via browseLearnerCareerRounds :191-193.
- Fix: Verify past reverse chronological order vs new global soonest sort and match old Schedule contract.

## G2-17-005-029  [P2] GAP  facet F13  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:142-143 ahead empty 'Nothing coming up... See where your applications stand', :151-152 'No past rounds yet.'.
- vNext now: src/components/placements/learner-career-rounds-workspace.tsx:191-215 focused INTERVIEW list empties driven by filter buckets.
- Fix: Restore canonical Schedule empty-state wording on alias route.

## G2-17-005-034  [P2] GAP  facet F17  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:129-135 segmented views use role=group, aria-label Show, aria-pressed current view.
- vNext now: src/components/placements/learner-career-rounds-workspace.tsx:135-142 client view controls may be different chip/button semantics and labels.
- Fix: Use equivalent aria-pressed group for canonical Schedule views.
