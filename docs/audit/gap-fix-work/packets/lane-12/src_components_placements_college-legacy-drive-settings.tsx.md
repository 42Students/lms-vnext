# Work packet: edit src/components/placements/college-legacy-drive-settings.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-settings.md

## G2-9-013-046  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/settings.js:60-67` — Status success Drive opened / Drive closed; errors Failed to update drive status.
- vNext now: `src/components/placements/college-legacy-drive-settings.tsx:29-49` — Close success Drive closed, reopen success Job opened successfully.
- Fix: Use Drive opened wording for successful reopening.
