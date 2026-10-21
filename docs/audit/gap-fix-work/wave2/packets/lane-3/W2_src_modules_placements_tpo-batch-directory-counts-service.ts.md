# Work packet (wave 2): edit src/modules/placements/tpo-batch-directory-counts-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l13-u029-tpo-batches-index.md

## G2-13-029-028  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:131-144`
- vNext now: `src/modules/placements/tpo-batch-directory-counts-service.ts:21-148`
- Fix: Legacy server provides aggregate eligible/ineligible/notDecided/placed; vNext computes decisions over cohort/section/membership and separate offer evidence.

## G2-13-029-033  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:68-75`
- vNext now: `src/modules/placements/tpo-batch-directory-counts-service.ts:126-143`
- Fix: Legacy decisions may reflect summary count from older service; vNext direct membership overrides section then cohort, adds ambiguity review flag.

## G2-13-029-049  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:121-138`
- vNext now: `src/modules/placements/tpo-batch-directory-counts-service.ts:21-148`
- Fix: Legacy page one batches GET then local sort/filter; vNext fan-out SQL for every batch eligibility before render, evaluate cost at 20 colleges.

## G2-13-029-056  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:63-75`
- vNext now: `src/modules/placements/tpo-batch-directory-counts-service.ts:89-143`
- Fix: Legacy flattened students/eligible/ineligible/notDecided/placed fields, vNext materialized decisions over memberships and offer-derived placed values.
