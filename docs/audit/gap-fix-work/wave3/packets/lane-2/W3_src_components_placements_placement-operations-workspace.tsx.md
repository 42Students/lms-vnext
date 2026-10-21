# Work packet (wave 3): edit src/components/placements/placement-operations-workspace.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-index.md

## G2-9-016-012  [P1] MISSING  facet F02  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:602-650` — Data retention report disclosure after cards, then learner lookup panel.
- vNext now: `src/components/placements/placement-operations-workspace.tsx:42-98` — Placement season/Companies/Recruiter access disclosures instead.
- Fix: Restore retention check and learner lookup, keep extra operations below.
