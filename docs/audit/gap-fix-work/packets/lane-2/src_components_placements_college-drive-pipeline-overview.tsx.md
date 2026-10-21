# Work packet: edit src/components/placements/college-drive-pipeline-overview.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-overview.md

## G2-9-011-006  [P1] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:144-184` — Needs attention warning first, before company card, with grouped categories and candidate links
- vNext now: `src/components/placements/college-drive-pipeline-overview.tsx:32-43` — Needs attention section appears below application pipeline; list contains category totals, no per-candidate details
- Fix: Move banner above drive card and include candidate-specific attention rows

## G2-9-011-020  [P1] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:151-183` — Needs attention groups have clickable specific candidate actions and status tab query
- vNext now: `src/components/placements/college-drive-pipeline-overview.tsx:35-40` — Category links use ?stage=APPLIED or ?stage=INTERVIEW, no candidate-level link
- Fix: Add per-candidate deep link/preserved status and explicit count

## G2-9-011-028  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:151-156` — Needs attention (N) yellow warning alert with reason and count
- vNext now: `src/components/placements/college-drive-pipeline-overview.tsx:32-34` — Needs attention (N) heading and neutral empty message
- Fix: Use warning banner style before identity card
