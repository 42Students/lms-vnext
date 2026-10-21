# Work packet (wave 3): edit src/components/placements/placement-drive-workspace.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-settings.md

## G2-10-014-080  [P1] MISSING  facet F23  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:137-145; docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:619-1137 — Full editor on Settings regardless old open/closed/draft.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:30-36; src/components/placements/placement-drive-workspace.tsx:579-671 — Published only reduced editor; draft moved to Overview.
- Fix: Restore full Settings edit reachability.
