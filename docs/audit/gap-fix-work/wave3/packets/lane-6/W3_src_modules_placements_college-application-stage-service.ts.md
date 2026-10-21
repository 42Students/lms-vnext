# Work packet (wave 3): edit src/modules/placements/college-application-stage-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-applications.md, docs/audit/gap2/lane-13/job-application-status-validator.md

## G2-10-011-065  [P1] MISSING  facet F15  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2840-2877; docs/legacy-source/frontend/src/api/Services/AdminService.js:825-837 — Reject modal explicitly warns 'They will be notified by email.' and status endpoint sends outcome.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:163-167; src/modules/placements/college-application-stage-service.ts:174-179 — Email checkbox flagged currently unavailable; only in-app notification generated.
- Fix: Implement opt-in email delivery with exact recipient/trigger and transactional outbox safeguards.

## G2-13-010-044  [P1] MISSING  facet F15  effort L
- Legacy: Old bulk undo cancels held outbox group, restores history row (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:154-192`)
- vNext now: New REINSTATE only for rejected; no general undo group in stage model (`src/modules/placements/college-application-stage-service.ts:75-81`)
- Fix: Add scoped reversible bulk transaction/notification-cancel if parity required.

## G2-13-010-063  [P1] MISSING  facet F23  effort L
- Legacy: Old HIRED can be reversed and bulk undo cancels held alerts (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationStatusValidator.java:52-57`)
- vNext now: New terminal HIRED and limited rejected reinstatement (`src/modules/placements/college-application-stage-service.ts:75-80`)
- Fix: Restore complete correction/undo capability with DB-safe offer/joining reconciliation.
