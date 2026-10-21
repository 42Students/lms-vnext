# Work packet (wave 2): edit src/components/placements/learner-placements-tabs.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/placement-applications.md, docs/audit/gap2/lane-12/placement-cell.md

## G2-12-006-002  [P2] GAP  facet F01  effort S
- Legacy: Seven My Placements tabs (Jobs/Announcements/Applications) `docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:18-26`
- vNext now: Seven tabs but labels Drives/Notices `src/components/placements/learner-placements-tabs.tsx:8-16`
- Fix: Align tab copy and shell

## G2-12-006-051  [P2] GAP  facet F16  effort S
- Legacy: Swipe content between sections and slide direction animation `docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:47-68,93-110`
- vNext now: Only tab-strip swipe navigation, no content slide `src/components/placements/learner-placements-tabs.tsx:27-60`
- Fix: Restore swipe target/animation

## G2-12-005-003  [P2] GAP  facet F01  effort S
- Legacy: Placement/rules tabs select key 7; Home, Jobs, Applications, Schedule, Offers, Announcements, Placement cell `docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:18-26`
- vNext now: Same seven positions, but Drives and Notices labels `src/components/placements/learner-placements-tabs.tsx:8-16`
- Fix: Align tab labels with exact legacy catalogue

## G2-12-005-062  [P2] GAP  facet F16  effort S
- Legacy: Swipe whole page left/right to adjacent tab, content slide animation keyed by tab/account `docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:47-68,93-110`
- vNext now: Tab-strip touch swipe with scroll-edge heuristics, no page-content slide animation `src/components/placements/learner-placements-tabs.tsx:27-60`
- Fix: Restore content swipe and slide if legacy UX parity required
