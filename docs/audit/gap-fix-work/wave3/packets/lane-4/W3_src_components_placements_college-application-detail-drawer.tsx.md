# Work packet (wave 3): edit src/components/placements/college-application-detail-drawer.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-applications.md, docs/audit/gap2/lane-9/college-admin-jobs-applications.md

## G2-10-011-017  [P1] MISSING  facet F04  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1348-1370 — Match Score Math.round(screeningScore*100), purple>=70%, cyan>=40%, partial flag.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:96-99; src/components/placements/college-application-detail-drawer.tsx:125-140 — No numeric Match Score column; detail refuses fabricated score.
- Fix: Use actual recorded numeric score and partial status only when supported; restore column where real.

## G2-10-011-026  [P1] MISSING  facet F06  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1917-1987 — Move to Assessment modal has optional Assessment URL, placeholder https://..., Save link to job checkbox default checked.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:146-162; src/components/placements/college-application-detail-drawer.tsx:150-160 — No assessment move URL field or save-to-job checkbox.
- Fix: Restore per-application URL and save-to-job behavior through authorized backend action.

## G2-10-011-030  [P1] MISSING  facet F06  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2778-2837 — InterviewForm/Edit/Feedback Form dialogs embedded with scheduling fields and calendar selection.
- vNext now: src/components/placements/college-application-detail-drawer.tsx:162-169 — Only navigation link to scheduling page.
- Fix: Restore accessible in-context interview create/edit/feedback flow or parity-equivalent route transition.

## G2-10-011-043  [P1] MISSING  facet F09  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2721-2837 — Separate offer letter, schedule/edit interview and feedback modals.
- vNext now: src/components/placements/college-application-detail-drawer.tsx:150-188 — Offers shown as list and schedule link; no equivalent embedded interview modals.
- Fix: Reintroduce distinct in-context flows with confirmations for destructive actions.

## G2-10-011-049  [P1] MISSING  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:755-935 — GET interviews, schedule POST, update PUT, cancel/completed/no-show and feedback actions within detail flow.
- vNext now: src/components/placements/college-application-detail-drawer.tsx:162-169 — Navigation only to separate scheduling page from detail.
- Fix: Wire in-context interview actions to vNext booking APIs with same state semantics.

## G2-9-010-032  [P1] MISSING  facet F06  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2778-2835` — Schedule/Edit Interview forms with time, interviewer and calendar integration
- vNext now: `src/components/placements/college-application-detail-drawer.tsx:163-170` — Interview scheduling section is read-only detail; no modal workflow
- Fix: Link or embed scheduling/edit forms with equivalent authorized controls

## G2-9-010-045  [P1] MISSING  facet F09  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2778-2835` — Interview schedule/edit/feedback modals, cancel/reschedule/ICS download
- vNext now: `src/components/placements/college-application-detail-drawer.tsx:163-170` — Detail lists interview rounds and scheduled times only
- Fix: Restore interview actions and ICS download from detail
