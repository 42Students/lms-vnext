# Work packet (wave 2): edit src/modules/placements/learner-offers-browse-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/learner-offers.md, docs/audit/gap2/lane-9/l17-u023-learner-offer-controller.md

## G2-13-005-052  [P2] GAP  facet F13  effort S
- Legacy: Old failed read says We could not load your offers (`docs/legacy-source/frontend/src/pages/learn/my-placements/offers.js:21-23`)
- vNext now: New SSR exception falls to route boundary (`src/modules/placements/learner-offers-browse-service.ts:20-26`)
- Fix: Restore exact recovery copy.

## G2-17-023-053  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/pages/learn/my-placements/offers.js:18-26 journey fetch once and client split into two arrays
- vNext now: src/modules/placements/learner-offers-browse-service.ts:16-26 server fetch own offers then browse filter
- Fix: Provide paginated server-side list for long offer history without hiding pending.
