# Work packet (wave 3): edit src/components/placements/college-application-pipeline-controls.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-applications.md

## G2-10-011-017  [P1] MISSING  facet F04  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1348-1370 — Match Score Math.round(screeningScore*100), purple>=70%, cyan>=40%, partial flag.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:96-99; src/components/placements/college-application-detail-drawer.tsx:125-140 — No numeric Match Score column; detail refuses fabricated score.
- Fix: Use actual recorded numeric score and partial status only when supported; restore column where real.

## G2-10-011-026  [P1] MISSING  facet F06  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1917-1987 — Move to Assessment modal has optional Assessment URL, placeholder https://..., Save link to job checkbox default checked.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:146-162; src/components/placements/college-application-detail-drawer.tsx:150-160 — No assessment move URL field or save-to-job checkbox.
- Fix: Restore per-application URL and save-to-job behavior through authorized backend action.

## G2-10-011-065  [P1] MISSING  facet F15  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2840-2877; docs/legacy-source/frontend/src/api/Services/AdminService.js:825-837 — Reject modal explicitly warns 'They will be notified by email.' and status endpoint sends outcome.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:163-167; src/modules/placements/college-application-stage-service.ts:174-179 — Email checkbox flagged currently unavailable; only in-app notification generated.
- Fix: Implement opt-in email delivery with exact recipient/trigger and transactional outbox safeguards.
