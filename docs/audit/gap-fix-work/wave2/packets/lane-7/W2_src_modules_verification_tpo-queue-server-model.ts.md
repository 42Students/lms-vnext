# Work packet (wave 2): edit src/modules/verification/tpo-queue-server-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l11-u025-tpo-verification.md

## G2-11-025-021  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:114-131`
- vNext now: `src/modules/verification/tpo-queue-server-model.ts:42-53`
- Fix: Legacy Waiting since Today/This week/Over a week ago computed using dayjs local date; vNext explicit IST calendar cutoff, verify boundary at midnight.

## G2-11-025-023  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:421-429`
- vNext now: `src/modules/verification/tpo-queue-server-model.ts:13-15`
- Fix: Legacy cap1000 without pagination; vNext server page/pageSize choices25/50/100/1000 with before-page filtering. Align first-page count and range.
