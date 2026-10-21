# Work packet: edit src/app/api/placements/jobs/[jobId]/status/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-settings.md

## G2-9-013-059  [P1] GAP  facet F10  effort M
- Legacy: `src/app/api/placements/jobs/[jobId]/status/route.ts:16-36` — Legacy POST status accepts true/false isActive.
- vNext now: `src/app/api/placements/jobs/[jobId]/status/route.ts:16-35` — Status endpoint accepts only CLOSE; reopen via separate POST /college/jobs/{id}/reopen.
- Fix: Document distinct reopen requirements and route clients through one guarded UX.
