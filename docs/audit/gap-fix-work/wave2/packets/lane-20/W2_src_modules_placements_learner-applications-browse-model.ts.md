# Work packet (wave 2): edit src/modules/placements/learner-applications-browse-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/placement-applications.md

## G2-12-006-015  [P2] GAP  facet F05  effort S
- Legacy: Server order maintained after filtering, all items shown `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:50-54`
- vNext now: Default most recent activity sorted; vNext paged20 `src/modules/placements/learner-applications-browse-model.ts:78-99`
- Fix: Match sort/order and auto-open first

## G2-12-006-014  [P3] GAP  facet F05  effort S
- Legacy: Search company+role trim/lowercase when apps>5 `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:50-54`
- vNext now: Search company+role always, extra normalized whitespace `src/modules/placements/learner-applications-browse-model.ts:67-78`
- Fix: Conditionally show per legacy threshold or document extra
