# Work packet (wave 2): edit src/components/placements/placement-operations-workspace.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/l17-u030-superadmin-drives-landing.md, docs/audit/gap2/lane-9/college-admin-jobs-index.md

## G2-17-030-078  [P2] GAP  facet F21  effort M
- Legacy: Legacy searchAdminJobs and needs-attention are 2 parallel HTTP requests and retention lazy. `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:115`
- vNext now: vNext workspace concurrently invokes 5 database-backed services and policy separately. `src/components/placements/placement-operations-workspace.tsx:26`
- Fix: Separate failure and caching boundaries; verify no unnecessary company/recruiter/seasons load on landing.

## G2-9-016-077  [P2] MISSING  facet F15  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:601-639` — Retention report read-only; displays rejected/withdrawn stale with last activity.
- vNext now: `src/components/placements/placement-operations-workspace.tsx:40-100` — No retention report, no housekeeping notices.
- Fix: Show read-only stale retention count with no delete action.

## G2-9-016-088  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:603-605` — Data retention report label and DatabaseOutlined.
- vNext now: `src/components/placements/placement-operations-workspace.tsx:41-100` — No retention report; Placement season/Companies/Recruiter access instead.
- Fix: Add legacy housekeeping heading below cards.
