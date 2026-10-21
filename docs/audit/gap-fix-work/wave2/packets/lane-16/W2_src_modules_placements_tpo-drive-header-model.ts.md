# Work packet (wave 2): edit src/modules/placements/tpo-drive-header-model.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-overview.md

## G2-10-012-010  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:183-185,194-202 — Hero left border green #52c41a for active, gray #8c8c8c for draft/closed; status pills green/orange/default.
- vNext now: src/components/placements/placement-drive-workspace.tsx:395-408; src/modules/placements/tpo-drive-header-model.ts:8-11 — Generic status badge by PUBLISHED/DRAFT/else without legacy accent border.
- Fix: Replicate exact thin border/status Tag palette for draft/open/open-expired/closed.

## G2-10-012-015  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:195-204 — Fact label 'Status' + descriptive Draft/Open/Open · Expired/Closed; 'Job type' displays normalized jobType.
- vNext now: src/components/placements/placement-drive-workspace.tsx:395-408; src/modules/placements/tpo-drive-header-model.ts:8-35 — Status Published rather than Open; job type under employmentType text; additional category/work mode/mode/pay/deadline.
- Fix: Provide legacy Status/Job type labelled Facts with exact labels.

## G2-10-012-067  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:195-204 — Labels are 'Status', 'Job type', values 'Draft', 'Open', 'Open · Expired', 'Closed'.
- vNext now: src/components/placements/placement-drive-workspace.tsx:395-408; src/modules/placements/tpo-drive-header-model.ts:8-17 — Generic status Published and unlabeled application mode/work mode/pay strip.
- Fix: Use original status label/capitalization and Facts labels.

## G2-10-012-076  [P2] GAP  facet F20  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:197-200 — Expired computed by parsed UTC deadline vs now; date timezone from parsePlacementUtcDateTime.
- vNext now: src/modules/placements/tpo-drive-header-model.ts:27-29 — Formats deadline in Asia/Kolkata, but status no expiry computation.
- Fix: Use same authoritative instant for expired badge while keeping IST display.
