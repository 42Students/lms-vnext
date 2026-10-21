# Work packet: edit src/modules/placements/learner-drive-url-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/learner-placement-jobs.md

## G2-14-005-031  [P1] GAP  facet F05  effort S
- Legacy: Legacy URL Saved facet `?tab=saved`; vNext reads `?saved=1`, losing saved-tab old deep links — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:334-336`
- vNext now: `src/modules/placements/learner-drive-url-model.ts:6-33`; `src/components/placements/learner-jobs-browse.tsx:89-90`
- Fix: Support tab=saved legacy alias, canonicalize only after preserving state
