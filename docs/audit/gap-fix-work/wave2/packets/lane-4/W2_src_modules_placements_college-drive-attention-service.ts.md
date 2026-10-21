# Work packet (wave 2): edit src/modules/placements/college-drive-attention-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-index.md, docs/audit/gap2/lane-9/college-admin-jobs-overview.md

## G2-9-016-027  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:104-117` — Active list 60 published sorted postedDate DESC.
- vNext now: `src/modules/placements/college-drive-attention-service.ts:14-17` — Published max60 sorted createdAt DESC.
- Fix: Sort by publishedAt/postedDate instead of draft creation time.

## G2-9-016-075  [P2] GAP  facet F15  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:408-456` — Attention count and details update after extend and new drive operations.
- vNext now: `src/modules/placements/college-drive-attention-service.ts:53-70` — Attention computed server side each request; new create redirects, no in-place refresh.
- Fix: Ensure list and attention refresh after writes.

## G2-9-016-089  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:104-117` — Two queries: active cap60 and all size1 count; avoids unbounded history.
- vNext now: `src/modules/placements/college-drive-attention-service.ts:14-17` — One query cap60 and per-application aggregation; overall total omitted.
- Fix: Use count(*) for complete overall metrics without loading full history.

## G2-9-011-042  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:88-89` — Closing soon row low conversion and no tab, conditions from legacy needs-attention service
- vNext now: `src/modules/placements/college-drive-attention-service.ts:61-65` — Next 3 days and at least5 apps and <20% conversion, linked Applied
- Fix: Compare legacy thresholds and preserve exact routing/wording
