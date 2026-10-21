# Work packet: edit src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx (part 2 of 2)

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-shortlisted.md

## G2-10-015-035  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1621-1655 — Export downloaded or Export failed toast.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:111-115 — Browser native CSV lacks toast; cap notice below.
- Fix: Match export acknowledgment.
