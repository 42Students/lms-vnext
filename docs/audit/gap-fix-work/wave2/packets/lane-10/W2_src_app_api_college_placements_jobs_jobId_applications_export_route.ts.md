# Work packet (wave 2): edit src/app/api/college/placements/jobs/[jobId]/applications/export/route.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-job-controller.md, docs/audit/gap2/lane-9/college-admin-jobs-applications.md

## G2-2-016-112  [P2] GAP  facet F10  effort M
- Legacy: GET CSV per job, server filters status/source/department/program/batch/search `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:706-738`
- vNext now: GET scoped CSV applies q/status/stage/source/academic filters from new read model `src/app/api/college/placements/jobs/[jobId]/applications/export/route.ts:5-31`
- Fix: Restore optional selected score/date parameters and correct filtered export count

## G2-2-016-133  [P2] GAP  facet F14  effort S
- Legacy: Legacy CSV attachment filename applications-job-{jobId}.csv `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:706-731`
- vNext now: New filename fixed college-drive-applicants.csv `src/app/api/college/placements/jobs/[jobId]/applications/export/route.ts:20-26`
- Fix: Include job ID/title in filename for downloaded multi-drive reports

## G2-9-010-065  [P2] GAP  facet F14  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1617-1650` — Server export downloads CSV and toast Export downloaded
- vNext now: `src/app/api/college/placements/jobs/[jobId]/applications/export/route.ts:5-28` — CSV GET capped1000 with X-Export-Truncated/X-Export-Rows, no toast
- Fix: Match download feedback and show truncation notice in UI
