# Work packet (wave 3): edit src/modules/placements/tpo-drive-next-step-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drives-jobid.md

## G2-11-010-018  [P1] MISSING  facet F03  effort L
- Legacy: Request main action Approve and publish. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:275`
- vNext now: New nextStep model handles DRAFT/PUBLISHED only; request actions not modeled. `src/modules/placements/tpo-drive-next-step-model.ts:30`
- Fix: Support REQUEST phase with Approve and publish, Approve later, Request change, Decline.

## G2-11-010-057  [P1] MISSING  facet F10  effort L
- Legacy: Recruiter request approveAndPublish uses dedicated API. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:506`
- vNext now: New lifecycle action handles DRAFT/PUBLISHED, not REQUEST. `src/modules/placements/tpo-drive-next-step-model.ts:30`
- Fix: Provide REQUEST approve and publish service pathway.
