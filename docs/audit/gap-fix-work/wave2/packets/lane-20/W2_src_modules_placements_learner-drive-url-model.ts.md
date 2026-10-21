# Work packet (wave 2): edit src/modules/placements/learner-drive-url-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/learner-placement-jobs.md

## G2-14-005-035  [P2] GAP  facet F06  effort S
- Legacy: Legacy search input no maxLength; vNext maxLength100 and model max100 — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:731-740`
- vNext now: `src/components/placements/learner-jobs-browse.tsx:113-123`; `src/modules/placements/learner-drive-url-model.ts:6-7`
- Fix: Decide legacy unbounded vs safe 100; if preserving limit show explicit counter/help

## G2-14-005-083  [P2] GAP  facet F20  effort S
- Legacy: Legacy URL filter changes shallow replace + reset page; vNext router.push and reset page via model — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:344-366`
- vNext now: `src/components/placements/learner-jobs-browse.tsx:52-55`; `src/modules/placements/learner-drive-url-model.ts:35-53`
- Fix: Use replace not push for debounced typing, preserve Back as intended
