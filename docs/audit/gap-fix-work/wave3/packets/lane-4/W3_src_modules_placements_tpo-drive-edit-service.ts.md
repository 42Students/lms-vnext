# Work packet (wave 3): edit src/modules/placements/tpo-drive-edit-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drives-jobid-edit.md

## G2-11-011-029  [P1] MISSING  facet F04  effort L
- Legacy: Batches selector sourced from active college batches. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:668`
- vNext now: Edit state fetches only minCgpa policy. `src/modules/placements/tpo-drive-edit-service.ts:26`
- Fix: Fetch and persist full eligible batch set.
