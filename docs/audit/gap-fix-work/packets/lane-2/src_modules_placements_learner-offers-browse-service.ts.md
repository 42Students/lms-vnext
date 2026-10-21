# Work packet: edit src/modules/placements/learner-offers-browse-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/learner-offers.md

## G2-13-005-027  [P2] GAP  facet F07  effort M
- Legacy: Malformed journey result causes failed state with Retry (`docs/legacy-source/frontend/src/components/Placements/student/useJourney.js:4-34`)
- vNext now: New SSR service validates permission, status view and source types but no in-page Retry (`src/modules/placements/learner-offers-browse-service.ts:16-26`)
- Fix: Show recoverable We could not load your offers Retry instead of generic crash.

## G2-13-005-028  [P2] GAP  facet F07  effort M
- Legacy: Legacy unauthorized user redirects root (`docs/legacy-source/frontend/src/pages/learn/my-placements/offers.js:17-21`)
- vNext now: New requires verified active learner membership and placements.read (`src/modules/placements/learner-offers-browse-service.ts:20-25`)
- Fix: Verify expired membership vs unauthenticated redirect semantics.
